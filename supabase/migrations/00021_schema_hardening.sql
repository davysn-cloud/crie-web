-- ============================================
-- 00021 — Schema hardening (P0 do review-2026-04-29-backend)
-- ============================================
-- Origem: [[02_architecture/review-2026-04-29-summary]]
--         [[02_architecture/review-2026-04-29-backend]]
--
-- Esta migration consolida 4 ajustes P0 identificados no review:
--   A. BUGFIX: unique_active_integration de 00018 — UNIQUE constraint
--      contendo deleted_at é furado em Postgres (NULL != NULL),
--      permite múltiplas integrações ativas duplicadas. Trocar por
--      UNIQUE INDEX parcial WHERE deleted_at IS NULL.
--   B. DENORMALIZAR workspace_id em approval_pins e publish_attempts
--      para eliminar subquery em policies RLS (3-way JOIN por linha
--      no hot path do aprovador e da fila de publicação).
--   C. ÍNDICES compostos em workspace_members e agency_members usados
--      pelos helpers is_workspace_member / is_agency_member em quase
--      toda policy do schema.
--   D. CHECK de tamanho em colunas JSONB que aceitam payloads externos
--      (audit_log.diff_json, publish_attempts.request/response_payload,
--      insights.raw_json) — defesa simples contra row > 100KB.
--
-- Idempotente sempre que possível (IF NOT EXISTS / IF EXISTS).
-- Pré-beta: tabelas-alvo estão vazias, então UPDATE de backfill é seguro
-- e CHECKs podem ser adicionados direto (sem NOT VALID).

-- =========================================================================
-- A. BUGFIX unique_active_integration
-- =========================================================================
-- Em 00018 foi declarado como CONSTRAINT:
--   constraint unique_active_integration
--     unique (agency_id, workspace_id, provider, deleted_at)
-- Como deleted_at é nullable e NULL != NULL no Postgres, duas linhas
-- ativas com mesmo (agency_id, workspace_id, provider) e deleted_at NULL
-- são consideradas distintas. Substituir por unique partial index.

alter table public.agency_integrations
  drop constraint if exists unique_active_integration;

create unique index if not exists unique_active_integration
  on public.agency_integrations (agency_id, workspace_id, provider)
  where deleted_at is null;

-- =========================================================================
-- B1. approval_pins: denormalizar workspace_id
-- =========================================================================
-- Hoje approval_pins não carrega workspace_id; policies RLS resolvem via
-- subquery em approval_requests. Adicionar coluna + backfill + NOT NULL +
-- index + reescrever policies para uso direto do helper.

alter table public.approval_pins
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.approval_pins ap
   set workspace_id = ar.workspace_id
  from public.approval_requests ar
 where ap.approval_request_id = ar.id
   and ap.workspace_id is null;

alter table public.approval_pins
  alter column workspace_id set not null;

create index if not exists idx_approval_pins_workspace
  on public.approval_pins(workspace_id);

drop policy if exists "approval_pins_select" on public.approval_pins;
drop policy if exists "approval_pins_insert" on public.approval_pins;
drop policy if exists "approval_pins_update" on public.approval_pins;
drop policy if exists "approval_pins_delete" on public.approval_pins;

create policy "approval_pins_select" on public.approval_pins
  for select using (public.is_workspace_member(workspace_id));
create policy "approval_pins_insert" on public.approval_pins
  for insert with check (public.is_workspace_member(workspace_id));
create policy "approval_pins_update" on public.approval_pins
  for update using (public.is_workspace_member(workspace_id));
create policy "approval_pins_delete" on public.approval_pins
  for delete using (public.is_workspace_member(workspace_id));

-- =========================================================================
-- B2. publish_attempts: denormalizar workspace_id
-- =========================================================================
-- publish_attempts referencia publish_queue (não post_cards diretamente).
-- Backfill via JOIN em publish_queue, que já carrega workspace_id.

alter table public.publish_attempts
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.publish_attempts pa
   set workspace_id = pq.workspace_id
  from public.publish_queue pq
 where pa.publish_queue_id = pq.id
   and pa.workspace_id is null;

alter table public.publish_attempts
  alter column workspace_id set not null;

create index if not exists idx_publish_attempts_workspace
  on public.publish_attempts(workspace_id);

drop policy if exists "publish_attempts_select" on public.publish_attempts;
drop policy if exists "publish_attempts_insert" on public.publish_attempts;

create policy "publish_attempts_select" on public.publish_attempts
  for select using (public.is_workspace_member(workspace_id));
create policy "publish_attempts_insert" on public.publish_attempts
  for insert with check (public.is_workspace_member(workspace_id));
-- Append-only: sem UPDATE/DELETE policies (mantido).

-- =========================================================================
-- C. Índices compostos críticos para RLS
-- =========================================================================
-- Os helpers is_workspace_member(ws) e is_agency_member(agency) fazem
-- lookup por (user_id, workspace_id) e (user_id, agency_id, accepted_at)
-- respectivamente. Hoje só existem índices simples em (workspace_id) /
-- (user_id) e (agency_id) / (user_id) — força bitmap scan em policies.

create index if not exists idx_workspace_members_user_workspace
  on public.workspace_members(user_id, workspace_id);

create index if not exists idx_agency_members_user_accepted
  on public.agency_members(user_id, accepted_at)
  where accepted_at is not null;

-- =========================================================================
-- D. CHECK de tamanho em colunas JSONB
-- =========================================================================
-- Defesa contra payload patológico: 100KB já cabe response Meta + erro
-- estendido. Se passar disso, o caller deve truncar/sumarizar antes.
-- Pre-beta as tabelas estão vazias, então CHECK pode ser adicionado direto.

alter table public.audit_log
  drop constraint if exists chk_audit_log_diff_json_size;
alter table public.audit_log
  add constraint chk_audit_log_diff_json_size
  check (diff_json is null or octet_length(diff_json::text) < 100000);

alter table public.publish_attempts
  drop constraint if exists chk_publish_attempts_request_payload_size;
alter table public.publish_attempts
  add constraint chk_publish_attempts_request_payload_size
  check (request_payload is null or octet_length(request_payload::text) < 100000);

alter table public.publish_attempts
  drop constraint if exists chk_publish_attempts_response_payload_size;
alter table public.publish_attempts
  add constraint chk_publish_attempts_response_payload_size
  check (response_payload is null or octet_length(response_payload::text) < 100000);

alter table public.insights
  drop constraint if exists chk_insights_raw_json_size;
alter table public.insights
  add constraint chk_insights_raw_json_size
  check (octet_length(raw_json::text) < 100000);
