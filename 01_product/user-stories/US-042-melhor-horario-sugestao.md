---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: social-media
feature_ref: F2 de [[../roles/social-media]]
priority: P1
effort: M
---

# US-042 — Sugestão de melhor horário via Audience Insights

## Como / Quero / Para que
**Como** social media,
**quero** receber 3 janelas sugeridas por dia baseadas em Audience Insights da marca (ou benchmark do setor se conta nova),
**para que** eu publique quando a audiência está mais ativa.

## Contexto
Dados de Audience Insights vêm da Meta Graph API. Fallback para benchmark público por setor quando a conta é nova.

## Critérios de aceitação (Gherkin)

### Cenário 1: Sugestão baseada em Insights
**Dado** que a marca tem 60 dias de histórico e Meta conectada
**Quando** agendo um post e abro "Sugerir horário"
**Então** sistema analisa atividade da audiência dos últimos 28 dias
**E** retorna 3 janelas com maior atividade para o dia escolhido (ex: 08:00-09:00, 12:00-13:00, 19:00-20:00)
**E** cada janela mostra % de atividade relativa.

### Cenário 2: Fallback benchmark do setor
**Dado** que a marca tem < 28 dias de histórico
**Quando** abro "Sugerir horário"
**Então** sistema usa benchmark público do setor (informado no cadastro da marca)
**E** badge "Benchmark do setor: Moda & Beleza" visível
**E** assim que a marca completar 28 dias, transição automática para dados reais.

### Cenário 3: Aceitar sugestão
**Dado** que vejo 3 janelas sugeridas
**Quando** clico em "12:00-13:00"
**Então** sistema escolhe 12:30 como padrão (meio da janela) no `scheduled_at`
**E** opção de ajuste fino ±15min ainda disponível.

### Cenário 4: Dias diferentes
**Dado** que estou agendando para sábado
**Quando** abro sugestão
**Então** sistema mostra padrão de atividade de sábados históricos
**E** se padrão é diferente de dia útil (ex: manhã mais fraca), janelas refletem isso.

### Cenário 5: Exportar relatório de melhor horário
**Dado** que quero entender o padrão
**Quando** clico "Ver análise completa"
**Então** gráfico de calor 7 dias × 24 horas mostrando atividade
**E** botão "Usar estes horários como padrão para esta marca".

## Dependências
- Backend: tabela `audience_activity` (brand_id, day_of_week, hour, activity_score). Worker diário puxa Insights Meta `/insights?metric=audience_activity`. Fallback seed com benchmark de 5-10 setores principais.
- Frontend: modal de sugestão, gráfico de calor (lightweight — Chart.js).
- Externas: Meta Graph API Insights (audience activity).

## Fora de escopo
- Otimização automática sem confirmação humana (fase 2+).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
