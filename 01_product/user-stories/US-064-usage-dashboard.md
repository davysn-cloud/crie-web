---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: admin
feature_ref: F4 de [[../roles/admin]]
priority: P1
effort: M
---

# US-064 — Usage dashboard com KPIs da operação

## Como / Quero / Para que
**Como** admin,
**quero** dashboard com KPIs agregados (posts/mês, % aprovado v1, tempo por etapa, backlog pendente, ranking de marcas),
**para que** eu identifique gargalos e prove valor para a agência.

## Contexto
Um dos principais valores do SaaS para o admin da agência. Sem dashboard, fica invisível quanto conteúdo está sendo entregue.

## Critérios de aceitação (Gherkin)

### Cenário 1: KPIs do mês visíveis
**Dado** que sou admin
**Quando** abro dashboard
**Então** vejo 4 cards topo: "Posts no mês" (total + variação vs mês anterior), "% aprovado v1" (com benchmark), "Tempo médio brief→publicado" (em horas), "Backlog pendente" (posts em cada coluna)
**E** hover mostra detalhes.

### Cenário 2: Tempo por etapa
**Dado** que quero ver onde está o gargalo
**Quando** abro gráfico de funil
**Então** vejo cada etapa (brief→copy: 3h / copy→design: 5h / design→aprovação: 2h / aprovação→publicação: 14h) com médias
**E** etapa mais lenta destacada em vermelho.

### Cenário 3: Ranking de marcas
**Dado** que tenho 5 marcas ativas
**Quando** abro "Ranking"
**Então** tabela ordenável por: posts publicados, % aprovado v1, tempo médio, NPS cliente (se coletado)
**E** top/bottom destacados.

### Cenário 4: Export CSV
**Dado** que quero enviar relatório para um cliente
**Quando** filtro por marca "Acme" + período "último mês" + clico "Export CSV"
**Então** arquivo com todas as métricas granulares é baixado
**E** contém colunas: post_id, formato, pilar, status, timestamps por etapa, métricas Meta.

### Cenário 5: Drill-down em métrica
**Dado** que vejo "% aprovado v1: 62%"
**Quando** clico no número
**Então** abre detalhe listando posts que NÃO passaram em v1
**E** agrupados por motivo de ajuste (copy / arte / timing).

### Cenário 6: Filtro de período
**Dado** que abro dashboard
**Quando** escolho período customizado "01/03 a 31/03"
**Então** todos os KPIs recalculam
**E** queries usam agregação pré-computada quando possível (performance).

## Dependências
- Backend: views agregadas `monthly_kpis`, `stage_times`, `brand_ranking`. Worker diário pré-computa. Endpoint `GET /agency/:id/dashboard?from&to`.
- Frontend: dashboard com charts (Recharts ou Chart.js), export CSV.
- Externas: Meta Insights (opcional para métricas).

## Fora de escopo
- Dashboard customizável pelo admin (fase 3+).
- Alertas automáticos (SLA breach).

## Links
- [[../roles/admin]]
- [[US-018-performance-panel-insights]]
- [[US-070-audit-log-imutavel]]
