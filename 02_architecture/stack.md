---
created: 2026-04-15
updated: 2026-04-15
owner: Backend Agent
status: approved
confidence: high
---

# Stack Técnica

## Frontend
- **React 19** + **Vite** + **TypeScript**
- **Tailwind v4** + **shadcn/ui** (Radix)
- **Zustand** (estado global leve)
- **TanStack Query** (cache/server state)
- **React Hook Form** + **Zod** (forms + validação)
- **react-router v7**
- **dnd-kit** (kanban)
- **sonner** (toasts)

## Backend / Dados
- **Supabase**: Postgres + Auth + Storage + **RLS**
- Multi-tenant via RLS por `workspace_id`

## Pendências (ADRs abertas)
- [[02_architecture/adr/billing-provider]] — Stripe vs Lemon Squeezy
- [[02_architecture/adr/deploy-target]] — Vercel (provável)
- [[02_architecture/adr/transactional-email]] — Resend (provável)

## Links
- [[03_backend/schema]]
- [[04_frontend/design-system]]
