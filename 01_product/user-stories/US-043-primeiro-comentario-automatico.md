---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: F3 de [[../roles/social-media]]
priority: P0
effort: S
---

# US-043 — Primeiro comentário automático (hashtags/menções fora da legenda)

## Como / Quero / Para que
**Como** social media,
**quero** configurar um "1º comentário" separado (geralmente hashtags) que é postado automaticamente 0-5s após o post,
**para que** a legenda fique limpa e as hashtags não poluam o texto.

## Contexto
Prática comum e validada em social media. Meta API suporta post de comentário no próprio media object.

## Critérios de aceitação (Gherkin)

### Cenário 1: Campo separado no agendamento
**Dado** que estou configurando um post para agendar
**Quando** abro o form de publicação
**Então** vejo campo "Primeiro comentário (opcional)"
**E** pode herdar hashtag set escolhido no brief (ver [[US-017-hashtag-sets-biblioteca]]) via botão "Usar set de hashtags"
**E** limite 2.200 chars (igual legenda).

### Cenário 2: Postagem automática pós-publicação
**Dado** que o post foi publicado com sucesso em T=0
**Quando** worker detecta `published` com `first_comment` preenchido
**Então** dispara call `/{ig-media-id}/comments` com o texto do 1º comentário
**E** timestamp do comentário é T+0 até T+5s
**E** status fica `published_with_comment=true`.

### Cenário 3: Falha no comentário não falha o post
**Dado** que o post foi publicado com sucesso
**E** a call de comentário falhou (5xx)
**Quando** worker detecta falha
**Então** post continua `published`
**E** entry de retry separada para só o comentário (max 3 tries)
**E** após 3 falhas, notifica "1º comentário falhou — adicione manual".

### Cenário 4: Inserção via hashtag suggester
**Dado** que o copywriter usou [[US-027-hashtag-suggester-ia|hashtag suggester]] e escolheu destino "1º comentário"
**Quando** post é agendado
**Então** campo `first_comment` vem pré-preenchido com hashtags selecionadas (cada uma separada por espaço).

### Cenário 5: Preview do que será postado
**Dado** que estou agendando
**Quando** olho preview do post
**Então** vejo mockup com legenda limpa + badge "1º comentário será postado automaticamente: 22 hashtags".

## Dependências
- Backend: campo `first_comment` em `publish_queue`. Lógica no worker: após `/media_publish` sucesso, disparar `/comments`.
- Frontend: campo opcional no form de publicação, botão "usar hashtag set".
- Externas: Meta Graph API Comments endpoint.

## Fora de escopo
- Agendar múltiplos comentários em sequência.
- Resposta a comentários automática (fase 2+).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-017-hashtag-sets-biblioteca]]
- [[US-027-hashtag-suggester-ia]]
