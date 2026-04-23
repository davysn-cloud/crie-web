---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: designer
feature_ref: F7 de [[../roles/designer]]
priority: P0
effort: M
---

# US-037 — Grid preview do Instagram (9 ou 12 posts)

## Como / Quero / Para que
**Como** designer,
**quero** ver os últimos 9 ou 12 posts publicados + próximos agendados + o post sendo editado em grid 3-colunas como no IG real,
**para que** eu cheque antes de finalizar se a peça nova conflita cromaticamente com o feed.

## Contexto
Crítico para manter estética do feed. Sem isso, designer cria arte bonita isolada mas feio no grid.

## Critérios de aceitação (Gherkin)

### Cenário 1: Ver grid com últimos 9 posts
**Dado** que a marca "Acme Co" tem 20 posts publicados + 3 agendados
**Quando** abro "Grid preview" com toggle "9 posts"
**Então** vejo grid 3×3 com os últimos 9 posts de feed em ordem cronológica decrescente
**E** crop central aplicado (simulando como IG mostra no grid)
**E** gap entre cards idêntico ao do IG (1px).

### Cenário 2: Slot do post sendo editado
**Dado** que estou editando um novo design
**Quando** abro o grid preview
**Então** o grid inclui "slot do post atual" na posição de próximo publicado
**E** o slot é destacado com borda pontilhada
**E** qualquer alteração no canvas atualiza o slot em tempo real (<500ms).

### Cenário 3: Toggle 9 / 12 posts
**Dado** que estou no modo 9 posts
**Quando** ativo toggle "12 posts"
**Então** grid vira 3×4 mostrando os últimos 12
**E** estado persiste na sessão.

### Cenário 4: Alerta de conflito cromático
**Dado** que o grid tem 9 posts azuis
**E** estou criando arte com paleta laranja dominante
**Quando** o slot do post atual aparece no grid
**Então** aviso visual "Conflito cromático — 9 posts consecutivos em tom azul"
**E** sugestão "considere usar cor do kit mais próxima do feed atual".

### Cenário 5: Posts não-feed ocultos
**Dado** que a marca tem Stories e Reels entre os últimos posts
**Quando** abro grid preview
**Então** Stories são filtrados (não aparecem no grid do IG)
**E** Reels aparecem usando a cover 1080×1350 (área central).

### Cenário 6: Drag-drop para simular reordem
**Dado** que vejo o grid
**Quando** arrasto um post agendado para outra posição
**Então** sistema atualiza `scheduled_at` do post (mantendo cadência)
**E** grid re-renderiza
**E** mesmo fluxo de [[US-044-grid-planner-dnd]] (o grid preview compartilha o componente).

## Dependências
- Backend: `GET /brands/:id/feed-posts?count=9|12&include_scheduled=true`, metadata de cor dominante em `designs`.
- Frontend: componente `<InstagramGrid />`, realtime update via Zustand.
- Externas: none.

## Fora de escopo
- Simulação mobile vs desktop do IG (não muda grid).

## Links
- [[../roles/designer]]
- [[US-044-grid-planner-dnd]]
- [[US-031-canvas-multiformato-presets-ig]]
