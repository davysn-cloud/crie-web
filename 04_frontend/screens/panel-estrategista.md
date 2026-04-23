---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
role: strategist
breakpoint_primary: desktop
---

# Painel — Estrategista

Persona e JTBD: [[../../01_product/roles/estrategista]]. Ver também [[panel-copywriter]] e [[panel-designer]] para handoff do brief.

## Rota
`/app/:agencySlug/w/:workspaceSlug/strategist` (react-router v7, aninhada em `WorkspaceLayout`).
Sub-rotas:
- `.../strategist` → calendário editorial (default)
- `.../strategist/pillars` → gestor de pilares
- `.../strategist/campaigns` → campanhas
- `.../strategist/campaigns/:campaignId` → detalhe/timeline da campanha
- `.../strategist/swipe` → swipe file / trends
- `.../strategist/hashtags` → hashtag sets
- `.../strategist/performance` → performance panel
- Drawer sobre qualquer rota: `?brief=<postCardId|new>` (abre [[../components/BriefBuilder]])

**Decisão:** **Desktop-only no MVP** (≥1024px). Estrategista trabalha em mesa com múltiplas abas — mobile vira read-only em fase 2.

## Layout (ASCII wireframe)

### Desktop (≥1280px)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ AgencySidebar (64px fixed) │ Workspace header (Marca · Membros)           │
│                            ├───────────────────────────────────────────── │
│                            │ View switcher: [Calendário*][Pilares][Camp.] │
│                            │                [Swipe][#Sets][Performance]   │
│                            ├───────┬────────────────────────────┬────────┤
│                            │ Filt. │ Calendário mês (grid 7xN)  │ Insig. │
│                            │ side  │ ┌──┬──┬──┬──┬──┬──┬──┐    │ panel  │
│                            │       │ │  │  │  │  │  │  │  │    │        │
│                            │ Marca │ ├──┼──┼──┼──┼──┼──┼──┤    │ Top-3  │
│                            │ Pilar │ │🖼️│🎞️│📸│  │🖼️│  │  │    │ posts  │
│                            │ Format│ ├──┼──┼──┼──┼──┼──┼──┤    │ mês    │
│                            │ Status│ │  │  │  │🎞️│  │  │  │    │        │
│                            │ Camp. │ └──┴──┴──┴──┴──┴──┴──┘    │ Pilar  │
│                            │       │                            │ líder  │
│                            │ [Toggle: "Ver grid IG"]            │        │
│                            │       │ (switch para GridPlanner)  │ Gap    │
│                            │       │                            │ alerts │
│                            │       │                            │        │
│                            │ [+Brief] fab (fixo canto inferior) │        │
└────────────────────────────┴───────┴────────────────────────────┴────────┘
```
Clicar em slot vazio → abre drawer do BriefBuilder com a data pré-preenchida.
Clicar em card → abre [[../components/InstagramPreview]] inline ou navega pra `/card/:id`.

### Toggle "Ver grid IG" ativo
Substitui o grid-mês por [[../components/GridPlanner]] — visão 3 colunas cronológica (mais recente topo-esquerda) dos próximos 9/12 posts.

### Mobile (<768px) — read-only no MVP
Simplifica para lista vertical do mês atual + botão "abrir no desktop" (aviso) + leitura de performance.

## Componentes-chave

### Reutilizados
- `Card`, `CardHeader`, `CardContent`, `CardTitle` — `src/components/ui/card.tsx`
- `Button`, `Badge`, `Input`, `Select`, `Tabs`, `Tooltip`, `Sheet`, `Dialog` — `src/components/ui/*`
- `KanbanCard` — `src/features/kanban/KanbanCard.tsx` (quando mostrado em lista lateral)
- `ImagePinOverlay` (via `PostCardDetailPage`)
- `DndContext` do `@dnd-kit/core` para drag-drop do calendário
- `date-fns` + `date-fns/locale/ptBR` (já usado em `SocialMediaCalendar`)

### A criar
- `src/features/strategist/components/EditorialCalendar.tsx` — grid mês/semana com drag-drop de posts, thumb + ícone de formato IG + cor do pilar por card.
- `src/features/strategist/components/CalendarSlot.tsx` — célula do calendário (droppable, click = brief, hover = preview).
- `src/features/strategist/components/CalendarFiltersSidebar.tsx` — filtros (marca já vem do workspace; pilar, status, formato, campanha).
- `src/features/strategist/components/InsightsPanel.tsx` — sidebar direita (top 3 posts, pilar líder, alerts).
- `src/features/strategist/components/PillarsManager.tsx` — CRUD de pilares + distribuição real vs alvo (barras).
- `src/features/strategist/components/PillarDistributionChart.tsx` — chart simples (sem dep extra — CSS bars) de distribuição vs alvo.
- `src/features/strategist/components/CampaignsList.tsx` + `CampaignTimeline.tsx` — lista e timeline (barra horizontal com marcos).
- `src/features/strategist/components/SwipeFileGallery.tsx` — grid de referências (masonry simples).
- `src/features/strategist/components/HashtagSetEditor.tsx` — editor de set com contador e métrica.
- `src/features/strategist/components/PerformancePanel.tsx` — KPIs + tabela top 10 + insight gerado.
- [[../components/BriefBuilder]] (transversal) — drawer/modal com form Zod.
- [[../components/GridPlanner]] (transversal) — toggle "ver grid IG".
- [[../components/InstagramPreview]] (transversal) — hover em card do calendário.
- `src/features/strategist/hooks/useCalendar.ts` — query `calendar-posts` + filtros.
- `src/features/strategist/hooks/usePillars.ts` — CRUD pilares.
- `src/features/strategist/hooks/useCampaigns.ts` — CRUD campanhas.
- `src/features/strategist/hooks/useInsights.ts` — performance agregada (inicialmente do banco, depois Meta Graph).

## Estado

### Server (TanStack Query)
| Query key | Fonte | Invalidada por |
|---|---|---|
| `["calendar", workspaceId, { month, filters }]` | `post_cards` join `copy_versions`+`asset_versions`+`pillars` range `scheduled_at` | create/edit post_card, drag-drop reschedule |
| `["pillars", workspaceId]` | `pillars` | CRUD pilar |
| `["pillar-distribution", workspaceId, month]` | agregação `post_cards.pillar_id` | criação/edição de post_card |
| `["campaigns", workspaceId]` | `campaigns` | CRUD campanha |
| `["campaign", campaignId]` | join com `post_cards` | edição do campaign ou dos seus posts |
| `["swipe-file", workspaceId, tag?]` | `swipe_references` | upload/delete |
| `["hashtag-sets", workspaceId]` | `hashtag_sets` | CRUD set |
| `["performance", workspaceId, period]` | `post_insights` (Meta) + fallback manual | sync Meta, edição manual |

Invalidação no handoff: quando `BriefBuilder` cria post, invalidar `["calendar", workspaceId]` e `["post-cards", workspaceId]` (já usada pelo kanban).

### Client (Zustand)
- `src/stores/useCalendarStore.ts` — view mode (`month`|`week`|`grid`), filtros ativos, posição de scroll.
- `src/stores/useBriefDraftStore.ts` — **rascunho persistido em localStorage** para não perder brief se fechar a aba (Zustand + persist middleware).
- `useAuthStore` (já existe) — workspace/agency corrente.

## Interações críticas (golden path + edge)
1. **Criar brief a partir de slot vazio** — clicar em dia/hora vazia → drawer abre com `scheduled_at` pré-preenchido → preenche brief → salva → otimisticamente insere card "cinza" no slot → sucesso: card vira "colorido" com pilar.
2. **Reagendar via drag-drop** — arrasta card de um dia pra outro → optimistic update no grid → falha (RLS/permissão) → rollback + `sonner.error("Sem permissão para reagendar")`.
3. **Duplicar + adaptar** — abrir card → menu `...` → "Duplicar" → `BriefBuilder` abre pré-preenchido (pilar/formato/audiência) com `title` editado e `scheduled_at` vazio.
4. **Validação de conflito** — ao salvar brief com mesmo `scheduled_at` de outro post na mesma marca → banner warning "Conflito de horário" + botão "mover para slot sugerido".
5. **Toggle grid IG** — switch alterna entre calendário e `GridPlanner`; filtros aplicados persistem.
6. **Falha de Meta Graph (performance)** — painel mostra skeleton 3s, timeout 10s → cai para fallback manual (input humano) com toast `sonner.warning("Meta indisponível — use input manual")`.

## Formulários (RHF + Zod)

### Brief (detalhado em [[../components/BriefBuilder]])
```ts
const briefSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(3).max(120),
  objective: z.enum(["awareness", "consideration", "conversion"]),
  pillar_id: z.string().uuid(),
  post_type: z.enum(["feed_1x1", "feed_4x5", "feed_1.91x1", "story", "reel", "carousel"]),
  target_audience: z.string().min(10).max(500),
  key_message: z.string().min(10).max(500),
  cta: z.string().min(2).max(80),
  references: z.array(z.object({ kind: z.enum(["url","upload"]), value: z.string() })).max(10),
  deadline: z.coerce.date(),
  scheduled_at: z.coerce.date().optional(),
  campaign_id: z.string().uuid().nullable(),
  copywriter_id: z.string().uuid().nullable(),
  designer_id: z.string().uuid().nullable(),
  hashtag_set_id: z.string().uuid().nullable(),
});
```

### Pilar
```ts
const pillarSchema = z.object({
  name: z.string().min(2).max(40),
  color_token: z.enum(["pillar-1","pillar-2","pillar-3","pillar-4","pillar-5"]),
  target_percent: z.number().min(0).max(100),
  description: z.string().max(200).optional(),
});
```
Regra cross-field: soma dos `target_percent` dos pilares ativos deve fechar em 100% (validação em `useForm` + `watch` ou em submit).

### Campanha
```ts
const campaignSchema = z.object({
  name: z.string().min(3).max(80),
  starts_at: z.coerce.date(),
  ends_at: z.coerce.date(),
  goal: z.string().max(500),
  inherits_pillar_id: z.string().uuid().nullable(),
}).refine((d) => d.ends_at > d.starts_at, { message: "Fim > início" });
```

### Hashtag set
```ts
const hashtagSetSchema = z.object({
  name: z.string().min(2).max(40),
  pillar_id: z.string().uuid().nullable(),
  hashtags: z.array(z.string().regex(/^#[\w\d_]+$/)).min(5).max(30),
});
```

## Responsividade
- **Desktop (≥1280px)** — layout 3 colunas completo (filtros + calendário + insights).
- **Laptop (1024–1280px)** — `InsightsPanel` colapsa em drawer (botão no topo direito).
- **Tablet (768–1024px)** — sidebar de filtros colapsa em `Sheet` lateral; calendário ocupa tudo.
- **Mobile (<768px)** — lista vertical read-only + aviso "abra no desktop para editar" (MVP). Performance panel é acessível em card simplificado.

## Acessibilidade
- Navegação por teclado no calendário: arrow keys para navegar entre dias, `Enter` para abrir brief, `Esc` fecha drawer.
- Hotkeys globais (via `command` do shadcn / cmdk): `⌘/Ctrl+K` abre command palette, `⌘/Ctrl+N` cria brief, `⌘/Ctrl+G` toggle grid.
- Cada célula de dia tem `aria-label="{data} — {N} posts"`.
- Cor do pilar **não é o único sinal** — ícone de formato + label no tooltip.
- Contraste AAA nos textos pequenos dos cards de insight.

## Performance
- Query `["calendar"]` com `staleTime: 60s` + realtime Supabase no canal `workspace:*` (já usado em `WorkspaceLayout`).
- Virtualização não necessária (30 slots/mês × 5 cards max = 150 DOM elements).
- Thumbnails do `asset_versions.thumbnail_url` com `loading="lazy"` + placeholder (CSS blur-up).
- Debounce de 250ms nos filtros.
- Skeleton via shadcn `Skeleton` em 3 slots: calendário, pilares, insights.

## Instagram-nativo
- Ícone por formato: `:::1:1 :::4:5 :::story :::reel :::carousel` (usar `lucide-react`).
- Hover em card → preview pequeno usando [[../components/InstagramPreview]] com `size="sm"` (150px).
- Toggle "grid IG" renderiza [[../components/GridPlanner]] (3-col mockup feed).
- Swipe file aceita URL do IG (regex `instagram.com/p/<id>` e `instagram.com/reel/<id>`) — futuro: scraping do oEmbed.

## Dependências

### User stories (a definir pelo product agent)
- US-012..US-020 (estrategista) — calendário, pilares, campanhas, brief, swipe, hashtags, performance, duplicar+adaptar.

### Endpoints / tabelas backend esperados
- `post_cards` (já existe) + colunas novas: `pillar_id`, `campaign_id`, `brief_id`, `objective`, `post_type` já existe mas virar enum com os 6 formatos IG.
- `briefs` (nova) — campos do schema acima (normalizar `key_message`, `cta`, `audience`, `references[]`, `deadline`).
- `campaigns` (nova) — `name`, `starts_at`, `ends_at`, `goal`, `pillar_id`.
- `pillars` (nova) — `name`, `color_token`, `target_percent`, `description`.
- `hashtag_sets` (nova) — `name`, `pillar_id`, `hashtags[]`.
- `swipe_references` (nova) — `kind (url|upload)`, `value`, `tags[]`.
- `post_insights` (nova) — `post_card_id`, `reach`, `impressions`, `saves`, `shares`, `video_views`, `fetched_at` (Meta Graph) + flag `is_manual`.
- Endpoint `GET /api/meta/insights?workspace_id=&period=` (backend agent — agregador).

### Design system a estender
- Tokens `--color-pillar-1..5` (ver [[README#Gaps no design system]]).
- shadcn: `command`, `calendar`, `progress`, `toggle-group`, `resizable`, `accordion`, `checkbox`, `table`, `alert`.

## Fora de escopo (MVP)
- Edição de brief via mobile (read-only).
- Sincronização com Google Calendar (fase 2).
- Insight automático com LLM ("carrosséis educativos tiveram 2.3× engajamento").
- Export de calendário em PDF.

## Conflitos com código existente
- `StrategistDashboard` atual é apenas um dashboard de gargalos/estatísticas do kanban. **Mantemos como sub-view** em `.../strategist/dashboard` (migrada) — o novo default vira o calendário editorial.
- `SocialMediaCalendar` tem um calendário mensal com drag-drop já funcional. **Não duplicar** — extrair `EditorialCalendar` como componente compartilhado em `src/features/calendar/` e consumi-lo em ambos os painéis com props distintas (Strategist mostra filtros + pilares; Publisher mostra fila + best-time).
