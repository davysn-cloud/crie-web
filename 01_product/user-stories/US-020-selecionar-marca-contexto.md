---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: estrategista
feature_ref: Sidebar + F1 de [[../roles/estrategista]]
priority: P0
effort: S
---

# US-020 — Seletor de marca multi-tenant no painel

## Como / Quero / Para que
**Como** estrategista trabalhando em 1-5 marcas,
**quero** alternar a marca ativa no painel sem perder contexto,
**para que** eu gerencie várias contas sem mix de dados e sem reabrir telas.

## Contexto
Essencial para multi-tenant. Toda query do painel depende da marca ativa. Sem isso, filtros, calendários e briefs ficam ambíguos.

## Critérios de aceitação (Gherkin)

### Cenário 1: Seletor mostra apenas marcas atribuídas
**Dado** que sou estrategista e estou atribuído às marcas "Acme Co" e "Luna Corp" (não "Zeta Ltd")
**Quando** abro o seletor de marca na sidebar
**Então** vejo apenas "Acme Co" e "Luna Corp" com logo e nome
**E** "Zeta Ltd" não aparece.

### Cenário 2: Troca de marca atualiza todo o painel
**Dado** que estou com marca "Acme Co" ativa e vendo calendário de abril
**Quando** seleciono "Luna Corp" no seletor
**Então** o calendário recarrega mostrando apenas posts da Luna Corp
**E** filtros (pilar, campanha, status) resetam
**E** URL muda para `/panel/estrategista?brand=luna-corp`.

### Cenário 3: Deep link para marca específica
**Dado** que recebo o link `https://app.crieweb.com/panel/estrategista?brand=luna-corp`
**Quando** abro o link
**Então** o painel carrega diretamente com "Luna Corp" ativa
**E** se não tenho acesso à marca, redirecionamento para a primeira marca permitida com toast "Sem acesso a luna-corp".

### Cenário 4: Última marca ativa persiste por sessão
**Dado** que selecionei "Luna Corp" e fechei o browser
**Quando** abro o painel novamente (sessão válida)
**Então** "Luna Corp" é a marca ativa por padrão
**E** a preferência fica em `localStorage` + backup em `user_preferences`.

### Cenário 5: Busca no seletor com >10 marcas
**Dado** que tenho 15 marcas atribuídas
**Quando** abro o seletor
**Então** aparece um campo de busca no topo
**E** digitar "lun" filtra para marcas com esse substring no nome.

## Dependências
- Backend: tabela `brand_members` (user_id, brand_id, role). RLS filtra marcas acessíveis. Endpoint `GET /me/brands`.
- Frontend: componente `<BrandSwitcher />`, Zustand store `useActiveBrand`, guard de rota.
- Externas: none.

## Fora de escopo
- Workspace multi-agência (usuário em 2 agências diferentes — fase 2 / SSO).

## Links
- [[../roles/estrategista]]
- [[US-062-atribuir-membros-marcas]]
- [[US-063-permissoes-granulares]]
