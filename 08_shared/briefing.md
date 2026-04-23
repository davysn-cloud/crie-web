---
created: 2026-04-15
updated: 2026-04-15
owner: Coordinator
status: in-progress
confidence: high
---

# Briefing Diário do Time

## Status Atual
**Data:** 2026-04-15
**Fase:** MVP — beta fechado com 3-5 agências piloto.
**Produto:** SaaS de aprovação/publicação de conteúdo para agências de marketing (kanban multi-cliente). Ver [[01_product/ideia]].

## Stack confirmada
React 19 + Vite + TS + Tailwind v4 + shadcn + Zustand + TanStack Query + RHF + Zod + react-router v7 + dnd-kit + sonner · **Supabase** (Postgres/Auth/Storage/RLS). Detalhes: [[02_architecture/stack]].

## Decisões tomadas em 2026-04-15 (todas ADRs accepted)
- [[../02_architecture/adr/billing-provider]] → **Stripe** (suporte Pix/Boleto BR, margem).
- [[../02_architecture/adr/deploy-target]] → **Vercel** (zero config Vite, preview por PR).
- [[../02_architecture/adr/transactional-email]] → **Resend** (DX, templates React, habilita white-label).
- [[../02_architecture/adr/008-agency-integrations-encryption]] → **pgsodium** (tokens Meta/LLM/Stripe criptografados em repouso).
- [[../02_architecture/adr/009-cron-runner]] → **pg_cron + pg_net** (jobs nativos, sem infra externa).
- [[../02_architecture/adr/010-image-processing]] → **Edge Function + imagescript (Deno)** com heurística layout-only + override manual de ponto focal.
- [[../02_architecture/adr/011-schema-naming]] → **manter `workspaces` e `post_cards`** (evita churn, UI traduz).

## Migrations e setup manual (sem MCP)
- Migration **00018_agency_integrations.sql** criada. Guia de aplicação: [[../06_deploy/supabase-cli-apply]].
- Usuário aplica via `supabase db push` após habilitar `pg_cron`, `pg_net`, `pgsodium` e bootstrap da chave.

## Time e entregas de hoje
- **Product Agent** → [[01_product/ideia]], [[01_product/roadmap]], [[01_product/user-stories/index]] (11 user stories MVP)
- **Backend Agent** → [[02_architecture/stack]], 3 ADRs abertas, [[03_backend/schema]] (9 tabelas + RLS)
- **Frontend Agent** → [[04_frontend/design-system]], [[04_frontend/flows/aprovacao]]
- **QA Agent** → [[05_tests/plano]], [[05_tests/security-checklist]]

## Próximos passos (ordem)
1. **Usuário** segue [[../06_deploy/supabase-cli-apply]]: habilita `pg_cron`/`pg_net`/`pgsodium`, bootstrap da chave, `supabase db push` (00008→00018), Realtime + buckets + secrets + pg_cron jobs.
2. **QA agent** escreve primeiros casos E2E para os 3 fluxos críticos (brief → aprovação → publicação) em `05_tests/cases/e2e/`.
3. **Frontend agent** inicia implementação das P0 (priorização em [[../01_product/user-stories/index]]): aprovador mobile-first, designer canvas multiformato, publisher grid planner, copywriter editor, estrategista brief builder.
4. **Backend agent** implementa código das Edge Functions conforme contratos em `03_backend/api/*.md` (após usuário aplicar migrations).
5. **Deploy agent** configura Vercel + domínio + env vars assim que o Frontend estiver deployável.

## Histórico
- **2026-04-15** — Kickoff + ideia/stack/objetivo definidos + rascunhos iniciais de cada role entregues.
- **2026-04-15** — Migração para arquitetura de multiagents nativa do Claude Code: sub-agents reais em `.claude/agents/` (product, backend, frontend, qa, deploy). Vault Obsidian passa a ser pura memória. Regras no [[../CLAUDE]].
- **2026-04-15** — Definidos os 6 painéis personalizados por role de usuário final (estrategista, copywriter, designer, social-media, aprovador, admin). Specs em [[../01_product/roles/README]]. Foco em Instagram-nativo (Stories 9:16, Feed 1:1 e 4:5, Reel, carrossel até 10 slides).
- **2026-04-15** — Backend agent: auditoria + extensão com 21 tabelas novas em 10 migrations (não aplicadas). Contratos em [[../03_backend/api/]]. 4 ADRs novas: 004-approval-pins-storage, 005-post-versioning, 006-approver-auth, 007-storage-assets.
- **2026-04-15** — Frontend agent: wireframes + specs dos 6 painéis em [[../04_frontend/screens/README]]. 8 componentes novos críticos listados (`InstagramPreview`, `MultiFormatCanvas`, `GridPlanner`, `BriefBuilder`, `CommentPin`, `MagicLinkGate`, `BrandKitLockedPicker`, `CarouselSlideBuilder`). Gaps no design system: tokens (pilares, status-publish, gradient IG, sizes canônicos IG, font-mono), shadcn a adicionar (command, calendar, slider, switch, progress, toggle-group, resizable, drawer, accordion, checkbox, radio-group, table, alert, alert-dialog), rota pública `/a/:token` para aprovador.
- **2026-04-15** — Product agent: 59 user stories criadas (US-012 a US-070) cobrindo os 6 painéis. Índice em [[../01_product/user-stories/index]]. Distribuição P0/P1/P2: 30/25/4.
- **2026-04-15** — Coordinator: 7 ADRs fechadas (billing=Stripe, deploy=Vercel, email=Resend, encryption=pgsodium, cron=pg_cron, image=Edge Function+imagescript, schema naming=manter). Migration 00018_agency_integrations criada (não aplicada). Guia de apply manual via Supabase CLI em [[../06_deploy/supabase-cli-apply]].
- **2026-04-15** — QA agent: 3 fluxos E2E críticos em [[../05_tests/cases/e2e/]], security-checklist expandido (≈130 itens), plano de testes, pre-deploy checklist, arquivo de bugs. 8 gaps de especificação registrados como P-SPEC.
- **2026-04-16** — Backend agent: migration 00019 (5 P-SPECs resolvidos: lock otimista, approval resubmit, accepted_at filter, deleted_at filter, role enums). 5 Edge Functions implementadas (publish-worker, magic-link, llm-brand-voice, insights-sync, auto-adapt). Contratos e schema atualizados.
- **2026-04-16** — Frontend agent: implementacao codigo real das P0 dos 6 paineis. Rotas registradas em App.tsx (incluindo rota publica `/a/:token`), MagicLinkGate, InstagramPreview, MultiFormatCanvas, CarouselSlideBuilder, GridPreview, BriefBuilder, EditorialCalendar, ApprovalQueue, CommentPin, PublishQueue, AdminPanel (BrandsManager, TeamManager, ApproversManager, IntegrationSettings). 8 componentes transversais, 7 hooks TanStack Query, 4 stores Zustand. Tokens Tailwind v4 adicionados (pilares, status, IG sizes, font-mono). WorkspaceLayout view switcher atualizado para novos paineis.
- **2026-04-16** — Product agent: analise competitiva profunda em [[../07_knowledge/analise-competitiva]]. 18 concorrentes mapeados (BR + internacionais), 20 gaps identificados (4 criticos, 8 importantes, 8 nice-to-have). Gaps criticos: suporte multi-plataforma (so IG), relatorios exportaveis, onboarding/trial, PWA mobile. Top quick wins: workspace demo, seed de templates, manifest PWA, pricing page. 10 recomendacoes priorizadas para roadmap.
- **2026-04-21** — Frontend agent: 6 pages wired to real Supabase backend. TeamPage usa useTeam() + useRemoveMember() + useInviteMember() + workspace_members query para coluna Marcas. BrandsPage usa useBrands() + useCreateBrand() + useArchiveBrand() + brand_profile query por workspace + post count mensal. BillingPage lê agency.seat_limit/subscription_status do store, membros e marcas de hooks reais, posts/mes via count query. NotificationsPage agrega stage_transitions + comments em fila local de leitura (sem tabela notifications ainda). SettingsPage lê user do useAuthStore + agency_member e salva via supabase.auth.updateUser + update agency_members. ApproverPortalPage usa useApprovalQueue, useApprove, useRequestChanges, useComments/useAddComment com pin coords reais, lê session do useApproverStore. Zero erros de TS nos 6 arquivos alvo.
- **2026-04-19** — Coordinator: time de prospeccao montado com 3 novos sub-agents (copywriter, prospector, ads) em `.claude/agents/`. ICP definido em [[../01_product/icp]], 3 personas de compra em [[../01_product/personas/]] (dono-agencia, head-atendimento, social-media-manager), estrategia GTM beta em [[../01_product/gtm-beta]]. Artefatos: landing page copy [[../06_deploy/landing/landing-page-copy]], sequencia 5 emails onboarding [[../06_deploy/emails/onboarding-sequence]], pitch one-pager [[../06_deploy/pitch/one-pager]], 3 templates cold outreach [[../06_deploy/prospeccao/templates/cold-outreach]], fontes de pesquisa [[../06_deploy/prospeccao/fontes-pesquisa]], checklist qualificacao [[../06_deploy/prospeccao/qualificacao-checklist]], pesquisa palavras-chave [[../06_deploy/ads/palavras-chave]], estrategia ads [[../06_deploy/ads/estrategia]], copy de anuncios [[../06_deploy/ads/copy-anuncios]]. CLAUDE.md atualizado com novos agents.
- **2026-04-21** — Frontend agent: DesignPage criada em `src/pages/DesignPage.tsx`. Stats row (3x PCard), kanban 3 colunas (Para criar / Em aprovacao / Prontos) com design cards (thumbnail, title 2-line clamp, post-type badge, "Abrir canvas"). Canvas slide-over (60% width) com format selector (IG_FORMAT_TYPES), dropzone com drag-drop, safe zones overlay, export, "Enviar para aprovacao" via Supabase, upload progress. Grid IG 3x3 modal overlay. Brand query via brand_profiles. Rota `/app/design` protegida com RoleGuard (owner/designer). Sidebar: icone paintbrush, entrada "Painel do Designer" no grupo Criacao, PAGE_TITLES e NAV_VISIBILITY atualizados. Zero erros TS.
- **2026-04-21** — Frontend agent: role-based navigation + route protection implementados. CrieLayout.tsx filtro de sidebar via `useNavAccess()` (hook local que combina `useWorkspaceRole` + agency-level owner/admin check). `RoleGuard` criado em `src/components/auth/RoleGuard.tsx` — redireciona para `/app/dashboard` com toast "Acesso negado" se role nao autorizado. App.tsx: 9 rotas restritas wrapped com `RoleGuard`, 3 rotas abertas a todos os roles (dashboard, board, notifications, settings). DashboardPage.tsx: secao "Atalhos rapidos" adicionada apos o hero band com acoes contextuais por role + saudacao personalizada com nome e label do role.
