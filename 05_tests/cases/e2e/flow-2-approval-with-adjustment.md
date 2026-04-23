---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: draft
confidence: medium
priority: P0
covers: [US-029, US-030, US-040, US-051, US-052, US-053, US-054, US-055, US-056, US-058, US-066]
---

# E2E Flow 2: Aprovação com ajuste (cliente pede mudanças, equipe corrige, nova versão aprovada)

> Valida o loop de feedback completo: cliente aprova **parcialmente** — pina comentário em slide específico do carrossel + comentário inline na legenda → equipe interna corrige → nova versão → cliente aprova final.

## Personas envolvidas
1. **Copywriter** (Agência A, workspace Solaris) — autenticado.
2. **Designer** (mesma agência) — autenticado.
3. **Aprovador** (cliente externo) — via magic_link **mobile** (iPhone 13 emulation).

## Pré-condições (setup do ambiente)
- Estado inicial herda do Flow 1 pós-Ato III: post_card em `stage='in_review_client'`, `approval_requests.status='pending'` com `post_version_id` v1 apontando para snapshot de carrossel de 5 slides.
- Magic link ativo com `expires_at = now()+7d`, não revogado, `use_count=0`.
- Resend mock em captura.
- Feature flag `approval_pins` ON.

## Passos (sequência numerada)

### Ato I — Cliente abre no celular (US-058, US-051)
1. **Dado** o aprovador recebe o e-mail (capturado em mock Resend).
2. **Quando** abre `/a/<token>` no iPhone 13 (viewport 390×844, touch events habilitados).
3. **Então** `/magic-link/verify` valida token, retorna JWT ephemeral; UI carrega fila com 1 item pendente; `magic_links.use_count=1`, `last_used_ip` preenchido, `last_used_user_agent` contém "iPhone".

### Ato II — Cliente navega o carrossel (US-052)
4. **Quando** aprovador toca no card → abre preview Instagram-nativo: header com handle correto, `InstagramPreview` mostra slide 0 de 5 com indicador paginado.
5. **Quando** faz swipe-left → avança para slide 1, slide 2, slide 3. Safe zones não invadem conteúdo crítico.
6. **Assert:** nenhum scroll horizontal na página inteira (só o carrossel faz pan interno).

### Ato III — Pin em coordenada (US-053)
7. **Quando** no slide 2, aprovador faz tap-and-hold em coordenada (0.45, 0.72) → modal de novo pin abre.
8. **Quando** digita "O logo está muito próximo da borda, pode centralizar?" e submete.
9. **Então** Edge Function `/approval/pins/create` recebe `{approval_request_id, slide_index: 2, pin_x: 0.45, pin_y: 0.72, body, target: 'image', author_label, author_email}` (label e email extraídos do JWT, não do body).
10. **E** **no DB** `approval_pins` ganha 1 row com `resolved=false`; `audit_log` `pin.created` com `actor_type='magic_link'`.
11. **Assert:** pin aparece na UI da agência (copywriter/designer) em tempo real via Realtime channel na workspace (publicação Supabase Realtime subscrita ao canal `workspace:<id>:pins`).

### Ato IV — Comentário inline na legenda (US-054)
12. **Quando** aprovador abre tab "Legenda" → vê caption com seleção de texto habilitada.
13. **Quando** seleciona caracteres 120–160 da legenda e clica "Comentar seleção" → submete body "trocar 'incrível' por 'espetacular'".
14. **Então** Edge Function cria `approval_pins` com `target='caption'`, `caption_range_start=120`, `caption_range_end=160`, `slide_index=NULL`.
15. **Assert CHECK:** se faltar `caption_range_start` com `target='caption'`, DB rejeita (testar via payload corrompido direto na Edge Function — bypass de UI).

### Ato V — Cliente escolhe "Pedir ajuste" (US-055)
16. **Quando** aprovador volta à fila, toca "Pedir ajuste", seleciona `reason_code='arte'`, preenche `decision_note="Slide 2 + palavra trocar"`, confirma.
17. **Então** Edge Function `/approval/decide` recebe `{decision: 'changes_requested', reason_code, decision_note}`.
18. **E** **no DB** `approval_requests.status='changes_requested'`, `decided_at=now()`, `decided_via_magic_link_id` preenchido. `post_versions` **v1 NÃO é locked** (só locka em 'approved'). `post_cards.stage='changes_requested'`.
19. **E** `audit_log` `approval.changes_requested` com actor magic_link.
20. **E** o magic_link **continua válido** (não expira na decisão — o aprovador volta para a próxima rodada). `use_count` incrementa em toda nova verificação.

### Ato VI — Equipe interna corrige (US-029, US-040)
21. **Quando** designer abre painel, vê notificação "ajuste pedido" + pin no slide 2.
22. **Quando** abre canvas, reposiciona logo (nova versão do asset), salva.
23. **Então** **no DB** nova row em `asset_versions` v2 para o slide 2; `carousel_slides` do slide 2 aponta para asset v2.
24. **Quando** copywriter abre, vê comentário inline em range 120–160, edita trecho correspondente, salva.
25. **Então** `copy_versions` v2 criada; diff visual disponível via `/copy/versions/diff` (US-029).
26. **Quando** designer marca pin do slide 2 como resolvido (UI de pin list).
27. **Então** **no DB** `approval_pins.resolved=true`, `resolved_by=<designer user_id>`, `resolved_at=now()`.
28. **Idem** para o pin inline da legenda.

### Ato VII — Nova versão enviada ao cliente
29. **Quando** copywriter clica "Reenviar para aprovação".
30. **Então** Edge Function `/approval/resubmit` cria `post_versions` v2 (novo snapshot completo), atualiza `approval_requests.post_version_id` para v2 **ou** cria novo `approval_requests` (decisão P-SPEC 002 — ver bugs).
31. **E** Resend dispara novo e-mail ao aprovador com o **mesmo magic_link** (reuso, não novo token).
32. **E** `post_cards.stage='in_review_client'` novamente.

### Ato VIII — Cliente aprova a v2
33. **Quando** aprovador reabre `/a/<token>` (mesmo token, `use_count=3+`) → vê v2 com indicador "Nova versão após seu feedback".
34. **E** vê timeline histórica (US-056) com as mudanças: "v1 enviada → feedback em slide 2 + legenda → v2 enviada".
35. **Quando** toca "Aprovar".
36. **Então** `approval_requests.status='approved'`, `post_version_id=v2`, `decided_at=now()`. `post_versions` **v2 is_locked=true**; v1 **não** é lockada (ficou apenas como histórico).
37. **E** `post_cards.stage='approved'`.

## Asserções críticas
- [ ] Pin em slide 2 e pin inline persistidos com FKs corretas e respeitando CHECK de consistência target/caption_range.
- [ ] `approval_pins.author_label` e `author_email` vêm do JWT do magic_link, **nunca** do body do request (prevenção de spoofing).
- [ ] Magic link **reusa-se** entre a primeira rejeição e a segunda aprovação — `use_count` cresce, `revoked_at IS NULL`, `expires_at` inalterado.
- [ ] `post_versions` tem v1 e v2 distintas; v1 permanece acessível na timeline.
- [ ] Apenas a `post_version` aprovada fica `is_locked=true`.
- [ ] `audit_log` reconstrói o fluxo: `approval.requested → pin.created ×2 → approval.changes_requested → pin.resolved ×2 → approval.requested (v2) → approval.approved`.
- [ ] Nenhum endpoint do aprovador aceita `author_email` / `actor_id` no body — sempre injetado server-side pelo middleware do JWT.
- [ ] Realtime channel do pin não vaza para outra workspace (asserted por subscribing com 2nd context da Agência B — deve ter 0 mensagens).

## Edge cases a incluir no mesmo fluxo
- **Aprovador tenta criar pin com `slide_index=15`:** CHECK `slide_index BETWEEN 0 AND 9` rejeita; Edge Function retorna 400.
- **Aprovador envia `pin_x=1.5`:** CHECK rejeita.
- **Pin em caption com `caption_range_end < caption_range_start`:** validar via Zod na Edge Function + CHECK sanidade.
- **Concorrência: designer e copywriter editam simultaneamente:** `post_drafts` tem optimistic lock via `updated_at` — segundo save recebe 409. **P-SPEC 001** (mesma do Flow 1).
- **Cliente aprova v1 depois do resubmit de v2:** Edge Function valida que `approval_requests.post_version_id == request body's expected_version_id`; rejeita com 409 se não bater.
- **Magic link revogado durante sessão aberta:** próxima chamada à Edge Function → 401, UI redireciona para "Link revogado".
- **Emoji/unicode em `decision_note` e `approval_pins.body`:** salvar e renderizar sem quebra.
- **Legenda editada encolhe — `caption_range_start/end` do pin antigo ficam fora do range:** marcar pin como `orphaned` (UI mostra "trecho referenciado não existe mais"). **P-SPEC 003** — comportamento não especificado.
- **Pin criado depois da aprovação:** rejeitado com 410 (approval_requests.status != pending).
- **Multi-aprovador (US-060 P2):** fora do MVP; apenas assert que `approval_requests` sem multi-aprovador funciona linear.

## Mocks necessários
- `Resend.send()` — captura novo e-mail no Ato VII; assert subject contém "Nova versão para sua aprovação".
- `pgsodium.decrypt_integration_secret()` — real.
- `GraphAPI` — não usado neste fluxo (publicação acontece depois em Flow 1 continuation).
- **Realtime:** testar via 2 browser contexts subscritos ao mesmo canal.

## Tempo esperado do fluxo completo
<60s em CI.

## Falhas aceitáveis vs inaceitáveis
**Aceitáveis:**
- Pin e comentário inline podem aparecer na UI interna com delay de até 2s (Realtime).

**Inaceitáveis:**
- `author_email` do pin salvo diferente do JWT (vazamento de identidade ou spoofing).
- v1 ficando `is_locked=true` erroneamente — bloquearia histórico.
- Magic link rotacionar/invalidar entre rodadas sem ação explícita do admin (quebraria UX).
- Pin de Agência A visível em realtime para Agência B.
- `decision_note` truncado sem validação visível na UI.

## Links
- [[../../../01_product/user-stories/US-053-comentario-pinado-coordenada]]
- [[../../../01_product/user-stories/US-054-comentario-legenda-inline]]
- [[../../../01_product/user-stories/US-055-1tap-aprovar-pedir-ajuste]]
- [[../../../01_product/user-stories/US-058-magic-link-auth]]
- [[../../../02_architecture/adr/004-approval-pins-storage]]
- [[../../../02_architecture/adr/005-post-versioning]]
- [[../../../02_architecture/adr/006-approver-auth]]
- [[../../../03_backend/api/magic-link]]
- [[../../bugs]]
