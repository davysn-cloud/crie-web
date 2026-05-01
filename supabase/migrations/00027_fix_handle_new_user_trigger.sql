-- 00027_fix_handle_new_user_trigger.sql
--
-- Problema: o trigger on_auth_user_created (definido em 00024) dispara AFTER
-- INSERT em auth.users para QUALQUER novo usuário — incluindo convidados.
-- No fluxo de convite (agency_invites), a página MemberSignUpPage.tsx cria o
-- registro em agency_members com o role correto e accepted_at ANTES de o
-- auth.users INSERT se completar. Quando o INSERT completa o trigger dispara e
-- cria uma SEGUNDA agência + membro 'owner', deixando o usuário convidado com
-- 2 agências: uma correta (do convite) e uma incorreta (auto-provisionada).
--
-- Fix: adicionar early-return ao início da função — se o usuário já possui
-- pelo menos um registro em agency_members, o auto-provisionamento é pulado.
--
-- Para aplicar no banco remoto (sem CLI local):
--   supabase db query --linked < supabase/migrations/00027_fix_handle_new_user_trigger.sql
-- Ou cole no editor SQL do painel Supabase (sa-east-1, projeto ndrqaymrkrlilxnyfymt).

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
  -- Skip if user was already provisioned (e.g., invited user flow).
  -- MemberSignUpPage inserts into agency_members BEFORE auth.users INSERT
  -- completes, so this guard reliably detects the invited-user case.
  IF EXISTS (SELECT 1 FROM public.agency_members WHERE user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

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

-- O trigger já existe desde 00024; recriar garante que aponte para a versão
-- mais recente da função em caso de ambiguidade de cache.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
