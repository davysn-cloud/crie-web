---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Screens — Índice (wireframes por role)

Wireframes ASCII + specs dos 6 painéis personalizados do crie-web. Cada spec detalha rota (react-router v7), layout, componentes reutilizados vs a criar, estado (TanStack Query / Zustand), formulários (RHF + Zod), responsividade, a11y, perf e dependências.

Ver [[../../01_product/roles/README]] para contexto de cada persona e [[../design-system]] para tokens/componentes.

## Convenções
- **Rotas:** todas aninhadas em `/app/:agencySlug/w/:workspaceSlug/` exceto o painel do Aprovador (magic link público `/a/:token`).
- **Estado server:** TanStack Query com chaves `["<resource>", workspaceId, ...filters]`.
- **Estado client:** Zustand por feature (`useCalendarStore`, `useCanvasStore` etc).
- **Forms:** `useForm({ resolver: zodResolver(schema) })` — nunca `useState` para campos.
- **Mobile-first obrigatório** apenas no Aprovador. Designer + Social Media + Estrategista podem ser **desktop-only no MVP** (anotado em cada spec como decisão).

## Painéis por role

| Role | Spec | Rota primária | Breakpoint primário | Status |
|---|---|---|---|---|
| Estrategista | [[panel-estrategista]] | `/app/:a/w/:w/strategist` | Desktop (≥1024px) | A criar (hoje existe `StrategistDashboard` simplificado) |
| Copywriter | [[panel-copywriter]] | `/app/:a/w/:w/copy` | Desktop (≥1024px) | A criar (hoje existe `CopywriterInbox` minimalista) |
| Designer | [[panel-designer]] | `/app/:a/w/:w/design` | Desktop (≥1280px) | A criar (novo — canvas/editor) |
| Social Media | [[panel-social-media]] | `/app/:a/w/:w/publisher` | Desktop (≥1024px) | A criar (hoje existe `SocialMediaCalendar` parcial) |
| Aprovador | [[panel-aprovador]] | `/a/:magicLinkToken` | **Mobile (<768px)** | A criar (novo — fora do shell autenticado) |
| Admin Agência | [[panel-admin]] | `/app/:a/admin` | Desktop (≥1024px) | A criar (hoje existe `AgencySettingsPage` / `AgencyMembersPage` separados) |

## Telas auxiliares já existentes (reutilizáveis)
| Tela | Rota atual | Componente | Reuso |
|---|---|---|---|
| Login / Signup / Forgot | `/login`, `/signup`, `/forgot-password` | `src/components/auth/*` | Mantidos |
| Kanban (fallback "todos") | `/app/:a/w/:w` | `KanbanBoardPage` | Mantido — é a visão "todas as etapas" |
| Post card detail | `/app/:a/w/:w/card/:id` | `PostCardDetailPage` | Vira deep-link acessado pelos 6 painéis (permanece; pode ganhar tabs específicas por role) |
| Marca (brand kit) | `/app/:a/w/:w/brand` | `BrandProfilePage` | Linkado do admin e do designer |
| Workspace members | `/app/:a/w/:w/members` | `WorkspaceMembersPage` | Linkado do admin |
| Agency members | `/app/:a/members` | `AgencyMembersPage` | Linkado do admin |
| Agency settings | `/app/:a/settings` | `AgencySettingsPage` | Linkado do admin (vira uma seção do novo painel) |

## Componentes transversais (specs próprias em `04_frontend/components/`)
Componentes que aparecem em 2+ painéis e merecem contrato próprio:
1. [[../components/InstagramPreview]] — preview pixel-accurate do IG (feed 1:1 / 4:5 / 1.91:1, Story/Reel 9:16, carrossel 2..10 slides).
2. [[../components/MultiFormatCanvas]] — canvas do designer com presets IG + overlay de safe zones.
3. [[../components/GridPlanner]] — grid 3-col do perfil IG com drag-drop (dnd-kit) e detecção de conflito cromático/pilar.
4. [[../components/BriefBuilder]] — modal/drawer com form estruturado (objetivo, pilar, formato, audiência, CTA, refs, assignees).
5. [[../components/CommentPin]] — pin numerado em coordenada (x% / y% / slide_index / reel_ts) com thread — extensão do `ImagePinOverlay` atual.
6. [[../components/MagicLinkGate]] — valida token do aprovador, cria sessão efêmera, gate para painel mobile.
7. [[../components/BrandKitLockedPicker]] — color/font picker travado no `BrandProfile` da marca.
8. [[../components/CarouselSlideBuilder]] — 10 slides reordenáveis (dnd-kit) + opção de background contínuo 10800×1080.

## Integração com telas existentes
- Todos os 6 painéis são **novas rotas irmãs** dentro de `WorkspaceLayout` (exceto Aprovador). A `view switcher` do `WorkspaceLayout` será estendida para comportá-los (ver seção "Ajustes no shell" abaixo).
- O `KanbanBoardPage` atual continua sendo o "modo geral" — vira rota default quando o usuário não tem role ou tem vários roles.
- `PostCardDetailPage` passa a ser o **ponto comum** acessado a partir de todos os painéis (link a partir do calendário, inbox, kanban, magic link).

## Ajustes no shell de navegação
`src/components/layout/WorkspaceLayout.tsx` já tem view switcher por role. Para suportar os 6 painéis:
- Renomear / adicionar entradas: `strategist`, `copy`, `design`, `publisher`, (admin é no AgencyLayout).
- Preservar link `Kanban` como fallback.
- Aprovador é **fora** desse shell (rota raiz `/a/:token`).

## Gaps no design system

Para entregar os 6 painéis, o design system atual (`src/components/ui/` + `src/index.css`) precisa:

### Tokens a adicionar (`src/index.css` `@theme`)
- `--color-ig-gradient-story`: OKLCH aproximando o gradiente oficial IG (purple→pink→orange) para borda de story/reel no preview.
- `--color-pillar-1..5`: 5 cores consistentes para pilares de conteúdo (usadas em calendário, grid planner e filtros). OKLCH derivando do chart-palette mas com saturação fixa.
- `--color-status-scheduled`, `--color-status-publishing`, `--color-status-failed`, `--color-status-published`: cores de status da fila de publicação (atuais `cyan-600`/`green-600` hardcoded em `SocialMediaCalendar` sobem pra tokens).
- `--size-ig-feed-1x1: 1080px`, `--size-ig-feed-4x5: 1350px`, `--size-ig-story-16x9: 1920px` — tamanhos canônicos IG (exportados como custom properties para usar no canvas/preview).
- `--font-mono` — para contador de caracteres da legenda (UX: monospace evita tremor).

### Componentes shadcn a adicionar
- `command` (cmdk) — brand voice tag picker, hashtag picker, swipe file search, command palette global.
- `calendar` (react-day-picker) — date picker para agendamento (hoje o `SocialMediaCalendar` é custom; reaproveitar para brief deadline e scheduler).
- `slider` — controle de zoom do canvas, slider antes/depois de versões.
- `switch` — toggles (safe zone on/off, "ver como cliente vê").
- `progress` — upload de asset, onboarding checklist do admin, pipeline progress.
- `toggle-group` — troca de formato no designer (feed/story/reel/carrossel).
- `resizable` — split panes do designer (canvas + sidebar).
- `drawer` (vaul) — drawer mobile para aprovador (comentários, histórico).
- `accordion` — seções do brief builder, seções do brand kit.
- `checkbox`, `radio-group` — para formulários complexos (brief, permissões).
- `table` — audit log, lista de marcas no admin, performance table.
- `alert` + `alert-dialog` — confirmações destrutivas (arquivar marca, revogar magic link).

### Componentes de domínio novos (resumo)
Detalhados em `04_frontend/components/`:
- `InstagramPreview`, `MultiFormatCanvas`, `GridPlanner`, `BriefBuilder`, `CommentPin`, `MagicLinkGate`, `BrandKitLockedPicker`, `CarouselSlideBuilder`.

### Padrões a adicionar
- `src/features/roles/`: um hook `useRoleCapabilities()` derivado de `useWorkspaceRole()` para gatear renderização de ações por role (já há `useWorkspaceRole`, falta a matriz de capabilities da [[../../01_product/roles/admin#F3]]).
- Skeleton screens padronizados por painel (shadcn `skeleton` já está, falta convenção).
- `src/lib/instagram.ts`: constantes (`IG_LIMITS`, `IG_PRESETS`, helpers `truncateCaption(125)`, `countEmojis`, `isUnicodeInvisibleBreak`).
- `src/lib/zod/`: schemas compartilhados (brief, copy, asset, brand voice, brand kit, campaign).

## Links
- [[../design-system]]
- [[../../01_product/roles/README]]
- [[../flows/aprovacao]] (será estendido após specs dos painéis)
- [[../../08_shared/briefing]]
