-- ============================================
-- 00014 — Approval flow: requests + pins + magic_links
-- Aprovador F2 / F4 / F9 / Admin F7
-- Aprovador externo autentica via magic_link (não auth.uid()).
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.approval_status AS ENUM (
  'pending', 'approved', 'changes_requested', 'cancelled', 'expired'
);

CREATE TYPE public.approval_reason AS ENUM (
  'copy', 'arte', 'timing', 'outro'
);

CREATE TYPE public.magic_link_purpose AS ENUM (
  'approval', 'portal_view'
);

CREATE TYPE public.pin_target AS ENUM (
  'image', 'caption'
);

-- ============================================
-- MAGIC_LINKS (criada primeiro pois approval_requests referencia)
-- ============================================
CREATE TABLE public.magic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  purpose public.magic_link_purpose NOT NULL DEFAULT 'approval',
  approval_request_id uuid, -- FK adicionada abaixo (dep. circular)
  token_hash text UNIQUE NOT NULL,
  email text NOT NULL,
  label text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  used_at timestamptz,
  use_count int NOT NULL DEFAULT 0,
  last_used_ip inet,
  last_used_user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_magic_links_agency ON public.magic_links(agency_id);
CREATE INDEX idx_magic_links_workspace ON public.magic_links(workspace_id);
CREATE INDEX idx_magic_links_email ON public.magic_links(email);
CREATE INDEX idx_magic_links_approval ON public.magic_links(approval_request_id);
CREATE INDEX idx_magic_links_expires ON public.magic_links(expires_at);

ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Só membros da agência podem gerenciar magic_links (listar, revogar etc).
-- Validação pelo aprovador externo acontece via Edge Function com service_role.
CREATE POLICY "magic_links_select" ON public.magic_links
  FOR SELECT USING (public.is_agency_member(agency_id));
CREATE POLICY "magic_links_insert" ON public.magic_links
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));
CREATE POLICY "magic_links_update" ON public.magic_links
  FOR UPDATE USING (public.is_agency_member(agency_id));
CREATE POLICY "magic_links_delete" ON public.magic_links
  FOR DELETE USING (public.is_agency_member(agency_id));

-- ============================================
-- APPROVAL_REQUESTS
-- ============================================
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_card_id uuid NOT NULL REFERENCES public.post_cards(id) ON DELETE CASCADE,
  post_version_id uuid REFERENCES public.post_versions(id) ON DELETE SET NULL,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  assignee_email text NOT NULL,
  assignee_label text,
  status public.approval_status NOT NULL DEFAULT 'pending',
  decision_note text,
  reason_code public.approval_reason,
  decided_at timestamptz,
  decided_via_magic_link_id uuid REFERENCES public.magic_links(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_requests_card ON public.approval_requests(post_card_id);
CREATE INDEX idx_approval_requests_ws ON public.approval_requests(workspace_id);
CREATE INDEX idx_approval_requests_status ON public.approval_requests(status);
CREATE INDEX idx_approval_requests_email ON public.approval_requests(assignee_email);
CREATE INDEX idx_approval_requests_expires ON public.approval_requests(expires_at);

CREATE TRIGGER approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_requests_select" ON public.approval_requests
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "approval_requests_insert" ON public.approval_requests
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "approval_requests_update" ON public.approval_requests
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "approval_requests_delete" ON public.approval_requests
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- Agora fechamos o ciclo: magic_links.approval_request_id aponta para approval_requests.
ALTER TABLE public.magic_links
  ADD CONSTRAINT magic_links_approval_request_id_fkey
  FOREIGN KEY (approval_request_id) REFERENCES public.approval_requests(id) ON DELETE SET NULL;

-- ============================================
-- APPROVAL_PINS (Aprovador F2)
-- Pins em coordenada (x,y) por slide/frame + comentários inline na legenda.
-- Aprovador externo cria via Edge Function. Membros da agência resolvem.
-- ============================================
CREATE TABLE public.approval_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id uuid NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  slide_index int,
  frame_timestamp_ms int,
  pin_x numeric(5,4) NOT NULL DEFAULT 0,
  pin_y numeric(5,4) NOT NULL DEFAULT 0,
  body text NOT NULL,
  target public.pin_target NOT NULL DEFAULT 'image',
  caption_range_start int,
  caption_range_end int,
  author_label text NOT NULL,
  author_email text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pin_x BETWEEN 0 AND 1 AND pin_y BETWEEN 0 AND 1),
  CHECK (
    (target = 'caption' AND caption_range_start IS NOT NULL AND caption_range_end IS NOT NULL)
    OR target = 'image'
  )
);

CREATE INDEX idx_approval_pins_request ON public.approval_pins(approval_request_id);
CREATE INDEX idx_approval_pins_unresolved ON public.approval_pins(approval_request_id, resolved);
CREATE INDEX idx_approval_pins_slide ON public.approval_pins(slide_index);

CREATE TRIGGER approval_pins_updated_at
  BEFORE UPDATE ON public.approval_pins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.approval_pins ENABLE ROW LEVEL SECURITY;

-- Membros da agência: acesso completo via workspace do approval_request.
CREATE POLICY "approval_pins_select" ON public.approval_pins
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.approval_requests WHERE id = approval_request_id)
    )
  );
CREATE POLICY "approval_pins_insert" ON public.approval_pins
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.approval_requests WHERE id = approval_request_id)
    )
  );
CREATE POLICY "approval_pins_update" ON public.approval_pins
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.approval_requests WHERE id = approval_request_id)
    )
  );
CREATE POLICY "approval_pins_delete" ON public.approval_pins
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.approval_requests WHERE id = approval_request_id)
    )
  );

-- Nota: aprovador externo (anon) INSERTA e SELECTA via Edge Function com service_role
-- bypass. Não criamos policy anon aqui para evitar vazamento de dados da workspace.
