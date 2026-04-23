---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: high
decided_on: 2026-04-15
---

# ADR 009 — Cron runner (jobs recorrentes)

## Contexto
Precisamos de execução agendada para:
- **`publish_worker`** — varre `publish_queue` e dispara publicações na Meta Graph API no horário agendado (granularidade: 1 min).
- **`insights_sync`** — puxa métricas da Meta Graph API para `insights` (granularidade: a cada 1-6h por conta conectada).
- **`magic_link_cleanup`** — expira tokens após TTL (diário).
- **`meta_token_refresh`** — renova tokens de longa duração antes de expirar (diário).
- **`digest_email`** — envia resumo semanal para aprovadores (semanal).

## Decisão
**`pg_cron` (extensão nativa Postgres, habilitada no Supabase)** acionando Edge Functions via `net.http_post` (extensão `pg_net`).

Padrão:
```sql
select cron.schedule(
  'publish-worker-every-minute',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://<project>.functions.supabase.co/publish-worker',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
     );
  $$
);
```

## Justificativa
- **Nativo Supabase** — sem serviço externo, sem custo adicional, sem infra para operar.
- Granularidade de 1 min atende `publish_worker` (horário agendado ±1 min é aceitável).
- Edge Function é o lugar natural para a lógica (acesso ao `service_role`, secrets criptografados).
- Facilidade de debug: `cron.job_run_details` guarda histórico.

## Consequências
- Habilitar extensões `pg_cron` e `pg_net` no projeto Supabase (via dashboard ou CLI).
- Criar role + secret `app.cron_secret` (GUC) para a Edge Function validar que chamada veio do cron, não de fora.
- Edge Functions do cron devem ser **idempotentes** (cron pode disparar duplicado em caso de retry).
- Concorrência: `publish_worker` usa `FOR UPDATE SKIP LOCKED` ao ler `publish_queue` para evitar publicar duplicado.
- Timeout da Edge Function (150s) é suficiente para batch de até ~20 publicações por minuto. Além disso, fanout.

## Riscos
- `pg_cron` roda no nó primário — grandes bloqueios na DB atrasam cron. Mitigação: jobs curtos, lógica pesada fica na Edge Function.
- Supabase Free tier não tem `pg_cron`? Confirmar na hora de aplicar (ver `06_deploy/supabase-cli-apply.md`).

## Alternativas consideradas
- **Cron externo (GitHub Actions / Vercel Cron)** — mais flexível mas adiciona superfície e latência.
- **Upstash QStash** — bom para filas de alto volume, overkill pro MVP.
- **Temporal / Inngest** — overengineering pra 5 jobs.

## Links
- [[../../03_backend/api/publish|api/publish]]
- [[../../03_backend/api/insights-sync|api/insights-sync]]
- [[../../06_deploy/supabase-cli-apply|Supabase CLI apply guide]]
