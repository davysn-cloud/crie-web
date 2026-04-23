---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: estrategista
feature_ref: F2 de [[../roles/estrategista]]
priority: P1
effort: M
---

# US-013 — Gestor de pilares de conteúdo com distribuição real vs alvo

## Como / Quero / Para que
**Como** estrategista,
**quero** definir 3-5 pilares por marca e ver a distribuição real de posts do mês versus o alvo,
**para que** eu equilibre o conteúdo sem depender de planilha externa.

## Contexto
Pilares são cor + nome + % alvo (ex: educativo 40%, inspiracional 30%, vendas 20%, bastidores 10%). Métrica mensal para intervenção rápida.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar pilar com % alvo
**Dado** que estou nas configurações da marca "Acme Co"
**Quando** adiciono pilar "Educativo" com cor #2563EB e alvo 40%
**Então** o pilar aparece na biblioteca de pilares da marca
**E** a soma dos alvos ainda precisa fechar em 100% (validação visível).

### Cenário 2: Dashboard mostra distribuição real vs alvo
**Dado** que a marca tem 4 pilares configurados (educativo 40%, inspiracional 30%, vendas 20%, bastidores 10%)
**E** o mês atual tem 20 posts publicados/agendados (8 educativos, 6 inspiracionais, 4 vendas, 2 bastidores)
**Quando** abro o dashboard de pilares
**Então** vejo 4 barras mostrando real (40%/30%/20%/10%) ao lado de alvo (40%/30%/20%/10%)
**E** todas as barras ficam com cor neutra (diferença <=20%).

### Cenário 3: Alerta quando pilar está >20% fora do alvo
**Dado** que o alvo de "Vendas" é 20%
**E** o mês atual tem apenas 2% de posts de vendas
**Quando** abro o dashboard de pilares
**Então** a barra de "Vendas" fica com cor vermelha
**E** um alerta mostra "Pilar 'Vendas' 18pp abaixo do alvo — considere agendar posts de vendas".

### Cenário 4: Validação de soma ≠ 100%
**Dado** que estou editando pilares
**Quando** tento salvar com soma 95%
**Então** o botão salvar fica desabilitado
**E** a mensagem "A soma dos pilares deve ser 100% (atual: 95%)" aparece.

### Cenário 5: Arquivar pilar preserva histórico
**Dado** que o pilar "Promoções" tem 12 posts históricos
**Quando** arquivo o pilar
**Então** o pilar não aparece mais para seleção em novos briefs
**E** os 12 posts históricos mantêm a referência
**E** o dashboard pode filtrar "ver também pilares arquivados".

## Dependências
- Backend: tabela `pillars` (id, brand_id, name, color, target_pct, archived_at). View agregada `pillar_distribution_monthly`.
- Frontend: dashboard com barras comparativas, form de criação/edição com validação de soma.
- Externas: none.

## Fora de escopo
- Pilares compartilhados entre marcas.
- Histórico comparativo entre meses (fase 2).

## Links
- [[../roles/estrategista]]
- [[US-012-calendario-editorial-multiformato]]
- [[US-015-brief-builder-handoff]]
