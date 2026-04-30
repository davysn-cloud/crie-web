-- 00024_handle_new_user_trigger.sql
-- Cria a função e o trigger que provisionam o setup mínimo de um novo
-- usuário (agência + membro owner + workspace default + workspace_member +
-- brand_profile) automaticamente quando inserido em auth.users.
--
-- Sem esse trigger, o cliente fica com currentAgencyId=null e a dashboard
-- entra em loading eterno ("Carregando..." na hero, sem sidebar útil).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_name  text;
  v_agency_slug  text;
  v_display_name text;
  v_agency_id    uuid;
  v_workspace_id uuid;
BEGIN
  -- Lê metadados passados em supabase.auth.signUp(options.data)
  v_agency_name  := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'agency_name')::text), ''),
    'Minha Agência'
  );
  v_agency_slug  := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'agency_slug')::text), ''),
    'ag-' || EXTRACT(EPOCH FROM now())::bigint::text
  );
  v_display_name := COALESCE(
    NULLIF(TRIM((NEW.raw_user_meta_data->>'display_name')::text), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Garante slug único (sufixo aleatório se colidir)
  WHILE EXISTS (SELECT 1 FROM public.agencies WHERE slug = v_agency_slug) LOOP
    v_agency_slug := v_agency_slug || '-' || floor(random() * 9000 + 1000)::text;
  END LOOP;

  -- 1. Agência
  INSERT INTO public.agencies (name, slug, owner_id)
  VALUES (v_agency_name, v_agency_slug, NEW.id)
  RETURNING id INTO v_agency_id;

  -- 2. Membro owner da agência
  INSERT INTO public.agency_members (agency_id, user_id, display_name, role, accepted_at)
  VALUES (v_agency_id, NEW.id, v_display_name, 'owner', now());

  -- 3. Workspace default (será renomeado no onboarding step 2)
  INSERT INTO public.workspaces (agency_id, name, slug)
  VALUES (v_agency_id, 'Primeira marca', 'marca-1')
  RETURNING id INTO v_workspace_id;

  -- 4. Membro owner do workspace (necessário para is_workspace_member)
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'owner');

  -- 5. Brand profile vazio para o workspace (UNIQUE em workspace_id)
  INSERT INTO public.brand_profiles (workspace_id, brand_name)
  VALUES (v_workspace_id, 'Primeira marca')
  ON CONFLICT (workspace_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- Backfill: provisiona setup mínimo para usuários que já existem em
-- auth.users mas não têm agência (criados antes do trigger ser instalado).
-- =========================================================================
DO $$
DECLARE
  u RECORD;
  v_agency_id    uuid;
  v_workspace_id uuid;
  v_agency_name  text;
  v_agency_slug  text;
  v_display_name text;
BEGIN
  FOR u IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.agency_members am ON am.user_id = au.id
    WHERE am.id IS NULL
  LOOP
    v_agency_name  := COALESCE(
      NULLIF(TRIM((u.raw_user_meta_data->>'agency_name')::text), ''),
      'Minha Agência'
    );
    v_agency_slug  := COALESCE(
      NULLIF(TRIM((u.raw_user_meta_data->>'agency_slug')::text), ''),
      'ag-' || EXTRACT(EPOCH FROM now())::bigint::text || '-' || floor(random() * 9000 + 1000)::text
    );
    v_display_name := COALESCE(
      NULLIF(TRIM((u.raw_user_meta_data->>'display_name')::text), ''),
      split_part(u.email, '@', 1)
    );

    WHILE EXISTS (SELECT 1 FROM public.agencies WHERE slug = v_agency_slug) LOOP
      v_agency_slug := v_agency_slug || '-' || floor(random() * 9000 + 1000)::text;
    END LOOP;

    INSERT INTO public.agencies (name, slug, owner_id)
    VALUES (v_agency_name, v_agency_slug, u.id)
    RETURNING id INTO v_agency_id;

    INSERT INTO public.agency_members (agency_id, user_id, display_name, role, accepted_at)
    VALUES (v_agency_id, u.id, v_display_name, 'owner', now());

    INSERT INTO public.workspaces (agency_id, name, slug)
    VALUES (v_agency_id, 'Primeira marca', 'marca-1')
    RETURNING id INTO v_workspace_id;

    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (v_workspace_id, u.id, 'owner');

    INSERT INTO public.brand_profiles (workspace_id, brand_name)
    VALUES (v_workspace_id, 'Primeira marca')
    ON CONFLICT (workspace_id) DO NOTHING;
  END LOOP;
END $$;
