---
created: 2026-04-15
updated: 2026-04-29
owner: backend
status: superseded
superseded_by: 012-encryption-resolution
confidence: high
decided_on: 2026-04-15
---

# ADR 008 — Criptografia de credenciais em `agency_integrations`

> **2026-04-29 — superseded por [[012-encryption-resolution]].** O corpo desta ADR já refletia a virada de pgsodium → pgcrypto, mas o briefing e a comunicação inicial mencionavam pgsodium. ADR 012 documenta a resolução formal e o caminho futuro para Supabase Vault. Implementação na migration 00018 permanece válida.

## Contexto
Cada agência conecta integrações externas que exigem secrets:
- **Meta Graph API** — `page_access_token` (long-lived, 60 dias) por workspace/marca.
- **LLM provider** (OpenAI/Anthropic) — API key própria da agência (para isolar custo e acordo com o cliente).
- **Stripe connect** (Fase 3) — ID da conta conectada.
- **Resend** custom domain (Fase 2) — token por agência no modo white-label.

Armazenar esses tokens **em claro** no Postgres é inaceitável: um SELECT de quem ganhou `service_role` ou um eventual SQL injection expõe tudo.

## Decisão
**Criptografar credenciais sensíveis em repouso usando `pgcrypto` (`pgp_sym_encrypt`/`pgp_sym_decrypt` com AES-256).**

> ~~Primeira escolha era `pgsodium`~~, mas a extensão apresentou incompatibilidades no ambiente Supabase atual. `pgcrypto` é mais estável, amplamente suportado, e já habilitado na maioria dos projetos Supabase.

Esquema:
- Tabela `agency_integrations` guarda metadados em claro (`provider`, `scopes`, `expires_at`, `status`) + campo `secret_encrypted BYTEA` criptografado via `pgp_sym_encrypt`.
- **Passphrase** armazenada como GUC do Postgres (`app.encryption_key`) — configurada via dashboard/CLI, nunca em código.
- Acesso ao plaintext **só via função RPC `decrypt_integration_secret(integration_id)`** que verifica `service_role` (apenas Edge Functions com `service_role` têm acesso).
- Frontend **nunca** toca o plaintext — chama Edge Functions que por sua vez usam o secret no servidor.

## Justificativa
- `pgcrypto` é extensão padrão do PostgreSQL, disponível em todos os planos Supabase (inclusive Free).
- `pgp_sym_encrypt` com `cipher-algo=aes256` oferece criptografia forte o suficiente para o threat model (proteção contra SELECT indevido + dump de backup).
- Passphrase em GUC: não sai do runtime do Postgres, não aparece em logs, não está em código.
- KMS externo seria melhor para enterprise mas é desproporcional para beta fechado.

## Consequências
- **Pré-requisito manual antes de aplicar migration 00018:**
  ```sql
  ALTER DATABASE postgres SET app.encryption_key TO '<passphrase-64-chars>';
  SELECT pg_reload_conf();
  ```
- **Migration `00018_agency_integrations.sql`** cria a tabela + RPCs `save_agency_integration` / `decrypt_integration_secret`.
- **RLS bloqueia** SELECT direto na tabela para `authenticated` — metadados acessíveis via view `agency_integrations_public` com `security_barrier`.
- Rotação de token (ex: refresh Meta a cada 60 dias) feita por Edge Function em background.
- Rotação da passphrase exige re-encrypt de todas as rows — documentar em `06_deploy/runbook.md`.

## Riscos
- Perda da passphrase GUC = perda de todos os tokens criptografados. Mitigação: documentar a passphrase em local seguro (Vault/1Password da operação) + backup do Supabase.
- `current_setting('app.encryption_key')` é visível para qualquer função `security definer` no mesmo DB — aceito, já que só RPCs autorizadas a usam e RLS bloqueia acesso direto.
- Performance: decrypt PGP ~2ms por chamada — irrelevante para volume esperado.

## Alternativas consideradas
- **pgsodium**: instável no ambiente Supabase atual — rejeitado após testes.
- **Plaintext com RLS forte**: insuficiente — vazamento de `service_role` expõe tudo.
- **AWS KMS / GCP KMS**: overkill pra MVP.
- **App-level encryption (libsodium no Edge Function)**: viável, mas duplica lógica e a passphrase teria que ser secret da Edge Function ao invés de GUC — menos integrado.

## Links
- [[006-approver-auth]] (magic_link não usa esse fluxo — é HMAC separado)
- [[../../03_backend/api/publish|api/publish]] (consumidor da RPC)
- [[../../06_deploy/supabase-cli-apply]] (passos de configuração)
