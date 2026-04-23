---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: active
confidence: high
---

# API — Magic Link

> Geração e verificação do token do aprovador externo. Sem Supabase Auth; o aprovador não é `auth.uid()`. Ver [[../../02_architecture/adr/approver-auth|ADR approver-auth]].

## Design em uma frase
Token de 256 bits gerado server-side. Plaintext **só aparece uma vez** na resposta de criação (enviado por email). Tabela `magic_links` persiste apenas `sha256(token)`. Validação roda em Edge Function `service_role` — frontend do aprovador **nunca** fala direto com `magic_links`.

## Edge Functions

### `POST /magic-link/create` — interno (membro da agência)
Membro cria um link para o aprovador.

**Auth:** `auth.uid()` tem que ser `is_agency_member(agency_id)`.
**Request (Zod):**
```ts
{
  agency_id: string (uuid),
  workspace_id: string (uuid) | null,
  purpose: 'approval' | 'portal_view',
  approval_request_id: string (uuid) | null,
  email: string (email),
  label: string (ex: "Maria Silva — gerente"),
  expires_in_hours: number (default 168 = 7 dias, max 720 = 30 dias)
}
```
**Response:**
```ts
{
  id: string,
  token: string,           // plaintext — UMA VEZ.
  expires_at: string,
  approval_url: string     // https://<white-label-host>/approve/<token>
}
```
**Side effects:**
- Gera 32 bytes crypto.randomBytes → base64url.
- INSERT em `magic_links` com `token_hash = sha256(token)`.
- Envia email via provider (Resend — pendente ADR) com o `approval_url`.
- INSERT em `audit_log` action `magic_link.created`.

### `POST /magic-link/verify` — público (aprovador)
Aprovador cola/clica no link.

**Auth:** pública (nenhum JWT do Supabase).
**Request (Zod):**
```ts
{ token: string }
```
**Response (200):**
```ts
{
  magic_link_id: string,
  agency: { id, name, logo_url, white_label_primary },
  workspace: { id, name } | null,
  approval_request: {         // somente se purpose='approval'
    id: string,
    status: 'pending' | ...,
    post_version_id: string,
    post_card: { id, title, ig_format, ... },
    caption: string,
    assets: Array<{ format, url }>,
    slides?: Array<{ index, title, body, cta_overlay, url }>,
    pins: Array<{ id, slide_index, pin_x, pin_y, body, target, ... }>
  } | null,
  session: {                  // token ephemeral curto p/ chamadas subsequentes
    access_jwt: string,
    expires_at: string
  }
}
```
**Erros:**
- `401 MAGIC_LINK_INVALID` — hash não casa.
- `401 MAGIC_LINK_EXPIRED` — `expires_at < now()`.
- `401 MAGIC_LINK_REVOKED` — `revoked_at IS NOT NULL`.

**Side effects:**
- Atualiza `used_at = now()` se NULL, incrementa `use_count`, grava `last_used_ip`, `last_used_user_agent`.
- Emite `audit_log` action `magic_link.used`.

### `POST /approve/decide` — aprovador (com session jwt)
Aprovador bate Aprovar / Pedir ajuste.

**Auth:** header `Authorization: Bearer <session.access_jwt>`. O JWT é assinado pela Edge Function com um secret interno (`MAGIC_LINK_SESSION_SECRET`), carrega `magic_link_id` + `approval_request_id` + `exp`.
**Request:**
```ts
{
  decision: 'approved' | 'changes_requested',
  note: string | null,
  reason_code: 'copy' | 'arte' | 'timing' | 'outro' | null
}
```
**Response:** `{ status: 'approved' | 'changes_requested' }`.
**Side effects:**
- UPDATE `approval_requests` status, decision_note, reason_code, decided_at, decided_via_magic_link_id.
- UPDATE `post_cards.stage` conforme decisão (p/ approved vai pra `agendado`; para changes_requested volta pra `copy` ou `design`).
- Insere `stage_transitions`.
- Notifica copywriter/designer (canal dependente do ADR e-mail).
- `audit_log`.

### `POST /approve/pins` — aprovador
Cria pin.

**Auth:** session jwt.
**Request:** igual ao schema de `approval_pins` (menos `resolved_*`, `author_*` que vêm do JWT).
**Response:** `{ id: string }`.
**Side effects:** INSERT em `approval_pins`, `audit_log` action `approval_pin.created`.

### `POST /magic-link/revoke/{id}` — interno
Membro agência revoga link.
**Side effects:** `revoked_at = now()`. Audit log.

## Segurança
- Token entropy ≥ 256 bits.
- Hashing: SHA-256 (não é senha; brute-force do token exige enumeração da base inteira, 32 bytes é suficiente).
- Rate limit em `/magic-link/verify`: 10 tentativas/IP/minuto (usar Supabase Redis ou banding em Edge Function).
- Session JWT curto (default 30 min, renovação = re-verificar magic link).
- Toda chamada `service_role` dentro das Edge Functions **nunca vaza chave pro client**.
- Sanitização: `body` dos pins e `note` da decision → strip de HTML/script.
- CORS: Edge Functions liberam `*` para as rotas `/magic-link/*` e `/approve/*` (cliente externo pode estar em domínio white-label custom).

## Decisoes resolvidas
- **Provider de e-mail:** Resend (ADR transactional-email aceita). Implementado em `magic-link/index.ts`.
- **Rate limit:** max 5 generates por approval_request por hora.
- **Token TTL:** 24h (implementacao). Ajustavel via parametro futuro.
- **Implementacao:** `supabase/functions/magic-link/index.ts` (completa, 2026-04-16). Dois modos: `?mode=generate` (HMAC-SHA256 token + envio Resend) e `?mode=verify` (valida HMAC, retorna session JWT HS256 com 30min TTL).

## Links
- [[../schema#magic_links]] · [[../schema#approval_requests]] · [[../schema#approval_pins]]
- [[../../01_product/roles/aprovador]]
- [[../../02_architecture/adr/approver-auth]]
