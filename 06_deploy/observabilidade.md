---
created: 2026-04-29
updated: 2026-04-29
owner: deploy
status: active
confidence: high
---

# Observabilidade — setup mínimo (P0 #6)

Stack mínima de observabilidade para o beta fechado, derivada do review [[../02_architecture/review-2026-04-29-summary]]. Tudo gratuito ou near-zero no início.

## Componentes

| Sinal | Ferramenta | Onde está | Custo |
|---|---|---|---|
| Erros frontend | Sentry (`@sentry/react`) | `src/lib/sentry.ts` | Free 5k errors/mês |
| Erros Edge Functions | Sentry Deno | `supabase/functions/_shared/sentry.ts` | Mesmo plano |
| Web Vitals (LCP/INP/CLS/FCP/TTFB) | `web-vitals` lib + tabela Supabase | `src/lib/vitals.ts`, `telemetry_vitals` | Custo de DB (negligenciável) |
| Healthcheck | Edge Function `/healthz` | `supabase/functions/healthz/` | Free |
| Uptime + Status page | BetterStack (manual) | externo | Free 10 monitors |
| Logs Edge Functions | Supabase Logs (built-in) | dashboard | Pro: 7d retenção |

## 1. Sentry

### Setup
1. Criar projeto Sentry: `crie-web` (plataforma React) e `crie-web-edge` (plataforma Deno/Generic).
2. Coletar DSNs.
3. Vercel → Settings → Environment Variables:
   - `VITE_SENTRY_DSN` = DSN do projeto frontend
   - `VITE_APP_VERSION` = `${VERCEL_GIT_COMMIT_SHA}` (Vercel preenche)
4. Supabase secrets:
   ```bash
   supabase secrets set SENTRY_DSN_FUNCTIONS=<dsn-do-projeto-edge>
   supabase secrets set SENTRY_ENVIRONMENT=production
   supabase secrets set SENTRY_RELEASE=<commit-sha>
   ```
5. Em dev local, **deixe vazio** — o init é no-op sem DSN.

### Privacidade
- `replaysSessionSampleRate: 0` (Session Replay desabilitado).
- `beforeSend` faz scrub de `user.email` (hash) e remove headers `Authorization`/`Cookie`.
- Edge wrapper limpa headers Auth/Cookie antes de enviar.

### Alertas sugeridos
- **>5 errors/5min em production** → Slack/Discord webhook.
- **>1% error rate** em qualquer Edge Function (ratio entre tx 5xx e tx 2xx, janela 15min).
- **New issue** com tag `function: publish-worker` ou `function: magic-link` → notificação imediata (caminho crítico).

## 2. Web Vitals

Migration `00022_telemetry_vitals.sql` cria a tabela. RLS:
- INSERT: `anon` e `authenticated` (telemetria pública).
- SELECT: só `service_role` (sem policy → bloqueado por default).

### Dashboard SQL (rodar no Supabase Studio com service role)

```sql
-- p75 LCP/INP/CLS por rota nos últimos 7 dias
SELECT route, metric,
  percentile_cont(0.75) WITHIN GROUP (ORDER BY value) AS p75,
  percentile_cont(0.50) WITHIN GROUP (ORDER BY value) AS p50,
  count(*) AS samples
FROM telemetry_vitals
WHERE created_at > now() - interval '7 days'
  AND metric IN ('LCP', 'INP', 'CLS')
GROUP BY route, metric
ORDER BY metric, p75 DESC;
```

```sql
-- Distribuição good/needs-improvement/poor por rota crítica
SELECT route, metric, rating, count(*)
FROM telemetry_vitals
WHERE created_at > now() - interval '7 days'
  AND route IN ('/a/:token', '/app/board', '/app/design', '/app/dashboard')
GROUP BY route, metric, rating
ORDER BY route, metric;
```

### Budget de p75 (mobile, viewport <768px)
- LCP < 2500ms (Core Web Vital "good")
- INP < 200ms
- CLS < 0.1
- TTFB < 800ms (proxy de latência região DB)

Alerta: p75 LCP de `/a/:token` em mobile > 2500ms ⇒ revisitar bundle do aprovador.

### Retenção (rodar manualmente até implementar pg_cron)
```sql
DELETE FROM telemetry_vitals WHERE created_at < now() - interval '90 days';
```

Quando aplicar via pg_cron (após 1ª limpeza estabilizada):
```sql
SELECT cron.schedule(
  'telemetry-vitals-retention',
  '0 3 * * *',  -- 3am daily
  $$DELETE FROM telemetry_vitals WHERE created_at < now() - interval '90 days'$$
);
```

## 3. Healthcheck `/healthz`

Endpoint público em `https://<project>.supabase.co/functions/v1/healthz`.

- Probe: `select id, count head` em `telemetry_vitals` (timeout 500ms).
- 200 OK: `{ status: "ok", db: "ok", duration_ms, timestamp }`
- 503 degraded: `{ status: "degraded", db: "fail" | "unconfigured", error?, duration_ms?, timestamp }`

Pré-requisito: migration 00022 aplicada. Se não estiver, o probe falha — comportamento esperado (chama atenção pra aplicar).

## 4. BetterStack (manual)

1. Criar conta free em betterstack.com.
2. Adicionar **Uptime monitor #1**:
   - URL: `https://<project>.supabase.co/functions/v1/healthz`
   - Method: GET, Esperado: status 200, body contém `"status":"ok"`
   - Frequência: 1 min, regiões: SA + US-East
3. Adicionar **Uptime monitor #2**:
   - URL: `https://app.crieweb.com.br` (ou domínio do beta)
   - Method: GET, Esperado: status 200
   - Frequência: 1 min
4. **Status Page** pública: `status.crieweb.com.br` (CNAME pra BetterStack), agrupando os 2 monitors.
5. Notificações: Slack/Discord webhook + e-mail.

## 5. Alertas iniciais (lista P0)

Implementar quando habilitar Sentry/BetterStack:
1. Cron job failure (`SELECT * FROM cron.job_run_details WHERE status = 'failed'` — alerta diário).
2. Edge Function 5xx rate > 1% (Sentry → Slack).
3. p75 LCP mobile em `/a/:token` > 2500ms (query manual semanal por enquanto).
4. Sentry error rate spike (>5 errors/5min).
5. Healthcheck `/healthz` down >2min (BetterStack).

## Próximos passos manuais (você precisa fazer)

- [ ] Criar 2 projetos no Sentry (`crie-web` React e `crie-web-edge` Deno).
- [ ] Setar `VITE_SENTRY_DSN` na Vercel.
- [ ] `supabase secrets set SENTRY_DSN_FUNCTIONS=...`.
- [ ] `supabase db push` para aplicar migration 00022.
- [ ] Deploy da Edge Function `healthz`: `supabase functions deploy healthz --no-verify-jwt`.
- [ ] Criar conta BetterStack + 2 monitors + status page.
- [ ] Configurar webhook Slack/Discord pros alertas.

## Links
- [[../02_architecture/review-2026-04-29-summary]]
- [[../02_architecture/review-2026-04-29-frontend]] — gaps de telemetria
- [[../02_architecture/review-2026-04-29-infra]] — alternativas e custo
