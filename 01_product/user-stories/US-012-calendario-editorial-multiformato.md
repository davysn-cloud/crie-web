---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: estrategista
feature_ref: F1 de [[../roles/estrategista]]
priority: P0
effort: L
---

# US-012 — Calendário editorial multiformato (mês/semana)

## Como / Quero / Para que
**Como** estrategista de conteúdo,
**quero** visualizar e manipular um calendário editorial mensal com thumbs e ícone do formato Instagram em cada slot,
**para que** eu consiga planejar a cadência de 1-5 marcas sem abrir cada post individualmente.

## Contexto
Base do painel do estrategista. O calendário precisa mostrar simultaneamente formato (Story 9:16, Feed 1:1, Feed 4:5, Reel, Carrossel) e pilar (via cor). Toda manipulação temporal flui daqui.

## Critérios de aceitação (Gherkin)

### Cenário 1: Visualizar o mês com thumbs e ícones de formato
**Dado** que estou logado como estrategista e selecionei a marca "Acme Co"
**Quando** abro a view "mês" do calendário editorial
**Então** vejo uma grade 7×5 com os dias do mês corrente
**E** cada slot com post exibe a thumb (80×80px) da arte principal
**E** um ícone do formato IG no canto superior direito (Story/Feed/Reel/Carrossel)
**E** a borda do card colorida com a cor do pilar associado.

### Cenário 2: Drag-drop reagenda post
**Dado** que existe um post agendado para 10/04 às 09:00
**Quando** arrasto o card para o slot de 12/04 às 18:00
**Então** o backend atualiza `scheduled_at` para 2026-04-12T18:00:00
**E** a fila de publicação do [[US-041-publicacao-meta-graph-api|social-media]] é reordenada
**E** uma notificação toast confirma "Post reagendado para 12/04 às 18h".

### Cenário 3: Conflito detectado ao drop
**Dado** que já existe um post agendado para 15/04 às 12:00 na marca "Acme Co"
**Quando** arrasto outro post para 15/04 às 12:00
**Então** o drop é rejeitado com modal de aviso "Conflito: outro post agendado nesta hora"
**E** o estrategista pode escolher "Mover mesmo assim" (offset ±15min automático) ou "Cancelar".

### Cenário 4: Toggle para ver grid do Instagram
**Dado** que estou na view do calendário
**Quando** ativo o toggle "Ver grid do Instagram"
**Então** a tela alterna para preview dos próximos 9 posts de feed organizados em 3 colunas
**E** posts que não são feed (Story/Reel sem cover) são ocultados
**E** posso voltar à view calendário com o mesmo toggle.

### Cenário 5: Filtros combinados
**Dado** que abri a sidebar esquerda
**Quando** marco pilar "Educativo" + formato "Carrossel"
**Então** apenas posts que satisfazem ambos os filtros permanecem visíveis
**E** um badge no topo mostra "12 de 47 posts visíveis".

## Dependências
- Backend: tabela `posts` (id, brand_id, format, pillar_id, scheduled_at, thumb_url), tabela `pillars`. Endpoint `GET /brands/:id/calendar?from&to`.
- Frontend: dnd-kit para drag-drop, componente `<Calendar />`, toggle view mode.
- Externas: none no MVP (dados internos).

## Fora de escopo
- Sincronização com Google Calendar (fase posterior).
- View anual.
- Edição inline do post no calendário (abre modal/drawer separado — [[US-015-brief-builder-handoff]]).

## Links
- [[../roles/estrategista]]
- [[US-013-gestor-pilares-distribuicao]]
- [[US-041-publicacao-meta-graph-api]]
