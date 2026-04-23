---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: active
confidence: medium
---

# Plano de Testes — crie-web MVP

## Objetivo
Garantir que os **3 fluxos críticos** do beta fechado (brief→publicação, aprovação com ajuste, multi-tenant isolation) sejam confiáveis, seguros e observáveis antes de liberar para as 3-5 agências piloto. Este plano é **vivo** — cada novo painel role-based (US-012 a US-070) amplia o escopo.

## Pirâmide de testes (alvos realistas MVP)

| Camada | Ferramenta | Cobertura alvo | O que entra |
|---|---|---|---|
| **Unit** | Vitest (nativo Vite) | 70% nas pastas `src/lib`, `src/schemas`, `src/hooks` | Schemas Zod, utils de formatação (dimensões IG, charCount legenda), hooks puros, reducers Zustand |
| **Component / Integration** | React Testing Library + Vitest | 50% dos componentes P0 | `InstagramPreview`, `MultiFormatCanvas`, `CarouselSlideBuilder`, `BriefBuilder`, `MagicLinkGate`, `CommentPin`, `BrandKitLockedPicker`, `GridPlanner` |
| **E2E** | **Playwright** | 3 fluxos críticos verdes + smoke por role (6 painéis) | Ver `cases/e2e/` |
| **DB / RLS** | `supabase db test` + seed script em Node | 100% das tabelas novas (00008-00018) | Policy SELECT/INSERT/UPDATE negative test por tabela |
| **Contract** | MSW + Zod parse do response | 100% das Edge Functions | `publish`, `magic-link`, `insights-sync`, `auto-adapt`, `llm-brand-voice` |

### Por que Playwright (e não Cypress)
1. **Multi-context nativo** — essencial para testar multi-tenant (abrir 2 browser contexts, um logado como Agência A, outro como Agência B, sem colisão de cookies/localStorage).
2. **Mobile emulation** de verdade — o painel do aprovador é mobile-first (US-051), Playwright tem `devices['iPhone 13']` built-in com viewport + userAgent + touch.
3. **Trace viewer** — debug visual com step-by-step, útil para testes flaky do canvas multiformato (US-031) e pin de coordenadas (US-053).
4. **Rodagem em paralelo por worker** — testes isolados por agência seed, escalável.
5. **API interception** — mock do Meta Graph API e Resend sem infra extra.

## Ambientes

| Env | URL / Supabase | Usado para |
|---|---|---|
| **local** | `localhost:5173` + Supabase local (`supabase start`) | Dev + Playwright headed + debugging |
| **staging** | Preview Vercel por PR + **Supabase branch DB** (feature do Supabase) | PR checks, smoke E2E, QA manual |
| **produção** | `crie.app` (a confirmar com deploy agent) + Supabase project prod | Apenas smoke pós-deploy (read-only + 1 healthcheck) |

**Seed:** cada ambiente de teste tem um script `scripts/seed-e2e.ts` que cria Agência A, Agência B, 2 workspaces cada, membros por role, 1 brand_kit, 1 post_card em cada stage, 1 magic_link ativo.

## O que NÃO vamos testar automaticamente
1. **Publicação real no Meta Graph API em CI** — sempre mockado via Playwright route intercept. Publicação real só em smoke manual pré-release com conta sandbox IG Business dedicada.
2. **Envio real de e-mail pelo Resend** — interceptado e verificado por assert do payload. Live email test só manual pré-release.
3. **LLM real em CI** — `llm-brand-voice` e hashtag suggester mockados com resposta fixa (determinístico). Testes de qualidade de prompt vivem em fixtures manuais.
4. **Stripe cobrança real** — webhook mockado com payloads de teste oficiais da Stripe.
5. **Image rendering pixel-perfect** — auto-adapt (US-032) tem golden-snapshot tolerante (>98% match) e validação de dimensões/metadata, não pixel exato.
6. **Performance de carga** — pg_cron publish worker com 1000 jobs simultâneos fica para fase pós-beta.

## Governance
- Todo PR que mexe em RLS/Edge Function exige teste negativo novo (cross-tenant).
- Todo PR que toca `InstagramPreview` exige snapshot atualizado.
- Bugs encontrados em E2E viram linha em [[bugs]] com severidade.
- Gaps de especificação (spec não responde "o que acontece se...") viram bugs P-SPEC.

## Links
- [[security-checklist]] — checklist de segurança vivo
- [[pre-deploy]] — release checklist
- [[cases/e2e/flow-1-brief-to-publish]]
- [[cases/e2e/flow-2-approval-with-adjustment]]
- [[cases/e2e/flow-3-multi-tenant-isolation]]
- [[bugs]]
- [[../03_backend/schema]]
- [[../01_product/user-stories/index]]
