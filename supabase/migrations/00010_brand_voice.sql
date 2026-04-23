-- ============================================
-- 00010 — Brand Voice (Copy F8)
-- Nova tabela 1:1 com workspaces, dedicada a prompt engineering.
-- Coexiste com `brand_profiles` (que continua fonte de brand_kit).
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.voice_tone AS ENUM (
  'formal', 'neutral', 'casual', 'playful'
);

CREATE TYPE public.emoji_policy AS ENUM (
  'none', 'sparingly', 'freely'
);

-- ============================================
-- BRAND_VOICE
-- ============================================
CREATE TABLE public.brand_voice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid UNIQUE NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tone public.voice_tone NOT NULL DEFAULT 'neutral',
  vocab_preferred text[] NOT NULL DEFAULT '{}',
  vocab_forbidden text[] NOT NULL DEFAULT '{}',
  emoji_policy public.emoji_policy NOT NULL DEFAULT 'sparingly',
  slang_allowed boolean NOT NULL DEFAULT false,
  approved_examples_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  system_prompt_override text,
  llm_model text NOT NULL DEFAULT 'claude-3-5-sonnet',
  llm_temperature numeric(3,2) NOT NULL DEFAULT 0.70 CHECK (llm_temperature BETWEEN 0 AND 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_voice_workspace ON public.brand_voice(workspace_id);

CREATE TRIGGER brand_voice_updated_at
  BEFORE UPDATE ON public.brand_voice
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.brand_voice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brand_voice_select" ON public.brand_voice
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "brand_voice_insert" ON public.brand_voice
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "brand_voice_update" ON public.brand_voice
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "brand_voice_delete" ON public.brand_voice
  FOR DELETE USING (public.is_workspace_member(workspace_id));
