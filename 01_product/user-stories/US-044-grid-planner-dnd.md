---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: social-media
feature_ref: F4 de [[../roles/social-media]]
priority: P1
effort: M
---

# US-044 — Grid planner com drag-drop e detector de monotonia

## Como / Quero / Para que
**Como** social media,
**quero** ver os posts agendados como grid 3 colunas do IG com drag-drop para reordenar e alerta de 3 posts seguidos do mesmo pilar,
**para que** o feed mantenha variedade cromática e temática.

## Contexto
Complementa o [[US-037-grid-preview-instagram]] do designer com reordenação real que mexe em `scheduled_at`.

## Critérios de aceitação (Gherkin)

### Cenário 1: Visualizar grid com agendados + publicados
**Dado** que a marca tem 9 posts (6 publicados + 3 agendados)
**Quando** abro grid planner
**Então** vejo 3×3 com os 9 posts em ordem cronológica (mais recente/agendado no topo esquerdo)
**E** publicados com ícone check, agendados com ícone calendário.

### Cenário 2: Drag-drop recalcula horários
**Dado** que tenho 3 posts agendados para [2026-04-20, 04-22, 04-24]
**Quando** arrasto o post do dia 24 para a posição 2 (entre 20 e 22)
**Então** novo `scheduled_at` é calculado mantendo cadência (ex: meio entre 20 e 22 = 21)
**E** confirmação "Post reagendado de 24/04 para 21/04 14:00"
**E** backend valida conflitos ([[US-045-detector-conflitos-agendamento]]).

### Cenário 3: Alerta de monotonia
**Dado** que 3 posts consecutivos são do mesmo pilar "Vendas"
**Quando** grid renderiza
**Então** os 3 cards recebem badge amarelo "Mesmo pilar 3× seguido"
**E** tooltip sugere "Intercale com Educativo ou Bastidores".

### Cenário 4: Toggle "ver como cliente vê"
**Dado** que estou no grid planner
**Quando** ativo toggle "Ver como cliente vê"
**Então** apenas posts `published` aparecem (remove agendados/draft)
**E** simula exatamente o feed público do IG.

### Cenário 5: Gaps de conteúdo visíveis
**Dado** que há gap de 6 dias sem posts agendados
**Quando** grid renderiza
**Então** slot vazio visível com "6 dias sem post — agendar?"
**E** clique abre brief builder (ver [[US-015-brief-builder-handoff]]).

### Cenário 6: Reordenar bloqueado para publicados
**Dado** que arrasto um post `published`
**Quando** drop em nova posição
**Então** sistema bloqueia (posts já no ar não podem ser reordenados)
**E** aviso "Posts publicados não podem ser movidos".

## Dependências
- Backend: `GET /brands/:id/grid-planner`, endpoint `PATCH /publish-queue/:id/reschedule` com validação de conflito.
- Frontend: dnd-kit, recálculo client-side com confirmação server-side.
- Externas: none.

## Fora de escopo
- Planner anual.
- IA que sugere reordenação ótima (fase 2+).

## Links
- [[../roles/social-media]]
- [[US-037-grid-preview-instagram]]
- [[US-045-detector-conflitos-agendamento]]
