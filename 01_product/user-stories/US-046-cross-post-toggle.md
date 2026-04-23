---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: low
role: social-media
feature_ref: F6 de [[../roles/social-media]]
priority: P2
effort: M
---

# US-046 — Cross-post: Reel → Facebook, Reel → Stories, Feed → Stories

## Como / Quero / Para que
**Como** social media,
**quero** toggle para replicar automaticamente Reel no Facebook, Reel como Stories (24h) e Feed post com notificação em Stories,
**para que** o conteúdo alcance maior audiência sem esforço manual.

## Contexto
Feature de polimento, não crítica para MVP. Depende de Meta permitir cross-post (Reel → FB é nativo, Stories-share é via call separada).

## Critérios de aceitação (Gherkin)

### Cenário 1: Reel com toggle Facebook
**Dado** que estou agendando Reel
**Quando** ativo toggle "Cross-post para Facebook"
**Então** sistema agenda call adicional `/page-id/video_stories` com o mesmo asset
**E** status mostra 2 publicações (IG Reel + FB).

### Cenário 2: Reel compartilhado em Stories
**Dado** que Reel foi publicado com toggle "Reshare em Stories"
**Quando** worker confirma publicação do Reel
**Então** dispara call para criar Story com media_type=reel_share e ig_media_id referenciado
**E** Story dura 24h padrão.

### Cenário 3: Feed → notificação em Stories
**Dado** que Feed post foi publicado com toggle "Notificar em Stories"
**Quando** worker confirma publicação do Feed
**Então** cria Story com template "Novo post" referenciando o ig_media_id do feed
**E** Stories inclui link "Ver post".

### Cenário 4: Conta FB não conectada
**Dado** que ativo toggle Facebook mas a marca não tem FB Page linkada
**Quando** tento agendar
**Então** aviso "Conecte a Página do Facebook para cross-post"
**E** link para [[US-068-conectar-instagram-oauth|Admin: conectar integrações]].

### Cenário 5: Falha no cross-post não falha principal
**Dado** que o Reel foi publicado com sucesso no IG
**E** o cross-post FB falhou
**Quando** worker detecta falha
**Então** status principal permanece `published`
**E** sub-status `cross_post_failed` com opção "tentar novamente".

## Dependências
- Backend: campos `cross_post_fb`, `reshare_as_story`, `notify_in_story` em `publish_queue`. Calls adicionais no worker.
- Frontend: toggles no form de agendamento.
- Externas: Meta Graph API (Pages API para FB, Stories API para reshare).

## Fora de escopo
- Cross-post para LinkedIn, Twitter, TikTok (outro produto).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
