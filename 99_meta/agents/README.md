---
created: 2026-04-15
updated: 2026-04-15
owner: coordinator
status: active
confidence: high
---

# Time de Agents — Índice humano

> **Fonte da verdade:** os sub-agents reais são definidos em `.claude/agents/*.md` (lidos pelo Claude Code).
> Este arquivo é só um índice legível para humanos.

## Organização
- **Coordinator** → é a **sessão principal** do Claude Code (eu, quando você conversa comigo). Regras em `[[CLAUDE]]`.
- **Sub-agents especialistas** → invocados via `Agent` tool, rodam em paralelo, contexto isolado:

| Agent | Arquivo | Domínio | Vault |
|---|---|---|---|
| product | `.claude/agents/product.md` | Ideia, user stories, roadmap | `01_product/` |
| backend | `.claude/agents/backend.md` | Supabase, schema, RLS, API | `02_architecture/`, `03_backend/`, `supabase/` |
| frontend | `.claude/agents/frontend.md` | React, UI, fluxos | `04_frontend/`, `src/` |
| qa | `.claude/agents/qa.md` | Testes, segurança, edge cases | `05_tests/` |
| deploy | `.claude/agents/deploy.md` | Vercel, env, landing, marketing | `06_deploy/` |

## Como invocar
- Usuário → Coordinator (sessão principal).
- Coordinator decide quais sub-agents acionar e dispara **em paralelo** quando independentes.
- Cada sub-agent lê `08_shared/briefing.md` antes, escreve no vault depois, e adiciona linha no histórico do briefing.

## Links
- [[CLAUDE]] — regras gerais do time
- [[08_shared/briefing]] — memória viva
- [[02_architecture/stack]] — stack técnico
- [[01_product/roadmap]] — roadmap
