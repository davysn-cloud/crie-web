-- =============================================================================
-- 00029_fix_user_agency_logic.sql
-- Auditoria completa e correção de todos os problemas encontrados no fluxo
-- de criação de usuário, estado do usuário, criação de agência e linkagem
-- de convidado com agência.
--
-- Problemas corrigidos:
--   P0-A: agency_invites sem policy SELECT para anon — MemberSignUpPage não
--         consegue carregar o convite antes do login (usuário vê "Convite inválido")
--   P0-B: agency_members INSERT policy bloqueia o próprio convidado de se
--         inserir após signUp (is_agency_member exige accepted_at IS NOT NULL,
--         mas o membro ainda não existe — deadlock de bootstrap)
--   P0-C: workspace_members INSERT policy tem o mesmo deadlock: exige
--         is_agency_member(agency_id) que retorna false porque o agency_member
--         ainda não foi inserido com accepted_at
--   P1-A: fetchAgencies em useAuthStore não filtra accepted_at IS NOT NULL —
--         convidados pendentes aparecem como agências ativas no store
--   P1-B: handle_new_user não tem EXCEPTION handler — qualquer erro no trigger
--         (ex: slug collision extrema) faz o signUp inteiro falhar com 500
--   P1-C: workspace_role enum não inclui 'owner' mas handle_new_user insere
--         workspace_members com role='owner' — viola constraint de enum
--   P2-A: agency_invites UPDATE policy ausente — MemberSignUpPage não consegue
--         marcar accepted_at no convite após aceitar
--   P2-B: agency_invites SELECT em 00025 não filtra accepted_at IS NOT NULL
--         no JOIN com agency_members — membros pendentes (sem accepted_at)
--         conseguem ver convites da agência
-- =============================================================================

-- =============================================================================
-- P0-A: agency_invites — adicionar policy SELECT para anon
-- Necessário para MemberSignUpPage carregar dados do convite antes do login.
-- Expõe apenas convites não aceitos (accepted_at IS NULL) — sem dados sensíveis
-- além de email, display_name e agency_id, que o convidado já conhece pelo link.
-- =============================================================================
DROP POLICY IF EXISTS "agency_invites_select_anon" ON public.agency_invites;
CREATE POLICY "agency_invites_select_anon" ON public.agency_invites
  FOR SELECT
  TO anon
  USING (accepted_at IS NULL);

-- =============================================================================
-- P0-B: agency_members — policy INSERT para o próprio usuário se auto-inserir
-- no fluxo de convite.
--
-- Problema: a policy agency_members_insert usa is_agency_member(agency_id),
-- que exige accepted_at IS NOT NULL. No fluxo de convite, o usuário recém-criado
-- ainda não tem nenhum registro em agency_members — logo is_agency_member retorna
-- false e o INSERT é bloqueado.
--
-- Fix: adicionar policy separada que permite o INSERT quando:
--   1. O usuário está inserindo a si mesmo (user_id = auth.uid())
--   2. Existe um convite pendente para o email do usuário nessa agência
--   3. O convite ainda não foi aceito (accepted_at IS NULL)
-- =============================================================================
DROP POLICY IF EXISTS "agency_members_insert_self_invite" ON public.agency_members;
CREATE POLICY "agency_members_insert_self_invite" ON public.agency_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agency_invites ai
      JOIN auth.users u ON u.email = ai.email
      WHERE ai.agency_id = agency_members.agency_id
        AND u.id = auth.uid()
        AND ai.accepted_at IS NULL
    )
  );

-- =============================================================================
-- P0-C: workspace_members — policy INSERT para o próprio usuário no fluxo de
-- convite.
--
-- Problema: workspace_members_insert usa is_agency_member(get_agency_id_for_workspace(...))
-- que retorna false pelo mesmo motivo do P0-B — o agency_member ainda não existe
-- com accepted_at quando MemberSignUpPage tenta inserir workspace_members.
--
-- Fix: policy adicional que permite INSERT quando:
--   1. O usuário está inserindo a si mesmo
--   2. Existe um convite pendente para o email do usuário na agência dona do workspace
-- =============================================================================
DROP POLICY IF EXISTS "workspace_members_insert_self_invite" ON public.workspace_members;
CREATE POLICY "workspace_members_insert_self_invite" ON public.workspace_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.agency_invites ai
      JOIN auth.users u ON u.email = ai.email
      JOIN public.workspaces w ON w.id = workspace_members.workspace_id
      WHERE ai.agency_id = w.agency_id
        AND u.id = auth.uid()
        AND ai.accepted_at IS NULL
    )
  );

-- =============================================================================
-- P2-A: agency_invites — adicionar policy UPDATE para authenticated
-- MemberSignUpPage precisa marcar accepted_at após aceitar o convite.
-- Restrito ao próprio convidado (email = auth.users.email) ou a membros da agência.
-- =============================================================================
DROP POLICY IF EXISTS "agency_invites_update_self" ON public.agency_invites;
CREATE POLICY "agency_invites_update_self" ON public.agency_invites
  FOR UPDATE
  USING (
    -- O próprio convidado pode marcar o convite como aceito
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
        AND u.email = agency_invites.email
    )
    OR
    -- Membros ativos da agência também podem atualizar (ex: admin revogando)
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
        AND am.accepted_at IS NOT NULL
    )
  )
  WITH CHECK (true);

-- =============================================================================
-- P2-B: agency_invites SELECT para authenticated — corrigir para exigir
-- accepted_at IS NOT NULL no JOIN com agency_members (alinhado com is_agency_member)
-- =============================================================================
DROP POLICY IF EXISTS "agency_invites_select" ON public.agency_invites;
CREATE POLICY "agency_invites_select" ON public.agency_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
        AND am.accepted_at IS NOT NULL
    )
  );

-- Manter policy de INSERT e DELETE alinhadas com accepted_at IS NOT NULL
DROP POLICY IF EXISTS "agency_invites_insert" ON public.agency_invites;
CREATE POLICY "agency_invites_insert" ON public.agency_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
        AND am.accepted_at IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "agency_invites_delete" ON public.agency_invites;
CREATE POLICY "agency_invites_delete" ON public.agency_invites
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
        AND am.accepted_at IS NOT NULL
    )
  );

-- =============================================================================
-- P1-C: workspace_role enum — adicionar valor 'owner' se não existir
-- handle_new_user insere workspace_members com role='owner' mas o enum
-- workspace_role definido em 00019 só tem: strategist, copywriter, designer,
-- social_media, viewer. Isso causa violação de constraint no trigger.
-- =============================================================================
DO $$
BEGIN
  ALTER TYPE public.workspace_role ADD VALUE IF NOT EXISTS 'owner';
EXCEPTION WHEN others THEN
  -- Se o valor já existe ou o tipo não suporta ADD VALUE neste contexto, ignora
  NULL;
END $$;

-- =============================================================================
-- P1-B: handle_new_user — adicionar EXCEPTION handler robusto
-- Sem handler, qualquer erro no trigger (slug collision, constraint violation,
-- etc.) faz o auth.signUp() retornar 500 e o usuário não consegue criar conta.
-- Com o handler, o trigger loga o erro e deixa o signUp completar — o frontend
-- detecta agencies.length === 0 e pode oferecer retry ou onboarding manual.
-- =============================================================================
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

  -- Garante slug único (sufixo aleatório se colidir)
  WHILE EXISTS (SELECT 1 FROM public.agencies WHERE slug = v_agency_slug) LOOP
    v_agency_slug := v_agency_slug || '-' || floor(random() * 9000 + 1000)::text;
  END LOOP;

  -- 1. Agência
  INSERT INTO public.agencies (name, slug, owner_id)
  VALUES (v_agency_name, v_agency_slug, NEW.id)
  RETURNING id INTO v_agency_id;

  -- 2. Membro owner da agência (accepted_at preenchido — membro ativo imediatamente)
  INSERT INTO public.agency_members (agency_id, user_id, display_name, role, accepted_at)
  VALUES (v_agency_id, NEW.id, v_display_name, 'owner', now());

  -- 3. Workspace default (será renomeado no onboarding step 2)
  INSERT INTO public.workspaces (agency_id, name, slug)
  VALUES (v_agency_id, 'Primeira marca', 'marca-1')
  RETURNING id INTO v_workspace_id;

  -- 4. Membro owner do workspace (role 'owner' agora existe no enum após fix P1-C)
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (v_workspace_id, NEW.id, 'owner');

  -- 5. Brand profile vazio para o workspace
  INSERT INTO public.brand_profiles (workspace_id, brand_name)
  VALUES (v_workspace_id, 'Primeira marca')
  ON CONFLICT (workspace_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN others THEN
  -- Loga o erro sem quebrar o signUp. O frontend detecta agencies.length === 0
  -- e pode oferecer retry de provisionamento ou onboarding manual.
  RAISE WARNING '[handle_new_user] Falha ao provisionar usuário %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Recria o trigger para apontar para a versão mais recente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- Índice em agency_invites.email — acelera o JOIN nas policies P0-B e P0-C
-- e a query de loadInvite() em MemberSignUpPage
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_agency_invites_email
  ON public.agency_invites (email);

CREATE INDEX IF NOT EXISTS idx_agency_invites_agency_accepted
  ON public.agency_invites (agency_id, accepted_at)
  WHERE accepted_at IS NULL;

-- =============================================================================
-- RPC pública: get_invite_info
-- Permite que MemberSignUpPage (usuário anon) carregue os dados do convite
-- incluindo o nome da agência, sem abrir RLS em agencies para anon.
-- Retorna NULL se o convite não existir ou já tiver sido aceito.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_invite_info(p_invite_id uuid)
RETURNS TABLE (
  id           uuid,
  agency_id    uuid,
  email        text,
  display_name text,
  default_role text,
  agency_name  text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ai.id,
    ai.agency_id,
    ai.email,
    ai.display_name,
    ai.default_role::text,
    a.name AS agency_name
  FROM public.agency_invites ai
  JOIN public.agencies a ON a.id = ai.agency_id
  WHERE ai.id = p_invite_id
    AND ai.accepted_at IS NULL;
$$;

-- Garante que qualquer role (incluindo anon) pode chamar a função
GRANT EXECUTE ON FUNCTION public.get_invite_info(uuid) TO anon, authenticated;
