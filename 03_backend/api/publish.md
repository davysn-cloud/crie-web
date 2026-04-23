---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: active
confidence: high
---

# API — Meta Graph API Publishing

> Edge Function(s) que movem itens da `publish_queue` para posts publicados no Instagram Business/Creator via Meta Graph API. **Somente contrato** — implementação depois.

## Contexto
- Conta IG Business vinculada a um Facebook Page (via OAuth Meta em [[admin#F9]]).
- Token long-lived por agência, armazenado server-side (nunca no client).
- Meta Graph API requer 2 passos: (1) criar container de mídia (`/media`); (2) publicar container (`/media_publish`).
- Carrossel requer passo 1 múltiplo (um container por slide) + passo `children` + publish.
- Stories tem endpoint próprio. Reel usa `media_type=REELS`.
- Rate limits: ~200 chamadas/hora por IG Business Account (valores sujeitos a mudança pela Meta).

## Edge Functions
### `POST /publish/enqueue` — interno
Chamado pelo frontend quando o Social clica "agendar".

**Auth:** `auth.uid()` precisa ser membro da workspace (RLS).
**Request (Zod):**
```ts
{
  post_card_id: string (uuid),
  ig_format: 'feed_1_1' | 'feed_4_5' | 'feed_1_91_1' | 'story' | 'reel' | 'carousel',
  scheduled_at: string (ISO datetime),
  caption: string (max 2200),
  first_comment: string | null,
  media: Array<{ storage_path: string, mime: string, width: number, height: number, duration_ms?: number }>,
  cross_post_fb: boolean,
  cross_post_story: boolean
}
```
**Response:** `{ publish_queue_id: uuid }`.
**Side effects:** insert em `publish_queue` com `status='queued'`, emite evento em `audit_log`.

### `POST /publish/worker/tick` — cron interno
Chamado por cron job (Supabase Scheduler) a cada 60s. Pega jobs `status='queued' AND scheduled_at <= now()`, marca `publishing`, tenta publicar, escreve `publish_attempts`.

**Auth:** service_role (invocation header secret).
**Lógica:**
1. `SELECT FOR UPDATE SKIP LOCKED` na `publish_queue` — pega até 10 jobs, seta `locked_by_worker`, `locked_until = now()+5min`.
2. Para cada job:
   - Lookup do `ig_business_account_id` e access_token (tabela `agency_integrations` — a criar futuramente; pendência).
   - Passo 1: POST `{account}/media` (ou múltiplos p/ carrossel) → pega `creation_id`(s).
   - Carrossel: POST `{account}/media` com `media_type=CAROUSEL&children=ID1,ID2,...`.
   - Passo 2: POST `{account}/media_publish` com `creation_id` final.
   - Em sucesso: `ig_media_id`, `published_url` gravados; status `published`; INSERT em `publish_attempts` outcome `success`.
   - Em retryable_error (429, 5xx, timeout): incrementar `attempts_count`, se < max (default 5) manter `queued` com backoff exponencial (60s * 2^n); senão marcar `failed`.
   - Em permanent_error (400 validation, 401 token): marcar `failed` imediatamente.
3. Em todos os casos: INSERT em `publish_attempts` e `audit_log`.

**Response:** `{ picked: n, published: x, failed: y, retried: z }`.

### `POST /publish/retry/{publish_queue_id}` — manual
Social reset de job que foi para `failed`. Seta status='queued', `attempts_count=0`, `last_error=null`.
**Auth:** workspace member.

### `POST /publish/cancel/{publish_queue_id}`
Cancela job antes de `publishing`.
**Auth:** workspace member. Proibido se status='publishing' ou 'published'.

## Primeiro comentário automático
Após `media_publish` retornar sucesso, se `first_comment_snapshot IS NOT NULL`:
- Aguardar 2s (dá tempo do post ficar consultável).
- POST `{media-id}/comments` com o texto.
- Falha no primeiro comentário **não falha o post** — só registra `audit_log` com action `publish.first_comment_failed`.

## Health check (Admin F9)
Edge Function `GET /publish/health/{agency_id}` retorna:
- `token_expires_at`
- `daily_api_calls_used`
- `last_successful_publish_at`

## Erros bem conhecidos a mapear
| Meta code | Significado | outcome |
|---|---|---|
| 190 / 463 | Token expirado | permanent_error (requer reconexão) |
| 4 / 17 / 32 | Rate limit | retryable_error |
| 100 + subcode 1366046 | Mídia inválida (dimensão/formato) | permanent_error |
| 200 + subcode 2207026 | Tipo de conta não suportado | permanent_error |
| 500, 503 | Server | retryable_error |

## Decisoes resolvidas
- **Access_token Meta:** armazenado em `agency_integrations.secret_encrypted` (pgcrypto AES-256, migration 00018). Decrypt via RPC `decrypt_integration_secret`.
- **Cron runner:** pg_cron + pg_net (ADR 009). Job chama `publish-worker` Edge Function a cada 60s.
- **Implementacao:** `supabase/functions/publish-worker/index.ts` (completa, 2026-04-16). Max 20 jobs/tick, FOR UPDATE SKIP LOCKED, retry exponencial, carousel/reel/story/feed suportados.

## Links
- [[../../01_product/roles/social-media]]
- [[../schema#publish_queue]] · [[../schema#publish_attempts]]
- [[insights-sync]]
