---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: copywriter
feature_ref: F5 de [[../roles/copywriter]]
priority: P1
effort: S
---

# US-025 — Hook library com tagging de performance

## Como / Quero / Para que
**Como** copywriter,
**quero** salvar hooks (primeiras linhas/frases de abertura) por pilar e marca, com tag de performance (👍/👎),
**para que** eu reutilize aberturas comprovadas e aprenda o que rende.

## Contexto
Hook é a parte mais crítica de qualquer post. Ter um banco aprendível diferencia copywriter sênior de iniciante.

## Critérios de aceitação (Gherkin)

### Cenário 1: Salvar hook da legenda atual
**Dado** que escrevi "Você sabia que 80% das pessoas erram na hora de X?" no editor de legenda
**Quando** clico "Salvar como hook"
**Então** o hook vai para a biblioteca com marca atual + pilar atual
**E** posso adicionar tags extras no modal de salvamento.

### Cenário 2: Busca full-text
**Dado** que tenho 47 hooks salvos
**Quando** digito "economia" no buscador da hook library
**Então** apenas hooks com "economia" no texto aparecem
**E** resultado é instantâneo (<200ms) com destaque do termo.

### Cenário 3: Tag de performance após publicar
**Dado** que um post usou o hook "Você sabia que X?" e foi publicado há 7 dias
**E** Meta Insights (quando disponível) mostra engajamento 30% acima da média
**Quando** abro o post
**Então** vejo prompt "Esse hook performou bem — adicionar 👍?"
**E** clicando, o hook ganha +1 na coluna 👍.

### Cenário 4: Ranking por performance
**Dado** que tenho 50 hooks com histórico
**Quando** abro a library no modo "Top"
**Então** vejo hooks ordenados por % de 👍 / (👍 + 👎)
**E** apenas hooks com mínimo 3 usos aparecem no ranking (evita outliers).

### Cenário 5: Inserir hook no editor
**Dado** que estou escrevendo legenda e abro a sidebar "Hooks"
**Quando** clico em um hook da library
**Então** o texto do hook é inserido no início da legenda (cursor no fim do hook)
**E** o contador de chars do editor se atualiza.

### Cenário 6: Hooks por marca são privados
**Dado** que sou copywriter atribuído a Marca A e Marca B
**Quando** abro hook library com Marca A ativa
**Então** vejo apenas hooks de Marca A
**E** para acessar Marca B troco no seletor (ver [[US-020-selecionar-marca-contexto]]).

## Dependências
- Backend: tabela `hooks` (id, brand_id, text, pillar_id, tags[], upvotes, downvotes, created_by).
- Frontend: sidebar list, search input, inline insert, like/dislike buttons.
- Externas: Meta Insights (opcional para sugestão automática de upvote).

## Fora de escopo
- IA gerando hooks — diferente de [[US-028-brand-voice-ia]] (aquela gera legenda inteira).

## Links
- [[../roles/copywriter]]
- [[US-021-editor-legenda-constraints-ig]]
- [[US-026-cta-library]]
