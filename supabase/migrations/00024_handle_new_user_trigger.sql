-- 00024_handle_new_user_trigger.sql
-- Cria a função e o trigger que provisionam agência + membro owner
-- automaticamente quando um novo usuário é criado no Supabase Auth.
-- Isso garante que todo usuário cadastrado via SignUpPage tenha uma
-- agência válida e um registro em agency_members, sem depender do cliente.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_name text;
  v_agency_slug text;
  v_display_name text;
  v_agency_id   uuid;
BEGIN
  -- Lê metadados passados no signUp (options.data)
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

  -- Garante slug único acrescentando sufixo se necessário
  WHILE EXISTS (SELECT 1 FROM public.agencies WHERE slug = v_agency_slug) LOOP
    v_agency_slug := v_agency_slug || '-' || floor(random() * 9000 + 1000)::text;
  END LOOP;

  -- Cria a agência
  INSERT INTO public.agencies (name, slug, owner_id)
  VALUES (v_agency_name, v_agency_slug, NEW.id)
  RETURNING id INTO v_agency_id;

  -- Cria o registro de membro owner (accepted_at preenchido = sem convite pendente)
  INSERT INTO public.agency_members (agency_id, user_id, display_name, role, accepted_at)
  VALUES (v_agency_id, NEW.id, v_display_name, 'owner', now());

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
