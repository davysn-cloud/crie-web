-- ============================================
-- 00012 — Asset library + Templates
-- Designer F5 / F6
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.asset_kind AS ENUM (
  'image', 'video', 'icon', 'illustration', 'mockup', 'logo'
);

CREATE TYPE public.asset_source AS ENUM (
  'upload', 'canva', 'unsplash', 'pexels'
);

-- ============================================
-- ASSET_LIBRARY (Designer F6)
-- ============================================
CREATE TABLE public.asset_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  kind public.asset_kind NOT NULL DEFAULT 'image',
  tags text[] NOT NULL DEFAULT '{}',
  dominant_color text,
  width int,
  height int,
  bytes bigint,
  source public.asset_source NOT NULL DEFAULT 'upload',
  external_ref text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_asset_library_workspace ON public.asset_library(workspace_id);
CREATE INDEX idx_asset_library_tags ON public.asset_library USING gin(tags);
CREATE INDEX idx_asset_library_workspace_kind ON public.asset_library(workspace_id, kind);
CREATE INDEX idx_asset_library_color ON public.asset_library(dominant_color);
CREATE INDEX idx_asset_library_created_by ON public.asset_library(created_by);

CREATE TRIGGER asset_library_updated_at
  BEFORE UPDATE ON public.asset_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.asset_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_library_select" ON public.asset_library
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "asset_library_insert" ON public.asset_library
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "asset_library_update" ON public.asset_library
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "asset_library_delete" ON public.asset_library
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ============================================
-- TEMPLATES (Designer F5)
-- ============================================
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  pillar_id uuid REFERENCES public.pillars(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ig_format public.ig_format,
  source_post_card_id uuid REFERENCES public.post_cards(id) ON DELETE SET NULL,
  thumbnail_url text,
  variables_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  usage_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_workspace ON public.templates(workspace_id);
CREATE INDEX idx_templates_pillar ON public.templates(pillar_id);
CREATE INDEX idx_templates_campaign ON public.templates(campaign_id);
CREATE INDEX idx_templates_workspace_fmt ON public.templates(workspace_id, ig_format);
CREATE INDEX idx_templates_source ON public.templates(source_post_card_id);

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON public.templates
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "templates_insert" ON public.templates
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "templates_update" ON public.templates
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "templates_delete" ON public.templates
  FOR DELETE USING (public.is_workspace_member(workspace_id));
