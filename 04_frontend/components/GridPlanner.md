---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — GridPlanner

Grid 3-colunas simulando o perfil do Instagram com drag-drop (dnd-kit). Usado em [[../screens/panel-estrategista]] (toggle "ver grid IG"), [[../screens/panel-designer]] (grid preview), [[../screens/panel-social-media]] (grid planner com reorder).

## API proposta
```tsx
type GridPlannerItem = {
  id: string;                    // post_card_id
  thumbUrl: string | null;
  format: IgFormat;
  status: "draft" | "approved" | "scheduled" | "published";
  scheduledAt?: string;
  publishedAt?: string;
  pillarToken?: string;          // --color-pillar-N
  title?: string;
};

type GridPlannerProps = {
  items: GridPlannerItem[];       // ordenados do mais recente para trás
  onReorder?: (items: GridPlannerItem[]) => void; // undefined = read-only
  highlightId?: string;           // destacar com ring (ex: post em edição)
  overlayMode?: "all" | "scheduled_only" | "published_only" | "client_view"; // client_view = published+approved
  columns?: 3;                    // sempre 3 (IG standard)
  rows?: 3 | 4;                   // 3 = 9 posts, 4 = 12 posts
  onItemClick?: (item: GridPlannerItem) => void;
  showConflicts?: boolean;        // marca items consecutivos com mesmo pilar
};
```

## Layout ASCII
```
┌────────────────────────────────┐
│ @handle · 12 posts             │ opcional header da marca
├────────┬────────┬──────────────┤
│  [🖼]   │  [🖼]   │  [🖼]        │ linha 1 (mais recentes)
│  🏷 pub │  🏷 pub │  🏷 sched    │
├────────┼────────┼──────────────┤
│  [🖼]   │  [🖼*]  │  [🖼]        │ linha 2 (* = highlight)
│  🏷 sched│  🏷 drft│  🏷 pub     │
├────────┼────────┼──────────────┤
│  [🖼]   │  [🖼]   │  [🖼]        │ linha 3
│ ⚠ cromático: 3 posts pilar 2 seguidos
└────────┴────────┴──────────────┘
```

## Comportamentos
- **Grid 3-col** (largura igual, `aspect-ratio: 1/1`) — IG corta 4:5 pra quadrado no grid, então preview usa `object-fit: cover`.
- **Drag-drop** (`@dnd-kit/core`) reorder item — `onReorder` recebe nova ordem. Se `onReorder` não fornecido, mode = **read-only** (só visualiza).
- **Reorder recalcula `scheduled_at`** (responsabilidade do consumidor) para manter cadência.
- **Detector de monotonia cromática** (`showConflicts`): se 3+ items consecutivos têm mesmo `pillarToken` OU paleta dominante similar (futuro), marca com borda destacada e alert discreto.
- **Highlight** (`highlightId`) — ring visual no item atualmente em edição.
- **Overlay mode**:
  - `all` = mostra tudo
  - `scheduled_only` = só agendados
  - `published_only` = só publicados
  - `client_view` = aprovado + publicado (simula visão do cliente no perfil).
- **Gap vazio** — se faltar item para preencher a posição, renderiza placeholder cinza com `+` (se editável) ou vazio (read-only).

## Análise cromática (futuro)
Fase 2: extrair cor dominante do thumb (via `color-thief-browser`) e alertar quando 3+ posts seguidos tiverem paleta muito similar (distância euclidiana em LAB < threshold).

## Acessibilidade
- Cada item: `<button role="gridcell" aria-label="{título} — {status} — {data}">`.
- Drag handle visível no hover + atalho teclado (`Space` pra pegar, arrows pra mover, `Enter` pra soltar).
- Status em ícone + label em tooltip (não só cor).

## Performance
- `React.memo` no `GridItem`.
- Thumbnails `loading="lazy"` + `width/height` fixos (evita layout shift).
- Máximo 12 items → sem virtualização necessária.

## Onde será implementado
`src/components/grid-planner/GridPlanner.tsx` (shared).
Subcomponentes:
- `./GridItem.tsx` — célula individual droppable + draggable.
- `./GridConflictBanner.tsx` — aviso cromático.
- `./usePillarConflicts.ts` — hook de detecção.

## Dependências
- `@dnd-kit/core` (já instalado).
- `embla-carousel-react` não necessário aqui.
- `src/lib/instagram.ts` — `IG_GRID_CROP` helper (centraliza 4:5 em 1:1).

## Fora de escopo
- Vídeo como thumbnail (MP4 preview) — fase 2.
- Auto-reorganização por sugestão de IA.
- Paleta cromática análise em tempo real.
