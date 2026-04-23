---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — CarouselSlideBuilder

Construtor de carrossel do Instagram com até **10 slides reordenáveis** (dnd-kit) e opção de **background contínuo único** (10800×1080 cortado automaticamente em 10 slices). Usado em [[../screens/panel-designer]] quando `post_type = carousel_1x1 | carousel_4x5`.

## API proposta
```tsx
type CarouselSlide = {
  id: string;
  index: number;                          // 1..10
  bgUrl: string | null;                   // imagem fundo do slide
  layersJson: CanvasLayer[];              // texto/imagem/shapes sobrepostos
  marker?: "cover" | "cta" | "none";     // cover=slide 1, cta=slide final
  scriptTextFromCopywriter?: {            // importado do CarouselScriptEditor do copy
    title?: string;
    body?: string;
    slideCta?: string;
  };
};

type CarouselSlideBuilderProps = {
  postCardId: string;
  format: "carousel_1x1" | "carousel_4x5";
  slides: CarouselSlide[];
  onChange: (slides: CarouselSlide[]) => void;
  continuousBackground: {
    enabled: boolean;
    imageUrl?: string;                    // 10800×1080 upload
  };
  onToggleContinuousBg: (enabled: boolean) => void;
  onUploadContinuousBg: (file: File) => Promise<string>;
  brandKit: BrandKit;
  copywriterScript?: Array<{
    index: number;
    title?: string;
    body?: string;
    slideCta?: string;
    designNote?: string;
  }>;
};
```

## Layout ASCII
```
┌──────────────────────────────────────────────────────────────────┐
│ Carrossel — 7 slides                    [+ Slide] até 10          │
├──────────────────────────────────────────────────────────────────┤
│ Thumbnails (drag-drop):                                           │
│ ┌──┬──┬──┬──┬──┬──┬──┐                                           │
│ │1 │2 │3 │4 │5 │6 │7 │ ← drag pra reordenar                     │
│ │cover              cta │                                          │
│ └──┴──┴──┴──┴──┴──┴──┘                                           │
├──────────────────────────────────────────────────────────────────┤
│ Slide 4 de 7 — editor:                                            │
│                                                                   │
│       ┌─────────────────────┐                                    │
│       │  Canvas 1080×1080   │                                    │
│       │   do slide atual    │                                    │
│       │   (MultiFormatCanvas │                                    │
│       │    embedded)         │                                    │
│       └─────────────────────┘                                    │
│                                                                   │
│ Script do copy (read-only):                                       │
│  · Título: "3 dicas para..."                                      │
│  · Corpo: "Vamos começar..."                                      │
│  · CTA do slide: "→"                                              │
│  · Nota design: "usar ícone maior"                                │
├──────────────────────────────────────────────────────────────────┤
│ ☐ Usar background contínuo único (10800×1080)                    │
│ (se marcado): [Upload 10800×1080] · cada slide recebe slice de 1080│
└──────────────────────────────────────────────────────────────────┘
```

## Comportamentos
- **Drag-drop reorder** (`@dnd-kit/core` + `@dnd-kit/sortable`) — arrasta thumbs → atualiza `index` em cada slide.
- **Limite 10 slides** — botão "+ Slide" disabled em 10.
- **Mínimo 2 slides** — botão "Remover" disabled em slides únicos.
- **Cover / CTA markers** — slide 1 ganha marker `"cover"` por default; slide final ganha `"cta"`. Editáveis.
- **Import do script** — ao abrir, se `copywriterScript` fornecido, pre-preenche textos nas camadas de texto padrão.
- **Continuous background**:
  - Toggle → upload de imagem 10800×1080 (validação rígida).
  - Client-side crop em `<canvas>` de 10 fatias de 1080×1080.
  - Cada slide recebe `bgUrl` = data URL da fatia correspondente.
  - Reordenar slides **não** reagrupa o bg (aviso ao usuário se habilitar depois de reordenar).
- **Editor por slide** — abre o `MultiFormatCanvas` embedded com `format="carousel_slide_1x1"` ou `"carousel_slide_4x5"`.
- **Preview "próximo slide"** — arrow keys navegam entre slides.

## Validações
- Todas as slides devem ter o mesmo ratio (garantido pela prop `format`).
- Se `continuousBackground.enabled`, imagem precisa ser exatamente 10800×1080 (±1px tolerância).
- Se remover slide no meio, índices recalculam + continuous bg fica inválido (toast warning).

## Acessibilidade
- Thumbs são `<button>` com `aria-label="Slide {N}, {marker}"`.
- Drag handle com atalho teclado (espaço para pegar, arrows para mover, enter para soltar).
- Navegação por teclado entre slides (`[` / `]`).
- Anúncios `aria-live` para reorder ("Slide 4 movido para posição 2").

## Performance
- Thumbnails renderizadas como `<canvas>` redimensionado (não reutilizar full-res).
- Re-render apenas do slide ativo.
- Crop da imagem contínua em Web Worker.
- Slides "não ativos" mantêm apenas `layersJson` em memória; renderizam sob demanda.

## Onde será implementado
`src/features/designer/carousel/CarouselSlideBuilder.tsx`.
Subcomponentes:
- `./SlideThumbs.tsx` — drag-drop thumbs.
- `./ContinuousBgManager.tsx` — upload + slice.
- `./CarouselExporter.tsx` — export do carrossel completo (zip ou sequência).
- `./useCarouselSlides.ts` — query+mutation de `carousel_slides`.
- `./lib/sliceImage10x.ts` — utility crop.

## Dependências
- `@dnd-kit/core` + `@dnd-kit/sortable` (já instalados `dnd-kit`; verificar `sortable`).
- [[MultiFormatCanvas]] — embedded para editar cada slide.
- [[InstagramPreview]] — preview final do carrossel completo.
- [[BrandKitLockedPicker]] — cores/fontes.
- Backend tabela `carousel_slides`.

## Fora de escopo
- Animação de transição entre slides (só preview estático).
- Carrossel de vídeo (vídeos como slides) — fase 2.
- Auto-dividir texto longo em slides.
