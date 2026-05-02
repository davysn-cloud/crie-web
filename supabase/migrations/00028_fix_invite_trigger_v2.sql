-- 00028_fix_invite_trigger_v2.sql
--
-- Corrige a race condition no trigger handle_new_user que ainda criava uma
-- agência duplicada para usuários convidados.
--
-- Contexto: a migration 00027 tentou detectar usuários convidados verificando
-- se já existe um registro em agency_members (INSERT BY MemberSignUpPage).
-- Porém o trigger AFTER INSERT on auth.users dispara IMEDIATAMENTE após o
-- INSERT em auth.users — antes de MemberSignUpPage fazer INSERT em
-- agency_members. Logo, a guard de 00027 NUNCA detecta o usuário convidado.
--
-- Fix correto: verificar NEW.raw_user_meta_data->>'invite_id', que é populado
-- por MemberSignUpPage via options.data ao chamar supabase.auth.signUp().
-- Usuários que criam conta normalmente (SignUpPage) não enviam invite_id,
-- então o auto-provisionamento continua funcionando para eles.
--
-- Aplicar no banco remoto:
--   supabase db query --linked < supabase/migrations/00028_fix_invite_trigger_v2.sql

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
  -- Se o usuário foi convidado (MemberSignUpPage passa invite_id nos metadados),
  -- pula o auto-provisionamento. O MemberSignUpPage cria agency_members
  -- e workspace_members com os dados corretos do convite.
  IF (NEW.raw_user_meta_data->>'invite_id') IS NOT NULL THEN
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

  -- Garante slug único
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

  -- 3. Workspace default
  INSERT INTO public.workspaces (agency_id, name, slug)
  VALUES (v_agency_id, 'Primeira marca', 'marca-1')
  RETURNING id INTO v_workspace_id;

  -- 4. Membro owner do workspace
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'owner');

  -- 5. Brand profile vazio
  INSERT INTO public.brand_profiles (workspace_id, brand_name)
  VALUES (v_workspace_id, 'Primeira marca')
  ON CONFLICT (workspace_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recria o trigger para apontar para a versão mais recente da função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
