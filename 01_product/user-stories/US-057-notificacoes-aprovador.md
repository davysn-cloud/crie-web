---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: aprovador
feature_ref: F7 de [[../roles/aprovador]]
priority: P1
effort: S
---

# US-057 — Notificações do aprovador (e-mail digest + lembrete deadline)

## Como / Quero / Para que
**Como** aprovador,
**quero** receber e-mail digest (máx 1/marca/dia) com posts pendentes e lembrete 24h antes do deadline,
**para que** eu não seja spammado mas também não perca deadlines.

## Contexto
Cliente externo esquece se não notifica; mas notificar demais queima o canal.

## Critérios de aceitação (Gherkin)

### Cenário 1: Primeiro post cria digest do dia
**Dado** que não recebi e-mail hoje e chega 1º post pendente da marca X
**Quando** sistema dispara notificação
**Então** recebo e-mail "1 post pendente em [Marca X]" com thumb + link magic
**E** flag `daily_digest_sent=true` setada até meia-noite.

### Cenário 2: Segundo post no mesmo dia não dispara e-mail
**Dado** que já recebi digest da marca X hoje
**E** chega 2º post pendente
**Quando** sistema avalia
**Então** e-mail NÃO é disparado (dedup por dia por marca)
**E** post aparece na fila via magic link.

### Cenário 3: Lembrete 24h antes do deadline
**Dado** que um post pendente tem deadline 2026-04-16T10:00
**E** agora é 2026-04-15T10:00
**Quando** worker detecta deadline em 24h
**Então** dispara e-mail "Lembrete: aprove até amanhã 10h"
**E** mesmo que já tenha recebido digest hoje (prioridade alta).

### Cenário 4: Canal WhatsApp opcional (fase 2)
**Dado** que admin da agência configurou WhatsApp para aprovador
**Quando** e-mail seria disparado
**Então** mensagem WhatsApp também é enviada via API
**E** ambos respeitam o mesmo dedup.

### Cenário 5: Preferência desativar notificações
**Dado** que aprovador acessou "Preferências" no portal
**Quando** desativa "Receber e-mails"
**Então** sistema para de enviar digest mas mantém lembrete de deadline
**E** pode optar "não receber nada" via link "Parar notificações" no rodapé do e-mail.

### Cenário 6: Multi-marca consolidado em 1 e-mail
**Dado** que aprovador é de Marca A e Marca B e ambas têm posts pendentes
**Quando** digest dispara
**Então** envia 1 e-mail por marca (não consolida) para manter branding white-label
**E** cada e-mail usa logo/cor da marca correspondente (se configurado).

## Dependências
- Backend: worker cron de notificações, tabela `notification_logs` (approver_id, brand_id, type, sent_at).
- Frontend: página de preferências no portal do aprovador.
- Externas: Resend/SendGrid (e-mail), WhatsApp Business API (fase 2).

## Fora de escopo
- Push notification mobile (PWA — fase 2).

## Links
- [[../roles/aprovador]]
- [[US-067-white-label-subdominio]]
- [[US-058-magic-link-auth]]
