-- ============================================
-- 00017 — Audit Log
-- Admin F8 — log imutável de quem fez o quê
-- ============================================

CREATE TYPE public.audit_actor AS ENUM (
  'user', 'magic_link', 'system', 'worker'
);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_type public.audit_actor NOT NULL,
  actor_id uuid,
  actor_label text,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  diff_json jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_agency_time ON public.audit_log(agency_id, created_at DESC);
CREATE INDEX idx_audit_workspace_time ON public.audit_log(workspace_id, created_at DESC);
CREATE INDEX idx_audit_actor ON public.audit_log(actor_id);
CREATE INDEX idx_audit_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON public.audit_log(action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- SELECT: membros da agência podem ler.
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (public.is_agency_member(agency_id));

-- INSERT: permitido para membros (triggers/Edge Functions escrevem via service_role,
-- mas deixamos membros também para casos de eventos manuais).
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

-- Sem UPDATE/DELETE: imutável. Qualquer remoção exige service_role.
