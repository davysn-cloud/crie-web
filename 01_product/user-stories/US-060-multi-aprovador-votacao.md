---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: low
role: aprovador
feature_ref: F9 (extensão) de [[../roles/aprovador]]
priority: P2
effort: M
---

# US-060 — Multi-aprovador com regra de votação

## Como / Quero / Para que
**Como** admin da agência configurando uma marca com 3 aprovadores (dono + gerente + financeiro),
**quero** definir se aprovação exige 1/N, maioria ou unanimidade,
**para que** posts respeitem o processo interno do cliente.

## Contexto
P2 (pós-beta). MVP assume 1 aprovador = 1 aprovação. Empresas maiores pedem 2+ aprovadores.

## Critérios de aceitação (Gherkin)

### Cenário 1: Configurar regra "maioria"
**Dado** que marca tem 3 aprovadores (A, B, C) e admin escolhe regra "maioria"
**Quando** salvo config
**Então** sistema exige ≥2 aprovações para passar status para `approved`
**E** UI mostra "2 de 3 necessárias" durante processo.

### Cenário 2: Regra 1/N
**Dado** que regra é "qualquer 1 aprova"
**Quando** qualquer aprovador clica "Aprovar"
**Então** status vira `approved` imediatamente
**E** demais aprovadores recebem notificação "post aprovado por X".

### Cenário 3: Regra unanimidade
**Dado** que regra é "todos"
**Quando** 2 de 3 aprovam mas 1 pede ajuste
**Então** status fica `changes_requested` (pedido de ajuste ganha)
**E** progresso mostra "2 aprovaram, 1 pediu ajuste".

### Cenário 4: Empate / conflito
**Dado** que regra é "maioria" com 4 aprovadores e 2 aprovam + 2 pedem ajuste
**Quando** não há desempate
**Então** status `pending_tiebreaker`
**E** notificação para admin da agência para mediar.

### Cenário 5: Aprovador vê status dos colegas
**Dado** que 1 dos 3 já aprovou
**Quando** acesso como aprovador
**Então** vejo "Já aprovado: Dono. Pendente: Gerente, Financeiro"
**E** minha decisão adiciona à contagem.

### Cenário 6: Change request reseta votação
**Dado** que regra é "maioria" e 1 pediu ajuste após 1 aprovação
**Quando** copywriter envia v2
**Então** votos anteriores são limpos
**E** todos os aprovadores recebem novo magic link para re-aprovar v2.

## Dependências
- Backend: campo `approval_rule` em `brand_approval_config` (enum any_one | majority | unanimous), tabela `approval_votes`.
- Frontend: UI de progress, config no admin.
- Externas: none.

## Fora de escopo
- Workflows customizados com nós condicionais (fase 3+, se demanda existir).

## Links
- [[../roles/aprovador]]
- [[US-055-1tap-aprovar-pedir-ajuste]]
- [[US-066-magic-link-management]]
