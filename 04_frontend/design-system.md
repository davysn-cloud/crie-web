---
created: 2026-04-15
updated: 2026-04-15
owner: Frontend Agent
status: draft
confidence: medium
---

# Design System

## Base
- **Tailwind v4** (tokens via CSS vars)
- **shadcn/ui** (Radix) como biblioteca de componentes
- **sonner** para toasts

## Padrões
- Forms: React Hook Form + Zod, erros inline.
- Fetch: TanStack Query — chaves por workspace/client.
- Estado local compartilhado: Zustand (somente UI state, não server data).

## Telas do MVP
- `/login` e `/signup`
- `/onboarding` (cria workspace)
- `/w/:slug` — dashboard da agência
- `/w/:slug/clients/:id` — kanban da marca
- `/w/:slug/clients/:id/posts/:postId` — detalhe do card
- `/invite/:token` — aceitar convite (cliente externo)

## Links
- [[02_architecture/stack]]
- [[04_frontend/flows/aprovacao]]
