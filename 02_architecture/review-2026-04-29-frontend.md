---
created: 2026-04-29
updated: 2026-04-29
owner: frontend
status: active
confidence: high
---

# Review Frontend — Escala e Latência (2026-04-29)

Auditoria sob ótica de centenas de usuários ativos, com foco no caminho crítico do **aprovador mobile-first** via magic link público (`/a/:token`). Amostragem em `src/App.tsx`, `package.json`, `vite.config.ts`, `src/components/`, `src/features/`, `src/hooks/`, `src/stores/`.

## 1. React 19 + Vite SPA + Vercel — **AJUSTAR (curto prazo) / TROCAR (médio prazo)**
CSR puro funciona até ~50 agências. Para o aprovador mobile, TTFB em SPA Vercel é dominado pelo bundle inicial (estimo 600-900 KB gz com 41 páginas importadas em `App.tsx` sem lazy). Em 4G real isso é 3-6s para FCP, **inaceitável** para magic link que precisa abrir em segundos.

Veredito imediato: **manter Vite** mas adotar (a) code splitting agressivo (item 2), (b) build separado/edge-rendered apenas para `/a/:token`, (c) `prerender` estático do shell público.

Gatilho para migrar para **TanStack Start ou Next.js (App Router)**: quando NPS do aprovador citar lentidão OU LCP p75 mobile > 2.5s OU contagem de agências > 30. RSC encaixa naturalmente no portal do aprovador (server-fetch do post + RLS via service-role + hidratação mínima). Não migrar agora — re-arquitetar custa 2-3 semanas que não temos no beta.

## 2. Bundle size — **AJUSTAR (urgente)**
`App.tsx` faz **import estático de 41 páginas**. Sem `React.lazy` em parte alguma do app (grep confirmou zero ocorrências). `vite.config.ts` é mínimo — sem `build.rollupOptions.manualChunks`, sem `visualizer`. Deps pesadas: `@dnd-kit/*`, 12 pacotes Radix, `date-fns` (sem tree-shake explícito), `lucide-react`, `sonner`, `@tanstack/react-query`, `@supabase/supabase-js`+`@supabase/ssr`.

Ações:
- `React.lazy` + `Suspense` em **todas** as 41 rotas. Ganho estimado: -60% no chunk inicial.
- `manualChunks`: separar `supabase`, `radix`, `dnd-kit`, `tanstack` em chunks dedicados (cache de longo prazo).
- Remover `@supabase/ssr` se a SPA não usa SSR (revisar). 
- Substituir `date-fns` por `date-fns/esm` específicos ou avaliar Temporal polyfill leve.
- Adicionar `rollup-plugin-visualizer` ao vite e fixar budget no CI (chunk inicial < 200 KB gz).

## 3. Zustand + TanStack Query — **OK com nota**
6 stores Zustand (`useAuthStore`, `useApproverStore`, `useCanvasStore`, `useCalendarStore`, `usePublisherStore`, `useAppStore`). Separação correta: Zustand = sessão/UI local; Query = servidor. Risco: `useCalendarStore`/`usePublisherStore` podem espelhar dados do servidor — confirmar que não duplicam fonte (regra: dado do banco fica só em Query cache; Zustand só guarda IDs/seleções/drafts). `staleTime: 60s` é razoável; para Realtime, configurar `setQueryData` no callback do channel em vez de `invalidateQueries` (evita refetch redundante).

## 4. Realtime Supabase — **AJUSTAR**
Apenas 2 subscriptions encontradas (`WorkspaceLayout`, `usePublishQueue`). **Insuficiente** para a meta de colaboração — falta channel para `post_cards`, `comments`, `stage_transitions` no kanban e no aprovador. Risco real é o oposto: ao implementar, abrir 1 channel por componente montado. Padrão obrigatório:
- 1 channel por workspace, multiplexando tabelas via filtros.
- Singleton por workspace_id em hook compartilhado (`useWorkspaceRealtime`).
- `removeChannel` em cleanup (já feito nos 2 existentes — manter padrão).
- Para `/a/:token` (público), **não** abrir realtime — usar polling leve (15s) ou Edge Function pull. Realtime via anon key + RLS por token é frágil.

## 5. Imagens IG — **AJUSTAR (alto impacto)**
Único `loading="lazy"` é em `GridPreview.tsx`. Zero `srcset`/`<picture>`/AVIF. Carrossel até 10 slides + grid 3x3 + canvas multiformato = **muitas imagens grandes**.

- Gerar variantes (thumb 320, preview 800, full 1440) via Edge Function `imagescript` (já existe — ADR 010) e servir AVIF/WebP com fallback JPEG.
- `<img loading="lazy" decoding="async" srcset>` em `InstagramPreview`, `GridPreview`, `CarouselSlideBuilder`, `MultiFormatCanvas` (só fora do viewport editável).
- Cache-Control imutável no Storage + CDN da Vercel à frente (rewrites).
- Para o aprovador mobile, servir versão **800px** por padrão e upgrade sob demanda.

## 6. dnd-kit no Kanban + Calendar — **AJUSTAR**
Sem virtualização. 100+ cards x 4-5 colunas = 500 nós DOM com sensores dnd-kit ativos = jank no mobile. `EditorialCalendar` com mês cheio (~30 dias x N posts) idem.
- Adotar `@tanstack/react-virtual` nas colunas do kanban e na lista do calendar.
- Memoizar `PostCard` agressivamente (`memo` + props estáveis).
- Considerar `closestCorners` + `pointerWithin` combinados para reduzir cálculos.

## 7. Aprovador mobile `/a/:token` — **AJUSTAR (P0)**
É o caminho crítico de receita (cliente da agência aprova → publica → renovação). Hoje carrega o bundle inteiro do app autenticado via mesmo `App.tsx`.
- **Split de bundle por rota** isolando `/a/:token` (entry separado em Vite ou rota com `lazy` + chunk dedicado sem importar `CrieLayout`/sidebar/etc).
- **PWA manifest + service worker** (Workbox) com precache do shell aprovador e offline read-only — gap crítico já citado em 07_knowledge/analise-competitiva.
- **Edge cache** dos assets estáticos (Vercel já faz) + `Cache-Control: public, max-age=31536000, immutable`.
- Considerar pre-render estático do HTML do `/a/:token` (Vite SSG plugin) com hidratação dos dados via fetch ao Edge Function `magic-link`.

## 8. Telemetria — **AJUSTAR (crítico, está cego)**
Zero Sentry, zero web-vitals, zero RUM. Sem isso, qualquer otimização é fé.
- `web-vitals` lib + envio para Supabase tabela `telemetry_vitals` (ou Vercel Analytics).
- Sentry browser SDK + tracing para rotas críticas (`/a/:token`, `/app/board`, `/app/design`).
- Dashboard de p75 LCP/INP/CLS por rota, segmentado mobile/desktop.

---

## TOP 5 ações priorizadas (latência)

1. **Code-splitting + lazy routes em `App.tsx`** (1d). Ganho imediato no FCP de todas as rotas, especialmente `/a/:token`. Adicionar `manualChunks` + visualizer + budget CI.
2. **Bundle isolado + PWA para `/a/:token`** (3d). Entry/route separada sem dependências do app autenticado, manifest, SW precache, srcset/AVIF nas imagens do post. Caminho crítico de receita.
3. **Telemetria web-vitals + Sentry** (1d). Pré-requisito para validar todo o resto. Sem isso, voamos cego.
4. **Pipeline de imagens responsivas** (3d). Variantes 320/800/1440 AVIF/WebP via Edge Function existente, `srcset` em todos os previews, `loading="lazy"` global.
5. **Virtualização Kanban + Calendar + singleton Realtime por workspace** (2d). `@tanstack/react-virtual` + `useWorkspaceRealtime` multiplexado para evitar N channels por usuário.
