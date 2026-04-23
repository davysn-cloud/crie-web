---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: high
decided_on: 2026-04-15
---

# ADR 011 — Nomenclatura do schema (`workspaces` vs `brands`, `post_cards` vs `posts`)

## Contexto
Auditoria de 2026-04-15 revelou que `03_backend/schema.md` usava nomes idealizados (`clients`, `posts`, `approvals`) que não batem com o banco real já aplicado em 7 migrations + código em `src/` (`workspaces`, `workspace_members`, `post_cards`, `copy_versions`, `asset_versions`, `comments`, `stage_transitions`, `agencies`, `agency_members`, `agency_invites`).

Opções:
- **A — Renomear para vocabulário de produto** (`workspaces → brands`, `post_cards → posts`, `workspace_members → brand_members`) para alinhar schema com linguagem do usuário.
- **B — Manter os nomes atuais** (`workspaces`, `post_cards`) e documentar o mapeamento.

## Decisão
**Opção B — manter `workspaces` e `post_cards`.**

Mapeamento canônico (documentar em `03_backend/schema.md` topo):
| Nome no DB/código | Nome no produto/UI | Nome na conversa |
|---|---|---|
| `agencies` | Agência | Agência |
| `workspaces` | Marca | Cliente / Brand |
| `workspace_members` | Time da marca | Time |
| `post_cards` | Post | Post / Conteúdo |
| `agency_members` | Membro da agência | Time |
| `approvers` (novo) | Aprovador | Cliente |

## Justificativa
- **Churn enorme evitado:** renomear tocaria todas as migrations aplicadas + `src/features/workspace/*`, `src/features/post-card/*`, tipos, queries. Alto risco de regressão.
- **Nomes técnicos ≠ nomes de UI** é prática comum e aceitável — UI sempre mostra "Marca" e "Post" pro usuário.
- `post_cards` tem significado histórico (veio do kanban onde posts são cards) — razoável.
- `workspaces` é neutro e tecnicamente correto (uma marca É um workspace multi-usuário dentro da agência).

## Consequências
- **Regra de ouro:** código de backend usa `workspace_id`, `post_card_id`. UI/produto usa "marca" e "post". Tradução acontece na camada de apresentação (labels, i18n).
- Novas tabelas seguem o padrão existente (ex: `workspace_assets`, `post_card_versions`, `post_card_formats`).
- Documentação em `01_product/` usa vocabulário de produto ("marca", "post"); documentação em `03_backend/` usa vocabulário técnico.
- `03_backend/schema.md` ganha uma **tabela de tradução no topo** para reduzir confusão futura.

## Riscos
- Desenvolvedor novo confunde `workspace` com "ambiente de desenvolvimento" — mitigação: README + tabela de tradução.

## Alternativas consideradas
- **Renomear gradual** via VIEWs (`CREATE VIEW brands AS SELECT * FROM workspaces`) — gera duplicação e não resolve código.
- **Renomear tudo agora** — rejeitado por churn excessivo.

## Links
- [[../../03_backend/schema]] (fonte canônica)
- [[../../03_backend/audit-2026-04-15]] (onde a divergência foi identificada)
