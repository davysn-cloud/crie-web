-- ============================================
-- 00011 — Post drafts + Post formats + Carousel slides
-- Designer F1/F2/F4 + rascunhos auto-save
-- ============================================

-- ============================================
-- POST_DRAFTS (rascunho ativo WIP — 1:1 com post_cards)
-- ============================================
CREATE TABLE public.post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_card_id uuid UNIQUE NOT NULL REFERENCES public.post_cards(id) ON DELETE CASCADE,
  body text,
  caption text,
  hashtags text[] NOT NULL DEFAULT '{}',
  carousel_script_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  reel_script_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  stories_script_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER post_drafts_updated_at
  BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_drafts_select" ON public.post_drafts
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_drafts_insert" ON public.post_drafts
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_drafts_update" ON public.post_drafts
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_drafts_delete" ON public.post_drafts
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

-- ============================================
-- POST_FORMATS (Designer F1/F2 — variantes por formato IG)
-- ============================================
CREATE TABLE public.post_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_card_id uuid NOT NULL REFERENCES public.post_cards(id) ON DELETE CASCADE,
  ig_format public.ig_format NOT NULL,
  is_master boolean NOT NULL DEFAULT false,
  master_format_id uuid REFERENCES public.post_formats(id) ON DELETE SET NULL,
  asset_version_id uuid REFERENCES public.asset_versions(id) ON DELETE SET NULL,
  safe_zone_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_card_id, ig_format),
  CHECK (NOT (is_master AND master_format_id IS NOT NULL))
);

CREATE INDEX idx_post_formats_card ON public.post_formats(post_card_id);
CREATE INDEX idx_post_formats_master ON public.post_formats(master_format_id);
CREATE INDEX idx_post_formats_asset ON public.post_formats(asset_version_id);

CREATE TRIGGER post_formats_updated_at
  BEFORE UPDATE ON public.post_formats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.post_formats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_formats_select" ON public.post_formats
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_formats_insert" ON public.post_formats
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_formats_update" ON public.post_formats
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
CREATE POLICY "post_formats_delete" ON public.post_formats
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

-- ============================================
-- CAROUSEL_SLIDES (Designer/Copy F4)
-- ============================================
CREATE TABLE public.carousel_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_format_id uuid NOT NULL REFERENCES public.post_formats(id) ON DELETE CASCADE,
  slide_index int NOT NULL CHECK (slide_index BETWEEN 0 AND 9),
  title text,
  body text,
  cta_overlay text,
  asset_version_id uuid REFERENCES public.asset_versions(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_format_id, slide_index)
);

CREATE INDEX idx_carousel_slides_format ON public.carousel_slides(post_format_id);
CREATE INDEX idx_carousel_slides_asset ON public.carousel_slides(asset_version_id);

CREATE TRIGGER carousel_slides_updated_at
  BEFORE UPDATE ON public.carousel_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

-- Helper inline: workspace_id via post_format → post_card
CREATE POLICY "carousel_slides_select" ON public.carousel_slides
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );
CREATE POLICY "carousel_slides_insert" ON public.carousel_slides
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );
CREATE POLICY "carousel_slides_update" ON public.carousel_slides
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );
CREATE POLICY "carousel_slides_delete" ON public.carousel_slides
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );
