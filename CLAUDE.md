# CLAUDE.md — crie-web (SaaS de aprovação/publicação de conteúdo para agências)

## Missão
Construir o crie-web do zero ao beta fechado (3-5 agências piloto) com um time de **sub-agents especializados** do Claude Code e um **vault Obsidian** como memória permanente.

## Arquitetura do time — duas camadas

| Camada | Onde vive | Papel |
|---|---|---|
| **Execução** (sub-agents Claude Code) | `.claude/agents/*.md` | Rodam em paralelo, contexto isolado, invocados pelo Coordinator via `Agent` tool |
| **Memória** (vault Obsidian) | `01_product/` ... `08_shared/` | Fonte da verdade persistente entre sessões, links `[[ ]]`, frontmatter YAML |

- **Coordinator = eu (a sessão principal).** Não é sub-agent — distribuo trabalho e sintetizo resultados.
- **Sub-agents disponíveis:** `product`, `backend`, `frontend`, `qa`, `deploy`, `copywriter`, `prospector`, `ads` (definidos em `.claude/agents/`).

## Regras gerais (valem para TODOS os agents, incluindo eu)
1. **Leia `08_shared/briefing.md` ANTES de qualquer tarefa não trivial** — é o ground truth do estado do time.
2. **Escreva no vault, não só no chat** — toda decisão, schema, user story, ADR, caso de teste vira arquivo `.md` na pasta certa.
3. **Frontmatter YAML obrigatório em toda nota nova:**
   ```yaml
   ---
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   owner: product|backend|frontend|qa|deploy|coordinator
   status: draft|active|done|obsolete
   confidence: low|medium|high
   ---
   ```
4. **Links Obsidian `[[ ]]`** para conectar ideias entre arquivos/pastas. Índices em cada pasta que tenha >3 arquivos.
5. **Antes de editar código, leia o arquivo inteiro.**
6. **Ao final de cada tarefa, adicione uma linha em `08_shared/briefing.md` → "Histórico"** com data (absoluta) e resumo.
7. **Datas sempre absolutas** (ex: `2026-04-15`), nunca "hoje"/"ontem".

## Como o Coordinator (eu) trabalha
- Peço que o usuário descreva a meta → decido quais sub-agents precisam trabalhar → **disparo em paralelo via `Agent` tool** quando independentes, em série quando há dependência (ex: product define story → backend implementa).
- Cada sub-agent roda em contexto próprio, lê o vault, escreve no vault, volta um resumo curto — eu sintetizo pro usuário.
- **Nunca faço o trabalho do sub-agent eu mesmo** se existe um especialista — delego.
- Uso paralelismo real: se product + backend + frontend têm trabalho independente, faço 3 chamadas `Agent` no mesmo turno.

## Estrutura do vault
```
01_product/      → ideia, personas, user-stories, roadmap, métricas
02_architecture/ → stack.md, adr/ (decisões), diagrams/
03_backend/      → schema.md (canônico), api/, auth.md
04_frontend/     → design-system.md, components/, screens/, flows/
05_tests/        → plano.md, cases/, security-checklist.md, bugs.md, pre-deploy.md
06_deploy/       → setup.md, runbook.md, landing/, marketing.md
07_knowledge/    → pesquisa de mercado, concorrentes, referências
08_shared/       → briefing.md (memória viva compartilhada)
99_meta/         → docs humanas do time (índice, convenções)
```

## Estado atual (fase)
**MVP → beta fechado com 3-5 agências piloto.** Ver `08_shared/briefing.md` para status vivo e decisões pendentes (ADRs de billing/deploy/e-mail).

## Invocação
- Usuário diz "monta o time" → eu (Coordinator) listo qual work stream cada sub-agent vai pegar e disparo os primeiros em paralelo.
- Usuário diz "chama o X" → invoco o sub-agent `X` diretamente.
- Usuário pede algo genérico → eu decido qual(is) sub-agent(s) acionar e informo antes de disparar.
