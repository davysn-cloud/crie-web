---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — CommentPin

Pin numerado em coordenada normalizada (x%/y%) sobre mídia do post, com extensão para `slide_index` (carrossel) e `reel_timestamp_s` (reel). Evolução do `src/features/comments/ImagePinOverlay.tsx` atual.

Usado em:
- [[../screens/panel-aprovador]] — cliente clica e cria pin.
- [[../screens/panel-designer]] — vê pins do aprovador sobre o canvas durante `aprovacao_arte`.
- [[../screens/panel-copywriter]] — vê pins sobre preview de carrossel (slide-specific).
- `PostCardDetailPage` (atual) — migra para o novo contrato.

## API proposta
```tsx
type PinCoord = {
  x: number;            // 0..100 (%)
  y: number;            // 0..100 (%)
  slideIndex?: number;  // 1..10 (carousel only)
  reelTimestampS?: number; // 0..90 (reel only)
};

type CommentPinData = {
  id: string;
  body: string;
  author: { id: string; name: string; avatarUrl?: string };
  coord: PinCoord;
  resolved: boolean;
  createdAt: string;
  replies?: Array<{ id: string; body: string; author: typeof CommentPinData["author"]; createdAt: string }>;
};

type CommentPinOverlayProps = {
  mediaUrl: string;
  mediaType: "image" | "video";
  mode: "internal" | "approver"; // internal = time da agência; approver = cliente externo
  targetType: "asset_version" | "carousel_slide" | "reel_frame";
  targetId: string;
  currentSlideIndex?: number;    // carousel
  currentVideoTimeS?: number;    // reel
  pins: CommentPinData[];
  onAddPin: (coord: PinCoord, body: string) => Promise<void>;
  onResolve: (pinId: string) => Promise<void>;
  onReply: (pinId: string, body: string) => Promise<void>;
  readOnly?: boolean;
};
```

## Layout ASCII
```
 Mídia do post (imagem / slide do carousel / frame do reel)
 ┌──────────────────────────┐
 │                          │
 │    ① (numerado)          │ pin clicável numerado
 │                          │
 │         ②                │ pin com check se resolvido
 │                          │
 │   ● novo pin (sendo      │ pin em criação (dragable)
 │     criado)              │
 │                          │
 └──────────────────────────┘

Ao clicar em pin: popover com thread
 ┌──────────────────────────┐
 │ ❶ João (cliente) · agora │
 │ "cor da letra pouco      │
 │  legível"                │
 │                          │
 │ Maria (design): "OK vou  │ reply
 │  ajustar"                │
 │                          │
 │ [textarea reply]         │
 │ [✓ Resolver]             │
 └──────────────────────────┘
```

## Comportamentos
- **Clique na mídia em área vazia** → inicia novo pin em `{x%, y%}` com popover aberto para escrever comentário.
- **Pin numerado** `1..N` na ordem cronológica (não-resolvidos primeiro).
- **Resolvido** muda cor (verde-check) e fica opacidade 50%; toggle mostra/esconde resolvidos.
- **Carrossel** — ao trocar de slide, filtra pins com `slideIndex === currentSlideIndex`.
- **Reel** — pin capturado no timestamp atual do vídeo; ao abrir pin, vídeo pula pro timestamp (seek).
- **Drag de pin existente** — apenas em `mode="internal"` (cliente não reposiciona pin de outro).
- **Thread** — cada pin tem replies (limite 20 por pin).
- **Pin novo do aprovador** notifica designer/copywriter via realtime + e-mail (debounced digest).
- **Mode approver** — popover simplificado (sem opção de resolver; só cria); Apenas o time interno resolve.

## Coordenadas normalizadas
Sempre %-based para manter fidelidade em qualquer tamanho de tela. Backend armazena `pin_x`, `pin_y` como `numeric(5,2)` (0.00..100.00).

## Acessibilidade
- Pins são `<button>` com `aria-label="Comentário {index}, {status}, por {autor}"`.
- Ordem tab = ordem de criação.
- `Enter`/`Space` abrem popover; `Esc` fecha.
- Drag só com mouse (a11y opcional via teclado arrows em `mode="internal"`).
- Se `readOnly`, cursor normal (não crosshair).

## Performance
- `React.memo` por pin.
- Popover montado sob demanda (não renderiza thread até abrir).
- Debounce no drag (save a cada 200ms durante drag, final save on release).

## Onde será implementado
`src/features/comments/CommentPinOverlay.tsx` — **refactor** do atual `ImagePinOverlay.tsx` para suportar novo contrato. Manter export legacy até migração completa dos consumidores.
Subcomponentes:
- `./PinMarker.tsx` — o círculo numerado.
- `./PinThread.tsx` — popover com body + replies + input.
- `./useCreatePin.ts`, `./useResolvePin.ts`.

## Dependências
- `src/features/comments/hooks/useComments.ts` (já existe; estender pra aceitar `slide_index` e `reel_timestamp_s`).
- `src/types/comments.ts` (já existe; estender).
- shadcn `popover`, `avatar`, `badge`.

## Migração do `ImagePinOverlay` atual
1. Criar `CommentPinOverlay` novo com props acima.
2. `ImagePinOverlay` vira wrapper fino que chama `CommentPinOverlay` com `mode="internal"` + `mediaType="image"` + sem `slideIndex`.
3. Migrar consumidores um a um.
4. Remover legacy quando todos migrados.

## Dependências backend
- `comments` tabela (existe) precisa ganhar colunas:
  - `slide_index INT NULL`
  - `reel_timestamp_s NUMERIC(5,2) NULL`
- Ou criar tabela `approval_pins` dedicada que referencia `comments` (decisão do backend agent).

## Fora de escopo
- Desenho livre (arrow, rect) sobre a mídia — fase 2.
- Pin persistente em vídeo que se move com objeto (tracking) — fase 3.
