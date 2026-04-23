---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: estrategista
feature_ref: F6 de [[../roles/estrategista]]
priority: P1
effort: S
---

# US-017 — Biblioteca de hashtag sets por pilar/audiência

## Como / Quero / Para que
**Como** estrategista,
**quero** manter 3-5 hashtag sets por marca com 15-30 hashtags cada,
**para que** o copywriter reutilize combinações validadas em vez de reinventar a cada post.

## Contexto
Substitui planilhas "hashtag bank". Integra com [[US-021-editor-legenda-constraints-ig]] (sugestão no momento da redação) e [[US-043-primeiro-comentario-automatico]] (hashtags no 1º comentário).

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar hashtag set
**Dado** que estou nas configurações da marca
**Quando** crio um set "Educativo - Economia Doméstica" com 22 hashtags associadas ao pilar "Educativo"
**Então** o sistema valida que todas começam com `#`
**E** o sistema bloqueia duplicatas dentro do set
**E** avisa se o total >30 (limite do Instagram).

### Cenário 2: Validação de limite 30
**Dado** que um set tem 30 hashtags
**Quando** tento adicionar a 31ª
**Então** o input fica vermelho
**E** aparece "Limite do Instagram: 30 hashtags"
**E** a 31ª não é adicionada.

### Cenário 3: Sugestão de set no brief
**Dado** que estou em um brief com pilar "Educativo"
**E** a marca tem 2 sets no pilar "Educativo"
**Quando** o campo pilar é preenchido
**Então** os 2 sets aparecem como sugestão ordenados pelo uso recente
**E** seleção é opcional.

### Cenário 4: Métricas de performance do set
**Dado** que o set "Educativo - Economia" foi usado em 12 posts publicados
**E** Meta Graph API está conectada (ver [[US-018-performance-panel-insights]])
**Quando** abro detalhes do set
**Então** vejo "alcance médio dos posts com esse set: 4.2k" e "engajamento médio: 3.8%"
**E** vejo a lista dos 12 posts que usaram o set.

### Cenário 5: Arquivar set em vez de deletar
**Dado** que um set foi usado em posts históricos
**Quando** clico "Arquivar"
**Então** o set some do picker de brief mas continua ligado aos posts antigos
**E** pode ser reativado depois.

## Dependências
- Backend: tabela `hashtag_sets` (id, brand_id, name, hashtags[], pillar_id, archived_at). Tabela `post_hashtag_sets` para join.
- Frontend: CRUD com validações, picker no brief builder, métricas via join com Insights.
- Externas: Meta Graph API (opcional, para métricas).

## Fora de escopo
- Hashtag suggester IA — esse é job do copywriter ([[US-026-hashtag-suggester-ia]]).
- Detecção de shadowban de hashtag (fase 2).

## Links
- [[../roles/estrategista]]
- [[US-026-hashtag-suggester-ia]]
- [[US-043-primeiro-comentario-automatico]]
