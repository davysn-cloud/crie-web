-- ============================================
-- 00013 — Post Versions (snapshot completo)
-- Copy/Designer F9 / F10 — histórico de versões nível-card
-- Coexiste com copy_versions / asset_versions (granularidade fina).
-- ============================================

CREATE TABLE public.post_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_card_id uuid NOT NULL REFERENCES public.post_cards(id) ON DELETE CASCADE,
  version int NOT NULL,
  label text,
  payload_json jsonb NOT NULL,
  is_locked boolean NOT NULL DEFAULT false,
  locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  locked_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_card_id, version)
);

CREATE INDEX idx_post_versions_card ON public.post_versions(post_card_id);
CREATE INDEX idx_post_versions_locked ON public.post_versions(post_card_id, is_locked);
CREATE INDEX idx_post_versions_created_by ON public.post_versions(created_by);

ALTER TABLE public.post_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_versions_select" ON public.post_versions
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_versions_insert" ON public.post_versions
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
-- UPDATE só permitido para mudar is_locked/locked_by/locked_at (lock de versão).
-- Sem policy de DELETE: versões são imutáveis. Remoção manual via service_role.
CREATE POLICY "post_versions_update_lock" ON public.post_versions
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
