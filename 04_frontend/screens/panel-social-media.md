---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
role: social_media
breakpoint_primary: desktop
---

# Painel — Social Media / Publisher

Persona e JTBD: [[../../01_product/roles/social-media]]. Consome posts aprovados de [[panel-aprovador]]. Integra com Meta Graph API.

## Rota
`/app/:agencySlug/w/:workspaceSlug/publisher` (raiz = fila de publicação).
Sub-rotas:
- `.../publisher` → queue (fila cronológica)
- `.../publisher/calendar` → calendário mês/semana
- `.../publisher/grid` → grid planner IG (3-col visual)
- `.../publisher/settings` → Meta connection health + preferências

**Decisão:** **Desktop-primário no MVP (≥1024px)**. Mobile como read-only + botão "publicar agora" emergencial.

## Layout (ASCII wireframe)

### Desktop — queue + grid planner
```
┌──────────────────────────────────────────────────────────────────────────┐
│ WorkspaceLayout · View switcher [Queue*][Calendar][Grid][Settings]       │
├────────────────────────────────┬─────────────────────────────────────────┤
│ Fila de publicação (timeline)  │ Grid planner IG (3-col)                 │
│ ──────────────────────────────  │                                         │
│ Hoje 15/04                      │       ┌──┬──┬──┐                        │
│  18:30 🟢 Feed "Receita..."    │       │  │  │  │ últimos publicados      │
│  20:00 🟢 Reel "Como fazer.."  │       │  │  │  │                        │
│                                 │       ├──┼──┼──┤                        │
│ Amanhã 16/04                    │       │  │  │  │ próximos agendados      │
│  09:00 🟡 Story "Enquete"      │       │  │  │  │ (arrastar para reordenar)│
│  ...                            │       ├──┼──┼──┤                        │
│                                 │       │  │  │  │ em rascunho             │
│ 🔴 3 falhas requerem ação      │       │  │  │  │                        │
│                                 │       └──┴──┴──┘                        │
│ [+ Agendar novo]                │  Alertas: ⚠ 3 posts mesmo pilar seguidos │
│                                 │  Toggle "ver como cliente vê" (só       │
│                                 │  aprovado+publicado)                    │
├────────────────────────────────┴─────────────────────────────────────────┤
│ Sidebar direita (quando post selecionado): detalhes completos            │
│  · Preview IG (InstagramPreview)                                          │
│  · Legenda final (read-only, com truncate em 125)                         │
│  · 1º comentário (editável até 10 min antes)                             │
│  · Cross-post toggles: [Facebook] [Story reshare] [Notif Stories]        │
│  · Status Meta: ✓ API ok · próximo retry em 2min                         │
│  · [Publicar agora] · [Editar agendamento] · [Cancelar]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Calendário view
Reusa o `EditorialCalendar` compartilhado com [[panel-estrategista]] — props focadas em `scheduled_at` e status de publicação (não em edição de brief).

### Grid planner view
Full-width do [[../components/GridPlanner]] com drag-drop para reordenar (ajusta `scheduled_at` mantendo cadência), detecta monotonia cromática, toggle "view cliente".

### Settings
Meta connection health:
- Status: ✓ Connected (expira em 42 dias)
- Botão "Reconectar"
- Webhook de falhas (Slack/Discord URL)
- Cadência padrão (minutos mínimos entre posts)
- Janelas ótimas pré-calculadas

### Mobile (<768px)
Queue vertical + botão SOS "Publicar agora" para o post em falha mais recente. Sem edição.

## Componentes-chave

### Reutilizados
- `Card`, `Button`, `Badge`, `Tooltip`, `Select`, `Dialog`, `Sheet`, `Tabs`, `ScrollArea`, `Separator`
- `DndContext` (`@dnd-kit/core`)
- `EditorialCalendar` (compartilhado — extraído do atual `SocialMediaCalendar.tsx`)
- `AssetVersionsList` (leitura apenas)
- `CopyVersionsList` (leitura apenas — legenda aprovada)
- [[../components/InstagramPreview]] — preview no detail panel
- [[../components/GridPlanner]] — visualização 3-col

### A criar
- `src/features/publisher/components/PublishQueue.tsx` — lista cronológica com agrupamento por dia.
- `src/features/publisher/components/QueueItem.tsx` — card da fila (hora, status, thumb, ações).
- `src/features/publisher/components/PostDetailDrawer.tsx` — drawer direito com detalhes do post selecionado.
- `src/features/publisher/components/SchedulePostDialog.tsx` — dialog para agendar com best-time sugerido.
- `src/features/publisher/components/MetaConnectionStatus.tsx` — badge + link de reconexão.
- `src/features/publisher/components/CrossPostToggles.tsx` — FB, Story reshare, notif Stories.
- `src/features/publisher/components/ConflictBanner.tsx` — detecta conflitos ao salvar agendamento.
- `src/features/publisher/components/FailureRecovery.tsx` — painel de falhas + retry manual + "marcar publicado" (fallback).
- `src/features/publisher/components/BestTimeSuggester.tsx` — 3 janelas sugeridas.
- `src/features/publisher/components/FirstCommentField.tsx` — campo separado com preview.
- `src/features/publisher/hooks/useScheduledPosts.ts` — query fila.
- `src/features/publisher/hooks/useSchedulePost.ts` — mutation agendar (optimistic + conflito).
- `src/features/publisher/hooks/useMetaConnection.ts` — health check Meta.
- `src/features/publisher/hooks/useBestTimes.ts` — busca janelas otimizadas.
- `src/features/publisher/hooks/useRetryPublish.ts` — retry manual.
- Extrair `src/features/calendar/EditorialCalendar.tsx` **do atual `SocialMediaCalendar.tsx`** para compartilhar com estrategista (refator).

## Estado

### Server (TanStack Query)
| Query key | Fonte | Invalidada por |
|---|---|---|
| `["publish-queue", workspaceId]` | `publish_queue` (nova tabela) join `post_cards` | schedule/cancel/publish |
| `["publish-queue", workspaceId, "failed"]` | filter status=failed | retry |
| `["grid-preview", workspaceId]` | `post_cards` published + scheduled ordenados | novo scheduled/published |
| `["best-times", workspaceId]` | `audience_insights` (tabela cache) ou Meta Graph | cron diário |
| `["meta-connection", workspaceId]` | `meta_connections` (nova) | reconnect |

Realtime: `publish_queue` no canal workspace → invalidação automática quando status muda no servidor.

### Client (Zustand)
- `src/stores/usePublisherStore.ts` — view mode (`queue|calendar|grid`), filtro de status, data range.
- Sem draft local (agendamento é operação pontual, não escreve em background).

## Interações críticas
1. **Golden path — agendar post aprovado** — card chega em stage `aprovacao_arte`+`approved` → aparece em "Prontos para agendar" → arrasta pra slot do calendário → `SchedulePostDialog` abre com best-time sugerido → confirma → otimistic move → sucesso.
2. **Detecção de conflitos** — ao salvar, checa: (a) outro post mesma hora, (b) feriado não previsto, (c) overlap campanha, (d) arte/copy não aprovadas. `ConflictBanner` bloqueia até resolver ou override explícito.
3. **Falha de publicação** — cron/worker tenta publicar → Meta retorna erro → `publish_queue.status=failed` + `error_message` → realtime invalida → `FailureRecovery` mostra erro + [Retry] + [Publicar manualmente].
4. **Health check Meta** — polling 30min (client-side) do endpoint `/api/meta/status` → se token expira em <14 dias, badge vermelho + toast persistente.
5. **Fallback manual** — para Stories em região não suportada: botão "Marcar como publicado" move para `publicado` sem API, audit log registra quem fez manual.
6. **Grid planner reorder** — arrasta post no grid → reagenda mantendo cadência (ex: se espaço era 24h, move respeita); optimistic.
7. **Edge — primeiro comentário >2200 chars** — Zod refuta + destaca campo.

## Formulários (RHF + Zod)

### Schedule post
```ts
const scheduleSchema = z.object({
  post_card_id: z.string().uuid(),
  scheduled_at: z.coerce.date().refine((d) => d > new Date(Date.now() + 15 * 60_000), "Min 15 min à frente"),
  first_comment: z.string().max(2200).optional(),
  cross_post: z.object({
    facebook: z.boolean().default(false),
    story_reshare: z.boolean().default(false),
    stories_notification: z.boolean().default(false),
  }),
});
```

### Reagendamento / cancelamento
```ts
const rescheduleSchema = scheduleSchema.partial().extend({
  id: z.string().uuid(),
});
```

### Meta connection
Sem form — fluxo OAuth redireciona para Meta.

## Responsividade
- **Desktop (≥1280px)** — queue + grid lado a lado + drawer de detalhes.
- **Laptop (1024–1280px)** — grid colapsa em tab.
- **Tablet (768–1024px)** — queue empilhada, grid em `Sheet`.
- **Mobile (<768px)** — queue vertical read-only + botões SOS (publicar agora, retry).

## Acessibilidade
- Tab order: filtros → queue → detail panel → grid.
- `⌘/Ctrl+K` abre command palette com "Publicar X agora", "Reagendar X", "Cancelar X".
- Status não é só cor: `badge` sempre acompanha ícone + label.
- `aria-live="polite"` para mudanças de status em realtime.

## Performance
- Queue virtualizada (`@tanstack/react-virtual`) quando >50 itens.
- Thumb de grid com `loading="lazy"` + placeholder.
- Debounce 300ms em filtros.
- Polling Meta status 30 min (não a cada 10s).
- Skeleton em 3 blocos iniciais.

## Instagram-nativo
- Preview mostra IG do feed (grid 3-col crop 1:1) + hover "como fica no feed individual".
- `GridPlanner` aceita `overlayMode: "scheduled" | "published" | "both"`.
- Validação pré-publish: dimensão do asset bate com `post_type`? legenda ≤2200? hashtags ≤30? se algo errado, **bloqueia** com mensagem específica.
- Meta Graph limits: Content Publishing API para feed/reel/carousel; Stories via API de terceiros se necessário em fase 2.

## Dependências

### User stories
- US-041..US-055 (social media) — fila, best-time, 1º comentário, grid planner drag, detector de conflitos, cross-post, calendário unificado, fallback manual, health check.

### Endpoints / tabelas
- `publish_queue` (nova) — `id`, `post_card_id`, `scheduled_at`, `status (scheduled|publishing|published|failed)`, `error_message`, `retry_count`, `meta_media_id`, `first_comment`, `cross_post_flags`.
- `meta_connections` (nova) — `workspace_id`, `ig_business_account_id`, `access_token (encrypted)`, `expires_at`, `fb_page_id`.
- `audience_insights` (nova) — cache Meta Insights agregado.
- Edge function `publish-to-meta` (cron/worker) — lê queue, publica, atualiza status.
- Edge function `refresh-meta-token` (cron) — rota tokens long-lived.
- Endpoint `GET /api/meta/status?workspace_id=`.
- Webhook handler para notificar Slack/Discord em falha.

### Design system a estender
- shadcn: `command`, `progress`, `calendar`, `alert`, `alert-dialog`, `table`, `toggle`.
- Tokens: `--color-status-scheduled|publishing|published|failed` (ver [[README#Gaps no design system]]).

## Fora de escopo (MVP)
- Publicação Threads / YouTube Shorts / TikTok (fase 2).
- Stories publicação automática em regiões não suportadas (fallback manual).
- A/B testing de horário.

## Conflitos com código existente
- `SocialMediaCalendar` atual tem calendário drag-drop funcional mas **só troca `scheduled_at` direto na tabela `post_cards`** (sem `publish_queue`). Plano de migração:
  1. Criar `publish_queue` no backend.
  2. Extrair `EditorialCalendar` como componente genérico.
  3. Refatorar `SocialMediaCalendar` para virar `PublisherCalendarPage` que usa `publish_queue`.
  4. Remover lógica de mutation `scheduled_at` direto (vira `schedulePost()`).
- `WorkspaceLayout` view switcher precisa adicionar entrada `Publisher` distinta da `Calendário` atual (ou renomear).
