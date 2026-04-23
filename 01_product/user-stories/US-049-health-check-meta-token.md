---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: F9 de [[../roles/social-media]]
priority: P0
effort: S
---

# US-049 — Health check da conexão Meta + alerta pré-expiração

## Como / Quero / Para que
**Como** social media,
**quero** ver status do token Meta (dias até expirar) com alerta proativo 14 dias antes,
**para que** a conexão não caia no dia da publicação.

## Contexto
Meta tokens long-lived duram 60 dias. Sem alerta, agendamentos expiram sem aviso.

## Critérios de aceitação (Gherkin)

### Cenário 1: Status do token no painel
**Dado** que marca tem token com expires_at 2026-06-15
**Quando** abro o painel social-media em 2026-04-15
**Então** vejo card de saúde "Token Meta: 61 dias restantes"
**E** cor verde.

### Cenário 2: Alerta 14 dias antes
**Dado** que token expira em 2026-04-29 (14 dias)
**Quando** abro o painel em 2026-04-15
**Então** card muda cor para amarelo
**E** banner topo: "Token Meta expira em 14 dias — reconectar"
**E** botão "Reconectar agora" que abre flow OAuth.

### Cenário 3: Alerta crítico 3 dias antes
**Dado** que token expira em 2026-04-18 (3 dias)
**Quando** abro o painel
**Então** card vermelho
**E** e-mail automático para admin da agência
**E** bloqueio de novas publicações com status `blocked_by_token`.

### Cenário 4: Reconexão sem perder agendamentos
**Dado** que uso o flow de reconexão
**Quando** OAuth completa com novo token
**Então** todas as entries `scheduled` permanecem
**E** novo token é associado à marca
**E** worker retoma processamento sem perder entry.

### Cenário 5: Token expirado com agendamentos
**Dado** que token já expirou
**E** há 5 posts agendados para os próximos 7 dias
**Quando** worker tenta processar um deles
**Então** falha com erro auth
**E** status `blocked_by_token` em cada entry pendente
**E** social-media recebe alerta "5 posts bloqueados por token expirado".

### Cenário 6: Reconexão por marca independente
**Dado** que agência tem 3 marcas com tokens diferentes
**Quando** o token da marca A expira
**Então** apenas marca A fica com `blocked_by_token`
**E** marcas B e C continuam publicando normal.

## Dependências
- Backend: tabela `ig_integrations` (brand_id, ig_user_id, token, expires_at, scope, refreshed_at). Worker de health check diário. Flow OAuth para reconexão (ver [[US-068-conectar-instagram-oauth]]).
- Frontend: card de saúde no painel, banner de alerta, botão reconectar.
- Externas: Meta Graph API `/me?fields=id&access_token=...` para ping.

## Fora de escopo
- Refresh automático de token sem interação humana (Meta não permite).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-068-conectar-instagram-oauth]]
