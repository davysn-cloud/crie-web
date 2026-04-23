-- ============================================
-- 00016 — Insights
-- Estrategista F7 — performance via Meta Graph Insights
-- ============================================

CREATE TABLE public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  post_card_id uuid REFERENCES public.post_cards(id) ON DELETE CASCADE,
  ig_media_id text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  impressions int,
  reach int,
  engagement int,
  saves int,
  shares int,
  comments_count int,
  likes_count int,
  video_views int,
  plays int,
  profile_visits int,
  follows int,
  raw_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ig_media_id, fetched_at)
);

CREATE INDEX idx_insights_workspace ON public.insights(workspace_id);
CREATE INDEX idx_insights_card ON public.insights(post_card_id);
CREATE INDEX idx_insights_ig_media ON public.insights(ig_media_id);
CREATE INDEX idx_insights_fetched ON public.insights(fetched_at);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insights_select" ON public.insights
  FOR SELECT USING (public.is_workspace_member(workspace_id));
-- INSERT apenas por jobs de sync (service_role); policy liberada para membros
-- para permitir fallback manual / testes locais.
CREATE POLICY "insights_insert" ON public.insights
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "insights_update" ON public.insights
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "insights_delete" ON public.insights
  FOR DELETE USING (public.is_workspace_member(workspace_id));
