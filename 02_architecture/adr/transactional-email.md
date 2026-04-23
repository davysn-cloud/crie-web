---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: high
decided_on: 2026-04-15
---

# ADR — E-mail Transacional

## Contexto
Precisamos enviar: convite de membro do time, **magic link do aprovador** (crítico — ver [[006-approver-auth]]), notificação de aprovação pendente, pedido de ajuste, reminder 24h.

## Decisão
**Resend.**

## Justificativa
- DX excelente, API simples (`POST /emails`).
- Templates em React (compatível com nossa stack) via `@react-email/components`.
- Free tier 3k e-mails/mês, 100/dia — atende beta fechado (5 agências × ~50 e-mails/mês).
- Domain verification com SPF/DKIM guiada — habilita white-label de e-mail (Fase 2) com from-address da agência.

## Consequências
- `RESEND_API_KEY` em Supabase Edge Function secrets (nunca no frontend).
- Edge Function `send-email` como única interface (templates centralizados).
- Domínio `crie-web.com` (ou o que for) precisa ser verificado no Resend antes do primeiro envio de produção.
- Para white-label (Fase 2) cada agência configura seu próprio domínio via painel de admin — Resend permite múltiplos domains na mesma conta.

## Alternativas consideradas
- Postmark — excelente entregabilidade mas mais caro e DX menos moderna.
- SES — barato mas DX ruim e sem templates out-of-the-box.
- SendGrid — evitado (histórico de marcar como spam, UX datada).
