---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
role: designer
breakpoint_primary: desktop
---

# Painel — Designer

Persona e JTBD: [[../../01_product/roles/designer]]. Consome brief de [[panel-estrategista]] + script de [[panel-copywriter]]. Entrega para [[panel-aprovador]] e [[panel-social-media]].

## Rota
`/app/:agencySlug/w/:workspaceSlug/design` (raiz = inbox do designer).
Sub-rotas:
- `.../design` → inbox de cards
- `.../design/canvas/:postCardId` → editor canvas (full-width)
- `.../design/canvas/:postCardId?format=feed_1x1|feed_4x5|feed_1.91x1|story|reel|carousel` (preset ativo)
- `.../design/templates` → biblioteca de templates
- `.../design/assets` → biblioteca de assets (upload + busca)
- `.../design/brand-kit` (atalho para `/brand`)

**Decisão:** **Desktop-only no MVP (≥1280px)**. Canvas editor exige área grande; mobile é inviável.

## Layout (ASCII wireframe)

### Desktop — editor canvas
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Back · Card title · Stage · [Export ▾] [Salvar v] [Pedir aprovação]      │
├──────────────────────────────────────────────────────────────────────────┤
│ Left sidebar    │ Canvas area (flexible)           │ Right sidebar        │
│ (240px)         │                                  │ (280px)              │
│ ┌─Camadas─┐    │    ┌──────────────────────┐     │ ┌─Brand kit─┐         │
│ │ Bg      │    │    │                      │     │ │ Cores [🔒]│         │
│ │ Imagem  │    │    │    Canvas 1080×1080  │     │ │ ▇ ▇ ▇ ▇ ▇ │         │
│ │ Título  │    │    │    (preset feed 1:1) │     │ │ Fontes[🔒]│         │
│ │ CTA     │    │    │                      │     │ │ Logos [🔒]│         │
│ └─────────┘    │    │   (overlays:         │     │ └───────────┘         │
│ ┌─Assets──┐    │    │   · safe zones      │     │ ┌─Propriedades─┐      │
│ │ 🖼️ 🖼️ 🖼️│    │    │   · profile pic    │     │ │ X: 120 Y: 80 │      │
│ │ 🖼️ 🖼️ 🖼️│    │    │   · captions Reel) │     │ │ W: 800 H:400 │      │
│ └─────────┘    │    │                      │     │ │ Opac.: 100%  │      │
│ ┌─Templates─┐  │    └──────────────────────┘     │ │ Align: center│      │
│ │ pilar 1:1 │  │                                  │ └──────────────┘      │
│ │ pilar 4:5 │  │ [Zoom -  100%  +]  [Fit]         │ ┌─Export──────┐      │
│ │ ...       │  │                                  │ │ Formato: JPG│      │
│ └───────────┘  │                                  │ │ sRGB, 85%   │      │
│                │                                  │ │ [Download]  │      │
│                │                                  │ │ [Todos em    │      │
│                │                                  │ │  lote]       │      │
│                │                                  │ └─────────────┘      │
├────────────────┴──────────────────────────────────┴──────────────────────┤
│ Bottom bar: Formatos [1:1*][4:5][1.91:1][Story][Reel][Carousel(10)]       │
│             [Gerar variantes] (smart crop) · [Brand lock: ✓]             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Carousel mode (format=carousel)
Bottom bar troca para: **10 slides** (drag-drop thumbs) + toggle "Background contínuo 10800×1080".
Canvas vira `CarouselSlideBuilder` ([[../components/CarouselSlideBuilder]]).

### Grid preview (botão "Grid IG" no canvas)
Overlay modal mostrando [[../components/GridPlanner]] — últimos 9 publicados + agendados + atual destacado.

### Story / Reel UI overlay
Toggle "IG UI" desenha o chrome do IG (profile pic topo, barra de progresso story, CTA Reel, closed captions).

## Componentes-chave

### Reutilizados
- `Button`, `Badge`, `Tabs`, `Select`, `Dialog`, `Sheet`, `Tooltip`, `Separator`, `ScrollArea`, `Popover`
- `DndContext` do `@dnd-kit/core` (reorder de slides, reorder de camadas, reorder de assets)
- `AssetUploader` (já existe) — reuso para upload de asset fonte
- `AssetVersionsList` (já existe) — reuso em sidebar direita (histórico de versões)
- `ImagePinOverlay` (já existe) — ativar quando card está em `aprovacao_arte` para ver pins do aprovador

### A criar
- `src/features/designer/components/DesignerInboxPage.tsx` — 3 colunas "Para criar / Em ajuste / Aprovado" (evolução do `DesignerInbox` atual).
- `src/features/designer/components/CanvasEditorPage.tsx` — container com split panes (esquerda layers+assets, centro canvas, direita brand+props+export).
- [[../components/MultiFormatCanvas]] — componente transversal principal do painel.
- [[../components/CarouselSlideBuilder]] — quando format=carousel.
- [[../components/BrandKitLockedPicker]] — color/font/logo picker travado.
- `src/features/designer/components/LayerPanel.tsx` — lista de camadas (visibility, lock, reorder).
- `src/features/designer/components/AssetLibraryPanel.tsx` — sidebar com assets do workspace + tabs Uploads / Unsplash / Canva.
- `src/features/designer/components/TemplateLibraryPanel.tsx` — templates do workspace filtráveis por formato/pilar.
- `src/features/designer/components/PropertiesPanel.tsx` — propriedades da camada selecionada (x/y/w/h/opac/align).
- `src/features/designer/components/ExportPanel.tsx` — presets de export (JPG/PNG/MP4) + lote.
- `src/features/designer/components/VariantGenerator.tsx` — botão "Gerar variantes" + modal de review das variantes.
- `src/features/designer/components/SmartCropService.ts` — heurística client-side (centro de rosto/logo) ou fallback servidor.
- `src/features/designer/components/StoryReelUIOverlay.tsx` — chrome do IG desenhado em SVG sobre o canvas.
- `src/features/designer/components/VersionDiffSlider.tsx` — slider antes/depois para comparar versões.
- `src/features/designer/hooks/useCanvas.ts` — estado do canvas (layers, selected, zoom, pan) — Zustand.
- `src/features/designer/hooks/useAssetUpload.ts` — upload com progresso + otimização.
- `src/features/designer/hooks/useExport.ts` — render do canvas para imagem/video via lib (`canvas2image` ou server-side).

### Library externa proposta
- `fabric.js` **ou** `konva.js` para canvas 2D (shapes, images, text, transform handles). **Decisão:** `konva` (leve, React bindings via `react-konva`, boa comunidade). Registrar em ADR `02_architecture/adr/canvas-lib.md` (a criar).
- Alternativa MVP: canvas minimalista com `<canvas>` + manipulação manual (apenas imagem + texto sobreposto) — decisão fica com o coordinator.

## Estado

### Server (TanStack Query)
| Query key | Fonte | Invalidada por |
|---|---|---|
| `["design-inbox", workspaceId, userId]` | `post_cards` stage in ("design","aprovacao_arte") | move/save |
| `["post-card", cardId]` | `post_cards` + `asset_versions` | save version |
| `["brand-kit", workspaceId]` | `brand_profiles` (já existe) + estendido (logos, grafismos) | brand update |
| `["assets", workspaceId, tag?]` | `workspace_assets` (nova) | upload/delete |
| `["templates", workspaceId]` | `templates` (nova) | CRUD template |
| `["grid-preview", workspaceId]` | últimos 9 publicados + 3 agendados | novo post aprovado |
| `["carousel-slides", postCardId]` | `carousel_slides` (nova) | save slide |

### Client (Zustand)
- `src/stores/useCanvasStore.ts` — `{ layers, selectedLayerId, zoom, pan, activeFormat, showSafeZones, showIGOverlay, showGrid }`. Persistência **por postCardId** em localStorage (evitar perda em reload).
- `src/stores/useDesignDraftStore.ts` — draft não-salvo do canvas (snapshot de layers).

## Interações críticas
1. **Golden path — brief+script → arte em 3 formatos** — abre card → canvas vazio preset 1:1 → importa script do copy (auto-preenche textos) → arrasta imagem da asset lib → posiciona → clica "Gerar variantes" → review 4:5 e Story → ajusta safe zones → "Pedir aprovação".
2. **Brand lock** — color picker só mostra cores do kit; fontes só do kit. Se tentar cor custom → dialog "Justificar uso fora do kit" (textarea obrigatório, fica no audit log).
3. **Smart crop falha** — se heurística não detecta assunto → variante fica com crop central + toast `sonner.warning("Variante Story gerada com crop central — revise")`.
4. **Optimistic save + rollback** — salvar nova versão → otimisticamente marca `v4 (salvando...)` → falha de upload → rollback + retry automático com toast.
5. **Carousel background contínuo** — toggle "BG contínuo" → upload imagem 10800×1080 → client-side crop em 10 slices de 1080×1080 → cada slide vira `carousel_slides[i].bg_url` + `post_cards.asset_versions[i]`.
6. **Export em lote** — botão "Todos os formatos" → gera JPG pra cada variante → baixa zip (via JSZip) com naming `<marca>_<campanha>_<pilar>_<formato>_v<N>.jpg`.
7. **Edge — asset >8MB** — bloqueia export + sugere compressor client-side (browser-image-compression).

## Formulários (RHF + Zod)

### Asset upload
```ts
const assetSchema = z.object({
  workspace_id: z.string().uuid(),
  file: z.instanceof(File).refine((f) => f.size <= 50 * 1024 * 1024, "Max 50MB"),
  tags: z.array(z.string()).max(10),
  kind: z.enum(["photo","icon","illustration","mockup","video","logo_source"]),
});
```

### Template
```ts
const templateSchema = z.object({
  name: z.string().min(3).max(80),
  workspace_id: z.string().uuid(),
  format: z.enum(["feed_1x1","feed_4x5","feed_1.91x1","story","reel","carousel"]),
  pillar_id: z.string().uuid().nullable(),
  layers_json: z.record(z.string(), z.unknown()),
  variables: z.array(z.object({ key: z.string(), type: z.enum(["text","image","color"]) })),
});
```

### Carousel slide
```ts
const carouselSlideSchema = z.object({
  post_card_id: z.string().uuid(),
  index: z.number().int().min(1).max(10),
  bg_url: z.string().url().nullable(),
  layers_json: z.record(z.string(), z.unknown()),
  marker: z.enum(["cover","cta","none"]).default("none"),
});
```

### Brand kit (extensão)
```ts
// estende o brand_profiles atual
const brandKitSchema = z.object({
  colors: z.array(z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), name: z.string(), usage: z.string().optional() })).max(24),
  fonts: z.array(z.object({ family: z.string(), weight: z.string(), url: z.string().url().optional(), usage: z.string().optional() })).max(10),
  logos: z.array(z.object({ kind: z.enum(["horizontal","icon","monochrome"]), file_url: z.string().url(), min_padding: z.number().int().optional() })).max(8),
  graphics: z.array(z.object({ name: z.string(), file_url: z.string().url() })).max(30),
});
```

## Responsividade
- **Desktop (≥1280px)** — layout full.
- **Laptop (1024–1280px)** — sidebars colapsáveis via `Resizable` (shadcn).
- **Tablet (768–1024px)** — apenas read-only do inbox; canvas redireciona pra "abra no desktop".
- **Mobile** — bloqueado para edição (banner + CTA).

## Acessibilidade
- Canvas tem `role="application"` + instruções de atalhos de teclado para quem não usa mouse.
- Atalhos: `V` seleção, `T` texto, `R` retângulo, `I` imagem (quando escolher `konva`), `⌘/Ctrl+Z` undo, `⌘/Ctrl+Shift+Z` redo, `⌘/Ctrl+D` duplicar, `Delete` remover, `1`..`6` trocar formato.
- `aria-live="polite"` anuncia ações do canvas ("camada X movida para X, Y").
- Alternativa não-visual para "Gerar variantes" (mostra crop sugerido em lista textual).

## Performance
- Canvas renderiza em `requestAnimationFrame`.
- Thumbnails de asset com `loading="lazy"` + blur placeholder.
- Upload via `supabase.storage` com `multipart` para arquivos >5MB.
- Render de export fora da UI thread (Web Worker para compressão).
- Virtualização em `AssetLibraryPanel` quando >50 assets (`@tanstack/react-virtual`).

## Instagram-nativo
- Presets canônicos (ver [[../components/MultiFormatCanvas]]): feed 1:1 (1080×1080), feed 4:5 (1080×1350), feed 1.91:1 (1080×566), story/reel (1080×1920), reel cover (área visível no feed = 1080×1350 central).
- **Safe zones** (pré-desenhadas):
  - Story: top 250px (profile), bottom 350px (CTA/captions).
  - Reel: top 210px (profile), bottom 330px (CTA + closed captions ativas por padrão).
  - Feed 4:5: top ~100px e bottom ~100px "cortados" no grid preview.
- Grid preview usa [[../components/GridPlanner]] com crop central (IG corta 4:5 para 1:1 no perfil).
- Export limite: JPG/PNG sRGB <8MB, MP4 <4GB 30fps AAC.

## Dependências

### User stories
- US-031..US-045 (designer) — canvas multiformato, auto-adapt, brand lock, carousel builder, templates, assets, grid preview, IG UI overlay, export, version lock.

### Endpoints / tabelas
- `post_cards.asset_versions` (já existe) — estender com `format` (enum IG) e `layers_json` (jsonb).
- `workspace_assets` (nova) — lib de assets do workspace.
- `templates` (nova) — layers + variáveis.
- `carousel_slides` (nova) — 10 slides por post.
- `brand_profiles` (estender) — logos[], graphics[].
- Storage buckets: `design-assets`, `design-exports`, `design-thumbnails` (com policies RLS).
- Edge function `smart-crop` (opcional server-side) ou fallback client-side.
- Edge function `compress-image` (reduzir assets fonte).

### Design system a estender
- shadcn `resizable`, `slider`, `toggle-group`, `command`, `context-menu`, `progress`.
- Tokens canvas: `--size-ig-*` dimensões canônicas.
- Lib: `konva` + `react-konva` (ou decisão alternativa em ADR).

## Fora de escopo (MVP)
- Colaboração real-time no canvas (multi-cursor).
- Integração Canva Connect (fase 2, confirmar OAuth).
- AI background removal.
- Vector editor (só imagens + texto + shapes básicas).

## Conflitos com código existente
- `DesignerInbox` atual é lista simples → **evoluir** para `DesignerInboxPage` com 3 colunas, mantendo assinatura.
- `AssetUploader` / `AssetVersionsList` permanecem — usados dentro do novo painel, chamando o mesmo backend.
- `BrandProfilePage` (`/brand`) continua como editor completo do brand kit — o painel do designer **lê** via `useBrandKit()` e não duplica editor.
- `ImagePinOverlay` permanece em `/card/:id` para visualização cheia de pins; no canvas ele é só overlay (read-only) durante `aprovacao_arte`.
