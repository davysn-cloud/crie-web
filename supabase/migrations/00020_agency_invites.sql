-- ============================================================
-- 00020_agency_invites.sql
-- NOTE: The agency_invites table already existed in prod with
-- column `default_role` (workspace_role enum) instead of `role`.
-- This migration is a no-op if the table already exists.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agency_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email        text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  default_role public.workspace_role NOT NULL DEFAULT 'copywriter',
  invited_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),

  UNIQUE (agency_id, email)
);

ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent — will skip if they already exist)
DO $$ BEGIN
  CREATE POLICY "agency_invites_select" ON public.agency_invites
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.agency_members am
        WHERE am.agency_id = agency_invites.agency_id
          AND am.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "agency_invites_insert" ON public.agency_invites
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.agency_members am
        WHERE am.agency_id = agency_invites.agency_id
          AND am.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "agency_invites_delete" ON public.agency_invites
    FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM public.agency_members am
        WHERE am.agency_id = agency_invites.agency_id
          AND am.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
