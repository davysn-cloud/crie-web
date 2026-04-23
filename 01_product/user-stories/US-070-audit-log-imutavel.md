---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: admin
feature_ref: F8 de [[../roles/admin]]
priority: P1
effort: M
---

# US-070 — Audit log imutável com filtros e export

## Como / Quero / Para que
**Como** admin,
**quero** log append-only de quem criou/editou/aprovou/publicou o quê e quando, com filtros e export CSV,
**para que** compliance e investigação de incidentes sejam possíveis.

## Contexto
Além de compliance, é base de confiança: "quem aprovou?" é pergunta corriqueira do cliente.

## Critérios de aceitação (Gherkin)

### Cenário 1: Log registra eventos chave
**Dado** que time executa ações (brief criado, copy editada, arte aprovada, post publicado)
**Quando** cada ação ocorre
**Então** entry `audit_log` é criada com: actor_id, actor_role, action_type, target_type, target_id, payload_json (diff), ip_address, user_agent, timestamp
**E** entry é append-only (triggers de DB impedem UPDATE/DELETE).

### Cenário 2: Filtros
**Dado** que quero investigar
**Quando** filtro por member "João" + marca "Acme" + período "15/04" + action "approve"
**Então** vejo apenas entries matching
**E** paginação funcional com 50 por página.

### Cenário 3: Export CSV para compliance
**Dado** que cliente pediu relatório de quem aprovou os últimos 30 dias
**Quando** clico "Export CSV" filtrado por "marca=Acme, action=approve, período=30d"
**Então** arquivo é gerado com todas as colunas do log
**E** assinatura SHA-256 do conteúdo é incluída (integridade).

### Cenário 4: Busca por target
**Dado** que quero o histórico de um post específico
**Quando** busco por `post_id = xyz`
**Então** vejo timeline de TODAS as ações nesse post
**E** funciona mesmo que post esteja arquivado.

### Cenário 5: Retenção
**Dado** que log tem >365 dias
**Quando** verifico retenção
**Então** entries mais antigos do que 365 dias são movidos para cold storage (Supabase archive)
**E** ainda acessíveis via export com delay (<1min).

### Cenário 6: Tentativa de manipulação
**Dado** que alguém tenta `UPDATE audit_log SET ...`
**Quando** query executa
**Então** DB rejeita (trigger BEFORE UPDATE)
**E** tentativa é logada em `audit_log_tamper_attempts`
**E** alerta para security@.

### Cenário 7: RLS respeitada
**Dado** que sou admin de agência A
**Quando** consulto log
**Então** vejo apenas ações da minha agência (nunca de outras agências)
**E** isolamento multi-tenant validado.

## Dependências
- Backend: tabela `audit_log` (id, agency_id, actor_id, actor_role, action_type, target_type, target_id, payload_json, ip_address, user_agent, created_at). Triggers AFTER INSERT em tabelas críticas para auto-registrar. RLS. Cron de archival.
- Frontend: tela de audit log com filtros, export CSV.
- Externas: none.

## Fora de escopo
- Integração com SIEM externo (fase 3+ enterprise).

## Links
- [[../roles/admin]]
- [[US-058-magic-link-auth]]
- [[US-063-permissoes-granulares]]
- [[US-064-usage-dashboard]]
