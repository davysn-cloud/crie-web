---
created: 2026-04-29
updated: 2026-04-29
owner: backend
status: accepted
confidence: high
decided_on: 2026-04-29
supersedes: 008-agency-integrations-encryption
---

# ADR 012 — Resolução da inconsistência pgsodium vs pgcrypto

## Contexto
O review-2026-04-29-backend identificou uma inconsistência entre [[008-agency-integrations-encryption|ADR 008]] e a implementação real:

- **Briefing original** (2026-04-15) anunciou pgsodium como decisão.
- **Corpo da ADR 008** já documenta a virada para `pgcrypto`/`pgp_sym_encrypt` (citando incompatibilidades de pgsodium no Supabase).
- **Migration `00018_agency_integrations.sql`** implementa pgcrypto: `create extension pgcrypto`, `pgp_sym_encrypt`/`pgp_sym_decrypt` com AES-256, passphrase em GUC `app.encryption_key`.
- **Briefing.md (linha 23)** continua dizendo "pgsodium" — desalinhado.

Em paralelo, em 2024 o Supabase anunciou que pgsodium seria descontinuado em favor do **Supabase Vault** (mecanismo gerenciado de secrets baseado em libsodium). Em 2026 pgsodium continua disponível como extensão do Postgres mas o Supabase recomenda Vault para novos projetos; novos secrets criados via dashboard caem no Vault. pgsodium não é mais "primeira classe" no Supabase managed.

## Decisão
**Aceitar pgcrypto/`pgp_sym_encrypt` como solução para o beta.** A ADR 008 fica formalmente superseded por esta ADR 012, que reafirma a escolha que já está no código.

Justificativas:
1. **Realidade do código já é pgcrypto** — não há trabalho a fazer no curto prazo.
2. **pgsodium foi degradado pelo Supabase** — não vale migrar para uma extensão em fim de vida.
3. **Supabase Vault é o caminho ideal mas tem custo de migração** (RPC novos, mudança de modelo de chave, integração com Edge Functions). Isso é trabalho P1/P2, não P0 pré-beta.
4. **pgcrypto + GUC + RLS bloqueando authenticated + RPC service_role-only** é defesa em profundidade suficiente para o threat model do beta fechado (3-5 agências piloto). Confidencialidade contra dump/SELECT está coberta; a chave em GUC é o único ponto fraco e é aceitável.

## Caminho futuro (P1/P2, fora do escopo desta sessão)
Quando atingirmos um destes gatilhos, migrar para **Supabase Vault**:
- Atingir 50+ MAU pagantes / sair do beta fechado.
- Auditoria de segurança de cliente enterprise exigir KMS gerenciado.
- Necessidade de rotação automática da chave-mestra (Vault tem versionamento nativo).

A migração seria:
1. Criar nova migration que adiciona colunas `secret_vault_id` (FK→`vault.secrets`) ao lado das `secret_encrypted` atuais.
2. Job de migração: para cada row, decrypt via `decrypt_integration_secret` → `vault.create_secret` → guardar id.
3. Reescrever RPCs `save_agency_integration` e `decrypt_integration_secret` para usar Vault.
4. Drop das colunas `bytea` antigas e do GUC `app.encryption_key`.

Documentar como ADR futura quando tivermos o gatilho.

## Mudanças de código nesta sessão
**Nenhuma** no código de criptografia — a migration 00018 já está consistente com esta decisão. Mudanças apenas de documentação:
- Atualizar status da [[008-agency-integrations-encryption|ADR 008]] para `superseded` (apontando para esta ADR).
- Atualizar [[../../08_shared/briefing|briefing]] linha de decisões (substituir "pgsodium" por "pgcrypto" com link para esta ADR) — feito como entrada de Histórico em 2026-04-29.
- Atualizar [[../../03_backend/schema|schema.md]] na seção `agency_integrations` mencionando ambas as ADRs.

## Riscos remanescentes
- **Chave em GUC**: visível para qualquer função `security definer` no mesmo DB. Mitigação: RLS bloqueia SELECT direto em `agency_integrations`, decrypt restrito a service_role, audit_log captura toda mutação.
- **Perda do GUC = perda de tokens**: documentar no [[../../06_deploy/runbook|runbook]] (passphrase em 1Password da operação + backup do Supabase). Rotação requer re-encrypt — script já planejado em ADR 008.
- **Supabase pode forçar migração para Vault** se descontinuar pgcrypto (improvável — pgcrypto é nativo do Postgres). Plano B: a migração descrita acima é executável em uma sessão.

## Links
- [[008-agency-integrations-encryption]] (superseded por esta)
- [[../review-2026-04-29-backend]] · [[../review-2026-04-29-summary]]
- [[../../03_backend/schema#2.20-agency_integrations]]
- Supabase Vault docs: https://supabase.com/docs/guides/database/vault
