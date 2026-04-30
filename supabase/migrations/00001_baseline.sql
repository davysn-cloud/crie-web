-- 00001_baseline.sql
-- Schema base do crie-web: enums, funções helper, tabelas core e RLS.
-- Reconstruído a partir do projeto exzmhbdfdqxriedadcmy em 2026-04-30
-- para viabilizar a migração para sa-east-1 (ndrqaymrkrlilxnyfymt).
-- Ordem: enums → trigger fn → tabelas (sem policies) → helper fns → policies

-- =========================================================================
-- 1. Extensões
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================================
-- 2. Enums das tabelas base
-- (Os demais enums são criados pelas migrations 00008-00017)
-- =========================================================================

-- Usado por agencies
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Usado por post_cards
DO $$ BEGIN
  CREATE TYPE public.post_stage AS ENUM ('ideia', 'briefing', 'copy', 'aprovacao_copy', 'design', 'aprovacao_arte', 'agendado', 'publicado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Usado por agency_members (também criado em DO block no 00019 — seguro duplicar)
DO $$ BEGIN
  CREATE TYPE public.agency_role AS ENUM ('owner', 'admin', 'strategist', 'copywriter', 'designer', 'social_media');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Usado por workspace_members (também criado em DO block no 00019 — seguro duplicar)
DO $$ BEGIN
  CREATE TYPE public.workspace_role AS ENUM ('owner', 'strategist', 'copywriter', 'designer', 'social_media');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================================
-- 3. Função utilitária: updated_at
-- =========================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================================
-- 4. Tabelas core (sem RLS policies — adicionadas após helper fns)
-- =========================================================================

-- 4.1 agencies
CREATE TABLE IF NOT EXISTS public.agencies (
  id                     uuid                      PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text                      NOT NULL,
  slug                   text                      NOT NULL UNIQUE,
  logo_url               text,
  owner_id               uuid                      NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  stripe_customer_id     text,
  stripe_subscription_id text,
  subscription_status    public.subscription_status DEFAULT 'trialing',
  seat_limit             integer                   DEFAULT 3,
  created_at             timestamptz               DEFAULT now(),
  updated_at             timestamptz               DEFAULT now()
);

CREATE TRIGGER agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- 4.2 workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id  uuid        NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  slug       text        NOT NULL,
  archived   boolean     DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (agency_id, slug)
);

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 4.3 agency_members
CREATE TABLE IF NOT EXISTS public.agency_members (
  id            uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     uuid               NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id       uuid               NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text               NOT NULL,
  avatar_url    text,
  invited_email text,
  accepted_at   timestamptz,
  created_at    timestamptz        DEFAULT now(),
  role          public.agency_role NOT NULL DEFAULT 'copywriter',
  UNIQUE (agency_id, user_id)
);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- 4.4 workspace_members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id           uuid                  PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid                  NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      uuid                  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         public.workspace_role NOT NULL DEFAULT 'copywriter',
  created_at   timestamptz           DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 4.5 post_cards
CREATE TABLE IF NOT EXISTS public.post_cards (
  id            uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid              NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title         text              NOT NULL,
  stage         public.post_stage NOT NULL DEFAULT 'ideia',
  post_type     text,
  scheduled_at  timestamptz,
  published_at  timestamptz,
  published_url text,
  ig_media_id   text,
  assigned_to   uuid              REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by    uuid              NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  sort_order    integer           DEFAULT 0,
  archived      boolean           DEFAULT false,
  created_at    timestamptz       DEFAULT now(),
  updated_at    timestamptz       DEFAULT now()
);

CREATE TRIGGER post_cards_updated_at
  BEFORE UPDATE ON public.post_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.post_cards ENABLE ROW LEVEL SECURITY;

-- 4.6 brand_profiles
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE UNIQUE,
  brand_name       text,
  tone_of_voice    text,
  target_audience  text,
  do_not_say       text[]      DEFAULT '{}',
  keywords         text[]      DEFAULT '{}',
  colors           jsonb       DEFAULT '[]',
  fonts            jsonb       DEFAULT '[]',
  moodboard_urls   text[]      DEFAULT '{}',
  logo_url         text,
  extra_guidelines text,
  instagram_handle text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE TRIGGER brand_profiles_updated_at
  BEFORE UPDATE ON public.brand_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- 4.7 asset_versions (referenciada por post_formats/carousel_slides no 00011)
CREATE TABLE IF NOT EXISTS public.asset_versions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_card_id uuid        NOT NULL REFERENCES public.post_cards(id) ON DELETE CASCADE,
  version      integer     NOT NULL DEFAULT 1,
  file_url     text        NOT NULL,
  file_type    text        NOT NULL,
  thumbnail_url text,
  width        integer,
  height       integer,
  is_approved  boolean     DEFAULT false,
  approved_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.asset_versions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 5. Funções helper para RLS (criadas APÓS as tabelas existirem)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_agency_id_for_workspace(ws uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT agency_id FROM public.workspaces WHERE id = ws;
$$;

CREATE OR REPLACE FUNCTION public.is_agency_member(agency uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = agency AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws AND user_id = auth.uid()
  );
$$;

-- =========================================================================
-- 6. RLS Policies (criadas APÓS as funções helper)
-- =========================================================================

-- agencies
CREATE POLICY agency_insert ON public.agencies FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY agency_select ON public.agencies FOR SELECT
  USING (public.is_agency_member(id));

CREATE POLICY agency_update ON public.agencies FOR UPDATE
  USING (public.is_agency_member(id));

-- workspaces
CREATE POLICY workspaces_insert ON public.workspaces FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY workspaces_select ON public.workspaces FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE
  USING (public.is_agency_member(agency_id));

-- agency_members
CREATE POLICY agency_members_select ON public.agency_members FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY agency_members_insert ON public.agency_members FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY agency_members_delete ON public.agency_members FOR DELETE
  USING (public.is_agency_member(agency_id));

-- workspace_members
CREATE POLICY workspace_members_select ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY workspace_members_insert ON public.workspace_members FOR INSERT
  WITH CHECK (public.is_agency_member(public.get_agency_id_for_workspace(workspace_id)));

CREATE POLICY workspace_members_update ON public.workspace_members FOR UPDATE
  USING (public.is_agency_member(public.get_agency_id_for_workspace(workspace_id)));

CREATE POLICY workspace_members_delete ON public.workspace_members FOR DELETE
  USING (public.is_agency_member(public.get_agency_id_for_workspace(workspace_id)));

-- post_cards
CREATE POLICY post_cards_select ON public.post_cards FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY post_cards_insert ON public.post_cards FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY post_cards_update ON public.post_cards FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY post_cards_delete ON public.post_cards FOR DELETE
  USING (public.is_workspace_member(workspace_id));

-- brand_profiles
CREATE POLICY brand_profiles_select ON public.brand_profiles FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY brand_profiles_insert ON public.brand_profiles FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY brand_profiles_update ON public.brand_profiles FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

-- asset_versions
CREATE POLICY asset_versions_select ON public.asset_versions FOR SELECT
  USING (public.is_workspace_member((SELECT workspace_id FROM public.post_cards WHERE id = asset_versions.post_card_id)));

CREATE POLICY asset_versions_insert ON public.asset_versions FOR INSERT
  WITH CHECK (public.is_workspace_member((SELECT workspace_id FROM public.post_cards WHERE id = asset_versions.post_card_id)));

CREATE POLICY asset_versions_update ON public.asset_versions FOR UPDATE
  USING (public.is_workspace_member((SELECT workspace_id FROM public.post_cards WHERE id = asset_versions.post_card_id)));
