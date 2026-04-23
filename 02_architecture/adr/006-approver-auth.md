---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: high
---

# ADR 006 — Auth do aprovador (magic link custom, fora do Supabase Auth)

## Contexto
O aprovador (cliente externo da agência) precisa revisar posts sem criar conta ([[../../01_product/roles/aprovador|aprovador]] F9). Queremos magic link por e-mail. Duas rotas:

1. **Supabase Auth OTP / magic link nativo** — `auth.signInWithOtp(email)`.
2. **Implementação custom** — tabela `magic_links`, tokens SHA-256, Edge Function, JWT ephemeral.

## Opções avaliadas

### A) Supabase Auth nativo
Prós:
- Zero código auth.
- Cobertura de rate limit, retries, e-mail template.
- User vira `auth.uid()` real, RLS padrão funciona.

Contras:
- **Polui `auth.users`:** cada cliente externo de cada agência vira uma row em `auth.users`. Na escala de centenas de agências × dezenas de aprovadores por agência, vira milhares de usuários "fantasmas".
- `auth.users.email` é UNIQUE globalmente — mesmo e-mail em duas agências (caso real: uma consultoria com 10 clientes) vai ter problema.
- Não conseguimos facilmente escopar: "você só tem acesso a este approval_request específico", requer lógica extra em app.
- Expiração: Supabase magic link expira rápido (default 1h). O cliente pode receber e só abrir em 2 dias.
- White-label: e-mail sai do domínio supabase por default; configurar SMTP custom é possível mas mais passo.

### B) Custom com `magic_links` + Edge Function
Prós:
- Full controle: expiração configurável (default 7 dias).
- Escopo: link é por `approval_request` ou por `workspace`, não usuário global.
- Nada polui `auth.users`.
- Mesmo e-mail em múltiplas agências funciona (cada agência tem seus links).
- Revogação explícita (`revoked_at`).
- Auditoria rica (`use_count`, `last_used_ip`, etc.).
- E-mail enviado via provider escolhido ([[transactional-email]]).
- Session JWT curto assinado pela Edge Function (jwt-secret interno) — não mistura com Supabase JWT.

Contras:
- Mais código.
- Precisamos implementar rate limit contra brute-force de token (mitigação: 256 bits de entropy já resolve quase tudo, mas + IP rate limit).
- Não há RLS ligada ao aprovador — **todas** as operações dele passam por Edge Function com `service_role`. Isto é aceitável porque a superfície é pequena (aprovar/reprovar/pin).

## Decisão

**Opção B: magic link custom.**

Pontos críticos do design:
- **Token:** `crypto.randomBytes(32)` → base64url. 256 bits de entropy.
- **Storage:** apenas `sha256(token)` em `magic_links.token_hash`. Plaintext NUNCA persistido — retornado uma vez na criação.
- **Session:** ao verificar token, Edge Function emite JWT HS256 assinado com `MAGIC_LINK_SESSION_SECRET` (env var, apenas no Edge), exp 30 min. JWT carrega `magic_link_id`, `approval_request_id`, `workspace_id`. Renovação = reverify magic link.
- **Endpoints do aprovador:** todas Edge Functions, nenhuma policy RLS anon em `approval_requests`/`approval_pins`. Função lê `service_role` e valida o JWT antes de responder.
- **Escopo:** um magic link liga a `agency_id` + (opcional) `workspace_id` + (opcional) `approval_request_id`. Edge Function injeta filtro na query.
- **Rate limit:** `/magic-link/verify` — 10/IP/min. Em produção, via Redis ou via `audit_log` window.
- **Revogação:** UPDATE `revoked_at`. Middleware rejeita se `revoked_at IS NOT NULL`.
- **Multi-uso:** mesmo token pode ser usado N vezes até `expires_at`. Tracking em `use_count`, `used_at`, `last_used_ip`.

## Consequências
- Frontend do aprovador é **app pública** (rota não autenticada no Supabase) que só fala com Edge Functions específicas.
- Se perdemos o `MAGIC_LINK_SESSION_SECRET`, rotacionar invalida todas as sessões ativas — aceitável.
- Se quisermos migrar para Supabase Auth depois, o fluxo pode ser substituído sem mexer em outras tabelas.
- Risco residual: se o e-mail da aprovadora for comprometido, o token é acessível. Mitigação: expiração de 7 dias.
- Status "expired" precisa ser atualizado periodicamente — cron `UPDATE approval_requests SET status='expired' WHERE status='pending' AND expires_at < now()`.

## Links
- [[../../03_backend/api/magic-link]]
- [[../../03_backend/schema#magic_links]]
- [[../../01_product/roles/aprovador]]
