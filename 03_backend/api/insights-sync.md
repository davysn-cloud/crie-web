---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: active
confidence: high
---

# API — Insights Sync

> Background job que puxa Insights do Meta Graph API para posts publicados e preenche a tabela `insights`. Roda por cron.

## Estratégia
- Snapshot temporal: múltiplas linhas em `insights` por `ig_media_id` (uma por `fetched_at`). Permite ver evolução do post ao longo do tempo.
- Frequência: 4x por dia nos primeiros 7 dias após publicação, depois 1x/dia até 30 dias, depois semanal.
- Cap: até 50 jobs por tick.

## Edge Functions

### `POST /insights/worker/tick` — cron (service_role)
**Frequência recomendada:** a cada 15 min.
**Lógica:**
1. `SELECT` posts publicados nos últimos 30 dias com `post_cards.ig_media_id IS NOT NULL`.
2. Para cada, comparar última entrada em `insights` por `ig_media_id`:
   - Publicado há < 24h e último fetch há > 6h → elegível.
   - Publicado há 1-7 dias e último fetch há > 6h → elegível.
   - Publicado há 7-30 dias e último fetch há > 24h → elegível.
   - Publicado há > 30 dias e último fetch há > 7 dias → elegível.
3. Bater `{ig-media-id}/insights?metric=impressions,reach,engagement,saved,shares,likes,comments,video_views,plays,profile_visits,follows`.
4. INSERT em `insights` com `fetched_at=now()`.
5. Em rate limit (429) ou erro: logar em `audit_log` action `insights.fetch_failed`, skip.

**Response:** `{ fetched: n, skipped: m, errors: k }`.

### `POST /insights/refresh/{post_card_id}` — manual
Force refresh disparado pela UI do estrategista.
**Auth:** workspace member.
**Rate limit:** 1/min por post_card.

### `GET /insights/summary?workspace_id=&period=7d|30d|90d|qtr`
Agregação ready-to-UI do F7.
**Auth:** workspace member.
**Response:**
```ts
{
  top_posts: Array<{
    post_card_id, title, ig_format, pillar: { id, name, color },
    impressions, reach, engagement, saves, shares,
    engagement_rate: number
  }>,
  by_pillar: Array<{ pillar_id, posts_count, avg_engagement, avg_reach }>,
  by_format: Array<{ ig_format, posts_count, avg_engagement }>,
  total_reach, total_impressions, total_engagement,
  insight_text: string | null    // "Carrosséis educativos tiveram 2.3× o engajamento..."
}
```

## Fallback manual
Se a conta IG não está conectada:
- `POST /insights/manual` aceita entrada manual com os mesmos campos. Marcado com `raw_json.source='manual'` para distinguir.
- Estrategista lança dados de outra ferramenta (Meta Business Suite export).

## Decisoes resolvidas
- **Token storage:** `agency_integrations` (migration 00018, pgcrypto).
- **Cron runner:** pg_cron + pg_net (ADR 009).
- **Implementacao:** `supabase/functions/insights-sync/index.ts` (completa, 2026-04-16). Puxa insights por ig_media_id, frequencia adaptativa (6h para posts recentes, 24h para 7-30d, semanal para 30d+). Token expirado marca integracao como 'expired', nao quebra batch.
- **Pendente fase 2:** `insight_text` via LLM; endpoint `/insights/summary` com agregacao.

## Links
- [[../schema#insights]] · [[../schema#post_cards]]
- [[../../01_product/roles/estrategista]]
- [[publish]]
