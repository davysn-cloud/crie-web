---
created: 2026-04-29
updated: 2026-04-29
owner: backend
status: active
confidence: medium-high
---

# Review Backend — 2026-04-29

Avaliacao critica da arquitetura backend/dados do crie-web mirando **centenas de usuarios ativos com baixa latencia**. Baseada em leitura das migrations 00008-00020, [[../03_backend/schema]], [[stack]] e ADRs 008-011.

Convencoes: **veredito** = (manter / ajustar / trocar). **gatilho** = quando reavaliar.

---

## 1. Supabase como backend unico

**Veredito: manter — ajustar config.** Para o estagio (3-5 agencias piloto, ~50-200 MAU), Supabase entrega Auth + RLS + Storage + Realtime + cron + Edge Functions com 1 fornecedor — ROI de DX altissimo. Lock-in real esta no **RLS** (helpers `is_workspace_member`, `is_agency_member`) e em `pgsodium`/`pgcrypto` GUC `app.encryption_key`. Postgres puro e portavel; o que prende e a malha de policies + Edge Functions Deno.

**Pontos de inflexao concretos:**
- **Pro plan ($25)** estoura quando: >500 connections concorrentes, >500 Realtime concurrent, >250GB egress/mes, >2M Edge Function invocations.
- **Team plan ($599)** comeca a fazer sentido em 200-500 MAU se o publish-worker disparar muitas Edge Function por minuto ou se o egress de imagens IG (ate 10MB/post * 10 carrossel) crescer.
- Edge Function timeout de 150s nao serve para job que faz N uploads sequenciais para Meta Graph (carrossel de 10 + first_comment + cross-post FB). **Risco real hoje** — ver topico 4.

**Gatilho de migracao parcial:** quando Edge Function cold start + p95 da fila publish > 30s sustentado, mover publish-worker para Cloudflare Workers ou container dedicado mantendo Postgres no Supabase.

## 2. RLS multi-tenant

**Veredito: ajustar.** Padrao atual e solido conceitualmente (`is_workspace_member` STABLE SECURITY DEFINER, JOIN via `agency_members`+`workspaces`+`workspace_members` com filtro `accepted_at IS NOT NULL`). Mas:

- **Helper faz 3-way JOIN por linha** quando policy chama `is_workspace_member(workspace_id)`. Postgres normalmente cacheia STABLE dentro de uma query, mas em queries com CTE/subqueries ou N+1 (ex: `approval_pins` policy usa subquery `SELECT workspace_id FROM approval_requests WHERE id = approval_request_id` para CADA linha) o overhead vira O(N).
- **Indices necessarios verificados:** `workspace_members(user_id, workspace_id)` composto e `agency_members(user_id, agency_id, accepted_at)` parcial sao **criticos** — preciso confirmar que existem em 00001-00007 (nao li). Se nao existirem, RLS faz seq scan a cada policy check.
- **Padrao problematico:** `approval_pins`, `publish_attempts` resolvem workspace_id via subquery (ver 00014:156, 00015:97) — a cada SELECT/INSERT o helper RLS roda subquery + 3-way join. Solucao: **denormalizar `workspace_id` direto na tabela filha** (ja feito em `publish_queue`, falta em `approval_pins`, `publish_attempts`).

**Acao concreta:** auditar indices do schema base; adicionar `workspace_id` denormalizado em `approval_pins`, `publish_attempts`, `insights` (insights ja tem). Confirmar `idx_workspace_members_user_workspace`.

**Gatilho:** se p95 de query do board kanban > 200ms, virar para uma view materializada ou bypass RLS via RPC SECURITY DEFINER que valida explicitamente.

## 3. pg_cron + pg_net

**Veredito: manter ate ~500 posts/dia agendados, depois ajustar.** Tick atual: `publish-worker` a cada 1 min ([[../06_deploy/supabase-cli-apply]]). Pros: zero infra, transactional com o DB, ja esta em [[../02_architecture/adr/009-cron-runner]].

**Limites reais:**
- pg_cron e single-node — todos os jobs disputam o mesmo background worker pool (default `max_worker_processes=8`).
- pg_net `http_post` e fire-and-forget; nao tem retry exponencial, nao da observabilidade boa, falhas vao para `net._http_response`.
- Se `publish-worker` rodar 60s e a fila tiver 50 posts, tem que paralelizar dentro da Edge Function — risco de timeout 150s.

**Gatilho de migracao:** quando (a) > 500 publish/dia, (b) precisar de retry com backoff por job, ou (c) qualquer integracao Meta passar a exigir long-running (>120s) — mover para **Trigger.dev** (DX Postgres-friendly, cron + queue + retry nativos) ou Inngest. BullMQ exige Redis dedicado, evitar antes de 1k MAU.

## 4. Edge Functions Deno (image processing + LLM)

**Veredito: ajustar — separar workloads.** Imagescript em Deno e ok para overlay/crop ate ~5MB. **Mas:**
- LLM calls (`llm-brand-voice`) ja sao bound por latencia do provider (5-30s) — Edge Function so faz proxy + auth. Manter.
- Image processing pesado (carrossel 10 slides 4:5 com overlay) pode estourar memoria do Deno isolate (Supabase usa ~256MB). Cold start 200-800ms.
- `publish-worker` faz upload sequencial de N imagens + Meta API + insights — **pior caso vai bater 150s.**

**Acao:** separar em duas funcoes — `publish-prepare` (gera media containers) e `publish-finish` (commit + first_comment), com transicao via `publish_queue.status` e tick separado.

**Alternativas:** Cloudflare Workers (50ms CPU limit padrao, mas free tier generoso e com Durable Objects da pra fazer fila); para image processing pesado, **fila assincrona em container** (Fly.io machine, Railway worker) e melhor que Edge.

**Gatilho:** ao primeiro timeout 150s em prod, OU quando custo de invocations > $20/mes.

## 5. Realtime (kanban colaborativo)

**Veredito: manter ate 100 conexoes concorrentes; ajustar antes.** Supabase Realtime Pro ate 500 concurrent. Mas o custo real e o **broadcast amplification** — cada drag em `post_cards` dispara replication payload para todos os clientes assinando aquele workspace. Com 50 cards * 6 usuarios * mudanca de status, sao 300 eventos/min faceis.

**Acao (citado em [[review-2026-04-29-frontend]] tb):** singleton Realtime channel **por workspace** no client, debounce de 500ms em drag-end, e usar `replica identity full` so onde necessario. No backend: **filtrar por workspace_id no canal** (`realtime.list_changes` filter) — ja suportado.

**Gatilho:** > 200 concurrent ou jitter > 1s no kanban → migrar canal critico para Pusher/Ably ou SSE custom via Edge Function.

## 6. Storage para assets IG

**Veredito: ajustar — adicionar CDN externa.** Supabase Storage e S3 wrapper com CDN proprio (Cloudflare na frente em planos pagos), mas:
- Egress conta no plano (250GB Pro). 100 agencias * 30 posts/mes * 10 slides * 2MB = 60GB/mes apenas leitura — passa rapido.
- Transformacoes de imagem do Supabase sao **pagas separado** e limitadas. Ja temos pipeline propria via Edge Function (ADR 010).
- Aprovador externo carrega bundle pesado (ver [[review-2026-04-29-frontend]]) + assets — egress duplo.

**Acao:** em vez de migrar bucket, **colocar Cloudflare na frente** via custom domain + cache rules. Mantem o controle de RLS de `storage.objects` mas zera egress repetido. Quando > 200GB/mes, considerar **Cloudflare R2** com signed URLs (zero egress).

**Gatilho:** egress mensal > 50% do plano, ou quando aprovador mobile reportar latencia de imagem > 2s p75.

## 7. Migrations & schema — red flags

Leitura focada em 00008-00020:

- **JSONB grande sem GIN index nem schema validation** — `post_drafts.carousel_script_json`, `reel_script_json`, `stories_script_json`, `insights.raw_json`, `audit_log.diff_json`, `publish_attempts.request_payload/response_payload`. Sem CHECK/limit. **Risco:** linha de 2MB+ em `publish_attempts` por carrossel. Acao: adicionar `CHECK (octet_length(raw_json::text) < 100000)` e GIN onde houver query (`audit_log.diff_json` se filtrarem por chave).
- **TEXT sem LIMIT** em `caption_snapshot`, `caption`, `body`, `last_error` — Postgres lida bem, mas IG caption tem 2200 char hard limit; vale CHECK no `caption`.
- **Falta particionamento** em tabelas append-heavy: `audit_log`, `insights`, `publish_attempts`, `stage_transitions` (nao li mas implicado). A 500 MAU * 100 acoes/dia = 1.5M rows/mes em `audit_log`. Acao: planejar **particionamento por mes** (`PARTITION BY RANGE (created_at)`) antes do beta, mesmo que comece com 1 particao — mudar depois e doloroso.
- **Indices em FKs:** todos os FKs principais tem index dedicado, bom. Mas `agency_integrations(expires_at)` parcial e bom para refresh; falta index em `approval_requests(expires_at)` para cleanup job.
- **`unique_active_integration` constraint** em `agency_integrations` usa `deleted_at` no UNIQUE — isso permite multiplos `deleted_at IS NOT NULL` mas tambem multiplos NULL com mesmo escopo, por causa de NULL nao igualar NULL. **Bug latente:** trocar por `UNIQUE INDEX ... WHERE deleted_at IS NULL`.
- **`encryption_key` em GUC** ([[adr/008-agency-integrations-encryption]]) — funciona mas e dificil rotacionar e aparece em backups/dumps. Aceitavel para beta; pre-GA migrar para Supabase Vault ou KMS externo.
- **Trigger `increment_post_draft_version`** sempre incrementa em UPDATE — colide com optimistic lock se houver UPDATE legitimo concorrente vindo de path nao-RPC. Forcar UPDATE so via RPC `update_post_draft` (REVOKE UPDATE em authenticated).

## 8. Connection pooling

**Veredito: ajustar.** Supabase usa **Supavisor** (default) em modo transaction. PostgREST e Edge Functions ja vao via pooler. Mas:
- Modo transaction quebra prepared statements e session-level GUC — `app.encryption_key` precisa ser DATABASE-level (ja e via `ALTER DATABASE ... SET`), confirmado OK.
- `current_setting('request.jwt.claim.role')` em RPCs depende do header `request.jwt.claim` — funciona via PostgREST, mas via cron->pg_net->Edge Function->service_role, o JWT vem do header bearer e o claim role precisa estar no JWT. Validar.

**Gatilho:** monitorar `pg_stat_activity` — se pool saturar a > 60% sustentado, subir plan ou separar leitura via read replica (Pro+).

---

## TOP 5 acoes priorizadas para escalar ate 500 usuarios

1. **Denormalizar `workspace_id` em `approval_pins` e `publish_attempts`** + auditar indices em `agency_members(user_id, accepted_at)` e `workspace_members(user_id, workspace_id)`. Reduz custo de RLS de O(N joins) para O(1) lookup. **Owner: backend. Esforco: 1 dia + migration.**

2. **Particionar `audit_log`, `insights`, `publish_attempts` por mes (RANGE created_at)** antes do beta. Adicionar CHECK em JSONB grandes (`octet_length < 100k`). Reescrever `unique_active_integration` como `UNIQUE INDEX ... WHERE deleted_at IS NULL`. **Owner: backend. Esforco: 1-2 dias.**

3. **Quebrar `publish-worker` em `publish-prepare` + `publish-finish`** com transicao via `publish_queue.status`. Adicionar metrica de tempo por estagio. Elimina risco de timeout 150s e da retry granular. **Owner: backend + deploy. Esforco: 2 dias.**

4. **CDN Cloudflare na frente do Supabase Storage** + dominio customizado + cache rules para `/storage/v1/object/public/*`. Reduz egress 60-80% imediato. **Owner: deploy. Esforco: meio dia.**

5. **Observabilidade backend:** ativar `pg_stat_statements`, dashboard de p95 por endpoint PostgREST, Sentry nas Edge Functions, alarme de saturacao de pool e de cron job failures via `cron.job_run_details`. Sem isso, voamos cego em escala. **Owner: deploy + backend. Esforco: 1 dia.**

---

## Links

- [[../03_backend/schema]] · [[stack]] · [[adr/009-cron-runner]] · [[adr/010-image-processing]] · [[adr/008-agency-integrations-encryption]]
- Companion: [[review-2026-04-29-frontend]]
- Briefing: [[../08_shared/briefing]]
