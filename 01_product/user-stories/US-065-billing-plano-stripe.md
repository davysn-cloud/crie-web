---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: low
role: admin
feature_ref: F5 de [[../roles/admin]]
priority: P2
effort: XL
---

# US-065 — Billing & plano (Stripe) com limites visíveis

## Como / Quero / Para que
**Como** admin,
**quero** gerenciar plano (seats + marcas) via Stripe com upgrade/downgrade in-app e histórico de faturas,
**para que** billing seja self-service e previsível.

## Contexto
P2 (pós-beta). Depende de [[../../02_architecture/adr/billing-provider]] (Stripe vs Lemon Squeezy). Beta fechado é gratuito para as 3-5 agências piloto.

## Critérios de aceitação (Gherkin)

### Cenário 1: Plano atual visível
**Dado** que agência está no plano "Starter" (5 seats, 3 marcas)
**Quando** abro "Billing"
**Então** vejo "Plano Starter — R$ X/mês — próxima cobrança 20/05"
**E** uso atual: "4/5 seats · 3/3 marcas"
**E** 3/3 marcas destacado "limite atingido".

### Cenário 2: Upgrade in-app
**Dado** que estou no Starter e clico "Upgrade para Pro"
**Quando** confirmo na modal com preview de mudança (Pro: 15 seats, 10 marcas, R$ Y/mês)
**Então** Stripe Checkout abre e processa
**E** ao retornar com sucesso, plano ativo é Pro imediatamente
**E** limites atualizam na UI em <30s (webhook Stripe).

### Cenário 3: Downgrade com validação
**Dado** que estou no Pro (15 seats) e quero voltar para Starter (5 seats)
**E** atualmente tenho 8 membros ativos
**Quando** tento downgrade
**Então** bloqueio "Remova 3 membros antes de voltar ao Starter"
**E** link direto para remoção.

### Cenário 4: Cartão recusado
**Dado** que próxima cobrança falhou (cartão recusado)
**Quando** Stripe webhook dispara
**Então** e-mail para admin "Atualize método de pagamento"
**E** plano entra em grace period de 7 dias
**E** após 7 dias sem pagamento, serviço é suspenso (read-only).

### Cenário 5: Histórico de faturas
**Dado** que tenho 12 faturas
**Quando** abro "Histórico"
**Então** lista paginada com: data, plano, valor, status, PDF
**E** download de cada PDF disponível.

### Cenário 6: Trial
**Dado** que agência nova criou conta
**Quando** completa onboarding
**Então** ativa trial de 14 dias do plano Pro
**E** contagem regressiva visível no topo ("Trial: 10 dias restantes")
**E** fim do trial oferece conversão ou downgrade para free/starter.

### Cenário 7: Cancelamento
**Dado** que admin clica "Cancelar assinatura"
**Quando** confirma com razão (survey)
**Então** plano continua ativo até fim do ciclo atual
**E** após fim, vira `canceled` (dados preservados por 90 dias para re-ativação)
**E** após 90 dias, dados são anonimizados (LGPD).

## Dependências
- Backend: tabela `subscriptions` (agency_id, stripe_subscription_id, plan, status, current_period_end), `invoices`. Webhooks Stripe (`invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`). Endpoint `POST /billing/checkout`.
- Frontend: tela de billing, integração Stripe Checkout.
- Externas: **Stripe** (confirmar via [[../../02_architecture/adr/billing-provider]]).

## Fora de escopo
- Cobrança por uso além do plano fixo (fase 3+, ex: overage em posts publicados).

## Links
- [[../roles/admin]]
- [[../../02_architecture/adr/billing-provider]]
- [[US-061-gestor-marcas-brandkit]]
- [[US-062-atribuir-membros-marcas]]
