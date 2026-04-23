---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: active
confidence: medium
---

# Checklist pré-deploy — crie-web

> Tudo tem que estar **verde** antes de promover staging → produção. Usado tanto no deploy inicial (beta fechado) quanto em cada release subsequente. Quem faz o deploy preenche + aprova. Se algum item é `N/A`, justificar em 1 linha.

## 1. Código

- [ ] Branch `main` limpo, sem commits pendentes locais.
- [ ] `pnpm lint` + `pnpm typecheck` sem erros.
- [ ] `pnpm test` (unit + component) — 100% pass.
- [ ] `pnpm test:e2e` (Playwright mocked, staging) — os 3 fluxos críticos passam.
- [ ] `pnpm test:rls` (supabase db test, staging branch) — policies negativas passam.
- [ ] `pnpm build` sem warnings.
- [ ] `scripts/check-bundle-secrets.sh` — 0 matches para secrets server-only.

## 2. Banco (Supabase)

- [ ] Todas as migrations `00008 → 00018` aplicadas no projeto prod (`supabase migration list` local == remoto).
- [ ] Extensões habilitadas: `pg_cron`, `pg_net`, `pgsodium`.
- [ ] Bootstrap da chave `pgsodium` feito (key id presente).
- [ ] RLS enabled + FORCED em todas as tabelas novas (query de verificação rodada).
- [ ] Jobs `pg_cron` cadastrados: `publish_worker_tick` (60s), `insights_sync_tick` (hourly), `approval_requests_expire_tick` (10min), `meta_token_health_check_tick` (daily).
- [ ] Tipos TypeScript regenerados: `pnpm supabase:types` — commit no repo.

## 3. Edge Functions

- [ ] Todas deployadas via `supabase functions deploy`: `publish-enqueue`, `publish-worker-tick`, `magic-link-create`, `magic-link-verify`, `approval-create`, `approval-decide`, `approval-pins-create`, `approval-resubmit`, `auto-adapt`, `llm-brand-voice`, `insights-sync`, `stripe-webhook`.
- [ ] Secrets das Edge Functions configurados: `MAGIC_LINK_SESSION_SECRET`, `META_APP_SECRET`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY` (ou equivalente LLM).
- [ ] `SERVICE_ROLE_KEY` configurada **apenas** como secret da Edge Function, nunca exposta no frontend.
- [ ] Health check: cada Edge Function responde 200 em `GET /__health`.

## 4. Storage

- [ ] Buckets criados: `assets`, `exports`, `brand-kits`, `references`.
- [ ] Policies por prefixo `workspaces/<ws_id>/*` cruzando com `is_workspace_member`.
- [ ] CORS configurado para `crie.app` e domínios white-label conhecidos.

## 5. Frontend (Vercel)

- [ ] Env vars de produção: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_APP_URL`, `VITE_SENTRY_DSN` (se configurado).
- [ ] Preview URL do PR testada manualmente por 1 persona de cada role.
- [ ] Bundle size main <500KB gzip (checar `dist/assets/*.js` pós-build).
- [ ] Lighthouse mobile no `/a/<token>` (aprovador): score **>80** em Performance, >90 em Accessibility.
- [ ] Rotas públicas (`/a/:token`, landing) funcionam sem sessão.
- [ ] Headers de segurança ativos: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

## 6. Integrações externas

- [ ] Meta Graph API: conta de teste IG Business conectada via OAuth; post de sandbox publica OK (smoke manual).
- [ ] Meta token long-lived válido >30 dias.
- [ ] Resend: domínio `crie.app` verificado (DKIM, SPF, DMARC green).
- [ ] Stripe: produtos/planos criados; webhook endpoint configurado e respondendo 2xx.
- [ ] LLM provider (Anthropic): chave ativa com quota suficiente para o piloto.

## 7. Monitoramento / Observabilidade

- [ ] Sentry (ou alternativa) capturando erros do frontend.
- [ ] Logs da Edge Function acessíveis (Supabase logs).
- [ ] Dashboard de métricas básicas: publishes/dia, approval latency p50/p95, magic_link bounces.
- [ ] Alerta: `publish_attempts.outcome='permanent_error'` spike → Slack/email.
- [ ] Alerta: `agency_integrations` com token expirando em 7 dias.

## 8. Segurança (resumo — ver [[security-checklist]])

- [ ] Checklist de segurança completo verificado (≥95% itens).
- [ ] Grep no bundle por secrets: zero hits.
- [ ] Teste de isolamento multi-tenant (Flow 3) passou integralmente.
- [ ] Rate limits ativos em `/magic-link/verify`, `/approval/decide`, `/a/:token`.

## 9. Dados / Seed

- [ ] Nenhum dado de teste em prod (query `SELECT count(*) FROM agencies WHERE slug LIKE '%test%'` → 0).
- [ ] Agência do piloto criada com `subscription_status='trialing'` e `seat_limit` correto.
- [ ] Aprovadores do piloto convidados via magic_link (admin dispara manualmente).

## 10. Rollback plan

- [ ] Migration reversível OU snapshot do DB pré-deploy disponível.
- [ ] Deploy anterior marcado como "promovível" no Vercel (1-click rollback).
- [ ] Runbook de incident response acessível ([[../06_deploy/runbook]]).

## 11. Comunicação

- [ ] Changelog atualizado com o release.
- [ ] Agências piloto notificadas com 24h de antecedência (se downtime esperado).
- [ ] Status page (se existir) atualizada.

## 12. Pós-deploy (dentro de 1h)

- [ ] Smoke test manual: signup nova agência → criar workspace → criar post → publicar (mock) → revogar magic_link.
- [ ] Verificar logs sem erros 5xx inesperados nos primeiros 30min.
- [ ] Verificar `audit_log` recebendo eventos corretamente.
- [ ] Verificar cron jobs rodaram 1 ciclo sem erro.

## Links
- [[plano]]
- [[security-checklist]]
- [[bugs]]
- [[../06_deploy/supabase-cli-apply]]
