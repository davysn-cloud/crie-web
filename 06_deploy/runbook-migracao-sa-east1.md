---
created: 2026-04-30
updated: 2026-04-30
owner: backend
status: active
confidence: high
---

# Runbook — Migração Supabase para sa-east-1

> **Origem:** `exzmhbdfdqxriedadcmy.supabase.co` (região anterior, provavelmente us-east-1)
> **Destino:** `ndrqaymrkrlilxnyfymt.supabase.co` (sa-east-1, São Paulo — menor latência BR)
>
> Este runbook cobre a migração completa do zero: schema, extensões, Auth, Storage, Edge Functions,
> Secrets, Realtime, pg_cron, variáveis de ambiente e validação final.
>
> O projeto está em fase de **desenvolvimento pré-beta** — sem dados de produção com usuários reais,
> apenas dados de desenvolvimento/seed. A migração é "schema + config", não "dump de dados críticos".

---

## Estado do projeto antes desta migração

- Migrations **00001–00007** aplicadas no projeto de origem (schema base).
- Migrations **00008–00022** criadas, mas **ainda não confirmadas como aplicadas** no projeto de origem.
  Verifique: `supabase db remote list --project-ref exzmhbdfdqxriedadcmy`.
- 6 Edge Functions implementadas: `publish-worker`, `magic-link`, `llm-brand-voice`, `insights-sync`,
  `auto-adapt`, `healthz`.
- Nenhum usuário de produção registrado até o momento.

---

## Pré-requisitos

```bash
# Verificar versão do CLI (>= 1.170 para suporte completo ao Postgres 15 + Deno 1.4x)
supabase --version

# Login (abre browser)
supabase login

# Confirmar que o novo projeto já existe no dashboard
# https://supabase.com/dashboard/project/ndrqaymrkrlilxnyfymt
```

---

## A. Schema e Migrations

### A.1 Desvincular do projeto antigo e linkar ao novo

```bash
# Na raiz do repositório crie-web:
supabase unlink

supabase link --project-ref ndrqaymrkrlilxnyfymt
# O CLI vai pedir a senha do banco — copie de:
# dashboard → Project Settings → Database → Database password
```

### A.2 Dry-run (ver o que será executado sem aplicar)

```bash
supabase db diff --linked --schema public
```

Esperado: todas as 22 migrations listadas como pendentes (00001 → 00022), pois o banco novo está vazio.

### A.3 Aplicar todas as migrations

```bash
supabase db push --project-ref ndrqaymrkrlilxnyfymt
```

Isso aplica `00001_*.sql` → `00022_telemetry_vitals.sql` na ordem cronológica do filename.
O comando é idempotente e seguro de reexecutar caso seja interrompido.

### A.4 Verificar migrations aplicadas

```bash
supabase db remote list --project-ref ndrqaymrkrlilxnyfymt
```

Deve listar as 22 migrations até `00022_telemetry_vitals`.

### A.5 Regerar types TypeScript

```bash
supabase gen types typescript \
  --project-ref ndrqaymrkrlilxnyfymt \
  > src/types/supabase.ts
```

Commitar o arquivo gerado.

---

## B. Extensões

As extensões abaixo precisam estar habilitadas **antes** de aplicar as migrations.
A migration `00018` já emite `CREATE EXTENSION IF NOT EXISTS` para `pgcrypto` e `pg_net`,
mas algumas exigem habilitação no dashboard (plano Pro) antes disso.

### B.1 Habilitar via Dashboard (recomendado)

`Database → Extensions` no projeto `ndrqaymrkrlilxnyfymt`:

| Extensão | Schema | Motivo | Observação |
|---|---|---|---|
| `pgcrypto` | public | AES-256 em `agency_integrations` | Provavelmente já ativo |
| `pg_cron` | pg_catalog | Jobs agendados (publish-worker, insights-sync, cleanup) | Requer plano Pro |
| `pg_net` | extensions | HTTP requests do Postgres para Edge Functions | Requer pg_cron habilitado primeiro |

### B.2 Habilitar via SQL Editor (alternativa)

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

> Se `pg_cron` não estiver disponível no plano atual, o fallback é **Vercel Cron**
> disparando as Edge Functions diretamente. Ver nota em `supabase-cli-apply.md`.

---

## C. Configuração de Auth

No Dashboard do projeto `ndrqaymrkrlilxnyfymt`, ir em **Authentication → Settings**:

### C.1 Site URL

```
https://app.crieweb.com.br
```

(ou a URL de staging/preview, se ainda não tiver domínio definitivo)

### C.2 Redirect URLs (allowed list)

Adicionar todas as URLs que o Auth pode redirecionar após login/magic-link:

```
https://app.crieweb.com.br/**
https://*.vercel.app/**
http://localhost:5173/**
http://localhost:3000/**
```

> O padrão `**` cobre todos os paths dentro do domínio — essencial para rotas como
> `/app/dashboard`, `/a/:token`, `/auth/callback`.

### C.3 Email Templates (Magic Link interno do Supabase Auth)

O projeto usa `magic-link` Edge Function própria (não o Magic Link nativo do Supabase Auth)
para aprovadores externos. Ainda assim, configurar o e-mail transacional:

- **SMTP Provider:** configurar Resend como provedor SMTP customizado em
  `Authentication → Settings → SMTP Settings`:
  - Host: `smtp.resend.com`
  - Port: 465 (SSL) ou 587 (TLS)
  - Username: `resend`
  - Password: `<RESEND_API_KEY>`
  - Sender email: `no-reply@crieweb.com.br`

- **Email templates** (Confirm signup, Magic Link, Reset password): ajustar para a identidade
  visual do crie-web em `Authentication → Email Templates`.

### C.4 Providers OAuth

Se houver Google OAuth configurado no projeto de origem:
- `Authentication → Providers → Google`
- Copiar o Client ID e Client Secret do Google Cloud Console
- Adicionar as URLs de callback do novo projeto:
  `https://ndrqaymrkrlilxnyfymt.supabase.co/auth/v1/callback`

---

## D. Storage — Buckets e Políticas RLS

### D.1 Criar buckets

No Dashboard: `Storage → New bucket` (ou via SQL abaixo):

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('post-assets',   'post-assets',   false, 52428800,  ARRAY['image/*','video/*']),
  ('asset-library', 'asset-library', false, 52428800,  ARRAY['image/*','video/*','application/pdf']),
  ('templates',     'templates',     false, 10485760,  ARRAY['image/*']),
  ('brand-kits',    'brand-kits',    false, 10485760,  ARRAY['image/*','application/pdf']),
  ('avatars',       'avatars',       true,  2097152,   ARRAY['image/*']);
```

> `file_size_limit` em bytes: 50 MB para post-assets/asset-library, 10 MB para templates/brand-kits,
> 2 MB para avatars.

### D.2 Políticas RLS de Storage

Executar no SQL Editor:

```sql
-- ============================================================
-- post-assets: leitura e escrita por membros do workspace
-- Convenção de path: <workspace_id>/<post_card_id>/<variant>.<ext>
-- ============================================================
CREATE POLICY "post-assets: workspace members can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'post-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "post-assets: workspace members can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "post-assets: workspace members can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- asset-library: mesma lógica
-- ============================================================
CREATE POLICY "asset-library: workspace members can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'asset-library'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "asset-library: workspace members can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'asset-library'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "asset-library: workspace members can delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'asset-library'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- templates: idem
-- ============================================================
CREATE POLICY "templates: workspace members can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'templates'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "templates: workspace members can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'templates'
  AND (storage.foldername(name))[1] IN (
    SELECT workspace_id::text
    FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- ============================================================
-- brand-kits: apenas owner/admin da agência escreve
-- ============================================================
CREATE POLICY "brand-kits: agency members can read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'brand-kits'
  AND (storage.foldername(name))[1] IN (
    SELECT agency_id::text
    FROM public.agency_members
    WHERE user_id = auth.uid()
      AND accepted_at IS NOT NULL
  )
);

CREATE POLICY "brand-kits: agency admins can insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'brand-kits'
  AND (storage.foldername(name))[1] IN (
    SELECT agency_id::text
    FROM public.agency_members
    WHERE user_id = auth.uid()
      AND accepted_at IS NOT NULL
      AND role IN ('owner', 'admin')
  )
);

-- ============================================================
-- avatars: público para leitura, usuário só grava o seu próprio
-- Convenção: <user_id>/avatar.<ext>
-- ============================================================
CREATE POLICY "avatars: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars: authenticated upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars: authenticated update own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## E. Edge Functions

### E.1 Fazer deploy de todas as funções no novo projeto

Executar a partir da raiz do repositório:

```bash
# Garantir que o CLI está linkado ao novo projeto
supabase link --project-ref ndrqaymrkrlilxnyfymt

# Deploy de cada função
supabase functions deploy publish-worker  --project-ref ndrqaymrkrlilxnyfymt
supabase functions deploy magic-link      --project-ref ndrqaymrkrlilxnyfymt
supabase functions deploy llm-brand-voice --project-ref ndrqaymrkrlilxnyfymt
supabase functions deploy insights-sync   --project-ref ndrqaymrkrlilxnyfymt
supabase functions deploy auto-adapt      --project-ref ndrqaymrkrlilxnyfymt
supabase functions deploy healthz         --project-ref ndrqaymrkrlilxnyfymt --no-verify-jwt
```

> `--no-verify-jwt` em `healthz` é necessário porque o endpoint é público (sem Authorization header).

### E.2 Verificar deploy

```bash
supabase functions list --project-ref ndrqaymrkrlilxnyfymt
```

Deve listar as 6 funções com status `active`.

---

## F. Secrets das Edge Functions

### F.1 Setar todos os secrets no novo projeto

```bash
# Autenticação do cron (gerar novo valor — não reutilizar do projeto antigo)
supabase secrets set CRON_SECRET=$(openssl rand -hex 32) \
  --project-ref ndrqaymrkrlilxnyfymt

# Magic Link
supabase secrets set MAGIC_LINK_HMAC_SECRET=$(openssl rand -hex 32) \
  --project-ref ndrqaymrkrlilxnyfymt

# Resend (e-mail transacional)
supabase secrets set RESEND_API_KEY=re_<sua_chave> \
  --project-ref ndrqaymrkrlilxnyfymt
supabase secrets set EMAIL_FROM="Crie Web <no-reply@crieweb.com.br>" \
  --project-ref ndrqaymrkrlilxnyfymt

# Sentry para Edge Functions (opcional — deixar vazio se ainda sem DSN)
supabase secrets set SENTRY_DSN_FUNCTIONS=<dsn-do-projeto-edge-deno> \
  --project-ref ndrqaymrkrlilxnyfymt
supabase secrets set SENTRY_ENVIRONMENT=production \
  --project-ref ndrqaymrkrlilxnyfymt
supabase secrets set SENTRY_RELEASE=<commit-sha> \
  --project-ref ndrqaymrkrlilxnyfymt

# Fase 3 — Stripe (não necessário agora, mas documentar)
# supabase secrets set STRIPE_SECRET_KEY=sk_live_...
# supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

> `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente pelo runtime
> do Supabase nas Edge Functions — não precisam ser setados manualmente.
> `SUPABASE_ANON_KEY` também é injetado automaticamente.

### F.2 Verificar secrets

```bash
supabase secrets list --project-ref ndrqaymrkrlilxnyfymt
```

---

## G. Configuração de Realtime

### G.1 Habilitar Realtime nas tabelas via SQL

Executar no SQL Editor do novo projeto:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carousel_slides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.approval_pins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publish_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.publish_attempts;
```

### G.2 Verificar

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
```

Deve retornar as 7 tabelas acima.

---

## H. GUC de Criptografia e Jobs pg_cron

### H.1 Configurar passphrase de criptografia (ANTES de qualquer seed de dados)

Esta etapa é crítica: sem o GUC `app.encryption_key`, a migration `00018` pode aplicar mas
as RPCs `save_agency_integration` e `decrypt_integration_secret` vão falhar.

No SQL Editor do novo projeto:

```sql
-- Gerar passphrase (rodar uma vez, copiar o resultado e guardar em 1Password/Vault)
SELECT encode(gen_random_bytes(32), 'hex') AS nova_passphrase;
```

```sql
-- Aplicar o GUC (substituir pelo valor gerado acima)
-- ATENÇÃO: usar ALTER ROLE, não ALTER DATABASE
-- O Supabase não concede permissão de superuser para ALTER DATABASE SET via SQL Editor
ALTER ROLE postgres SET app.encryption_key TO '<passphrase-64-chars-gerada-acima>';
```

```sql
-- Validar (abrir nova query — a sessão atual ainda usa o valor antigo)
SELECT current_setting('app.encryption_key');
-- Esperado: string de 64 chars hex
```

> `ALTER ROLE postgres SET` persiste para todas as conexões futuras da role `postgres`
> (que é o que as RPCs usam). Efeito equivalente ao `ALTER DATABASE SET` para este caso.
> `ALTER DATABASE SET` requer superuser, que o Supabase não expõe via SQL Editor.

> IMPORTANTE: guardar esta passphrase em local seguro (1Password, Vault, etc).
> Ela deve ser DIFERENTE da usada no projeto de origem — rotação preventiva.
> A passphrase do projeto antigo era `0e2527d41f0dc71fda66207b2ff2ab879d50275c0f67ac8c44fd188265332bfb`
> (exposta em `supabase-cli-apply.md`) — gerar uma nova.

### H.2 Configurar GUC do CRON_SECRET

O valor de `CRON_SECRET` gerado na seção F precisa ser replicado no GUC para que o pg_cron
passe o header correto nas chamadas HTTP:

```sql
-- Usar ALTER ROLE (não ALTER DATABASE — permission denied no Supabase)
ALTER ROLE postgres SET app.cron_secret TO '<mesmo-valor-do-CRON_SECRET>';
```

### H.3 Agendar os jobs pg_cron

Substituir `ndrqaymrkrlilxnyfymt` na URL. Executar no SQL Editor:

```sql
-- 1. publish-worker — a cada 1 minuto
SELECT cron.schedule(
  'publish-worker',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://ndrqaymrkrlilxnyfymt.supabase.co/functions/v1/publish-worker',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
        'Content-Type',  'application/json'
      )
    );
  $$
);

-- 2. insights-sync — a cada 3 horas
SELECT cron.schedule(
  'insights-sync',
  '0 */3 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://ndrqaymrkrlilxnyfymt.supabase.co/functions/v1/insights-sync',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret'),
        'Content-Type',  'application/json'
      )
    );
  $$
);

-- 3. magic-link cleanup — todo dia às 3h (UTC)
SELECT cron.schedule(
  'magic-link-cleanup',
  '0 3 * * *',
  $$
    DELETE FROM public.magic_links
    WHERE expires_at < now() - INTERVAL '7 days';
  $$
);

-- 4. telemetry-vitals retention — todo dia às 3h15 (UTC)
SELECT cron.schedule(
  'telemetry-vitals-retention',
  '15 3 * * *',
  $$
    DELETE FROM public.telemetry_vitals
    WHERE created_at < now() - INTERVAL '90 days';
  $$
);

-- 5. meta-token-refresh — todo dia às 4h (UTC)
-- (só habilitar quando a Edge Function meta-token-refresh for implementada)
-- SELECT cron.schedule(
--   'meta-token-refresh',
--   '0 4 * * *',
--   $$ SELECT net.http_post(
--        url := 'https://ndrqaymrkrlilxnyfymt.supabase.co/functions/v1/meta-token-refresh',
--        headers := jsonb_build_object(
--          'Authorization', 'Bearer ' || current_setting('app.cron_secret')
--        )
--      ); $$
-- );
```

### H.4 Verificar jobs

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
```

---

## I. Variáveis de Ambiente do Frontend

### I.1 Arquivo `.env.local` (desenvolvimento local)

```bash
# Antes:
VITE_SUPABASE_URL=https://exzmhbdfdqxriedadcmy.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-do-projeto-antigo>

# Depois:
VITE_SUPABASE_URL=https://ndrqaymrkrlilxnyfymt.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-do-novo-projeto>
```

Obter a nova `VITE_SUPABASE_ANON_KEY` em:
`Dashboard → Project Settings → API → Project API keys → anon public`

### I.2 Vercel — Environment Variables

No painel da Vercel, atualizar em `Settings → Environment Variables` para os ambientes
`Production`, `Preview` e `Development`:

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://ndrqaymrkrlilxnyfymt.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `<nova anon key>` |
| `VITE_SENTRY_DSN` | manter igual (mesmo projeto Sentry) |
| `VITE_APP_VERSION` | `${VERCEL_GIT_COMMIT_SHA}` (já configurado) |

Após atualizar, fazer redeploy:
```bash
vercel redeploy --prod
```

### I.3 Confirmar que SERVICE_ROLE_KEY nunca vai para o frontend

A `SUPABASE_SERVICE_ROLE_KEY` é usada APENAS nas Edge Functions (injetada automaticamente
pelo runtime) e nunca deve aparecer em variáveis com prefixo `VITE_`.

---

## J. Dados — Situação e Plano

### J.1 Situação atual

O projeto está em **fase de desenvolvimento pré-beta**: sem usuários de produção, sem dados
de clientes reais. Os dados existentes no projeto de origem são exclusivamente de
desenvolvimento/testes do próprio time.

### J.2 Decisão: sem pg_dump/restore

Dado o estado pré-beta, a migração correta é "schema limpo no novo projeto" sem carregar
dados do antigo. Isso evita:
- Carregar tokens de integração criptografados com a passphrase do projeto antigo (que seria
  necessário redecriptar e recriptografar — processo arriscado).
- Usuários de teste sem equivalente no novo Auth.

### J.3 Se houver dados de seed necessários

Se o time tiver um script de seed (`supabase/seed.sql` ou similar), executá-lo:

```bash
# Verificar se existe
ls supabase/seed.sql

# Se existir, aplicar após as migrations
psql "postgresql://postgres:<password>@db.ndrqaymrkrlilxnyfymt.supabase.co:5432/postgres" \
  -f supabase/seed.sql
```

### J.4 Se futuramente quiser migrar dados específicos do projeto antigo

```bash
# Dump apenas tabelas sem dados sensíveis (ex: agencies, workspaces)
pg_dump \
  "postgresql://postgres:<senha-antiga>@db.exzmhbdfdqxriedadcmy.supabase.co:5432/postgres" \
  --table=public.agencies \
  --table=public.workspaces \
  --table=public.agency_members \
  --data-only \
  --no-owner \
  -f dump_agencies.sql

# Restaurar no novo projeto
psql \
  "postgresql://postgres:<senha-nova>@db.ndrqaymrkrlilxnyfymt.supabase.co:5432/postgres" \
  -f dump_agencies.sql
```

> NÃO migrar `agency_integrations` — os `secret_encrypted` são bytea criptografados com
> a passphrase do projeto antigo e ficam ilegíveis no novo projeto (chave diferente).
> As integrações precisam ser reconfiguradas via UI no novo projeto.

---

## K. Checklist de Validação

Execute cada item em ordem. Marcar como concluído antes de prosseguir.

### K.1 Schema e banco

```bash
# 1. Migrations aplicadas
supabase db remote list --project-ref ndrqaymrkrlilxnyfymt
# Esperado: 22 migrations listadas, até 00022_telemetry_vitals

# 2. GUC de criptografia configurado
# (rodar no SQL Editor)
SELECT current_setting('app.encryption_key');
# Esperado: string de 64 chars hex

# 3. GUC do cron secret configurado
SELECT current_setting('app.cron_secret');
# Esperado: string de 64 chars hex
```

```sql
-- 4. Tabelas criadas (contar: deve ser >= 22 tabelas de domínio)
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 5. RLS habilitado em TODAS as tabelas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relrowsecurity = true
  );
-- Esperado: zero linhas (todas as tabelas têm RLS)

-- 6. Extensões ativas
SELECT extname FROM pg_extension
WHERE extname IN ('pgcrypto', 'pg_cron', 'pg_net');
-- Esperado: 3 linhas

-- 7. Enums criados
SELECT typname FROM pg_type
WHERE typtype = 'e'
ORDER BY typname;
-- Verificar que todos os 20 enums do schema.md aparecem

-- 8. UNIQUE INDEX parcial de agency_integrations (correção do 00021)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'agency_integrations'
  AND indexname = 'unique_active_integration';
-- Esperado: 1 linha com WHERE deleted_at IS NULL
```

### K.2 Realtime

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
-- Esperado: 7 tabelas (post_cards, carousel_slides, approval_requests,
--           approval_pins, comments, publish_queue, publish_attempts)
```

### K.3 Storage

```sql
-- Buckets existem
SELECT id, name, public FROM storage.buckets ORDER BY name;
-- Esperado: asset-library (false), avatars (true), brand-kits (false),
--           post-assets (false), templates (false)

-- Policies de storage existem
SELECT name, bucket_id, operation
FROM storage.policies
ORDER BY bucket_id, operation;
-- Verificar cobertura de SELECT/INSERT/DELETE para cada bucket
```

### K.4 Edge Functions

```bash
# Todas as funções estão ativas
supabase functions list --project-ref ndrqaymrkrlilxnyfymt

# Healthcheck responde 200
curl -s https://ndrqaymrkrlilxnyfymt.supabase.co/functions/v1/healthz | jq .
# Esperado: { "status": "ok", "db": "ok", "duration_ms": <N>, "timestamp": "..." }
```

### K.5 Secrets

```bash
supabase secrets list --project-ref ndrqaymrkrlilxnyfymt
# Verificar: CRON_SECRET, MAGIC_LINK_HMAC_SECRET, RESEND_API_KEY, EMAIL_FROM
# Opcionais: SENTRY_DSN_FUNCTIONS, SENTRY_ENVIRONMENT, SENTRY_RELEASE
```

### K.6 pg_cron jobs

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
ORDER BY jobname;
-- Esperado: publish-worker, insights-sync, magic-link-cleanup, telemetry-vitals-retention
```

### K.7 Frontend conectado ao novo projeto

```bash
# Verificar .env.local
grep VITE_SUPABASE_URL .env.local
# Esperado: https://ndrqaymrkrlilxnyfymt.supabase.co

# Build local sem erros de TS
npm run build
# Esperado: exit 0, bundle ~82 KB gz (entry + react-vendor)
```

### K.8 Teste end-to-end mínimo (smoke test)

1. Abrir `http://localhost:5173` (ou URL do preview Vercel).
2. Criar conta → criar agência → criar workspace → criar brand profile.
3. Criar um `post_card` e mover entre stages do kanban.
4. Criar um `approval_request` → verificar que o magic link é gerado via Edge Function `magic-link`.
5. Abrir o link de aprovação em aba anônima → visualizar e aprovar → verificar `approval_requests.status = 'approved'`.
6. Verificar que `telemetry_vitals` recebe linhas após navegação:
   ```sql
   SELECT metric, count(*) FROM telemetry_vitals GROUP BY metric;
   ```
7. Chamar o healthcheck: `curl https://ndrqaymrkrlilxnyfymt.supabase.co/functions/v1/healthz`
8. Verificar logs do publish-worker após 1 minuto:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobname = 'publish-worker'
   ORDER BY start_time DESC LIMIT 5;
   ```

### K.9 BetterStack — atualizar URL do healthcheck

Em `betterstack.com → Monitors`:
- Atualizar monitor #1 de `exzmhbdfdqxriedadcmy` para `ndrqaymrkrlilxnyfymt`.
- Confirmar que o monitor volta a verde.

---

## Ordem de execução resumida

```
1. Habilitar extensões (B) — ANTES de aplicar migrations
2. Configurar GUC encryption_key (H.1) — ANTES das migrations (ou logo após, antes de qualquer seed)
3. Linkar CLI ao novo projeto (A.1)
4. Aplicar migrations: supabase db push (A.3)
5. Habilitar Realtime nas 7 tabelas (G)
6. Criar buckets + RLS Storage (D)
7. Deploy das 6 Edge Functions (E)
8. Setar secrets (F)
9. Configurar GUC cron_secret (H.2)
10. Criar jobs pg_cron (H.3)
11. Configurar Auth: Site URL, Redirect URLs, SMTP (C)
12. Atualizar .env.local e Vercel env vars (I)
13. Executar checklist de validação K.1–K.9
14. Atualizar monitor BetterStack (K.9)
15. Descomissionar projeto antigo (aguardar 7 dias de estabilidade no novo)
```

---

## Rollback

Se algo crítico falhar no novo projeto e for necessário reverter temporariamente para o
projeto antigo:

1. Reverter `.env.local` e Vercel env vars para `exzmhbdfdqxriedadcmy`.
2. Fazer redeploy na Vercel.
3. Diagnosticar o problema no novo projeto antes de tentar novamente.

Não há migrations para rollback — o projeto antigo não foi alterado.

---

## Links

- [[../03_backend/schema]] — schema canônico com todas as 22 tabelas
- [[supabase-cli-apply]] — guia de apply original (projeto antigo, referência)
- [[observabilidade]] — setup Sentry + BetterStack + Web Vitals
- [[../02_architecture/adr/012-encryption-resolution]] — decisão pgcrypto vs Vault
- [[../02_architecture/adr/009-cron-runner]] — decisão pg_cron vs Vercel Cron
- [[../02_architecture/review-2026-04-29-infra]] — review que originou esta migração
