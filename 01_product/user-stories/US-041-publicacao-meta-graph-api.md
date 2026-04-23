---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: F1 de [[../roles/social-media]]
priority: P0
effort: XL
---

# US-041 — Fila de publicação via Meta Graph API

## Como / Quero / Para que
**Como** social media,
**quero** agendar e publicar automaticamente feed image/vídeo/carrossel (até 10) e Reel via Meta Graph API,
**para que** o calendário editorial vire feed real sem ação manual no horário exato.

## Contexto
Core do painel. Meta Graph Content Publishing API é o meio oficial para posts automáticos (conta Business/Creator). Stories via API ficou restrita — fallback manual via push (ver [[US-048-fallback-manual-publish]]).

## Critérios de aceitação (Gherkin)

### Cenário 1: Agendar post feed para horário futuro
**Dado** que o post está `approved` e linkado a Meta IG Business
**Quando** clico "Agendar" e escolho 2026-04-20T10:00:00 BRT
**Então** entry `publish_queue` criada com `scheduled_at=2026-04-20T13:00:00Z` (UTC)
**E** status `scheduled`
**E** worker cron identifica e executa no horário (±2min).

### Cenário 2: Publicação de carrossel
**Dado** que o post é carrossel de 6 slides `approved`
**Quando** worker executa publicação
**Então** sistema faz 6 calls `/media` (um por slide) + 1 call `/media_publish` agregando os container IDs
**E** status vira `published` com `ig_media_id` registrado
**E** tempo total < 30s.

### Cenário 3: Retry em erro transiente
**Dado** que Meta retornou 503 (timeout)
**Quando** worker falha na 1ª tentativa
**Então** retry agendado para +30s, +2min, +5min (exponential backoff, max 3 tries)
**E** após 3 falhas status vira `failed` e notifica social-media.

### Cenário 4: Parada dura em erro de validação
**Dado** que Meta retornou 400 "image dimension invalid"
**Quando** worker falha
**Então** não retenta (erro permanente)
**E** status `failed` com mensagem exata
**E** ação sugerida "abra o design e refaça o export".

### Cenário 5: Bloqueio se legenda > 2200 chars
**Dado** que a legenda tem 2250 chars
**Quando** tento agendar
**Então** bloqueio pre-submit com "Legenda excede 2200 chars do IG"
**E** nenhuma entry `publish_queue` é criada.

### Cenário 6: Timezone correto
**Dado** que a marca tem timezone "America/Sao_Paulo"
**Quando** agendo para "20/04 às 10:00"
**Então** sistema converte para UTC (13:00Z) e armazena
**E** UI sempre exibe no timezone da marca.

### Cenário 7: Limite de rate Meta
**Dado** que Meta limita 25 posts/dia por IG account
**Quando** a fila tem 30 posts para hoje
**Então** sistema escalona e avisa "5 posts além do limite diário da Meta — primeiros 5 empurrados para amanhã"
**E** social-media confirma.

## Dependências
- Backend: tabela `publish_queue` (id, post_id, design_id, ig_business_id, scheduled_at, status, retries, error_msg, ig_media_id, published_at). Worker cron de 1min (Supabase cron/pg_cron ou Vercel cron). OAuth Meta + token refresh (ver [[US-049-health-check-meta-token]]).
- Frontend: form de agendamento, timezone picker, status de cada entry.
- Externas: Meta Graph API (Content Publishing endpoints `/{ig-user-id}/media` e `/media_publish`).

## Fora de escopo
- Publicação de Stories via API (ver [[US-048-fallback-manual-publish]] pra fallback manual).
- Analytics pós-publicação (ver [[US-018-performance-panel-insights]]).

## Links
- [[../roles/social-media]]
- [[US-040-version-lock-designer]]
- [[US-049-health-check-meta-token]]
- [[../../02_architecture/adr/publishing-strategy]]
