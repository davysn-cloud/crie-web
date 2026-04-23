---
created: 2026-04-15
updated: 2026-04-15
owner: deploy
status: active
confidence: high
---

# Aplicar migrations e configurar Supabase (via CLI / dashboard — sem MCP)

> Este guia substitui qualquer uso de MCP. Tudo aqui é feito manualmente por você via **Supabase CLI** ou **dashboard web**. Rode de cima para baixo na **primeira vez**. Depois, apenas os blocos de "Deploy rotineiro" importam.

## Pré-requisitos
- Conta Supabase com projeto criado.
- [Supabase CLI](https://supabase.com/docs/guides/cli) instalado: `npm install -g supabase`.
- Login: `supabase login` (abre browser).
- Link do projeto ao repo local (uma vez):
  ```bash
  supabase link --project-ref <PROJECT_REF>
  # <PROJECT_REF> é o ID que aparece na URL do dashboard:
  # https://supabase.com/dashboard/project/<PROJECT_REF>
  ```
- Copiar `.env.example` → `.env.local` e preencher `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (dashboard → Settings → API).

---

## 1. Extensões Postgres necessárias

**Via dashboard (recomendado):** Database → Extensions → habilitar:
- `pgcrypto` — criptografia AES-256 de tokens (provavelmente já habilitado).
- `pg_cron` — agendamento de jobs.
- `pg_net` — HTTP requests de dentro do Postgres (Edge Functions via cron).

**Via SQL (se preferir):**
```sql
create extension if not exists pgcrypto;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
```
> `pg_cron` pode exigir plano Pro em alguns casos. Confirmar no dashboard. Se não disponível, fallback é **Vercel Cron** (ver `09-cron-runner-fallback.md`, a criar apenas se necessário).

---

## 2. Configurar passphrase de criptografia (uma vez só, ANTES de aplicar migrations)

A migration `00018` usa `pgp_sym_encrypt` (AES-256) com uma passphrase armazenada como GUC do Postgres.

Rodar no **SQL Editor** do dashboard:
```sql
-- Gerar passphrase segura (64 chars hex) — copie e guarde em local seguro (1Password, Vault, etc)
-- Exemplo: SELECT encode(gen_random_bytes(32), 'hex');

ALTER DATABASE postgres SET app.encryption_key TO '<cole-a-passphrase-64-chars-aqui>';
SELECT pg_reload_conf();
```

Validar:
```sql
SELECT current_setting('app.encryption_key');
-- deve retornar a passphrase configurada
```

> **IMPORTANTE:** guarde essa passphrase em lugar seguro (1Password, Vault, etc). Se perdida, todos os tokens criptografados em `agency_integrations` ficam ilegíveis.
> 
> key: 0e2527d41f0dc71fda66207b2ff2ab879d50275c0f67ac8c44fd188265332bfb

---

## 3. Aplicar migrations novas (00008 → 00018)

> As migrations `00001` a `00007` já estão aplicadas em produção.
> As migrations `00008` a `00018` foram criadas pelo Backend agent em 2026-04-15 e **ainda não foram aplicadas**.

**Dry-run primeiro** (mostra o SQL que será executado, sem rodar):
```bash
supabase db diff --linked --schema public
```

**Aplicar (ambiente linkado):**
```bash
supabase db push
```
> Isso roda todas as migrations pendentes na ordem do filename.

**Verificação após aplicar:**
```bash
supabase db remote list   # lista migrations aplicadas no remoto
```
Deve listar até `00018_agency_integrations`.

**Caso precise rollback** (só em dev/staging):
```bash
supabase db reset   # DESTRUTIVO — apaga tudo e reaplica do zero
```

---

## 4. Habilitar Realtime nas tabelas certas

Via dashboard: Database → Replication → habilitar nas tabelas:
- `post_cards`
- `carousel_slides`
- `approval_requests`
- `approval_pins`
- `comments`
- `publish_queue`
- `publish_attempts`

Ou via SQL:
```sql
alter publication supabase_realtime add table public.post_cards;
alter publication supabase_realtime add table public.carousel_slides;
alter publication supabase_realtime add table public.approval_requests;
alter publication supabase_realtime add table public.approval_pins;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.publish_queue;
alter publication supabase_realtime add table public.publish_attempts;
```

---

## 5. Storage buckets

Via dashboard: Storage → New bucket. Criar:

| Bucket          | Público? | Propósito                                          |
| --------------- | -------- | -------------------------------------------------- |
| `post-assets`   | não      | Mídia dos posts (original + variantes por formato) |
| `asset-library` | não      | Biblioteca de assets por marca                     |
| `templates`     | não      | Thumbnails de templates                            |
| `brand-kits`    | não      | Logos e ativos de identidade                       |
| `avatars`       | sim      | Avatares de usuários (já existe provavelmente)     |

**RLS policies** para cada bucket (SQL Editor):
```sql
-- Exemplo: post-assets — membros do workspace leem, members podem escrever
create policy "post-assets read by workspace members"
on storage.objects for select to authenticated
using (
  bucket_id = 'post-assets'
  and (storage.foldername(name))[1] in (
    select workspace_id::text from public.workspace_members where user_id = auth.uid()
  )
);

create policy "post-assets write by workspace members"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'post-assets'
  and (storage.foldername(name))[1] in (
    select workspace_id::text from public.workspace_members where user_id = auth.uid()
  )
);
```
Convenção de path: `<workspace_id>/<post_card_id>/<variant>.<ext>`.

---

## 6. Edge Functions

As seguintes Edge Functions precisam ser criadas (código ainda não escrito — apenas contratos em `03_backend/api/`):

| Nome | Contrato | Secret extras necessários |
|---|---|---|
| `publish-worker` | [[../03_backend/api/publish]] | `CRON_SECRET` |
| `magic-link` | [[../03_backend/api/magic-link]] | `MAGIC_LINK_HMAC_SECRET`, `RESEND_API_KEY` |
| `llm-brand-voice` | [[../03_backend/api/llm-brand-voice]] | (usa `decrypt_integration_secret` — sem secret direto) |
| `insights-sync` | [[../03_backend/api/insights-sync]] | `CRON_SECRET` |
| `auto-adapt` | [[../03_backend/api/auto-adapt]] | (nenhum extra) |
| `stripe-webhook` | (Fase 3) | `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY` |
| `send-email` | (helper) | `RESEND_API_KEY`, `EMAIL_FROM` |

**Criar estrutura (uma vez):**
```bash
mkdir -p supabase/functions/publish-worker
mkdir -p supabase/functions/magic-link
mkdir -p supabase/functions/llm-brand-voice
mkdir -p supabase/functions/insights-sync
mkdir -p supabase/functions/auto-adapt
mkdir -p supabase/functions/send-email
```

**Deploy (quando implementado):**
```bash
supabase functions deploy publish-worker
supabase functions deploy magic-link
supabase functions deploy llm-brand-voice
supabase functions deploy insights-sync
supabase functions deploy auto-adapt
supabase functions deploy send-email
# ... etc
```

---

## 7. Secrets das Edge Functions

Via dashboard: Edge Functions → Secrets, ou via CLI:
```bash
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set EMAIL_FROM="Crie Web <no-reply@crieweb.com>"
supabase secrets set MAGIC_LINK_HMAC_SECRET=$(openssl rand -hex 32)
supabase secrets set CRON_SECRET=$(openssl rand -hex 32)

# Fase 3 (billing)
# supabase secrets set STRIPE_SECRET_KEY=sk_live_...
# supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

Verificar:
```bash
supabase secrets list
```

---

## 8. Configurar GUC para cron secret

Para o cron autenticar com a Edge Function:
```sql
alter database postgres set app.cron_secret to '<mesmo valor do CRON_SECRET acima>';
select pg_reload_conf();
```

---

## 9. Agendar os jobs pg_cron

No SQL Editor (rodar uma vez após deploy das Edge Functions):

```sql
-- publish worker — a cada 1 min
select cron.schedule(
  'publish-worker',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://<PROJECT_REF>.functions.supabase.co/publish-worker',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
         'Content-Type', 'application/json'
       )
     );
  $$
);

-- insights sync — a cada 3h
select cron.schedule(
  'insights-sync',
  '0 */3 * * *',
  $$ select net.http_post(
       url := 'https://<PROJECT_REF>.functions.supabase.co/insights-sync',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
         'Content-Type', 'application/json'
       )
     );
  $$
);

-- magic link cleanup — diário 3h da manhã
select cron.schedule(
  'magic-link-cleanup',
  '0 3 * * *',
  $$ delete from public.magic_links
     where expires_at < now() - interval '7 days'; $$
);

-- meta token refresh — diário 4h da manhã
select cron.schedule(
  'meta-token-refresh',
  '0 4 * * *',
  $$ select net.http_post(
       url := 'https://<PROJECT_REF>.functions.supabase.co/meta-token-refresh',
       headers := jsonb_build_object(
         'Authorization', 'Bearer ' || current_setting('app.cron_secret')
       )
     );
  $$
);
```

Verificar:
```sql
select jobid, jobname, schedule, active from cron.job;
select * from cron.job_run_details order by start_time desc limit 20;
```

Pausar um job se precisar:
```sql
select cron.unschedule('publish-worker');
```

---

## 10. Checklist pós-apply

- [ ] `supabase db remote list` mostra 00018 aplicada.
- [ ] `SELECT current_setting('app.encryption_key')` retorna a passphrase (64+ chars).
- [ ] Realtime habilitado nas 7 tabelas.
- [ ] 4 buckets Storage criados com RLS.
- [ ] Secrets setados (testar com `supabase secrets list`).
- [ ] GUC `app.cron_secret` configurada.
- [ ] Jobs pg_cron ativos (`select * from cron.job`).
- [ ] Primeiro teste end-to-end: criar agência via seed, rodar fluxo brief → aprovação → publicação em ambiente de staging.

---

## Deploy rotineiro (após setup inicial)

Sempre que houver mudança de schema ou Edge Function:
```bash
# schema
supabase db push

# edge functions
supabase functions deploy <nome>

# regerar types TypeScript pro frontend
supabase gen types typescript --linked > src/types/supabase.ts
```

---

## Rollback plan
Ver `runbook.md` (a criar).

## Links
- [[../02_architecture/adr/008-agency-integrations-encryption]]
- [[../02_architecture/adr/009-cron-runner]]
- [[../02_architecture/adr/010-image-processing]]
- [[../02_architecture/adr/deploy-target]]
- [[../02_architecture/adr/transactional-email]]
- [[../02_architecture/adr/billing-provider]]
- [[../02_architecture/adr/006-approver-auth]]
