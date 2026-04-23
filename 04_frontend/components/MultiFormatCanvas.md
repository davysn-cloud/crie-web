---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: low
---

# Componente — MultiFormatCanvas

Canvas editor do designer com presets IG e overlays de safe zones. Usado em [[../screens/panel-designer]].

**Confidence: low** — decisão de lib (konva vs fabric vs custom) ainda pendente. Ver ADR a criar `02_architecture/adr/canvas-lib.md`.

## API proposta
```tsx
type CanvasFormat =
  | "feed_1x1" | "feed_4x5" | "feed_1.91x1"
  | "story" | "reel" | "reel_cover"
  | "carousel_slide_1x1" | "carousel_slide_4x5";

type Layer =
  | { id: string; type: "image"; src: string; x: number; y: number; w: number; h: number; opacity: number; locked?: boolean; visible?: boolean }
  | { id: string; type: "text"; text: string; fontFamily: string; fontSize: number; color: string; x: number; y: number; w: number; align: "left"|"center"|"right"; locked?: boolean; visible?: boolean }
  | { id: string; type: "shape"; shape: "rect"|"circle"|"line"; fill: string; stroke?: string; x: number; y: number; w: number; h: number; locked?: boolean; visible?: boolean }
  | { id: string; type: "logo"; variant: "horizontal"|"icon"|"monochrome"; x: number; y: number; w: number; h: number; locked?: boolean; visible?: boolean };

type MultiFormatCanvasProps = {
  format: CanvasFormat;
  layers: Layer[];
  onChange: (layers: Layer[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showSafeZones: boolean;
  showIgUi: boolean;
  zoom: number;           // 0.25..4
  onZoomChange: (z: number) => void;
  brandKit: BrandKit;     // cores/fontes permitidas (ver BrandKitLockedPicker)
  onExport?: (format: "jpg"|"png"|"mp4") => Promise<Blob>;
};
```

## Layout ASCII
```
┌─────────────────────────────────────────────────────┐
│ Toolbar: [V] [T] [▭] [○] [🖼] [🏷logo]              │
│         │                 │                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│     ╔════════════════════════╗                     │
│     ║ Canvas 1080×1080       ║  <-- preset feed 1:1 │
│     ║  ┌─safe zone─┐         ║                     │
│     ║  │  layers   │         ║                     │
│     ║  │  clickable│         ║                     │
│     ║  └───────────┘         ║                     │
│     ╚════════════════════════╝                     │
│                                                     │
│ Zoom: [-] 100% [+] [Fit]                           │
└─────────────────────────────────────────────────────┘
```

## Comportamentos
- **Presets IG** travam dimensão do canvas (em pixels CSS escalados pelo zoom).
- **Transform handles** na camada selecionada (8 handles + rotação).
- **Snap** a guidelines: centro, 1/3 (regra dos terços), safe zones.
- **Undo/redo** via Zustand middleware `temporal` ou custom stack de `layers`.
- **Paste image** direto (`paste` event → cria layer imagem).
- **Drag de `AssetLibraryPanel`** entra no canvas como novo layer.
- **Brand lock** — `color picker` travado ao `brandKit.colors`, font picker travado.
- **Export** via `canvas.toBlob(mime, quality)` (ou `konva.toDataURL`).

## Safe zones por preset
```ts
export const SAFE_ZONES: Record<CanvasFormat, Array<{ top: number; bottom: number; left?: number; right?: number }>> = {
  story:  [{ top: 250, bottom: 350 }],
  reel:   [{ top: 210, bottom: 330 }],
  feed_4x5: [{ top: 100, bottom: 100 }], // zona cortada no grid
  reel_cover: [{ top: 285, bottom: 285 }], // visible area 1080×1350 central
  feed_1x1: [],
  feed_1.91x1: [],
  carousel_slide_1x1: [],
  carousel_slide_4x5: [{ top: 100, bottom: 100 }],
};
```

## IG UI overlay (SVG)
- **Story**: profile pic 40×40 top-left com @handle, 24h timestamp; barra de progresso no topo.
- **Reel**: ícones laterais direita (❤💬✉️🎵), CTA bottom-right, captions text overlay bottom 20%.
- **Feed**: ícones actions bottom + primeira linha da legenda.

## Acessibilidade
- `role="application"` no container.
- Atalhos de teclado (V/T/R/I/L + arrow keys para mover selected layer 1px, Shift+arrow = 10px).
- Anúncio das mudanças via `aria-live` discreto.
- Contraste do selection handle >= 3:1 com fundo do canvas.

## Performance
- `react-konva` com `Stage` dividido em `Layer`s nativos (uma layer para mídia, outra para safe zones, outra para UI overlay).
- Re-render só do `Layer` afetado.
- `useTransition` ao mudar formato (evita bloqueio UI em canvas grande).
- Export em Web Worker (caso lib suporte) ou `OffscreenCanvas`.

## Onde será implementado
`src/features/designer/canvas/MultiFormatCanvas.tsx` (dentro do feature do designer; não transversal tecnicamente mas documentado aqui por ser central a outros painéis via preview read-only).

## Dependências
- `konva` + `react-konva` (ADR a aprovar). Fallback: `<canvas>` manual com `useCanvas()` hook.
- `src/lib/instagram.ts` — dimensões.
- [[BrandKitLockedPicker]] — integração direta.

## Fora de escopo
- Real-time colaborativo (multi-cursor).
- Filtros/efeitos estilo Photoshop.
- Vetor (SVG nativo). Só imagem + texto + shape básica.
