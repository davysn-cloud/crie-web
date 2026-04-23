-- 00018_agency_integrations.sql
-- ADR: 02_architecture/adr/008-agency-integrations-encryption.md
-- Criptografia de credenciais externas (Meta, LLM, Stripe, Resend)
-- por agência/workspace usando pgcrypto (pgp_sym_encrypt/decrypt AES-256).
--
-- A passphrase de criptografia vive em um GUC (app.encryption_key)
-- configurado via dashboard/CLI — nunca em código.
--
-- Pré-requisito: rodar antes de aplicar esta migration:
--   ALTER DATABASE postgres SET app.encryption_key TO '<passphrase-segura-64-chars>';
--   SELECT pg_reload_conf();

-- =========================================================================
-- 1. Extensão
-- =========================================================================
create extension if not exists pgcrypto;
create extension if not exists pg_net with schema extensions;

-- =========================================================================
-- 2. Enums
-- =========================================================================
do $$ begin
  create type integration_provider as enum (
    'meta_graph',
    'openai',
    'anthropic',
    'stripe',
    'resend',
    'canva'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type integration_status as enum (
    'active',
    'expired',
    'revoked',
    'error'
  );
exception when duplicate_object then null; end $$;

-- =========================================================================
-- 3. Tabela agency_integrations
-- =========================================================================
create table public.agency_integrations (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  workspace_id  uuid          references public.workspaces(id) on delete cascade,
  provider      integration_provider not null,
  status        integration_status   not null default 'active',

  external_account_id   text,
  external_account_name text,
  scopes        text[] not null default '{}',
  expires_at    timestamptz,

  -- Credenciais criptografadas via pgcrypto (pgp_sym_encrypt AES-256)
  -- Armazenadas como bytea. Decrypt só via RPC service_role.
  secret_encrypted  bytea not null,
  refresh_encrypted bytea,

  last_refreshed_at timestamptz,
  last_error        text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint chk_workspace_scope check (
    (provider in ('meta_graph', 'canva') and workspace_id is not null)
    or (provider not in ('meta_graph', 'canva'))
  ),

  constraint unique_active_integration
    unique (agency_id, workspace_id, provider, deleted_at)
);

create index idx_agency_integrations_agency
  on public.agency_integrations(agency_id) where deleted_at is null;
create index idx_agency_integrations_workspace
  on public.agency_integrations(workspace_id) where deleted_at is null and workspace_id is not null;
create index idx_agency_integrations_provider_status
  on public.agency_integrations(provider, status) where deleted_at is null;
create index idx_agency_integrations_expires
  on public.agency_integrations(expires_at) where deleted_at is null and expires_at is not null;

-- =========================================================================
-- 4. Trigger updated_at
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists trg_agency_integrations_updated_at on public.agency_integrations;
create trigger trg_agency_integrations_updated_at
  before update on public.agency_integrations
  for each row execute function public.set_updated_at();

-- =========================================================================
-- 5. RLS — SELECT direto bloqueado para authenticated; usar view pública
-- =========================================================================
alter table public.agency_integrations enable row level security;
alter table public.agency_integrations force row level security;

create policy "integrations_select_service_role_only"
  on public.agency_integrations for select to authenticated using (false);

create policy "integrations_insert_service_role_only"
  on public.agency_integrations for insert to authenticated with check (false);

create policy "integrations_update_service_role_only"
  on public.agency_integrations for update to authenticated using (false);

create policy "integrations_delete_service_role_only"
  on public.agency_integrations for delete to authenticated using (false);

-- =========================================================================
-- 6. Helper: verificar se usuário pode ler metadados da integração
-- =========================================================================
create or replace function public.can_read_integration(p_agency_id uuid, p_workspace_id uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists(
    select 1 from public.agency_members am
    where am.agency_id = p_agency_id
      and am.user_id = auth.uid()
      and am.role in ('owner', 'admin')
  )
  or (
    p_workspace_id is not null
    and exists(
      select 1 from public.workspace_members wm
      where wm.workspace_id = p_workspace_id
        and wm.user_id = auth.uid()
    )
  );
$$;

-- =========================================================================
-- 7. View pública: metadados apenas, SEM campos criptografados
-- =========================================================================
create or replace view public.agency_integrations_public
with (security_barrier = true) as
select
  id, agency_id, workspace_id, provider, status,
  external_account_id, external_account_name, scopes, expires_at,
  last_refreshed_at, last_error, created_at, updated_at
from public.agency_integrations
where deleted_at is null
  and public.can_read_integration(agency_id, workspace_id);

grant select on public.agency_integrations_public to authenticated;

-- =========================================================================
-- 8. RPC: salvar integração (aceita plaintext, criptografa com pgcrypto)
-- =========================================================================
create or replace function public.save_agency_integration(
  p_agency_id uuid,
  p_workspace_id uuid,
  p_provider integration_provider,
  p_secret text,
  p_refresh text default null,
  p_external_account_id text default null,
  p_external_account_name text default null,
  p_scopes text[] default '{}',
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_key text;
  v_is_authorized boolean;
begin
  -- Autorização: admin/owner da agência OU service_role
  select exists(
    select 1 from public.agency_members
    where agency_id = p_agency_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  ) into v_is_authorized;

  if not v_is_authorized and current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  -- Ler passphrase do GUC (nunca sai do DB)
  v_key := current_setting('app.encryption_key');
  if v_key is null or length(v_key) < 32 then
    raise exception 'app.encryption_key not configured or too short (min 32 chars)'
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
-- 9. RPC: decrypt (APENAS service_role — Edge Functions)
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

  v_key := current_setting('app.encryption_key');

  secret := pgp_sym_decrypt(v_rec.secret_encrypted, v_key);

  refresh := case when v_rec.refresh_encrypted is not null
    then pgp_sym_decrypt(v_rec.refresh_encrypted, v_key)
  end;

  return next;
end;
$$;

revoke all on function public.decrypt_integration_secret(uuid) from public, authenticated;
grant execute on function public.decrypt_integration_secret(uuid) to service_role;

-- =========================================================================
-- 10. Audit log em toda mutação
-- =========================================================================
create or replace function public.log_integration_mutation()
returns trigger language plpgsql as $$
begin
  insert into public.audit_log (
    agency_id, user_id, action, entity_type, entity_id, metadata
  ) values (
    coalesce(new.agency_id, old.agency_id),
    auth.uid(),
    tg_op,
    'agency_integration',
    coalesce(new.id, old.id),
    jsonb_build_object(
      'provider', coalesce(new.provider, old.provider)::text,
      'status', coalesce(new.status, old.status)::text
    )
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_integrations_audit on public.agency_integrations;
create trigger trg_integrations_audit
  after insert or update or delete on public.agency_integrations
  for each row execute function public.log_integration_mutation();
