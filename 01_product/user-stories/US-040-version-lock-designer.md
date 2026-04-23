---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: designer
feature_ref: F10 de [[../roles/designer]]
priority: P0
effort: M
---

# US-040 — Version lock do design (draft → approved congelado)

## Como / Quero / Para que
**Como** designer,
**quero** que o status do design flua `draft → review → approved → published` com a versão aprovada congelada (hash do arquivo salvo),
**para que** após aprovação nenhuma edição acidental altere o que foi aprovado.

## Contexto
Paralelo com [[US-029-versionamento-diff-copy]] mas para artes. Arte aprovada vira imutável; nova edição cria nova versão.

## Critérios de aceitação (Gherkin)

### Cenário 1: Transição draft → review
**Dado** que salvei design em `draft`
**Quando** clico "Enviar para review"
**Então** status vira `review`
**E** designer não pode mais editar essa versão direto
**E** revisores internos (outros membros do time) podem comentar.

### Cenário 2: Congelar em approved
**Dado** que um design está em `review` e o aprovador externo clicou "Aprovar"
**Quando** o sistema registra a aprovação
**Então** status vira `approved`
**E** hash SHA-256 do arquivo final é salvo em `designs.content_hash`
**E** imagem/vídeo é copiada para bucket imutável `approved-media/<hash>`
**E** o botão "editar" fica desabilitado nessa versão.

### Cenário 3: Editar aprovado cria nova versão
**Dado** que v3 está `approved`
**Quando** clico "Editar" e o sistema confirma "Isso vai criar v4 e voltar status para draft — prosseguir?"
**E** confirmo
**Então** v4 é criada como `draft`
**E** v3 permanece intocada com seu hash
**E** post volta para status `in_design`.

### Cenário 4: Diff visual entre versões
**Dado** que seleciono v2 e v3 no histórico
**Quando** clico "Comparar"
**Então** vejo slider antes/depois com as duas imagens
**E** overlay vermelho nas áreas modificadas (usando pixel diff)
**E** funciona para imagens e vídeo (frame-a-frame no vídeo).

### Cenário 5: Publicação bloqueia sem approved
**Dado** que [[US-041-publicacao-meta-graph-api|social-media]] tenta agendar
**Quando** nenhuma versão do design está `approved`
**Então** agendamento é bloqueado
**E** aviso "Design precisa estar aprovado antes de agendar".

### Cenário 6: Status published após publicação
**Dado** que o post foi ao ar via Meta API
**Quando** a publicação confirma
**Então** status do design aprovado vira `published`
**E** referência do ig_media_id é salva para puxar insights depois.

## Dependências
- Backend: campos em `designs` (status, content_hash, approved_at, published_at, ig_media_id). Triggers/RLS para bloquear edit de approved.
- Frontend: histórico de versões, diff visual, botões com transições de estado.
- Externas: biblioteca pixel-diff (pixelmatch).

## Fora de escopo
- Diff de layers (só diff de output final no MVP).

## Links
- [[../roles/designer]]
- [[US-029-versionamento-diff-copy]]
- [[US-041-publicacao-meta-graph-api]]
