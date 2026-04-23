---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: admin
feature_ref: F2 de [[../roles/admin]]
priority: P0
effort: M
---

# US-062 — Convidar membros e atribuir por marca

## Como / Quero / Para que
**Como** admin,
**quero** convidar membros por e-mail com role (strategist/copywriter/designer/social_media/admin) e atribuir cada um a marcas específicas,
**para que** o time correto trabalhe em cada marca sem vazamento de acesso.

## Contexto
Tanto convite de time (seats pagos) quanto de aprovadores (sem custo) são gerenciados aqui. Aprovadores são separados porque não contam seat.

## Critérios de aceitação (Gherkin)

### Cenário 1: Convidar novo membro
**Dado** que sou admin e plano tem 5 seats (4 usados)
**Quando** convido "maria@agencia.com" com role "designer"
**Então** Maria recebe e-mail com link de setup
**E** ao aceitar, entra como seat ativo
**E** aparece como "designer pendente atribuição de marcas".

### Cenário 2: Atribuir membro a marcas
**Dado** que Maria é designer ativa
**Quando** vou em "Marcas" e marco Maria em "Acme Co" e "Luna Corp"
**Então** Maria passa a ver apenas essas 2 marcas no seletor
**E** RLS bloqueia acesso a outras marcas (testado automaticamente).

### Cenário 3: Aprovador separado (sem seat)
**Dado** que preciso adicionar Cliente A como aprovador de Acme
**Quando** uso seção "Aprovadores" (não "Time")
**Então** Cliente A recebe magic link sem criar conta
**E** não consome seat do plano
**E** só vê posts pendentes de Acme.

### Cenário 4: Remover membro
**Dado** que João saiu da agência
**Quando** clico "Remover" no membro
**Então** modal pergunta "Transferir trabalho em aberto para outro membro?"
**E** após escolher substituto, remoção se completa
**E** João perde acesso imediatamente.

### Cenário 5: Limite de seats enforced
**Dado** que plano tem 5 seats todos usados
**Quando** tento convidar 6º membro
**Então** bloqueio com "Limite de seats atingido — upgrade o plano"
**E** link para upgrade.

### Cenário 6: Listagem com filtros
**Dado** que time tem 20 membros
**Quando** abro "Time"
**Então** vejo lista filtrável por role, marca, status
**E** search por nome/email.

### Cenário 7: Role alterada preserva histórico
**Dado** que troco role de João de "copywriter" para "designer"
**Quando** confirmo
**Então** permissões mudam para role nova
**E** trabalho histórico de João como copywriter mantém atribuição (audit).

## Dependências
- Backend: tabelas `members` (user_id, agency_id, role, status), `brand_members` (user_id, brand_id), `approvers` (id, brand_id, email, name). RLS agressiva.
- Frontend: form de convite, matriz atribuição membros × marcas, separador aprovadores.
- Externas: Resend para e-mail de convite.

## Fora de escopo
- Role custom (roles fixas no MVP).
- SSO enterprise (fase 3+).

## Links
- [[../roles/admin]]
- [[US-063-permissoes-granulares]]
- [[US-066-magic-link-management]]
