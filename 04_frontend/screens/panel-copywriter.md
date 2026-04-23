---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
role: copywriter
breakpoint_primary: desktop
---

# Painel — Copywriter

Persona e JTBD: [[../../01_product/roles/copywriter]]. Consome briefs de [[panel-estrategista]] e entrega para [[panel-designer]] e [[panel-aprovador]].

## Rota
`/app/:agencySlug/w/:workspaceSlug/copy` (raiz do painel = fila/inbox).
Sub-rotas:
- `.../copy` → inbox (fila de briefs atribuídos)
- `.../copy/write/:postCardId` → editor dedicado (rota full-width)
- `.../copy/write/:postCardId?format=carousel` → carousel script sheet (10 slides)
- `.../copy/write/:postCardId?format=reel` → roteiro Reel (timeline de blocos)
- `.../copy/write/:postCardId?format=story` → grade de frames (3-10)
- `.../copy/libraries/hooks` → hook library
- `.../copy/libraries/ctas` → CTA library
- `.../copy/libraries/hashtags` → hashtag browser (consome sets do estrategista)
- `.../copy/brand-voice` → brand voice card

**Decisão:** **Desktop-only no MVP** (≥1024px). Editor com preview lado-a-lado precisa espaço horizontal.

## Layout (ASCII wireframe)

### Desktop — inbox (≥1024px)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ WorkspaceLayout (Marca / Membros / View switcher)                         │
├──────────────────────────────────────────────────────────────────────────┤
│ Topbar: "Inbox do Copywriter"      [Filtros ▼] [⌘K]                       │
├────────────┬─────────────────────────────────────────────────────────────┤
│ Filter     │ ┌───┬───┬───┐                                               │
│ sidebar    │ │   │   │   │ Cards em "Para escrever" (col 1)              │
│ · Prazo    │ │ 1 │ 2 │ 3 │ ou "Em ajuste" (col 2) ou "Aprovado" (col 3)  │
│ · Pilar    │ │   │   │   │                                               │
│ · Formato  │ └───┴───┴───┘  cada card mostra:                            │
│ · Campanha │                 · título · pilar · prazo · formato IG       │
│ · Assignee │                 · brief preview (2 linhas)                  │
│ · Status   │                                                             │
│            │                                                             │
└────────────┴─────────────────────────────────────────────────────────────┘
```

### Desktop — editor (`.../copy/write/:postCardId`)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Back · Brief resumo · Stage bar · [Salvar v] [Pedir aprovação]           │
├──────────┬────────────────────────────────────┬──────────────────────────┤
│ Brief    │ Tabs: [Legenda][1º coment.][Ref.]  │ Sidebar direita          │
│ panel    │                                    │ ──────────────────────── │
│ (read-   │ ┌────────────────────────────────┐ │ Brand voice card         │
│ only,    │ │ Editor textarea                │ │ · Tom: casual            │
│ col-     │ │ (monospace, wrap, 16-18px)     │ │ · Emojis: sim, max 30    │
│ lap-     │ │                                │ │ · Não dizer: "promoção"  │
│ sible)   │ │                                │ │                          │
│          │ │                                │ │ [Gerar com IA] brand-    │
│ ├ Obj.   │ │                                │ │ voice-conditioned        │
│ ├ Pilar  │ │                                │ │                          │
│ ├ Form.  │ │                                │ │ ─────────                │
│ ├ CTA    │ │                                │ │ Library                  │
│ ├ Audit. │ │                                │ │ · Hooks salvos 👍        │
│ └ Ref.   │ │                                │ │ · CTAs salvos            │
│          │ └────────────────────────────────┘ │ · Hashtag sets (puxa     │
│          │ ┌─────── Constraints bar ──────┐   │   do estrategista)       │
│          │ │ 0/2200 chars · "...ver mais" │   │                          │
│          │ │  em 125 · 12 emojis · ⚠ 3   │   │ ─────────                │
│          │ │ quebras colapsáveis          │   │ Versões (diff visual)    │
│          │ └──────────────────────────────┘   │ · v3 (atual)             │
│          │                                    │ · v2 ← diff              │
│          │ ┌──── InstagramPreview live ────┐  │ · v1 ← diff              │
│          │ │ feed 1:1 mobile frame com     │  │                          │
│          │ │ truncate "...ver mais"        │  │ ─────────                │
│          │ └───────────────────────────────┘  │ Checklist brand:          │
│          │                                    │ ✓ tom casual             │
│          │                                    │ ✗ tem "promoção"         │
└──────────┴────────────────────────────────────┴──────────────────────────┘
```

### Desktop — carousel script sheet (format=carousel)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ Slides: ◀ [1][2][3][4][5][6][7][8][9][10] ▶   [+Slide até 10]           │
├──────────────────────────────────────────────────────────────────────────┤
│ Slide N  │ Título:   [________________________]                         │
│ preview  │ Corpo:    [____________________________________]              │
│ 1:1      │ CTA:      [________________________]                         │
│ mock     │ Nota design: [________________________]                       │
│          │                                                               │
│          │ Constraints: 0/90 chars título · 0/200 corpo · emoji 0/4     │
└──────────┴──────────────────────────────────────────────────────────────┘
 [Importar script para designer] (copia pro asset_versions como metadata)
```

### Reel script (format=reel)
```
┌───────────────────────────────────────────────┐
│ Hook (0-3s)     [textarea até 60 chars overlay]│
│ Desenv. (3-25s) [textarea cada linha = frame]  │
│ CTA (25-30s)    [textarea até 40 chars]        │
│ Áudio trend:    [URL IG link]                  │
│ Direção:        [textarea notas designer/edit] │
└───────────────────────────────────────────────┘
```

### Mobile (<768px) — read-only
Ver lista de cards + preview de legenda; edição desativada.

## Componentes-chave

### Reutilizados
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — `src/components/ui/tabs.tsx`
- `Textarea` (shadcn), `Input`, `Select`, `Badge`, `Button`, `Card`, `Dialog`, `Sheet`, `Tooltip`, `Separator`, `Popover`, `ScrollArea`
- `CopyEditor` (já existe em `src/features/post-card/CopyEditor.tsx`) — **extrair lógica para `useCopyDraft` hook** e reusar no novo painel
- `CopyVersionsList` (já existe) — reuso direto na sidebar direita
- [[../components/InstagramPreview]] — preview live na parte inferior do editor

### A criar
- `src/features/copywriter/components/CopyInbox.tsx` — 3 colunas "Para escrever / Em ajuste / Aprovado" (inspirado no `CopywriterInbox` atual, expandido).
- `src/features/copywriter/components/CopyWriterPage.tsx` — container do editor com split-pane.
- `src/features/copywriter/components/CaptionEditor.tsx` — textarea monospace com constraints bar.
- `src/features/copywriter/components/CaptionConstraints.tsx` — barra visual (chars / 125-truncate / emojis / quebras).
- `src/features/copywriter/components/CarouselScriptEditor.tsx` — 10 slides com tabs + validação por slide.
- `src/features/copywriter/components/ReelScriptEditor.tsx` — blocos Hook/Desenv/CTA.
- `src/features/copywriter/components/StoryScriptEditor.tsx` — grade de frames.
- `src/features/copywriter/components/BriefPanel.tsx` — read-only do brief (collapsible).
- `src/features/copywriter/components/BrandVoiceCard.tsx` — mostra tom/emojis/não-dizer + botão "Gerar com IA".
- `src/features/copywriter/components/BrandVoiceChecklist.tsx` — valida texto contra `do_not_say` / keywords.
- `src/features/copywriter/components/HookLibrary.tsx` — CRUD hooks + busca + tags performance.
- `src/features/copywriter/components/CTALibrary.tsx` — idem para CTAs.
- `src/features/copywriter/components/HashtagPicker.tsx` — consome `hashtag_sets` do estrategista + sugestão IA.
- `src/features/copywriter/components/CopyDiffView.tsx` — diff lado-a-lado entre versões (lib `diff-match-patch` ou `diff`).
- `src/features/copywriter/hooks/useCopyDraft.ts` — orquestra RHF + auto-save (debounce 2s) + versionamento.
- `src/features/copywriter/hooks/useGenerateWithAI.ts` — chama edge function do Supabase com brand voice.
- `src/lib/instagram.ts` — `countVisibleChars`, `truncateAt(125)`, `countEmojis`, `insertInvisibleBreak` (caractere `⠀` U+2800).

## Estado

### Server (TanStack Query)
| Query key | Fonte | Invalidada por |
|---|---|---|
| `["copy-inbox", workspaceId, userId]` | `post_cards` stage in ("briefing","copy","aprovacao_copy") where assigned_to | mutation move/copy-save |
| `["post-card", cardId]` com copy_versions | `post_cards` + join | salvamento de nova versão |
| `["brand-voice", brand_profile_id]` | `brand_voice` (nova tabela ou estender `brand_profile`) | CRUD brand voice |
| `["hooks", workspaceId]` | `hook_library` (nova) | CRUD hook |
| `["ctas", workspaceId]` | `cta_library` (nova) | CRUD CTA |
| `["hashtag-sets", workspaceId]` | `hashtag_sets` (compartilhado com estrategista) | CRUD set |
| `["brief", postCardId]` | `briefs` | só leitura |

Mutation `saveCopyVersion` invalida `["post-card"]` + `["copy-inbox"]`.

### Client (Zustand)
- `src/stores/useCopyDraftStore.ts` — **autosave local** do draft enquanto escreve (persist middleware) — chave `draft:copy:<postCardId>:<userId>`. Flushes para server em toda pausa de 2s via hook `useCopyDraft`.
- `src/stores/useLibrariesStore.ts` — filtros/busca nas libraries (estado de UI).

## Interações críticas
1. **Golden path — brief → legenda v1 aprovada** — abrir card do inbox → editor mostra brief read-only + textarea vazio → digita/IA gera → live preview IG mostra truncate em 125 → constraints bar fica verde → botão "Pedir aprovação" move stage para `aprovacao_copy`.
2. **Auto-save versionado** — a cada pausa de 2s, salva `copy_versions` com `version++` **apenas se mudou significativamente** (threshold de chars) — caso contrário UPSERT na última. Optimistic local + toast discreto `sonner("salvo")`.
3. **IA generate** — botão "Gerar com IA" → edge function Supabase → recebe rascunho → insere no textarea como nova versão `ai_generated=true` → usuário edita → **nunca publica direto a versão IA**.
4. **Validação brand voice** — ao salvar, `BrandVoiceChecklist` mostra vermelho em palavras do `do_not_say`, amarelo em palavras que **não estão** em `keywords`. Não bloqueia salvamento (warning only).
5. **Edge: carousel importa script** — ao salvar carousel script, gera arquivo JSON anexado ao `post_card` → designer vê em "Notas do copywriter" no painel de design.
6. **Edge: sem conexão** — autosave falha → keep draft local → sonner `"Sem internet — salvo localmente"`. Reconexão → flush automático.

## Formulários (RHF + Zod)

### Caption (feed / single image)
```ts
const captionSchema = z.object({
  body: z.string().max(2200, "IG limita em 2200 caracteres").min(1),
  hashtags: z.array(z.string().regex(/^#[\w\d_]+$/)).max(30).optional(),
  first_comment: z.string().max(2200).optional(),
});
```

### Carousel script (10 slides)
```ts
const carouselSlideSchema = z.object({
  index: z.number().int().min(1).max(10),
  title: z.string().max(90).optional(),
  body: z.string().max(200).optional(),
  slide_cta: z.string().max(60).optional(),
  design_note: z.string().max(300).optional(),
});
const carouselScriptSchema = z.object({
  post_card_id: z.string().uuid(),
  slides: z.array(carouselSlideSchema).min(2).max(10),
  caption: captionSchema,
});
```

### Reel script
```ts
const reelScriptSchema = z.object({
  hook: z.string().max(120),
  development: z.string().max(600),
  cta: z.string().max(80),
  audio_url: z.string().url().optional(),
  camera_notes: z.string().max(300).optional(),
  caption: captionSchema,
});
```

### Story script (3–10 frames)
```ts
const storyFrameSchema = z.object({
  index: z.number().int(),
  text: z.string().max(60),
  sticker: z.enum(["poll","question","quiz","slider","link","countdown","mention"]).nullable(),
  expected_action: z.enum(["tap","swipe","dm"]).nullable(),
});
const storyScriptSchema = z.object({
  frames: z.array(storyFrameSchema).min(3).max(10),
});
```

### Hook / CTA library item
```ts
const libraryItemSchema = z.object({
  workspace_id: z.string().uuid(),
  text: z.string().min(3).max(300),
  pillar_id: z.string().uuid().nullable(),
  format: z.enum(["feed","story","reel","carousel"]).nullable(),
  performance_vote: z.enum(["up","down"]).nullable(),
});
```

## Responsividade
- **Desktop (≥1280px)** — split pane (editor + preview + sidebar).
- **Laptop (1024–1280px)** — sidebar direita vira `Sheet` toggle.
- **Tablet (768–1024px)** — inbox OK; editor empilha preview acima do textarea.
- **Mobile (<768px)** — read-only (MVP); CTA "abra no desktop para editar".

## Acessibilidade
- `aria-label` no textarea com contador de chars em `aria-live="polite"` (atualiza a cada 500ms para não spam leitor de tela).
- Navegação por tab: brief → editor → constraints → preview → sidebar.
- `⌘/Ctrl+S` salva versão explicitamente; `⌘/Ctrl+Enter` pede aprovação.
- Cores dos alertas não são único sinal (ícones + texto).
- Monospace do editor = `--font-mono` (ver [[README#Gaps no design system]]).

## Performance
- Debounce 2s no autosave.
- Preview IG renderiza com `requestAnimationFrame` em updates de texto (não re-renderiza DOM todo).
- `diff-match-patch` roda em Web Worker (diff de strings longas — legendas até 2200 chars × múltiplas versões).
- `Skeleton` em 4 blocos durante load.

## Instagram-nativo
- `IG_LIMITS.CAPTION_MAX = 2200`, `TRUNCATE_AT = 125`, `MAX_HASHTAGS = 30`, `MAX_EMOJIS_SAFE = 30`.
- Preview IG usa [[../components/InstagramPreview]] com prop `format="feed_1x1"|"story"|...`.
- Invisible break = U+2800 (`⠀`) — inserido em quebra dupla (`\n\n`) para preservar parágrafos.
- Regex de detecção de hashtag: `/#[\w\d_]+/g` (mesma do IG).

## Dependências

### User stories
- US-021..US-030 (copywriter) — editor legenda, carousel script, reel script, story script, hook lib, CTA lib, hashtag picker, brand voice, diff, pedir aprovação.

### Endpoints / tabelas
- `copy_versions` (já existe) — **adicionar colunas** `script_format` (enum), `script_json` (jsonb para carousel/reel/story), `first_comment`.
- `brand_voice` (nova) — `brand_profile_id`, `tone`, `allowed_emojis`, `do_not_say[]`, `keywords[]`, `references[]`.
- `hook_library` (nova) — itens com tagging.
- `cta_library` (nova) — idem.
- `briefs` (criada pelo estrategista) — leitura.
- `hashtag_sets` (compartilhado) — leitura.
- Edge function `generate-copy` (backend) — recebe `brief + brand_voice` → chama Claude/OpenAI → devolve draft.

### Design system a estender
- shadcn `command` (palette), `progress` (constraints bar), `toggle-group` (troca de formato).
- Token `--font-mono`.
- Token `--color-status-warning` / `--color-status-info` para constraints.

## Fora de escopo
- Edição colaborativa simultânea real-time (OT/CRDT) — futuro.
- Tradução automática PT↔EN.
- Auto-sugestão inline tipo Copilot.

## Conflitos com código existente
- `CopywriterInbox` atual é lista simples. **Evoluir, não substituir** — promover o arquivo para `CopyInboxMinimal` em `/copy` default e criar `CopyInboxFull` só quando houver mais de um card no inbox. No MVP os dois coexistem.
- `CopyEditor` atual (`src/features/post-card/CopyEditor.tsx`) é reutilizado **dentro** do card detail. Novo painel abre rota separada mas chama o mesmo hook `useCopyDraft`.
