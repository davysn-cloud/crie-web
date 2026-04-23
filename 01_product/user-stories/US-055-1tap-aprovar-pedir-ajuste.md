---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: aprovador
feature_ref: F4 de [[../roles/aprovador]]
priority: P0
effort: M
---

# US-055 — 1-tap aprovar / pedir ajuste com confirmação

## Como / Quero / Para que
**Como** aprovador,
**quero** aprovar com swipe de confirmação (evitar tap acidental) e pedir ajuste selecionando motivo obrigatório,
**para que** a decisão seja explícita e rastreável.

## Contexto
Aprovação dispara pipeline de publicação — não pode ser acidental. "Pedir ajuste" precisa categorizar para orientar o time.

## Critérios de aceitação (Gherkin)

### Cenário 1: Aprovação com swipe
**Dado** que decidi aprovar
**Quando** toco "Aprovar"
**Então** aparece overlay "Deslize para confirmar aprovação →"
**E** preciso fazer swipe completo (>80% da tela) para confirmar
**E** tap simples não confirma.

### Cenário 2: Feedback tátil/visual de confirmação
**Dado** que completei o swipe
**Quando** aprovação é registrada
**Então** animação de check verde ocupa tela por 1s
**E** haptic feedback no mobile (se suportado)
**E** card próximo da fila entra.

### Cenário 3: Registro de auditoria
**Dado** que aprovei um post
**Quando** sistema grava
**Então** registra: `approver_id`, `post_version_id`, `design_version_id`, `approved_at`, `ip_address`, `user_agent`
**E** registro é imutável (append-only).

### Cenário 4: Pedir ajuste com motivo obrigatório
**Dado** que decidi pedir ajuste
**Quando** toco "Pedir ajuste"
**Então** dropdown abre com 4 opções: copy, arte, timing, outro
**E** campo texto opcional abaixo
**E** botão "Enviar" desabilitado até escolher motivo.

### Cenário 5: Roteamento de notificação por motivo
**Dado** que pedi ajuste com motivo "copy"
**Quando** envio
**Então** apenas copywriter atribuído recebe notificação
**E** "arte" notifica só designer
**E** "timing" notifica social-media
**E** "outro" notifica time inteiro (social + design + copy).

### Cenário 6: Histórico de decisões no post
**Dado** que post teve ciclo: aprovar → pedir ajuste → aprovar
**Quando** abro histórico
**Então** vejo timeline das 3 decisões com quem e quando
**E** cada "pedir ajuste" com motivo + comentário.

### Cenário 7: Bloqueio de aprovação sem login
**Dado** que magic link expirou
**Quando** tento aprovar
**Então** bloqueio com "Sessão expirada — solicite novo link"
**E** link gera novo magic link automaticamente.

## Dependências
- Backend: transição de status com auditoria (post `approved` | `changes_requested`), tabela `approval_actions`, enum `change_reason`. Endpoint `POST /approvals/:post_id/approve` e `/request-changes`.
- Frontend: swipe gesture (framer-motion), dropdown de motivo, haptic.
- Externas: none.

## Fora de escopo
- Aprovação em lote de vários posts (fase 2).

## Links
- [[../roles/aprovador]]
- [[US-056-historico-post-timeline]]
- [[US-058-magic-link-auth]]
