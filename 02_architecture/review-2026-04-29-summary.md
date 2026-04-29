---
created: 2026-04-29
updated: 2026-04-29
owner: coordinator
status: active
confidence: high
---

# Review de Arquitetura & Stack — Sumário Executivo (2026-04-29)

> **Pergunta:** a stack atual sustenta centenas de usuários ativos com latência baixa?
> **Resposta curta:** **sim, com 6 ajustes obrigatórios pré-beta e 5 trocas planejadas após o piloto.** Nenhuma decisão fundamental precisa ser revista; o que falha primeiro é operacional (observabilidade, region, índices, bundle, App Review Meta).

Reviews detalhados:
- [[review-2026-04-29-backend]] — Supabase, RLS, jobs, Edge Functions, schema
- [[review-2026-04-29-frontend]] — React/Vite/Vercel, bundle, Realtime, aprovador mobile
- [[review-2026-04-29-infra]] — Vercel, Stripe, Resend, Meta Graph, LLM, custos

## Veredito por camada

| Camada | Stack atual | Veredito | Ponto de inflexão |
|---|---|---|---|
| Backend (DB+Auth) | Supabase Pro | **MANTER** | ~500 MAU ou egress >$200/mês |
| RLS multi-tenant | `is_workspace_member` + RLS | **AJUSTAR** | antes de 100 MAU |
| Jobs | pg_cron + pg_net | **MANTER no MVP** | >200 publishes/dia → Trigger.dev |
| Edge Functions | Deno (Supabase) | **AJUSTAR** | image processing → Cloudflare em escala |
| Realtime | Supabase Realtime | **MANTER** | >150 conexões pico → broadcast/Liveblocks |
| Storage | Supabase Storage | **TROCAR (médio prazo)** | >100GB egress/mês → R2 + CF Images |
| Frontend SPA | React 19 + Vite | **AJUSTAR (urgente)** | LCP p75 mobile >2.5s → TanStack Start/Next |
| Deploy | Vercel | **MANTER** | >100GB BW/mês → upgrade Pro |
| Região DB | ❓ (provável `us-east-1`) | **CONFIRMAR/MIGRAR** | imediato — antes do beta |
| Billing | Stripe | **MANTER, abstrair** | revisar Asaas se Pix dominar |
| E-mail | Resend | **MANTER** | >$200/mês ou >50 domínios |
| Meta Graph | App único | **AJUSTAR** | App Review imediato (4-8 sem) |
| LLM | OpenAI/Anthropic (key da agência) | **MANTER, instrumentar** | sem prompt caching estoura custo se nós subsidiarmos |
| Observabilidade | **nenhuma** | **CRÍTICO — GAP** | bloqueante para beta |

## Top 6 ações P0 (pré-beta — bloqueantes)

1. **Confirmar Supabase em `sa-east-1`** ou migrar antes da 1ª agência ativa. ~120ms RTT em jogo.
2. **Migration de saneamento de schema**: índices faltantes (FKs `owner_id`, `created_by`, `approved_by`, `author_id`, `email`) + desnormalização de `workspace_id` em `publish_attempts`/`approval_pins`/`carousel_slides` para eliminar subquery scalar em RLS.
3. **Resolver inconsistência pgsodium vs pgcrypto** em `agency_integrations` (schema canônico diz pgsodium, migration 00018 usa `pgp_sym_encrypt`). Escolher um e fechar ADR antes de qualquer agência inserir token Meta real.
4. **Code-splitting + lazy routes em `src/App.tsx`** + `manualChunks` no Vite + budget no CI (chunk inicial <200KB gz). Hoje 41 páginas em import estático ⇒ FCP mobile inaceitável.
5. **Bundle isolado + PWA para `/a/:token`** (rota pública do aprovador, caminho crítico de receita). Entry separado sem `CrieLayout`/sidebar/admin, manifest, service worker.
6. **Stack mínima de observabilidade**: Sentry frontend + Edge Functions, web-vitals → tabela `telemetry_vitals`, Better Stack uptime + status page. Sem isso o beta é cego.

## Top 5 ações P1 (durante o beta)

7. **Particionamento por mês** em `audit_log` e `insights` + retenção (90d detalhado, agregado mensal depois).
8. **Pipeline de imagens responsivas**: variantes 320/800/1440 AVIF/WebP via Edge Function existente (ADR 010), `srcset` em `InstagramPreview`/`GridPreview`/`CarouselSlideBuilder`, `loading="lazy"` global. Camada de abstração sobre Storage (RPC `get_asset_url` + signed URL) — habilita migração para R2 sem reescrita.
9. **Submeter App Review Meta** com permissões de produção (`instagram_content_publish`, `pages_read_engagement`, `instagram_manage_insights`). Leva 4-8 semanas — começar agora bloqueia menos depois.
10. **Singleton Realtime por workspace** (`useWorkspaceRealtime` multiplexando `post_cards`/`comments`/`stage_transitions`) + virtualização (`@tanstack/react-virtual`) no kanban e calendar. Sem isso, 100+ cards no mobile = jank.
11. **Prompt caching Anthropic + tabela `llm_usage` por agência**. Habilita controle de quota e billing por consumo. Sem isso, custo LLM explode se subsidiarmos qualquer plano gratuito.

## Top 5 trocas planejadas (pós-beta, gatilho-disparado)

| Troca | Gatilho | Prazo estimado |
|---|---|---|
| Storage Supabase → **Cloudflare R2 + Images** | egress >100GB/mês ou >500GB stored | ~10ª agência |
| pg_cron → **Trigger.dev** ou Inngest | >200 publishes/dia ou SLA <30s | ~50 agências |
| Vite SPA → **TanStack Start / Next App Router** | LCP p75 mobile >2.5s ou >30 agências | ~30 agências |
| Realtime Supabase → **broadcast/Liveblocks** | >150 conexões pico simultâneas | ~100 usuários ativos |
| Stripe → abstrair e adicionar **Asaas** | volume Pix domina (>60% transações) | Fase 3 |

## Custos projetados (infra, sem GMV cut)

- **100 usuários (~20 agências):** ~$155/mês
- **500 usuários (~100 agências):** ~$565/mês — primeiro ponto crítico em Supabase add-ons
- **1000 usuários (~200 agências):** ~$1700/mês — exige migração Storage→R2 e provavelmente Supabase Team plan

**Quem estoura primeiro:** Supabase (compute+storage egress) e LLM (se subsidiarmos). Storage de imagens é o termômetro mais sensível — instrumentar `llm_usage` e métricas de egress já no MVP.

## Não-mude

- React 19 + Vite + TS + Tailwind v4 + shadcn — sólido, produtividade alta, sem motivo de troca pré-30 agências.
- Zustand + TanStack Query — divisão correta (sessão/UI vs servidor); só reforçar regra de não duplicar dado.
- Postgres + RLS — fundamento certo para multi-tenant. Toda dívida apontada é de detalhe (índices, partições, helpers STABLE), não de estratégia.
- Stripe como billing primário — ecossistema vence; abstrair para trocar depois se Pix dominar.

## Links
- [[stack]] · [[../03_backend/schema]] · [[../08_shared/briefing]]
- ADRs relevantes: [[adr/008-agency-integrations-encryption]] · [[adr/009-cron-runner]] · [[adr/010-image-processing]] · [[adr/billing-provider]] · [[adr/deploy-target]] · [[adr/transactional-email]]
