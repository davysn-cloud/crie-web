---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: copywriter
feature_ref: F10 de [[../roles/copywriter]]
priority: P0
effort: S
---

# US-030 — Solicitar aprovação do cliente (copy + arte)

## Como / Quero / Para que
**Como** copywriter,
**quero** enviar o post (legenda + arte pronta do designer) para a fila do aprovador externo,
**para que** o cliente veja a peça completa em preview Instagram-nativo.

## Contexto
Momento crítico do fluxo interno → externo. Precisa validar que arte e copy estão prontas antes de enviar para evitar aprovação incompleta.

## Critérios de aceitação (Gherkin)

### Cenário 1: Enviar quando copy e arte estão prontas
**Dado** que a legenda está em versão v3 e a arte do designer em `ready_for_review`
**Quando** clico "Solicitar aprovação"
**Então** post muda para status `pending_client_approval`
**E** notificação é disparada para o aprovador via e-mail com magic link (ver [[US-058-magic-link-auth]])
**E** o post entra na fila do aprovador em [[US-051-fila-aprovacao-mobile]].

### Cenário 2: Bloqueio se arte ainda não está pronta
**Dado** que a arte está em `in_design`
**Quando** clico "Solicitar aprovação"
**Então** o botão fica desabilitado
**E** aviso "Aguardando arte do designer (Maria)".

### Cenário 3: Bloqueio se legenda >2200 chars
**Dado** que a legenda tem 2250 chars
**Quando** clico "Solicitar aprovação"
**Então** bloqueio com "Legenda acima do limite de 2200 chars — corrija antes de enviar"
**E** o cursor pula para o contador em vermelho.

### Cenário 4: Seleção de múltiplos aprovadores
**Dado** que a marca tem 2 aprovadores cadastrados (Dono + Gerente)
**Quando** clico "Solicitar aprovação"
**Então** vejo checkbox: "Enviar para todos os aprovadores" (default) ou seleção individual
**E** cada aprovador selecionado recebe link único.

### Cenário 5: Revogação se ainda pendente
**Dado** que enviei para aprovação há 30min e ninguém abriu
**Quando** clico "Cancelar solicitação"
**Então** os magic links são invalidados
**E** o post volta para `in_design` ou `in_copy`.

### Cenário 6: Bloqueio de reenvio se já aprovado sem edição
**Dado** que o post já foi aprovado em v5 e não houve edição
**Quando** clico "Solicitar aprovação"
**Então** aviso "Post já aprovado — nenhuma mudança desde última aprovação".

## Dependências
- Backend: transição de status `in_copy|in_design → pending_client_approval`, geração de magic_link, envio e-mail.
- Frontend: botão com validações pré-envio, seletor de aprovadores.
- Externas: Resend (e-mail), ver [[../../02_architecture/adr/transactional-email]].

## Fora de escopo
- Lógica de múltiplos aprovadores com votação (fase 2 — [[US-060-multi-aprovador-votacao]]).

## Links
- [[../roles/copywriter]]
- [[US-051-fila-aprovacao-mobile]]
- [[US-058-magic-link-auth]]
- [[US-060-multi-aprovador-votacao]]
