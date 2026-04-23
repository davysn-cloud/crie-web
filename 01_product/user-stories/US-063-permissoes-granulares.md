---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: admin
feature_ref: F3 de [[../roles/admin]]
priority: P0
effort: M
---

# US-063 — Permissões granulares role × ação × marca

## Como / Quero / Para que
**Como** admin,
**quero** matriz de permissões role × ação × escopo (marca) respeitada em backend e frontend,
**para que** vazamento de acesso entre marcas ou ações indevidas seja impossível.

## Contexto
Métrica de sucesso: 0 incidentes de permissão indevida. Regras do role spec:

| Ação | strategist | copy | design | social | admin |
|---|---|---|---|---|---|
| Criar brief | ✅ | ❌ | ❌ | ❌ | ✅ |
| Editar copy | ❌ | ✅ | ❌ | ❌ | ✅ |
| Editar arte | ❌ | ❌ | ✅ | ❌ | ✅ |
| Agendar publicação | ❌ | ❌ | ❌ | ✅ | ✅ |
| Aprovar internamente | ✅ | ✅ | ✅ | ✅ | ✅ |
| Publicar para cliente | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver billing | ❌ | ❌ | ❌ | ❌ | ✅ |

## Critérios de aceitação (Gherkin)

### Cenário 1: Copywriter tenta agendar (bloqueado)
**Dado** que sou copywriter atribuído à marca "Acme"
**Quando** tento acessar `/panel/social-media/schedule`
**Então** recebo 403 Forbidden
**E** UI redireciona para meu painel principal com toast "Ação restrita à role Social Media".

### Cenário 2: Leitura por marca
**Dado** que sou designer atribuído só à marca "Acme"
**Quando** tento acessar `/brands/luna-corp/designs`
**Então** recebo 404 Not Found (não revela existência da marca)
**E** RLS no Supabase bloqueia a query em nível de DB.

### Cenário 3: Admin vê tudo
**Dado** que sou admin
**Quando** acesso qualquer ação ou marca
**Então** permitido sem restrição
**E** audit log registra cada ação administrativa.

### Cenário 4: Aprovação interna permitida para todos do time
**Dado** que sou designer
**Quando** clico "Aprovação interna" em um post antes de enviar para cliente
**Então** ação é permitida
**E** post muda para status `internal_approved`.

### Cenário 5: Tentativa de escalonamento via API
**Dado** que copywriter tenta direct call `PATCH /posts/:id` com campo não permitido
**Quando** API recebe
**Então** 403 + log de "tentativa de escalonamento"
**E** alerta se >3 tentativas do mesmo usuário em 1h.

### Cenário 6: Teste automatizado de permissão
**Dado** que existe suite de testes de permissões
**Quando** rodo `npm test permissions`
**Então** cada combinação role × ação × escopo é testada
**E** cobertura é 100% da matriz.

## Dependências
- Backend: RLS policies em TODAS as tabelas relevantes, middleware de checagem por endpoint, tabela `permission_matrix` seedada.
- Frontend: guards de rota, componentes com `<Can action="X" />`, UI condicional.
- Externas: none.

## Fora de escopo
- Roles customizadas (só as 5 fixas no MVP).
- Permissão por post individual (overengineering para MVP).

## Links
- [[../roles/admin]]
- [[US-062-atribuir-membros-marcas]]
- [[../../03_backend/auth]]
