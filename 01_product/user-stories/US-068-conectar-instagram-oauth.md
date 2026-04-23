---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: admin
feature_ref: F9 de [[../roles/admin]]
priority: P0
effort: M
---

# US-068 — Conectar conta Instagram Business via OAuth Meta

## Como / Quero / Para que
**Como** admin (ou social-media com permissão),
**quero** conectar conta IG Business de cada marca via OAuth Meta com escopo mínimo,
**para que** publicação e insights funcionem sem compartilhar senha.

## Contexto
Primeiro pré-requisito para que [[US-041-publicacao-meta-graph-api]] e [[US-018-performance-panel-insights]] funcionem. Requer app Meta registrado + revisão.

## Critérios de aceitação (Gherkin)

### Cenário 1: Iniciar flow OAuth
**Dado** que marca "Acme" não tem IG conectado
**Quando** clico "Conectar Instagram" na config da marca
**Então** redirect para Facebook Login OAuth
**E** escopo solicitado: `instagram_basic`, `instagram_content_publish`, `instagram_manage_insights`, `pages_show_list`
**E** landing clara "crie-web precisa destas permissões para: publicar, ler insights".

### Cenário 2: Seleção de conta IG Business
**Dado** que usuário autorizou
**Quando** retorna com code
**Então** backend troca code por access_token
**E** exchange para long-lived token (60 dias)
**E** lista as contas IG Business disponíveis (pode ter várias)
**E** admin escolhe qual associar à marca.

### Cenário 3: Armazenamento seguro do token
**Dado** que conexão foi bem-sucedida
**Quando** salvo no banco
**Então** token fica encriptado (AES-256 com chave em env var separada)
**E** nunca aparece em logs ou responses de API
**E** `expires_at` é calculado a partir da resposta da Meta.

### Cenário 4: Erro de conta não-business
**Dado** que usuário escolheu conta IG pessoal (não-business)
**Quando** sistema detecta
**Então** erro claro "Apenas contas Business ou Creator podem publicar via API — converta em Business primeiro"
**E** link para o guia oficial da Meta.

### Cenário 5: Revogação externa
**Dado** que usuário revogou permissões no Facebook
**Quando** sistema detecta (via webhook ou falha de call)
**Então** marca a integração como `revoked`
**E** bloqueia publicações pendentes
**E** notifica admin para reconectar.

### Cenário 6: Permissão necessária para conectar
**Dado** que sou social-media (não admin)
**Quando** tento conectar
**Então** bloqueio se regra "conectar integração" está limitada ao admin
**E** aviso "Só admin pode conectar IG Business".

## Dependências
- Backend: rota OAuth callback `/integrations/meta/callback`, tabela `ig_integrations`, encryption helper, webhook Meta para user events.
- Frontend: botão "Conectar", seletor de conta IG, status da integração visível.
- Externas: Meta Graph API (App review obrigatório para scopes de publishing).

## Fora de escopo
- Multi-page Facebook (cross-post fase 2).

## Links
- [[../roles/admin]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-049-health-check-meta-token]]
- [[../../02_architecture/adr/publishing-strategy]]
