---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: high
decided_on: 2026-04-15
---

# ADR — Billing Provider

## Contexto
Precisamos cobrar agências na Fase 3 (pós-beta). Duas opções principais: Stripe (mais controle, NF própria) e Lemon Squeezy (Merchant of Record, fee maior).

## Decisão
**Stripe.**

## Justificativa
- Público inicial é BR; CNPJ + contabilidade já previstos no plano operacional da agência cliente.
- Stripe tem suporte nativo a Pix e Boleto no Brasil, crítico para o ICP.
- Margem maior no longo prazo.
- Integração com Supabase via webhook + Edge Function é padrão conhecido.

## Consequências
- Precisamos lidar com emissão de NF (terceirizar via NFe.io ou Nota fiscal automatizada).
- Edge Function `stripe-webhook` precisa validar signature e atualizar `agencies.plan` + `agency_subscriptions`.
- Secret `STRIPE_SECRET_KEY` vive apenas em Supabase Edge Function secrets (nunca no frontend).
- Escopo Fase 3 — não bloqueia MVP beta fechado.

## Alternativas consideradas
- Lemon Squeezy — rejeitado: fee maior e pagamentos em BRL dependem de conversão.
- Paddle — rejeitado: API menos madura.
