---
created: 2026-04-15
updated: 2026-04-15
owner: Product Agent
status: draft
confidence: medium
---

# Roadmap

## Objetivo Atual
**MVP funcional em beta fechado com 3-5 agências piloto.**

## Fase 1 — MVP Core (atual)
- [ ] Auth + multi-tenant (workspaces por agência)
- [ ] CRUD de clientes (marcas) dentro do workspace
- [ ] Kanban de posts com drag & drop
- [ ] Upload de mídia (Supabase Storage)
- [ ] Comentários por card
- [ ] Fluxo de aprovação (pendente → aprovado/reprovado)
- [ ] Convite de membros da agência + convidados (cliente externo)

## Fase 2 — Beta Fechado
- [ ] Onboarding das 3-5 agências piloto
- [ ] Notificações por e-mail (Resend?)
- [ ] Dashboard de status por cliente
- [ ] Feedback loop semanal com pilotos

## Fase 3 — Monetização
- [ ] Billing (Stripe ou Lemon Squeezy — [[02_architecture/adr/billing-provider]])
- [ ] Planos (free trial, starter, pro)
- [ ] Landing pública + waitlist

## Decisões pendentes
- Billing: Stripe vs Lemon Squeezy
- Deploy: Vercel (provável)
- Transacionais: Resend (provável)

## Links
- [[01_product/ideia]]
- [[08_shared/briefing]]
