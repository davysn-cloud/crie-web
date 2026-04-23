---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — InstagramPreview

Preview **pixel-accurate** do Instagram. Renderiza legenda, arte, indicador de carrossel e UI do IG (header, ícones, barra de progresso de story, captions de reel). Usado em: [[../screens/panel-copywriter]], [[../screens/panel-designer]], [[../screens/panel-social-media]], [[../screens/panel-aprovador]].

## API proposta
```tsx
type IgFormat =
  | "feed_1x1" | "feed_4x5" | "feed_1.91x1"
  | "story" | "reel"
  | "carousel_1x1" | "carousel_4x5";

type InstagramPreviewProps = {
  format: IgFormat;
  media: Array<{
    url: string;          // imagem ou vídeo
    mime: string;         // "image/jpeg" | "video/mp4"
    slideIndex?: number;  // só para carousel
  }>;
  caption?: string;
  account: {
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  overlays?: {
    safeZones?: boolean;           // designer
    igUi?: boolean;                 // story profile pic, cta reel, captions
    profileGridCrop?: boolean;      // para mostrar como fica no perfil (crop central)
  };
  size?: "xs" | "sm" | "md" | "lg" | "full";  // preset de largura
  onPinClick?: (coord: { x: number; y: number; slideIndex?: number; reelTimestampS?: number }) => void; // aprovador
  pins?: Array<{ id: string; x: number; y: number; slideIndex?: number; resolved?: boolean }>;
  showFirstComment?: boolean;
  firstComment?: string;
  truncateAt?: number;              // default 125 (limit IG)
  className?: string;
};
```

## Dimensões canônicas (CSS)
```css
/* tokens em src/index.css */
--size-ig-feed-1x1-base:   1080px;
--size-ig-feed-4x5-h:      1350px;
--size-ig-feed-1.91x1-h:   566px;
--size-ig-story-h:         1920px;
```

Tamanhos (width) por `size` prop:
- `xs` = 120px (calendário hover)
- `sm` = 240px (inbox preview)
- `md` = 360px (card do aprovador mobile)
- `lg` = 480px (editor copy/design)
- `full` = 100% do container (responsivo)

## Layout ASCII — feed 1:1
```
┌─────────────────────────┐
│ 🅰 @handle  ✓    ⋯     │ header 54px alto fixo
├─────────────────────────┤
│                         │
│     [IMAGEM 1080×1080]  │ square
│                         │
├─────────────────────────┤
│ ❤  💬  ✉️        🔖     │ ícones ações
│ Curtido por X e mais    │
│ @handle conteúdo da...  │ legenda truncada em 125
│     ... ver mais        │
│ há 2h                   │
└─────────────────────────┘
```

## Layout ASCII — carrossel
```
┌─────────────────────────┐
│ 🅰 @handle           ⋯ │
├─────────────────────────┤
│ ◀      [slide 2/10]  ▶ │ swipe horizontal
│                         │
│     [IMAGEM slide 2]   │
│                         │
│ · · ● · · · · · · ·    │ indicador dots
├─────────────────────────┤
│ ❤  💬  ✉️        🔖     │
│ @handle descrição...    │
└─────────────────────────┘
```

## Layout ASCII — story/reel (9:16)
```
┌───────────────┐
│ ▬▬▬▬  ▬  ▬   │ progress bar (story) ou ao vivo
│ 🅰 @handle    │ profile topo
│                │
│                │
│    [9:16]     │ mídia
│                │
│                │
│                │
│ cc legenda    │ closed caption reel
│ [CTA button]  │ bottom CTA
└───────────────┘
```

## Comportamentos
- **Truncate em 125 chars** com "... ver mais" (botão expande inline). Funciona com caracteres unicode (`Array.from(str)` para contar grafemas, não `.length`).
- **Indicador de slide** em carrossel: dots + swipe gesture (mobile) + arrows (desktop). Lib `embla-carousel-react` ou implementação nativa com `scroll-snap`.
- **Safe zones** (só `overlays.safeZones=true`): retângulos translúcidos cobrindo topo/rodapé nas áreas críticas, cor `oklch(0.6 0.2 27 / 0.2)` (destructive translúcido).
- **IG UI overlay** (só `overlays.igUi=true`): desenha chrome do IG sobre a mídia (útil no designer ver se texto fica atrás do CTA do Reel).
- **Profile grid crop**: quando `overlays.profileGridCrop=true`, renderiza 3 cards quadrados com crop central da imagem (simulando visão do perfil).
- **Pin overlay**: se `pins` provided, desenha `CommentPin` em cada coordenada.
- **Click-to-pin** (aprovador): `onPinClick` recebe coord normalizada x%/y% + slide_index (se carousel) + reel_timestamp_s (se reel).

## Padrões de implementação
- **SVG foreignObject** para garantir pixel-perfect em zoom (evitar blur de bitmap).
- Imagens com `object-fit: cover` + `aspect-ratio: <ratio>` para cada formato.
- Vídeos (reel) com `<video playsInline muted autoPlay loop>` + controles custom (evitar chrome nativo).
- Captions do reel geradas automaticamente a partir do campo `caption` (primeiros 60 chars em overlay).

## Acessibilidade
- `role="img"` no container com `aria-label="Preview do Instagram — {formato} — {handle}"`.
- Legenda read-aloud-friendly (não `aria-hidden`).
- Botão "ver mais" tem `aria-expanded`.
- Contraste dos overlays >= 4.5:1.

## Performance
- `React.memo` no componente raiz (props estáveis).
- `useMemo` para ordenação de slides do carousel.
- Preload da primeira imagem; lazy das seguintes.
- Quando `size="xs"`, versão simplificada sem chrome completo (só imagem + handle).

## Dependências internas
- `src/lib/instagram.ts` (novo) — `truncateCaption`, `countGraphemes`, `IG_RATIOS`, `IG_SAFE_ZONES`.
- `src/components/ui/avatar.tsx` (existe) — avatar do handle.
- Lib `embla-carousel-react` (adicionar) — swipe do carousel.

## Onde será implementado
`src/components/instagram/InstagramPreview.tsx` (shared ao invés de em uma feature específica — usado por 4 painéis).
Submódulos:
- `./Frame.tsx` — chrome (header + ações)
- `./FeedPreview.tsx`, `./StoryPreview.tsx`, `./ReelPreview.tsx`, `./CarouselPreview.tsx` — um por formato.
- `./SafeZoneOverlay.tsx`, `./IgUiOverlay.tsx`, `./ProfileGridOverlay.tsx`.

## Testes
- Snapshot por formato (×5).
- Teste de truncate em várias strings unicode (emojis, CJK).
- Teste de pin-click em coord proporcional (simular tap em várias larguras).
- Visual regression (Playwright + `toHaveScreenshot`).
