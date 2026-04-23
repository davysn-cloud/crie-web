---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: estrategista
feature_ref: F3 de [[../roles/estrategista]]
priority: P1
effort: M
---

# US-014 — Campaign groups com timeline e herança de brief

## Como / Quero / Para que
**Como** estrategista,
**quero** agrupar posts sob uma campanha com início/fim e brief compartilhado,
**para que** eu garanta coesão narrativa em lançamentos e datas comerciais.

## Contexto
Campanhas como "Lançamento Coleção Verão" ou "Black Friday" têm vários posts que compartilham mensagem-chave, audiência e CTA. Herança evita redigitar brief para cada post filho.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar campanha com período
**Dado** que estou no painel do estrategista
**Quando** crio campanha "Black Friday 2026" com início 2026-11-20 e fim 2026-11-30
**Então** a campanha aparece no seletor de campanhas da marca
**E** uma linha do tempo horizontal mostra o período de 10 dias
**E** posso arrastar marcos (teasers, lançamento, oferta, lembrete, fim) na timeline.

### Cenário 2: Post herda brief da campanha
**Dado** que a campanha "Black Friday 2026" tem mensagem-chave "Maior desconto do ano"
**Quando** crio um novo post dentro da campanha
**Então** o campo "mensagem-chave" do brief já vem preenchido com "Maior desconto do ano"
**E** o estrategista pode sobrescrever no nível do post sem afetar a campanha.

### Cenário 3: Post fora da janela gera alerta
**Dado** que a campanha "Black Friday 2026" termina em 2026-11-30
**Quando** agendo um post vinculado à campanha para 2026-12-05
**Então** um alerta visual "Post fora do período da campanha" aparece
**E** o estrategista escolhe "Remover vinculação" ou "Estender campanha até 2026-12-05".

### Cenário 4: Timeline mostra todos os posts da campanha
**Dado** que a campanha tem 8 posts (2 teasers, 4 no auge, 2 lembretes finais)
**Quando** abro a timeline da campanha
**Então** vejo os 8 posts como marcadores no eixo temporal
**E** gaps maiores que 48h destacam em amarelo "gap de comunicação".

### Cenário 5: Encerrar campanha congela dados
**Dado** que a campanha terminou há 7 dias
**Quando** clico "Encerrar campanha"
**Então** o status vira `archived`
**E** os posts da campanha mantêm o vínculo mas não aceitam novos
**E** o relatório final com métricas agregadas fica disponível (se Insights conectado — ver [[US-018-performance-panel-insights]]).

## Dependências
- Backend: tabela `campaigns` (id, brand_id, name, start_at, end_at, brief_json, status), `post_campaigns` (post_id, campaign_id).
- Frontend: componente timeline, form de campanha, seletor de campanha no brief builder.
- Externas: none.

## Fora de escopo
- Campanhas cross-marca (não suportado — campanha é escopo de uma marca).
- A/B testing de campanhas (fase 2).

## Links
- [[../roles/estrategista]]
- [[US-015-brief-builder-handoff]]
- [[US-018-performance-panel-insights]]
