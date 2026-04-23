---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: estrategista
feature_ref: F4 de [[../roles/estrategista]]
priority: P0
effort: L
---

# US-015 — Brief builder estruturado com handoff automático

## Como / Quero / Para que
**Como** estrategista,
**quero** preencher um brief estruturado e enviar simultaneamente para copywriter e designer,
**para que** a produção comece sem reuniões intermediárias.

## Contexto
Primeiro artefato crítico do handoff do time. O brief canônico alimenta a fila do [[US-021-editor-legenda-constraints-ig|copywriter]] e do [[US-031-canvas-multiformato-presets-ig|designer]] em paralelo.

## Critérios de aceitação (Gherkin)

### Cenário 1: Abrir brief builder em slot vazio do calendário
**Dado** que estou no calendário editorial com slot vazio em 20/04 às 10:00
**Quando** clico no slot vazio
**Então** abre um drawer lateral com o brief builder
**E** o campo "prazo de publicação" já vem preenchido com 2026-04-20T10:00:00.

### Cenário 2: Preencher brief válido e enviar
**Dado** que abri o brief builder
**Quando** preencho os 7 campos obrigatórios: objetivo (awareness), pilar (educativo), formato IG (Carrossel 1080×1350), audiência (donas de casa 30-45), mensagem-chave ("5 dicas para economizar em compras"), CTA ("salva esse post"), assignees (copywriter João + designer Maria)
**E** clico em "Enviar"
**Então** um post é criado com status `briefing_done`
**E** aparece na fila do João com prazo de 2026-04-20
**E** aparece na fila da Maria com prazo de 2026-04-20
**E** ambos recebem notificação in-app.

### Cenário 3: Validação de campos obrigatórios
**Dado** que preenchi apenas 5 dos 7 campos obrigatórios
**Quando** clico em "Enviar"
**Então** o botão permanece desabilitado
**E** os 2 campos faltantes ficam com borda vermelha e mensagem "Campo obrigatório"
**E** nenhum post é criado.

### Cenário 4: Anexar referências do swipe file
**Dado** que abri o brief builder
**Quando** clico em "Anexar referência" e seleciono 3 itens do swipe file
**Então** as 3 referências aparecem como thumbnails anexados ao brief
**E** ao enviar, copywriter e designer veem as 3 referências nos cards deles.

### Cenário 5: Sugestão de hashtag set ao escolher pilar
**Dado** que escolhi o pilar "Educativo" e a marca "Acme Co" tem 2 hashtag sets associados a esse pilar
**Quando** o campo pilar é preenchido
**Então** um card "Hashtag sets sugeridos" aparece com os 2 sets (nome + preview de 5 hashtags cada)
**E** seleção é opcional (pode herdar no momento da redação).

### Cenário 6: Salvar como rascunho
**Dado** que preenchi 4 dos 7 campos
**Quando** clico em "Salvar rascunho"
**Então** o brief é salvo com status `draft`
**E** não aparece nas filas de copywriter/designer
**E** posso reabrir depois para completar.

## Dependências
- Backend: tabela `briefs` (id, post_id, brand_id, objective, pillar_id, format, audience, key_message, cta, references_json, deadline_at, created_by, status). Endpoint `POST /briefs`.
- Frontend: drawer lateral, React Hook Form + Zod, multi-select de assignees, attach de referências.
- Externas: none.

## Fora de escopo
- IA que pré-preenche brief a partir de data comercial (fase 2).
- Templates de brief salvos (próxima iteração — usar [[US-019-duplicar-adaptar-post]]).

## Links
- [[../roles/estrategista]]
- [[US-021-editor-legenda-constraints-ig]]
- [[US-031-canvas-multiformato-presets-ig]]
