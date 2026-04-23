---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: admin
feature_ref: F7 de [[../roles/admin]]
priority: P0
effort: S
---

# US-066 — Gestão de aprovadores e magic links

## Como / Quero / Para que
**Como** admin,
**quero** listar aprovadores ativos por marca com último acesso e poder revogar/re-emitir links,
**para que** eu controle quem aprova o quê.

## Contexto
Cliente da agência muda pessoa responsável frequentemente. Sem revogação rápida, risco de aprovação por ex-colaborador do cliente.

## Critérios de aceitação (Gherkin)

### Cenário 1: Lista de aprovadores por marca
**Dado** que marca "Acme" tem 2 aprovadores cadastrados
**Quando** abro "Aprovadores" na marca
**Então** vejo tabela com: nome, e-mail, último acesso, # posts aprovados, status (ativo/revogado)
**E** ordenação por último acesso.

### Cenário 2: Adicionar novo aprovador
**Dado** que quero adicionar "cliente@acme.com"
**Quando** clico "Adicionar" e preencho nome + e-mail
**Então** aprovador é criado
**E** magic link inicial é gerado e enviado por e-mail
**E** aparece como "ativo — aguardando 1º acesso".

### Cenário 3: Revogar aprovador
**Dado** que aprovador "ex-gerente@acme.com" saiu da empresa
**Quando** clico "Revogar"
**Então** todos os magic links ativos desse aprovador são invalidados (em <30s)
**E** status vira `revoked`
**E** audit log registra quem revogou.

### Cenário 4: Re-emitir link
**Dado** que aprovador perdeu o e-mail
**Quando** clico "Reenviar link"
**Então** novo link é gerado (invalidando anteriores)
**E** enviado ao e-mail cadastrado
**E** limite: máximo 5 reemissões/dia por aprovador (anti-abuso).

### Cenário 5: Limite de aprovadores por marca
**Dado** que plano permite 3 aprovadores por marca
**Quando** tento cadastrar 4º
**Então** bloqueio "Limite do plano: 3 aprovadores por marca"
**E** link para upgrade.

### Cenário 6: Histórico de acessos
**Dado** que clico detalhes de um aprovador
**Quando** abro aba "Histórico"
**Então** vejo últimos 50 acessos com: timestamp, IP, user-agent, ação (login, aprovação, comentário)
**E** filtro por tipo de ação.

## Dependências
- Backend: endpoints `POST /approvers`, `DELETE /approvers/:id`, `POST /approvers/:id/regenerate-link`. Limpa `magic_links` associados. Auditoria em `audit_log`.
- Frontend: tabela listagem, ações inline, confirmação destrutiva.
- Externas: Resend.

## Fora de escopo
- Aprovador multi-marca com cadastro único (hoje é 1 cadastro por marca).

## Links
- [[../roles/admin]]
- [[US-058-magic-link-auth]]
- [[US-070-audit-log-imutavel]]
