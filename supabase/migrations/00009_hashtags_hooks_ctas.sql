-- ============================================
-- 00009 — Hashtag sets + Hooks library + CTAs library
-- Estrategista F6 / Copy F5 / Copy F6
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.performance_tag AS ENUM (
  'positive', 'negative', 'neutral'
);

CREATE TYPE public.cta_kind AS ENUM (
  'comment_bait', 'save_bait', 'share_bait', 'dm', 'link_in_bio'
);

-- ============================================
-- HASHTAG_SETS
-- ============================================
CREATE TABLE public.hashtag_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  pillar_id uuid REFERENCES public.pillars(id) ON DELETE SET NULL,
  description text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_hashtag_sets_ws_name ON public.hashtag_sets(workspace_id, lower(name));
CREATE INDEX idx_hashtag_sets_workspace ON public.hashtag_sets(workspace_id);
CREATE INDEX idx_hashtag_sets_pillar ON public.hashtag_sets(pillar_id);

CREATE TRIGGER hashtag_sets_updated_at
  BEFORE UPDATE ON public.hashtag_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.hashtag_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hashtag_sets_select" ON public.hashtag_sets
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "hashtag_sets_insert" ON public.hashtag_sets
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "hashtag_sets_update" ON public.hashtag_sets
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "hashtag_sets_delete" ON public.hashtag_sets
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- Fechar a FK pendente em briefs.hashtag_set_id (criada em 00008 sem FK)
ALTER TABLE public.briefs
  ADD CONSTRAINT briefs_hashtag_set_id_fkey
  FOREIGN KEY (hashtag_set_id) REFERENCES public.hashtag_sets(id) ON DELETE SET NULL;

-- ============================================
-- HASHTAG_SET_ITEMS
-- ============================================
CREATE TABLE public.hashtag_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag_set_id uuid NOT NULL REFERENCES public.hashtag_sets(id) ON DELETE CASCADE,
  tag text NOT NULL CHECK (char_length(tag) BETWEEN 1 AND 100 AND tag !~ '^#'),
  sort_order int NOT NULL DEFAULT 0,
  avg_reach int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_hashtag_items_set_tag ON public.hashtag_set_items(hashtag_set_id, lower(tag));
CREATE INDEX idx_hashtag_items_set ON public.hashtag_set_items(hashtag_set_id);

ALTER TABLE public.hashtag_set_items ENABLE ROW LEVEL SECURITY;

-- Helper inline: resolve workspace via hashtag_set
CREATE POLICY "hashtag_set_items_select" ON public.hashtag_set_items
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );
CREATE POLICY "hashtag_set_items_insert" ON public.hashtag_set_items
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );
CREATE POLICY "hashtag_set_items_update" ON public.hashtag_set_items
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );
CREATE POLICY "hashtag_set_items_delete" ON public.hashtag_set_items
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );

-- ============================================
-- HOOKS_LIBRARY (Copy F5)
-- ============================================
CREATE TABLE public.hooks_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  body text NOT NULL,
  ig_format public.ig_format,
  pillar_id uuid REFERENCES public.pillars(id) ON DELETE SET NULL,
  performance public.performance_tag NOT NULL DEFAULT 'neutral',
  uses_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  body_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', body)) STORED
);

CREATE INDEX idx_hooks_workspace ON public.hooks_library(workspace_id);
CREATE INDEX idx_hooks_pillar ON public.hooks_library(pillar_id);
CREATE INDEX idx_hooks_workspace_perf ON public.hooks_library(workspace_id, performance);
CREATE INDEX idx_hooks_body_tsv ON public.hooks_library USING gin(body_tsv);

CREATE TRIGGER hooks_library_updated_at
  BEFORE UPDATE ON public.hooks_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.hooks_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hooks_library_select" ON public.hooks_library
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "hooks_library_insert" ON public.hooks_library
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "hooks_library_update" ON public.hooks_library
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "hooks_library_delete" ON public.hooks_library
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ============================================
-- CTAS_LIBRARY (Copy F6)
-- ============================================
CREATE TABLE public.ctas_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  body text NOT NULL,
  ig_format public.ig_format,
  cta_kind public.cta_kind NOT NULL DEFAULT 'comment_bait',
  pillar_id uuid REFERENCES public.pillars(id) ON DELETE SET NULL,
  performance public.performance_tag NOT NULL DEFAULT 'neutral',
  uses_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  body_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', body)) STORED
);

CREATE INDEX idx_ctas_workspace ON public.ctas_library(workspace_id);
CREATE INDEX idx_ctas_pillar ON public.ctas_library(pillar_id);
CREATE INDEX idx_ctas_workspace_kind ON public.ctas_library(workspace_id, cta_kind);
CREATE INDEX idx_ctas_body_tsv ON public.ctas_library USING gin(body_tsv);

CREATE TRIGGER ctas_library_updated_at
  BEFORE UPDATE ON public.ctas_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.ctas_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ctas_library_select" ON public.ctas_library
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "ctas_library_insert" ON public.ctas_library
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "ctas_library_update" ON public.ctas_library
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "ctas_library_delete" ON public.ctas_library
  FOR DELETE USING (public.is_workspace_member(workspace_id));
