-- ============================================================
-- 00019_pspec_resolutions.sql
-- Resolve 5 P-SPEC gaps identified by QA agent:
--   P-SPEC-001: Optimistic lock on post_drafts (version column + RPC)
--   P-SPEC-002: Approval resubmission = new row (superseded status + trigger)
--   P-SPEC-004: accepted_at IS NOT NULL in all agency_members policies
--   P-SPEC-005: deleted_at IS NULL in all policies for soft-delete tables
--   P-SPEC-006: Role enums hardcoded in policies
--
-- ROLE × ACTION MATRIX (P-SPEC-006)
-- ┌──────────────────────┬───────┬───────┬────────────┬────────────┬──────────┬──────────────┐
-- │ Action               │ owner │ admin │ strategist │ copywriter │ designer │ social_media │
-- ├──────────────────────┼───────┼───────┼────────────┼────────────┼──────────┼──────────────┤
-- │ manage_agency        │  ✓    │  ✓    │            │            │          │              │
-- │ manage_members       │  ✓    │  ✓    │            │            │          │              │
-- │ manage_billing       │  ✓    │       │            │            │          │              │
-- │ manage_integrations  │  ✓    │  ✓    │            │            │          │              │
-- │ create_workspace     │  ✓    │  ✓    │  ✓         │            │          │              │
-- │ manage_workspace     │  ✓    │  ✓    │  ✓         │            │          │              │
-- │ create_brief         │  ✓    │  ✓    │  ✓         │            │          │              │
-- │ edit_copy            │  ✓    │  ✓    │  ✓         │  ✓         │          │              │
-- │ edit_design          │  ✓    │  ✓    │            │            │  ✓       │              │
-- │ submit_approval      │  ✓    │  ✓    │  ✓         │            │          │  ✓           │
-- │ schedule_publish     │  ✓    │  ✓    │            │            │          │  ✓           │
-- │ view_insights        │  ✓    │  ✓    │  ✓         │            │          │  ✓           │
-- │ view_all             │  ✓    │  ✓    │  ✓         │  ✓         │  ✓       │  ✓           │
-- └──────────────────────┴───────┴───────┴────────────┴────────────┴──────────┴──────────────┘
--
-- WORKSPACE ROLE MATRIX
-- ┌──────────────────────┬────────────┬────────────┬──────────┬──────────────┬────────┐
-- │ Action               │ strategist │ copywriter │ designer │ social_media │ viewer │
-- ├──────────────────────┼────────────┼────────────┼──────────┼──────────────┼────────┤
-- │ manage_workspace     │  ✓         │            │          │              │        │
-- │ create_brief         │  ✓         │            │          │              │        │
-- │ edit_copy            │  ✓         │  ✓         │          │              │        │
-- │ edit_design          │            │            │  ✓       │              │        │
-- │ submit_approval      │  ✓         │            │          │  ✓           │        │
-- │ schedule_publish     │            │            │          │  ✓           │        │
-- │ view_insights        │  ✓         │            │          │  ✓           │        │
-- │ view_all             │  ✓         │  ✓         │  ✓       │  ✓           │  ✓     │
-- └──────────────────────┴────────────┴────────────┴──────────┴──────────────┴────────┘
-- ============================================================

BEGIN;

-- ============================================================
-- P-SPEC-006: Create role enums (if not exist)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.agency_role AS ENUM (
    'owner', 'admin', 'strategist', 'copywriter', 'designer', 'social_media'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.workspace_role AS ENUM (
    'strategist', 'copywriter', 'designer', 'social_media', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add role column to agency_members if not exists, migrate text→enum
DO $$
BEGIN
  -- Check if role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.agency_members ADD COLUMN role public.agency_role NOT NULL DEFAULT 'copywriter';
  ELSE
    -- If column exists but is text, migrate to enum
    IF (
      SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'role'
    ) = 'text' THEN
      ALTER TABLE public.agency_members
        ALTER COLUMN role TYPE public.agency_role USING role::public.agency_role;
    END IF;
  END IF;
END $$;

-- Ensure workspace_members.role uses the enum
DO $$
BEGIN
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'workspace_members' AND column_name = 'role'
  ) NOT IN ('USER-DEFINED') THEN
    ALTER TABLE public.workspace_members
      ALTER COLUMN role TYPE public.workspace_role USING role::public.workspace_role;
  END IF;
END $$;

-- ============================================================
-- P-SPEC-004: Ensure accepted_at column exists on agency_members
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_members' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE public.agency_members ADD COLUMN accepted_at timestamptz;
    COMMENT ON COLUMN public.agency_members.accepted_at IS
      'NULL = invite pending; NOT NULL = active member. All RLS policies MUST filter by accepted_at IS NOT NULL.';
  END IF;
END $$;

-- ============================================================
-- P-SPEC-004: Rewrite is_agency_member to require accepted_at IS NOT NULL
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.agency_members
    WHERE agency_id = p_agency_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
  );
$$;

-- ============================================================
-- P-SPEC-004: Rewrite is_workspace_member to require accepted_at IS NOT NULL
-- on the underlying agency_members row
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.workspace_members wm
    JOIN public.workspaces w ON w.id = wm.workspace_id
    JOIN public.agency_members am ON am.agency_id = w.agency_id AND am.user_id = auth.uid()
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
      AND am.accepted_at IS NOT NULL
  );
$$;

-- ============================================================
-- P-SPEC-004: Rewrite get_agency_id_for_workspace
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_agency_id_for_workspace(p_workspace_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.workspaces WHERE id = p_workspace_id;
$$;

-- ============================================================
-- P-SPEC-004: Rewrite is_agency_admin helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_agency_admin(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.agency_members
    WHERE agency_id = p_agency_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
      AND role IN ('owner', 'admin')
  );
$$;

-- ============================================================
-- P-SPEC-004: Rewrite can_read_integration (from 00018) to require accepted_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_read_integration(p_agency_id uuid, p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.agency_members am
    WHERE am.agency_id = p_agency_id
      AND am.user_id = auth.uid()
      AND am.accepted_at IS NOT NULL
      AND am.role IN ('owner', 'admin')
  )
  OR (
    p_workspace_id IS NOT NULL
    AND EXISTS(
      SELECT 1 FROM public.workspace_members wm
      JOIN public.workspaces w ON w.id = wm.workspace_id
      JOIN public.agency_members am ON am.agency_id = w.agency_id AND am.user_id = auth.uid()
      WHERE wm.workspace_id = p_workspace_id
        AND wm.user_id = auth.uid()
        AND am.accepted_at IS NOT NULL
    )
  );
$$;

-- ============================================================
-- P-SPEC-005: Rewrite policies for tables with deleted_at
-- Tables with deleted_at: briefs, agency_integrations (already handled in 00018)
-- briefs has deleted_at — policies must include deleted_at IS NULL
-- ============================================================

-- briefs: DROP + recreate policies with deleted_at IS NULL
DROP POLICY IF EXISTS "briefs_select" ON public.briefs;
DROP POLICY IF EXISTS "briefs_insert" ON public.briefs;
DROP POLICY IF EXISTS "briefs_update" ON public.briefs;
DROP POLICY IF EXISTS "briefs_delete" ON public.briefs;

CREATE POLICY "briefs_select" ON public.briefs
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NULL
  );
CREATE POLICY "briefs_insert" ON public.briefs
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "briefs_update" ON public.briefs
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NULL
  );
CREATE POLICY "briefs_delete" ON public.briefs
  FOR DELETE USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NULL
  );

-- Add policy for viewing archived/deleted briefs (strategist+ only via explicit RPC)
CREATE POLICY "briefs_select_deleted" ON public.briefs
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NOT NULL
    AND EXISTS(
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = briefs.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'strategist'
    )
  );

-- ============================================================
-- P-SPEC-001: Add version column to post_drafts for optimistic locking
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'post_drafts' AND column_name = 'version'
  ) THEN
    ALTER TABLE public.post_drafts ADD COLUMN version integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Trigger: auto-increment version on update
CREATE OR REPLACE FUNCTION public.increment_post_draft_version()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_drafts_version ON public.post_drafts;
CREATE TRIGGER trg_post_drafts_version
  BEFORE UPDATE ON public.post_drafts
  FOR EACH ROW EXECUTE FUNCTION public.increment_post_draft_version();

-- RPC: optimistic update for post_drafts
CREATE OR REPLACE FUNCTION public.update_post_draft(
  p_id uuid,
  p_expected_version int,
  p_data jsonb
)
RETURNS public.post_drafts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.post_drafts;
BEGIN
  UPDATE public.post_drafts
  SET
    body              = COALESCE(p_data->>'body', body),
    caption           = COALESCE(p_data->>'caption', caption),
    hashtags          = CASE WHEN p_data ? 'hashtags' THEN ARRAY(SELECT jsonb_array_elements_text(p_data->'hashtags')) ELSE hashtags END,
    carousel_script_json = COALESCE(p_data->'carousel_script_json', carousel_script_json),
    reel_script_json  = COALESCE(p_data->'reel_script_json', reel_script_json),
    stories_script_json = COALESCE(p_data->'stories_script_json', stories_script_json),
    updated_by        = auth.uid()
  WHERE id = p_id
    AND version = p_expected_version
  RETURNING * INTO v_result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conflict: post_draft version mismatch (expected %, current differs)'
      USING ERRCODE = '40001', DETAIL = p_expected_version::text;
  END IF;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.update_post_draft(uuid, int, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.update_post_draft(uuid, int, jsonb) TO authenticated, service_role;

-- ============================================================
-- P-SPEC-002: Add 'superseded' to approval_status enum
-- ============================================================
DO $$
BEGIN
  ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'superseded';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger: when a new approval_request is created for a post_card_id,
-- auto-supersede any existing pending requests for the same post_card_id.
CREATE OR REPLACE FUNCTION public.supersede_pending_approvals()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.approval_requests
  SET status = 'superseded', updated_at = now()
  WHERE post_card_id = NEW.post_card_id
    AND status = 'pending'
    AND id <> NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supersede_pending_approvals ON public.approval_requests;
CREATE TRIGGER trg_supersede_pending_approvals
  AFTER INSERT ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.supersede_pending_approvals();

-- ============================================================
-- P-SPEC-006: Rewrite save_agency_integration to use accepted_at filter
-- ============================================================
CREATE OR REPLACE FUNCTION public.save_agency_integration(
  p_agency_id uuid,
  p_workspace_id uuid,
  p_provider integration_provider,
  p_secret text,
  p_refresh text DEFAULT NULL,
  p_external_account_id text DEFAULT NULL,
  p_external_account_name text DEFAULT NULL,
  p_scopes text[] DEFAULT '{}',
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_key text;
  v_is_authorized boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.agency_members
    WHERE agency_id = p_agency_id
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
      AND role IN ('owner', 'admin')
  ) INTO v_is_authorized;

  IF NOT v_is_authorized AND current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  v_key := current_setting('app.encryption_key');
  IF v_key IS NULL OR length(v_key) < 32 THEN
    RAISE EXCEPTION 'app.encryption_key not configured or too short (min 32 chars)'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.agency_integrations
  SET deleted_at = now(), status = 'revoked'
  WHERE agency_id = p_agency_id
    AND coalesce(workspace_id::text, '') = coalesce(p_workspace_id::text, '')
    AND provider = p_provider
    AND deleted_at IS NULL;

  INSERT INTO public.agency_integrations (
    agency_id, workspace_id, provider,
    external_account_id, external_account_name, scopes, expires_at,
    secret_encrypted,
    refresh_encrypted
  ) VALUES (
    p_agency_id, p_workspace_id, p_provider,
    p_external_account_id, p_external_account_name, p_scopes, p_expires_at,
    pgp_sym_encrypt(p_secret, v_key, 'compress-algo=1, cipher-algo=aes256'),
    CASE WHEN p_refresh IS NOT NULL
      THEN pgp_sym_encrypt(p_refresh, v_key, 'compress-algo=1, cipher-algo=aes256')
    END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMIT;
