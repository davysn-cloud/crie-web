-- ============================================
-- 00008 — Pillars + Campaigns + Briefs
-- Estrategista F2, F3, F4
-- ============================================

-- ============================================
-- ENUMS (compartilhados por várias tabelas)
-- ============================================
CREATE TYPE public.ig_format AS ENUM (
  'feed_1_1', 'feed_4_5', 'feed_1_91_1', 'story', 'reel', 'carousel'
);

CREATE TYPE public.brief_objective AS ENUM (
  'awareness', 'consideration', 'conversion', 'retention'
);

CREATE TYPE public.brief_status AS ENUM (
  'draft', 'active', 'done', 'archived'
);

-- ============================================
-- PILLARS (Estrategista F2)
-- ============================================
CREATE TABLE public.pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#8884d8',
  description text,
  target_percentage int NOT NULL DEFAULT 0 CHECK (target_percentage BETWEEN 0 AND 100),
  sort_order int NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_pillars_workspace_name ON public.pillars(workspace_id, lower(name));
CREATE INDEX idx_pillars_workspace ON public.pillars(workspace_id);

CREATE TRIGGER pillars_updated_at
  BEFORE UPDATE ON public.pillars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.pillars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pillars_select" ON public.pillars
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "pillars_insert" ON public.pillars
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "pillars_update" ON public.pillars
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "pillars_delete" ON public.pillars
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ============================================
-- CAMPAIGNS (Estrategista F3)
-- (briefs ainda não existe; campaigns.brief_id será FK adicionada
--  após CREATE TABLE briefs, mais abaixo)
-- ============================================
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  starts_at date,
  ends_at date,
  brief_id uuid, -- FK adicionada via ALTER abaixo (briefs criada depois)
  color text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at)
);

CREATE INDEX idx_campaigns_workspace ON public.campaigns(workspace_id);
CREATE INDEX idx_campaigns_dates ON public.campaigns(workspace_id, starts_at, ends_at);
CREATE INDEX idx_campaigns_brief ON public.campaigns(brief_id);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON public.campaigns
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "campaigns_insert" ON public.campaigns
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "campaigns_update" ON public.campaigns
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "campaigns_delete" ON public.campaigns
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ============================================
-- BRIEFS (Estrategista F4)
-- hashtag_sets ainda não existe; FK adicionada em 00009 via ALTER.
-- ============================================
CREATE TABLE public.briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  post_card_id uuid UNIQUE REFERENCES public.post_cards(id) ON DELETE CASCADE,
  pillar_id uuid REFERENCES public.pillars(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  objective public.brief_objective,
  ig_format public.ig_format,
  target_audience text,
  key_message text,
  cta text,
  references_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  due_at timestamptz,
  assignee_copy uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_design uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  hashtag_set_id uuid, -- FK adicionada em 00009
  status public.brief_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_briefs_workspace ON public.briefs(workspace_id);
CREATE INDEX idx_briefs_pillar ON public.briefs(pillar_id);
CREATE INDEX idx_briefs_campaign ON public.briefs(campaign_id);
CREATE INDEX idx_briefs_post_card ON public.briefs(post_card_id);
CREATE INDEX idx_briefs_assignee_copy ON public.briefs(assignee_copy);
CREATE INDEX idx_briefs_assignee_design ON public.briefs(assignee_design);
CREATE INDEX idx_briefs_due_at ON public.briefs(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX idx_briefs_hashtag_set ON public.briefs(hashtag_set_id);

CREATE TRIGGER briefs_updated_at
  BEFORE UPDATE ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "briefs_select" ON public.briefs
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "briefs_insert" ON public.briefs
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "briefs_update" ON public.briefs
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "briefs_delete" ON public.briefs
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- Agora que briefs existe, fechar o ciclo de FK em campaigns.brief_id
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_brief_id_fkey
  FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE SET NULL;
