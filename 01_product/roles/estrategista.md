---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# Painel do Estrategista

## Persona
Estrategista de conteúdo / social media strategist. Pensa mensal/trimestral. Dono do **porquê** de cada post existir. Alterna entre 1-5 marcas.

## Jobs-to-be-done
- Manter calendário editorial alinhado com pilares e campanhas.
- Traduzir objetivo de marca em briefs acionáveis para Copy + Design.
- Reagir a trends sem quebrar o planejamento.
- Provar ROI de conteúdo (o que funcionou, por quê).

## Layout do painel
**Hero:** calendário editorial do mês (view grid com thumbs dos posts).
**Sidebar esquerda:** seletor de marca + filtros (pilar, status, formato IG, campanha).
**Sidebar direita:** performance panel (top 3 posts do mês, pilar líder).
**Modal/drawer:** brief builder ao clicar em slot vazio do calendário.

## Funcionalidades

### F1 — Calendário editorial multiformato
- View mês/semana com cada slot mostrando thumb + ícone do formato IG (Story/Feed/Reel/Carrossel) + cor do pilar.
- Drag-drop para reagendar. Validação de conflito (2 posts mesma hora / overlap de campanha).
- Toggle "ver grid do Instagram" → renderiza os 9/12 próximos posts de feed como aparecerão no perfil.

### F2 — Gestor de pilares
- Definir 3-5 pilares por marca (ex: educativo 40% / inspiracional 30% / vendas 20% / bastidores 10%).
- Dashboard mostra **distribuição real vs alvo** no mês. Alerta se um pilar estiver >20% fora do alvo.

### F3 — Campaign groups
- Agrupar posts sob uma campanha (ex: "Lançamento Coleção Verão", "Black Friday").
- Linha do tempo da campanha com início/fim, marcos, posts dentro.
- Brief de campanha que herda para os posts filhos.

### F4 — Brief builder (handoff)
Campos estruturados: **objetivo** (awareness/consideration/conversion), **pilar**, **formato IG** (dropdown com os presets), **audiência-alvo**, **mensagem-chave**, **CTA**, **referências** (links/imagens), **prazo**, **assignees** (copywriter + designer).
Ao salvar, cria card na fila do Copywriter e do Designer simultaneamente.

### F5 — Swipe file / trends
- Capturar referências externas (URL do IG, upload, link de Reel trend).
- Organizar por pasta/tag (tipo de conteúdo, marca-referência, pilar).
- Anexar referência direto no brief.

### F6 — Hashtag sets
- Biblioteca de conjuntos de hashtags por pilar/audiência (3-5 sets de 15-30 hashtags).
- Métricas por set (alcance médio ao longo do tempo) — dado vem do F7.
- Sugestão de set no momento do brief.

### F7 — Performance panel
- Integração **Meta Graph API (Insights)** — alcance, engajamento, saves, shares, views (Reel).
- View "top 10 posts do último trimestre" agrupado por pilar/formato.
- Insight automático: "Carrosséis educativos tiveram 2.3× o engajamento de single images este mês".
- Fallback manual (input humano) se a API não estiver conectada.

### F8 — Atalho "duplicar + adaptar"
Pega um post de sucesso e gera um novo brief herdando pilar/formato, mudando mensagem-chave. Reduz tempo de planejamento de posts recorrentes.

## Integrações
- **Meta Graph API** (leitura de Insights).
- Leitura de calendário Google (opcional — puxar datas comerciais).

## Handoffs
- **Entrada:** objetivo de negócio do cliente, datas comerciais.
- **Saída:** brief estruturado → [[copywriter]] + [[designer]].
- **Observa:** fila de aprovação do [[aprovador]] e fila de publicação do [[social-media]].

## Métricas de sucesso do painel
- Tempo médio de "slot vazio → brief pronto" < 5 min.
- % de posts com brief completo antes de começar produção > 95%.
- NPS do estrategista com o painel.

## User stories relacionadas
- [[../user-stories/index]] (US-012 a US-020 — a definir)

## Links
- [[README|índice de roles]]
- [[copywriter]] · [[designer]]
