---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: estrategista
feature_ref: F7 de [[../roles/estrategista]]
priority: P1
effort: L
---

# US-018 — Performance panel com Meta Graph Insights

## Como / Quero / Para que
**Como** estrategista,
**quero** ver métricas dos posts (alcance, engajamento, saves, shares, views de Reel) agrupadas por pilar e formato,
**para que** eu possa provar ROI e replicar o que funcionou.

## Contexto
Puxa Meta Graph API (Insights endpoint) em janelas configuráveis. Precisa fallback manual para marcas sem token conectado.

## Critérios de aceitação (Gherkin)

### Cenário 1: Ver top 10 posts do trimestre
**Dado** que a marca tem Meta Graph conectada e 47 posts publicados no trimestre
**Quando** abro o performance panel
**Então** vejo uma tabela dos top 10 posts ordenados por engajamento
**E** cada linha mostra thumb, formato IG, pilar, alcance, likes, comentários, saves, shares, views (Reel)
**E** as métricas foram atualizadas na última hora (cache refresh horário).

### Cenário 2: Insight automático gerado
**Dado** que os dados do trimestre mostram carrosséis educativos com 2.3× o engajamento de single images
**Quando** abro o topo do painel
**Então** vejo o card "Insight: Carrosséis educativos tiveram 2.3× o engajamento de single images este trimestre"
**E** o insight tem link para filtrar apenas esses posts.

### Cenário 3: Fallback manual sem API conectada
**Dado** que a marca ainda não conectou Meta Graph
**Quando** abro o performance panel
**Então** vejo mensagem "Conecte o Instagram para ver métricas automáticas"
**E** botão "Inserir métricas manuais" abre form para colocar alcance/engajamento post a post
**E** os dados manuais entram nos gráficos com badge "manual".

### Cenário 4: Agrupamento por pilar
**Dado** que vejo o painel de performance
**Quando** ativo "Agrupar por pilar"
**Então** os posts colapsam em 4 grupos (um por pilar)
**E** cada grupo mostra agregado de alcance e engajamento médio
**E** posso expandir para ver os posts individuais.

### Cenário 5: Rate limit da Meta respeitado
**Dado** que a Meta Graph API tem rate limit de 200 calls/hora por token
**Quando** faço refresh manual do painel
**Então** o sistema só chama a API se o cache tem >60min
**E** caso atinja rate limit, mostra "Limite Meta atingido, dados de Xmin atrás" sem quebrar a view.

## Dependências
- Backend: tabela `post_insights` (post_id, reach, likes, comments, saves, shares, views, collected_at, source enum manual|meta). Worker cron horário para refresh. Endpoint `GET /brands/:id/insights`.
- Frontend: dashboard com cards de métricas, tabela ordenável, filtro por pilar/formato.
- Externas: Meta Graph API `/{ig-media-id}/insights`, respeitar rate limit.

## Fora de escopo
- Insights de Stories (API separada, incluir em fase 2).
- Comparação cross-marca.
- Export PDF para cliente (fase 2).

## Links
- [[../roles/estrategista]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-019-duplicar-adaptar-post]]
