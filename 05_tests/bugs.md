---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: active
confidence: high
---

# Bugs conhecidos

> Registro vivo de bugs encontrados em qualquer fase (implementação, QA, beta). Severidade: **P0** (quebra produção/vaza dados), **P1** (feature crítica quebrada), **P2** (workaround existe), **P3** (cosmético), **P-SPEC** (especificação ambígua — bloqueia implementação até product/backend/frontend responderem).
>
> Formato: `- [id] [severidade] [owner] título — reprodução / link.`

## Aberto

### P-SPEC — Gaps de especificação (bloqueiam implementação de testes/feature)

- ~~**P-SPEC-001**~~ · [backend] **RESOLVIDO — Lock otimista em `post_drafts` para concorrência de 2 editores.**
  - **Resolucao:** Migration 00019 adiciona coluna `version int NOT NULL DEFAULT 1` + trigger auto-increment + RPC `update_post_draft(p_id, p_expected_version, p_data)` que raises SQLSTATE 40001 em conflito. Frontend deve ler version e passar na mutation.
  - Ref: `supabase/migrations/00019_pspec_resolutions.sql`

- ~~**P-SPEC-002**~~ · [backend] **RESOLVIDO — Resubmissão de aprovação = novo row.**
  - **Resolucao:** Opcao B escolhida. Migration 00019 adiciona valor `superseded` ao enum `approval_status` + trigger `trg_supersede_pending_approvals` que auto-marca requests pendentes anteriores como `superseded` ao inserir novo request para mesmo `post_card_id`.
  - Ref: `supabase/migrations/00019_pspec_resolutions.sql`

- **P-SPEC-003** · [product] **Pin em legenda cujo range não existe mais após edição da copy.**
  - Contexto: Flow 2 edge cases — copywriter edita legenda e encolhe trecho comentado; `approval_pins.caption_range_start/end` ficam inválidos.
  - Pergunta: marcar pin como `orphaned`? Recalcular automaticamente? Deletar? Deixar apontando para range inválido com fallback visual?
  - Bloqueia: US-054.
  - Owner esperado: product + frontend.

- ~~**P-SPEC-004**~~ · [backend] **RESOLVIDO — `is_agency_member` filtra `accepted_at IS NOT NULL`.**
  - **Resolucao:** Migration 00019 reescreve `is_agency_member`, `is_workspace_member`, `is_agency_admin`, `can_read_integration` para exigir `accepted_at IS NOT NULL`. Garante coluna `accepted_at` existe em `agency_members`.
  - Ref: `supabase/migrations/00019_pspec_resolutions.sql`

- ~~**P-SPEC-005**~~ · [backend] **RESOLVIDO — `deleted_at IS NULL` nas policies.**
  - **Resolucao:** Migration 00019 reescreve policies da tabela `briefs` (unica com `deleted_at` nas migrations 00008-00017) para incluir `AND deleted_at IS NULL` em SELECT/UPDATE/DELETE. Policy separada `briefs_select_deleted` permite estrategista ver itens deletados. `agency_integrations` ja filtra `deleted_at` nos indices/view (migration 00018).
  - Ref: `supabase/migrations/00019_pspec_resolutions.sql`

- ~~**P-SPEC-006**~~ · [backend + product] **RESOLVIDO — Role enums + matriz documentada.**
  - **Resolucao:** Migration 00019 cria enums `agency_role` e `workspace_role`, migra colunas text para enum, documenta matriz role x acao como comentario SQL. `agency_members.role` agora e `agency_role` enum; `workspace_members.role` agora e `workspace_role` enum. Policies existentes via `is_workspace_member` continuam como baseline; granularidade fina role-por-acao fica para fase 2 (policies por acao especifica).
  - Ref: `supabase/migrations/00019_pspec_resolutions.sql`

- **P-SPEC-007** · [backend] **Expiração programática de `approval_requests.status='expired'`.**
  - Contexto: ADR 006 menciona "cron update `approval_requests` onde `expires_at < now()` para `expired`". Não há migration dessa cron yet.
  - Pergunta: qual a frequência? É `pg_cron` job junto com 00015/00018? Qual evento dispara notificação ao admin?
  - Bloqueia: US-057, US-058.
  - Owner esperado: backend + deploy.

- **P-SPEC-008** · [frontend + product] **Preview Instagram-nativo: qual fonte de verdade para safe zones e UI overlay?**
  - Contexto: US-052 e US-038 pedem pixel-accuracy. Os overlays (header com handle, paginação, bar de interação) mudam entre versões do IG.
  - Pergunta: snapshot atual do IG é baseline congelado? Atualizamos trimestralmente? Há design tokens para essas UIs?
  - Bloqueia: snapshot visual dos testes E2E (determinismo).
  - Owner esperado: frontend + product.

### P0

_(vazio)_

### P1

_(vazio)_

### P2

_(vazio)_

### P3

_(vazio)_

## Fechado

_(vazio)_

## Links
- [[plano]]
- [[security-checklist]]
- [[pre-deploy]]
- [[cases/e2e/flow-1-brief-to-publish]]
- [[cases/e2e/flow-2-approval-with-adjustment]]
- [[cases/e2e/flow-3-multi-tenant-isolation]]
