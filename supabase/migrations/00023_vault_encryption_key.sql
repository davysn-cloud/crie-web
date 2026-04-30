-- 00023_vault_encryption_key.sql
-- Migra as funções de criptografia de agency_integrations do GUC app.encryption_key
-- para o Supabase Vault (pgsodium).
--
-- Motivação: o Supabase gerenciado não permite ALTER ROLE/DATABASE SET para
-- parâmetros customizados via SQL — permissão negada mesmo para o role postgres.
-- O Vault é a alternativa nativa e já estava prevista no ADR-012 como caminho P1/P2.
-- Esta migration antecipa a adoção para viabilizar o projeto em sa-east-1.
--
-- Pré-requisito: secret 'app.encryption_key' deve existir no vault ANTES desta migration.
--   SELECT vault.create_secret('<passphrase>', 'app.encryption_key', 'AES-256 key');

-- =========================================================================
-- 1. RPC: save_agency_integration — lê chave do Vault
-- =========================================================================
create or replace function public.save_agency_integration(
  p_agency_id        uuid,
  p_workspace_id     uuid,
  p_provider         integration_provider,
  p_external_account_id   text,
  p_external_account_name text,
  p_secret           text,
  p_refresh          text default null,
  p_scopes           text[] default '{}',
  p_expires_at       timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_authorized boolean;
  v_key           text;
  v_id            uuid;
begin
  -- Verificar autorização: owner/admin da agência ou service_role
  select exists(
    select 1 from public.agency_members
    where agency_id = p_agency_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  ) into v_is_authorized;

  if not v_is_authorized and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  -- Ler passphrase do Vault (nunca sai do DB)
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'app.encryption_key'
  limit 1;

  if v_key is null or length(v_key) < 32 then
    raise exception 'app.encryption_key não encontrado no Vault ou muito curto (min 32 chars)'
      using errcode = 'P0001';
  end if;

  -- Soft-replace: revogar integração anterior do mesmo escopo
  update public.agency_integrations
  set deleted_at = now(), status = 'revoked'
  where agency_id = p_agency_id
    and coalesce(workspace_id::text, '') = coalesce(p_workspace_id::text, '')
    and provider = p_provider
    and deleted_at is null;

  -- Inserir com secret criptografado
  insert into public.agency_integrations (
    agency_id, workspace_id, provider,
    external_account_id, external_account_name, scopes, expires_at,
    secret_encrypted,
    refresh_encrypted
  ) values (
    p_agency_id, p_workspace_id, p_provider,
    p_external_account_id, p_external_account_name, p_scopes, p_expires_at,
    pgp_sym_encrypt(p_secret, v_key, 'compress-algo=1, cipher-algo=aes256'),
    case when p_refresh is not null
      then pgp_sym_encrypt(p_refresh, v_key, 'compress-algo=1, cipher-algo=aes256')
    end
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.save_agency_integration(uuid, uuid, integration_provider, text, text, text, text, text[], timestamptz) from public;
grant execute on function public.save_agency_integration(uuid, uuid, integration_provider, text, text, text, text, text[], timestamptz) to authenticated, service_role;

-- =========================================================================
-- 2. RPC: decrypt_integration_secret — lê chave do Vault
-- =========================================================================
create or replace function public.decrypt_integration_secret(p_integration_id uuid)
returns table (secret text, refresh text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec record;
  v_key text;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'not_authorized: decrypt only via service_role' using errcode = '42501';
  end if;

  select * into v_rec
  from public.agency_integrations
  where id = p_integration_id and deleted_at is null;

  if not found then
    raise exception 'integration_not_found' using errcode = 'P0002';
  end if;

  -- Ler passphrase do Vault
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'app.encryption_key'
  limit 1;

  if v_key is null or length(v_key) < 32 then
    raise exception 'app.encryption_key não encontrado no Vault ou muito curto (min 32 chars)'
      using errcode = 'P0001';
  end if;

  secret := pgp_sym_decrypt(v_rec.secret_encrypted, v_key);

  refresh := case when v_rec.refresh_encrypted is not null
    then pgp_sym_decrypt(v_rec.refresh_encrypted, v_key)
  end;

  return next;
end;
$$;

revoke all on function public.decrypt_integration_secret(uuid) from public, authenticated;
grant execute on function public.decrypt_integration_secret(uuid) to service_role;
