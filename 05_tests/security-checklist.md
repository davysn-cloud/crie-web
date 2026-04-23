---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: active
confidence: medium
---

# Checklist de Segurança — crie-web

> Checklist **vivo**. Todo item precisa estar verde antes de abrir beta fechado para as 3-5 agências piloto. Gaps não cobertos viram bugs P-SPEC em [[bugs]].

## RLS / Multi-tenant

### Isolamento entre agências
- [ ] Membro da Agência A tenta `SELECT` em `post_cards` da Agência B via PostgREST → 0 rows.
- [ ] Membro tenta `INSERT` em `briefs` com `workspace_id` de outra agência → policy violation 403.
- [ ] Membro tenta `UPDATE post_cards WHERE id=<B_id>` → 0 rows affected (RLS filtra silenciosamente).
- [ ] Membro tenta `DELETE` em `publish_queue` de outra agência → 0 rows affected.
- [ ] Cliente com magic_link de Agência A tenta acessar post de Agência B trocando `approval_request_id` na URL → 403.
- [ ] Cliente com magic_link tenta forjar `author_email`/`actor_id` no body de `/approval/pins/create` → Edge Function ignora body e usa JWT → pin salvo com email correto.
- [ ] RLS **FORÇADO** (`FORCE ROW LEVEL SECURITY`) em todas as tabelas — `owner_id` do dono não bypassa.
- [ ] Helper `is_agency_member(agency)` filtra por `agency_members.accepted_at IS NOT NULL` (P-SPEC 004).

### Cobertura (todas as tabelas novas + agency_integrations)
Para cada tabela, confirmar: RLS enabled; policies testadas (SELECT/INSERT/UPDATE/DELETE negative tests); policy usa helper correto.
- [ ] `pillars`
- [ ] `campaigns`
- [ ] `briefs`
- [ ] `hashtag_sets`
- [ ] `hashtag_set_items`
- [ ] `hooks_library`
- [ ] `ctas_library`
- [ ] `brand_voice`
- [ ] `post_drafts`
- [ ] `post_formats`
- [ ] `carousel_slides`
- [ ] `asset_library`
- [ ] `templates`
- [ ] `post_versions`
- [ ] `approval_requests`
- [ ] `approval_pins`
- [ ] `magic_links`
- [ ] `publish_queue`
- [ ] `publish_attempts`
- [ ] `insights`
- [ ] `audit_log`
- [ ] `agency_integrations` — **+ policy que oculta/bloqueia `secret_ciphertext` via PostgREST**

### Storage
- [ ] Bucket `assets` com policy por prefixo `workspaces/<ws_id>/...` cruzando com `is_workspace_member`.
- [ ] Bucket `exports` idem.
- [ ] Tentativa de upload para path de outra workspace → 403.
- [ ] URL pré-assinada (signed URL) tem TTL curto (<=10min) e é regenerada por request.

### Realtime
- [ ] Channel `workspace:<id>:*` valida `is_workspace_member(id)` no `channel.subscribe`.
- [ ] Pin criado em workspace A **não** chega em subscription de workspace B (Flow 3 Cenário 8).

---

## Auth / Magic link do aprovador (ADR 006)

### Token
- [ ] Token plaintext é 256 bits base64url (43 chars) gerado com `crypto.randomBytes(32)`.
- [ ] Plaintext **nunca** persistido — só `sha256(token)` em `magic_links.token_hash`.
- [ ] Plaintext retornado **uma vez** ao backend na criação + enviado via Resend; nunca aparece em subsequente GET/SELECT.
- [ ] Token expirado (`expires_at < now()`) → `/magic-link/verify` retorna 401.
- [ ] Token revogado (`revoked_at IS NOT NULL`) → 401.
- [ ] Token com ID existente mas hash errado (fabricado) → 401.

### JWT ephemeral
- [ ] JWT HS256 assinado com `MAGIC_LINK_SESSION_SECRET` (env var server-only).
- [ ] `exp` = 30 min.
- [ ] Claims: `magic_link_id`, `approval_request_id`, `workspace_id`, `agency_id`, `email`, `label`.
- [ ] Edge Function rejeita JWT com assinatura inválida → 401.
- [ ] JWT com `exp` passado → 401.
- [ ] Troca de `approval_request_id` no body quando JWT tem outro → 403 (mismatch scope).

### Rate limit
- [ ] `/magic-link/verify` — máx 10 req/IP/min (Edge Function + `audit_log` window OU Redis).
- [ ] `/a/:token` rota pública — máx 30 req/IP/min.
- [ ] `/approval/decide` — 5 req/IP/min.
- [ ] Após N falhas em `/magic-link/verify`, retornar 429 com `Retry-After`.

### Revogação
- [ ] Admin revoga magic_link em `/admin/magic-links` (US-066) → `revoked_at=now()`.
- [ ] Sessão JWT ativa é invalidada na próxima request (Edge Function checa `revoked_at` em cada call — não confia apenas no JWT).
- [ ] UI do aprovador trata 401 pós-revogação com mensagem "Link revogado. Peça novo ao time".

### Supabase Auth (membros da agência)
- [ ] Confirmação de e-mail obrigatória.
- [ ] Rate limit de signup/login (Supabase built-in) ativo.
- [ ] Senha mínima 8 chars + complexity (Supabase config).
- [ ] Convite `agency_invites` com `expires_at` (gap — adicionar em migration futura).

---

## Secrets / Credenciais

### Frontend / bundle
- [ ] `grep -r "SUPABASE_SERVICE_ROLE_KEY" dist/` após `npm run build` → 0 matches.
- [ ] `grep -r "sk_live\|sk_test" dist/` → 0 matches (sem Stripe secret no bundle).
- [ ] `grep -r "MAGIC_LINK_SESSION_SECRET" dist/` → 0 matches.
- [ ] `grep -r "META_GRAPH_TOKEN\|EAAG" dist/` → 0 matches (token Meta começa com EAAG).
- [ ] Apenas `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `VITE_PUBLIC_APP_URL` no bundle.

### Backend / Edge Functions
- [ ] Tokens Meta/LLM/Stripe só manipulados server-side (Edge Function lê via `decrypt_integration_secret()`).
- [ ] `decrypt_integration_secret()` é `SECURITY DEFINER` com GRANT apenas a `service_role`.
- [ ] Logs da Edge Function **não** imprimem plaintext de secrets (grep nos logs capturados em Playwright: `/EAAG|sk_|Bearer [A-Za-z0-9]{40,}/` → 0 matches fora de requests externos esperados).
- [ ] `audit_log.diff_json` **nunca** contém plaintext de `secret_ciphertext` (trigger em `agency_integrations` mascara o campo).
- [ ] Chave raiz `pgsodium` só existe em env var do Supabase, não em repo nem em migration.

### Stripe
- [ ] Webhook `/stripe/webhook` valida signature com `STRIPE_WEBHOOK_SECRET` antes de processar.
- [ ] Replay attack: `stripe-signature` com timestamp > 5min → rejeitado.

### Meta Graph API
- [ ] OAuth state param (US-068) é random e validado no callback.
- [ ] Token long-lived salvo criptografado em `agency_integrations.secret_ciphertext`.
- [ ] Refresh automático antes do expire.

---

## Validação de input / XSS / injection

### XSS
- [ ] Nenhum `dangerouslySetInnerHTML` com input do usuário (grep no código-fonte).
- [ ] Legenda renderizada como **texto puro**; se markdown, usa sanitizer (DOMPurify ou render próprio sem HTML raw).
- [ ] `approval_pins.body`, `comments.body`, `briefs.key_message`, `decision_note` → render seguro.
- [ ] `moodboard_urls`, `references_json[].value` (quando URL) → validar scheme `http/https` e renderizar como `<a rel="noopener noreferrer nofollow">`.

### Upload
- [ ] Upload valida MIME type **server-side** (não só no client): jpeg/png/webp/mp4.
- [ ] Upload valida dimensões server-side via `imagescript` na Edge Function (rejeita >20MB raw).
- [ ] Export final < 8MB (IG feed limit) validado antes de entrar em `publish_queue.media_snapshot_json`.
- [ ] Nome de arquivo sanitizado (sem `../`, sem null bytes).

### SQL / ORM
- [ ] Zero queries cruas com template string de input (grep por `` `${`` dentro de `.sql(` / `.query(`). Tudo parametrizado via Supabase client.
- [ ] RPC functions não concatenam `EXEC` string de input.

### URL / referências
- [ ] `briefs.references_json[].value` quando `type='url'` valida scheme http(s), comprimento <2048, e não permite `javascript:`, `data:`, `file:`.
- [ ] `brand_profiles.logo_url`, `moodboard_urls` mesmos cuidados.

### Comprimentos / tipos
- [ ] Legenda: max 2200 chars (IG limit) validado client + server (Zod em Edge).
- [ ] Carrossel: max 10 slides (CHECK no DB + Zod).
- [ ] Hashtags: max 30 por post (IG limit).
- [ ] `approval_pins.body` max 2000 chars.
- [ ] Emoji/unicode em todos os campos de texto.

---

## Instagram Graph API specifics

- [ ] Worker `publish/worker/tick` respeita rate limit da Graph API (~200 calls/hora por conta) com backoff exponencial (60s * 2^n, max 5 tentativas).
- [ ] Token Meta com expiração < 14 dias dispara evento `meta_token.expiring_soon` → notificação proativa para admin (US-049).
- [ ] `publish_attempts (publish_queue_id, attempt_number)` UNIQUE previne duplicata.
- [ ] Publish falhado em `permanent_error` não é retentado automaticamente.
- [ ] Arte que viola spec IG (dimensão errada, MP4 inválido, >8MB export) é bloqueada **antes** de entrar em `publish_queue` (validação no `/publish/enqueue`).
- [ ] Carrossel com slides de ratios mistos é bloqueado (IG exige mesmo ratio).
- [ ] Reel duração >90s é bloqueado.
- [ ] `first_comment_snapshot` só é postado se publish primário teve sucesso (ordem: publish → comment, não paralelo).

---

## Dependências / build

- [ ] `npm audit` sem high/critical antes do beta.
- [ ] Dependabot / Renovate ativo no repo.
- [ ] `npm run build` sem warnings que mencionem keys ou paths suspeitos.
- [ ] Bundle size total <500KB gzip main + lazy chunks por painel (mobile aprovador tem prioridade).

---

## Cookies / Storage do cliente

- [ ] Tokens Supabase Auth em cookie httpOnly (Supabase Auth Helpers SSR) OU localStorage apenas no lado do cliente — nunca no DOM.
- [ ] JWT ephemeral do magic_link salvo em **sessionStorage** (não localStorage) para morrer ao fechar aba.
- [ ] Nenhum token em URL hash persistente (só durante o flow `/a/<token>` inicial).
- [ ] CSP header no Vercel: `default-src 'self'`; `img-src 'self' https://cdn.ig.com *.cdninstagram.com blob:`; `connect-src 'self' *.supabase.co *.graph.facebook.com`.
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.

---

## Audit log

- [ ] `audit_log` append-only (sem UPDATE/DELETE policy).
- [ ] INSERT só via `service_role` (trigger ou Edge Function).
- [ ] Trigger em `agency_integrations` registra toda mutação em `audit_log` com `diff_json` **mascarado** (secret_ciphertext → `'***'`).
- [ ] `audit_log.actor_type` correto: `user`/`magic_link`/`system`/`worker`.
- [ ] `audit_log.actor_id` aponta para `user_id` OU `magic_link_id` coerente com `actor_type`.

---

## LGPD / Privacidade

- [ ] Processo documentado: aprovador (cliente externo) pode pedir remoção de dados → admin da agência dispara job que: (a) anonimiza `approval_pins.author_label/email`; (b) deleta `magic_links`; (c) marca `approval_requests.assignee_email = '<deleted>'`.
- [ ] Exportação de dados do aprovador (portabilidade): endpoint `/gdpr/export?email=...` (só via admin da agência).
- [ ] Banner de cookies no `/a/<token>` informa sobre uso (IP, user-agent em `magic_links.last_used_*`).
- [ ] Retenção: `audit_log` mantido 12 meses; `publish_attempts` 6 meses; `insights` 24 meses.
- [ ] PII em `audit_log` (e-mails, IPs) só visível para admin da agência.

---

## Checklist automatizável (CI)

Estes itens devem rodar em toda PR:
- [ ] `pnpm test` (Vitest unit) — 100% pass.
- [ ] `pnpm test:component` — 100% pass.
- [ ] `pnpm test:e2e` (Playwright mocked) — 3 fluxos + smoke.
- [ ] `pnpm test:rls` (supabase db test) — negative tests por tabela.
- [ ] `grep` no bundle por secrets — script `scripts/check-bundle-secrets.sh`.
- [ ] `pnpm lint` + `pnpm typecheck`.

## Links
- [[plano]]
- [[pre-deploy]]
- [[bugs]]
- [[cases/e2e/flow-3-multi-tenant-isolation]]
- [[../02_architecture/adr/006-approver-auth]]
- [[../02_architecture/adr/008-agency-integrations-encryption]]
- [[../03_backend/schema]]
