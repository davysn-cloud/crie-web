---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: draft
confidence: high
priority: P0
covers: [US-020, US-061, US-062, US-063, US-066, US-068, US-069, US-070]
---

# E2E Flow 3: Multi-tenant isolation (Agência A nunca vê dados de Agência B)

> Valida que o isolamento RLS + magic_link scoping + Edge Functions nunca leakam dados entre agências. **Fluxo de segurança — qualquer falha aqui é P0.**

## Personas envolvidas
1. **Membro-A1** — `agency_members` da Agência A, `workspace_members.role='strategist'` em workspace A1.
2. **Membro-A2** — Agência A, outra workspace (A2).
3. **Membro-B1** — Agência B, workspace B1. Mesmo e-mail que Membro-A1 (**propositalmente** — testa colisão).
4. **Aprovador-A** — magic_link scoped em Agência A / workspace A1 / approval_request específico.
5. **Aprovador-B** — magic_link scoped em Agência B / workspace B1.
6. **Atacante externo** — anônimo, sem cookies.

## Pré-condições (setup do ambiente)
- Seed:
  - Agência A com 2 workspaces (A1, A2), 3 membros, 2 post_cards cada em estados variados, 1 brand_kit, 2 briefs, 1 approval_request ativo, 1 magic_link ativo, 1 publish_queue item, 1 row em `insights`, 1 row em `agency_integrations` com Meta token criptografado.
  - Agência B idem, dados completamente independentes (agency_id, workspace_id diferentes).
- RLS **forçado** em todas as tabelas (`FORCE ROW LEVEL SECURITY`).
- `anon` key do Supabase usada pelo cliente Playwright (simula navegador real).

## Passos (sequência numerada)

### Cenário 1 — SELECT direto via PostgREST (anon key)
1. **Dado** Atacante sem sessão.
2. **Quando** faz `GET /rest/v1/post_cards?select=*` com `anon` key.
3. **Então** resposta é `[]` (RLS bloqueia tudo sem `auth.uid()`).
4. **Idem para:** `workspaces`, `briefs`, `publish_queue`, `insights`, `magic_links`, `agency_integrations`, `approval_requests`, `approval_pins`, `post_versions`, `audit_log` → **todas 0 rows**.

### Cenário 2 — Membro-A1 autenticado tenta ler Agência B
5. **Dado** Membro-A1 logado (sessão Supabase Auth válida, `auth.uid()` = user_id do membro A1).
6. **Quando** faz `GET /rest/v1/post_cards?select=*` (sem filtro).
7. **Então** recebe **apenas** os post_cards da Agência A (workspaces A1 e A2), **zero** de Agência B.
8. **Quando** força filtro com ID de post_card da Agência B: `GET /rest/v1/post_cards?id=eq.<B1_post_id>`.
9. **Então** resposta `[]` — policy `is_workspace_member(workspace_id)` barra.
10. **Quando** tenta `INSERT` em `briefs` com `agency_id` explícito da Agência B via payload (`{workspace_id: <B1_ws_id>, ...}`).
11. **Então** PostgREST retorna 403 / RLS policy violation — Membro-A1 não passa em `is_workspace_member` para workspace B1.
12. **Quando** tenta `UPDATE post_cards SET title='hack' WHERE id=<B1_post_id>` via PostgREST.
13. **Então** `0 rows affected` (RLS filtra o WHERE silenciosamente).

### Cenário 3 — Mesmo e-mail em duas agências (colisão)
14. **Dado** Membro-A1 e Membro-B1 usam mesmo e-mail (`joao@agencia.com`). Em Supabase Auth cada um tem `auth.users.id` distinto, pois são convites separados (ADR 006 garante isolamento via `agency_members`, não via `auth.users.email`).
15. **Quando** Membro-A1 loga, e separadamente Membro-B1 loga em outro browser context.
16. **Então** cada um vê **apenas** sua agência. `agency_members` tem 2 rows distintas com `user_id` diferentes.

### Cenário 4 — Magic link scoping (aprovador)
17. **Dado** Aprovador-A com token T_A ligado a `approval_request_A` (workspace A1).
18. **Quando** abre `/a/T_A` → OK, vê post A1.
19. **Quando** tenta acessar `/a/T_A` mas com query `?approval_request_id=<B1_approval_id>` ou troca ID no body de `/approval/decide` para um da Agência B.
20. **Então** Edge Function compara o `approval_request_id` do JWT com o do body/query → 403 Forbidden.
21. **Quando** faz brute-force trocando o token: `/a/T_RANDOM_FAKE_43CHARS`.
22. **Então** `/magic-link/verify` calcula `sha256(T_RANDOM)`, não acha match → 401.
23. **Quando** Atacante tenta ler `magic_links` via PostgREST com `anon` key.
24. **Então** `[]` (sem policy anon).
25. **Quando** admin da Agência A revoga T_A (`UPDATE magic_links SET revoked_at=now()`).
26. **Então** próxima chamada de Aprovador-A via JWT ephemeral → Edge Function rejeita (checa `revoked_at`) → 401. Sessão invalidada em curso.

### Cenário 5 — `agency_integrations.secret_ciphertext` nunca sai (ADR 008)
27. **Dado** Membro-A1 autenticado.
28. **Quando** faz `GET /rest/v1/agency_integrations?select=*` da própria agência.
29. **Então** resposta **não contém** `secret_ciphertext` (RLS policy restringe colunas OU view pública `agency_integrations_safe` que omite o campo).
30. **Quando** tenta `GET /rest/v1/agency_integrations?select=secret_ciphertext`.
31. **Então** erro 403 / coluna oculta / `null`.
32. **Quando** chama RPC `decrypt_integration_secret()` via PostgREST como anon/user.
33. **Então** erro — função é `SECURITY DEFINER` e só invocável por `service_role` (grant revogado para `authenticated` e `anon`).

### Cenário 6 — Edge Functions não aceitam spoofing de agency_id
34. **Dado** Membro-A1 autenticado.
35. **Quando** chama `/publish/enqueue` com `post_card_id=<B1_post_id>`.
36. **Então** Edge Function faz SELECT com `auth.uid()` context; não encontra linha (RLS); retorna 404.
37. **Quando** chama `/auto-adapt` passando `post_card_id` de Agência B.
38. **Então** idem 404.
39. **Quando** chama `/insights-sync` (normalmente cron) com payload forjado `{agency_id: <A_id>}` mas sessão de Membro-B1.
40. **Então** Edge Function valida `is_agency_member(agency_id)` → 403.

### Cenário 7 — Storage buckets
41. **Dado** Membro-A1.
42. **Quando** tenta `GET` em storage path `workspaces/<B1_ws_id>/assets/<file>.jpg`.
43. **Então** 403 (bucket policy verifica `workspace_id` via path prefix + `is_workspace_member`).
44. **Quando** tenta `POST` upload em path `workspaces/<B1_ws_id>/assets/hack.jpg`.
45. **Então** 403.

### Cenário 8 — Realtime channels não vazam
46. **Dado** Membro-A1 subscrito ao canal `workspace:<A1_ws_id>:pins` e Membro-B1 subscrito a `workspace:<B1_ws_id>:pins`.
47. **Quando** Aprovador-B cria pin no B1.
48. **Então** Membro-A1 recebe **0 mensagens**; Membro-B1 recebe 1.
49. **Quando** Atacante tenta subscribe em canal `workspace:<A1_ws_id>:pins` sem sessão válida.
50. **Então** Realtime rejeita (policy via `is_workspace_member` no channel authorization).

### Cenário 9 — audit_log isolation
51. **Dado** Membro-A1 autenticado.
52. **Quando** `GET /rest/v1/audit_log?select=*`.
53. **Então** só eventos de `agency_id=A`. Nenhum de B.

## Asserções críticas (checklist por tabela)
Para **cada** tabela abaixo, rodar: (a) anon SELECT = 0 rows; (b) user de agência errada SELECT = 0 rows; (c) INSERT com `workspace_id`/`agency_id` de agência errada = policy violation.

- [ ] `agencies`
- [ ] `agency_members`
- [ ] `workspaces`
- [ ] `workspace_members`
- [ ] `brand_profiles`
- [ ] `brand_voice`
- [ ] `pillars`
- [ ] `campaigns`
- [ ] `briefs`
- [ ] `hashtag_sets` + `hashtag_set_items`
- [ ] `hooks_library` + `ctas_library`
- [ ] `post_cards`
- [ ] `post_drafts`
- [ ] `post_formats` + `carousel_slides`
- [ ] `copy_versions`
- [ ] `asset_versions`
- [ ] `asset_library`
- [ ] `templates`
- [ ] `post_versions`
- [ ] `approval_requests`
- [ ] `approval_pins`
- [ ] `magic_links`
- [ ] `publish_queue`
- [ ] `publish_attempts`
- [ ] `insights`
- [ ] `audit_log`
- [ ] `agency_integrations` — **+ secret_ciphertext nunca sai via PostgREST**
- [ ] `comments`
- [ ] `stage_transitions`

## Edge cases a incluir no mesmo fluxo
- **Search path poisoning:** tentar exploitar funções SECURITY DEFINER sem `SET search_path = public, pg_temp` — revisar todas as helpers.
- **Role-switch em sessão única:** Membro-A1 tem sessão ativa, admin o remove de `workspace_members` — próxima query deve retornar 0 rows imediatamente (policies são avaliadas a cada query, não cacheadas em sessão).
- **Membro convidado mas não aceito:** `agency_invites.accepted_at IS NULL` → não tem `agency_members` → policies barram tudo.
- **Row de `agency_members` com `accepted_at IS NULL`:** helper `is_agency_member` deve considerar apenas `accepted_at IS NOT NULL`. **P-SPEC 004** — schema não indica explicitamente se helper filtra `accepted_at`.
- **Soft-deleted `briefs.deleted_at IS NOT NULL`:** RLS não filtra por default — query precisa incluir `WHERE deleted_at IS NULL`. **P-SPEC 005** — soft delete + RLS interaction não está especificada.
- **Downgrade de role mid-session:** social_media rebaixado para strategist, tentativa de `/publish/enqueue` deve falhar com 403. Hoje a policy só valida `is_workspace_member`, não o sub-role. **P-SPEC 006** — granularidade da US-063 não está mapeada no schema atual (faltam policies por `workspace_members.role`).
- **JWT do magic_link com `exp` adulterado:** chave simétrica (HS256) impede — assinatura inválida → 401.
- **Tentativa de SQL injection em filtros PostgREST:** `?title=like.*%27;DROP TABLE%27*` — PostgREST escapa; assert que 0 rows e DB intacto.

## Mocks necessários
- Nenhum serviço externo — este fluxo só testa DB/Edge/Realtime.

## Tempo esperado do fluxo completo
<90s (grande volume de asserts).

## Falhas aceitáveis vs inaceitáveis
**Aceitáveis:**
- Tempos de resposta ligeiramente maiores para queries que passam por várias policies (<200ms).

**Inaceitáveis:**
- **Qualquer** row de Agência B retornando para Membro A. Um único leak = P0, block deploy, rollback.
- `secret_ciphertext` em qualquer response HTTP, log ou realtime payload.
- Magic_link token plaintext persistido em qualquer coluna.
- Realtime message cruzando workspace.

## Links
- [[../../../01_product/user-stories/US-020-selecionar-marca-contexto]]
- [[../../../01_product/user-stories/US-063-permissoes-granulares]]
- [[../../../01_product/user-stories/US-066-magic-link-management]]
- [[../../../01_product/user-stories/US-070-audit-log-imutavel]]
- [[../../../02_architecture/adr/006-approver-auth]]
- [[../../../02_architecture/adr/008-agency-integrations-encryption]]
- [[../../../03_backend/schema]]
- [[../../security-checklist]]
- [[../../bugs]]
