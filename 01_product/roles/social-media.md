---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# Painel do Social Media / Publisher

## Persona
Social media manager ou publisher. Agenda, publica e garante que o calendário vire feed real. É o elo entre "aprovado" e "no ar".

## Jobs-to-be-done
- Agendar com precisão (horário, legenda, primeiro comentário).
- Prever o **grid final do feed** antes de publicar.
- Não errar o horário / não duplicar post / não publicar conteúdo não aprovado.
- Reagir rápido quando auto-post falha.

## Layout do painel
**Hero:** fila de publicação (timeline cronológica dos próximos posts agendados).
**Painel central:** **grid planner** (drag-drop visual do feed do IG).
**Sidebar direita:** detalhes do post selecionado (legenda final, arte, 1º comentário, status Meta).

## Funcionalidades

### F1 — Fila de publicação via Meta Graph API
- Integração com Instagram Graph API (conta Business/Creator vinculada à Meta Business Suite).
- Suporta publicação automática: feed image, feed vídeo, carrossel (até 10), Reel, Story (requires Content Publishing API).
- Status de cada item: `scheduled` → `publishing` → `published` / `failed`.
- Retry automático em erros transientes (rate limit, timeout). Parada dura em erros de validação (dimensão errada, legenda >2200).

### F2 — Sugestão de melhor horário
- Puxa Audience Insights da marca (dias/horários com mais atividade da audiência).
- Sugere 3 janelas ótimas por dia.
- Fallback se conta ainda não tem dados: usa benchmark do setor.

### F3 — Primeiro comentário automático
- Campo separado para "primeiro comentário" (prática comum: colocar hashtags fora da legenda).
- Postado automaticamente 0-5s após o post ir ao ar.
- Herda hashtag set do brief.

### F4 — Grid planner drag-drop
- Visualização 3 colunas do feed do IG com os posts agendados.
- Drag-drop reordena (recalcula horários mantendo cadência).
- **Conflito visual:** 3 posts seguidos do mesmo pilar ficam sinalizados (monotonia cromática / temática).
- Toggle "ver como o cliente vê" (somente posts aprovados e publicados).

### F5 — Detector de conflitos
Alertas antes de confirmar agendamento:
- Dois posts agendados para a mesma hora (mesma marca).
- Post agendado em **feriado/data comercial sensível** não previsto no brief.
- Overlap de campanha (ex: post de "Black Friday" agendado depois do fim da campanha).
- Legenda ou arte não aprovadas pelo cliente.

### F6 — Cross-post toggle
- Reel → Facebook (Meta permite republicar).
- Reel → Stories como reshare (24h).
- Feed post → notificação em Stories (drives traffic).

### F7 — Calendário unificado
- View mês/semana agregando: scheduled, published, failed, draft (ainda em produção).
- Cores diferentes por status.
- Clique em dia mostra todos os posts + gaps de conteúdo.

### F8 — Fallback manual (publish reminder)
Alguns formatos não são 100% suportados pela API em certas regiões. Nesses casos:
- Push notification + e-mail ao social media com: arte pronta pra download, legenda pro clipboard, 1º comentário separado.
- Botão "marcar como publicado" para fechar o ciclo manualmente.

### F9 — Health check da conexão Meta
- Painel mostra status do token (expira em X dias — Meta tokens são long-lived mas expiram).
- Alerta proativo 14 dias antes de expirar.
- Flow de reconexão sem perder agendamentos.

## Integrações
- **Meta Graph API** (Content Publishing + Insights).
- Meta Business Suite (fallback / migração).
- Slack/Discord webhook (notificações de falha).

## Handoffs
- **Entrada:** post aprovado pelo [[aprovador]] (arte final + legenda final + 1º comentário).
- **Saída:** post no ar → [[estrategista#F7|performance panel]] puxa Insights depois.

## Métricas de sucesso do painel
- % de posts publicados na janela agendada (±2 min) > 98%.
- 0 posts publicados sem aprovação.
- Tempo médio de recuperação de falha de publicação < 10 min.

## User stories relacionadas
- A definir (US-041+).

## Links
- [[README|índice de roles]]
- [[aprovador]] · [[estrategista]]
- [[../../02_architecture/adr/publishing-strategy|ADR: publishing-strategy]] (a criar)
