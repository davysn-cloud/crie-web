---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: admin
feature_ref: F9 (extensão) de [[../roles/admin]]
priority: P1
effort: S
---

# US-069 — Gestão de chaves de API em nível de agência (LLM, Resend, Canva)

## Como / Quero / Para que
**Como** admin,
**quero** configurar chaves de API (Claude/OpenAI, Canva Connect, Resend/SendGrid) no nível da agência,
**para que** features que dependem dessas APIs funcionem para todas as marcas da agência.

## Contexto
Chaves ficam em nível de agência (não por marca) para reduzir setup. Permite escolher provedor (flexibilidade).

## Critérios de aceitação (Gherkin)

### Cenário 1: Adicionar chave LLM
**Dado** que quero usar [[US-028-brand-voice-ia]] (gerador de legenda)
**Quando** abro "Integrações" e adiciono chave Claude (sk-ant-xxx)
**Então** sistema armazena encriptada (AES-256)
**E** validação imediata chamando endpoint de health da Anthropic
**E** badge verde "Chave válida".

### Cenário 2: Escolher provedor LLM
**Dado** que posso usar Claude OU OpenAI
**Quando** configuro
**Então** vejo 2 opções mutuamente exclusivas
**E** se configurar ambas, escolho qual é default
**E** fallback automático se primeira falhar.

### Cenário 3: Chave Canva Connect
**Dado** que admin tem conta Canva Business
**Quando** conecta via Canva Connect (OAuth)
**Então** designers da agência passam a ver "Importar do Canva" na asset library (ver [[US-036-asset-library-tags]])
**E** status da integração visível.

### Cenário 4: Chave Resend para e-mails
**Dado** que admin adicionou chave Resend + domínio verificado
**Quando** magic link é disparado
**Então** e-mail sai via conta Resend da agência (não do crie-web)
**E** contabilidade de quota é da agência.

### Cenário 5: Revogação
**Dado** que chave foi vazada
**Quando** admin clica "Revogar"
**Então** chave é apagada imediatamente do banco (hard delete)
**E** features dependentes ficam em fallback ou bloqueio
**E** notifica time afetado.

### Cenário 6: Limite de gerações LLM por plano
**Dado** que plano é Pro (100 gerações LLM/dia)
**Quando** agência atinge 100
**Então** próximas chamadas retornam limite atingido
**E** reset à meia-noite UTC
**E** admin vê contador em tempo real.

## Dependências
- Backend: tabela `agency_integrations` (agency_id, provider, encrypted_key, status, valid_until). Endpoint validação.
- Frontend: form de configuração, status cards, validação inline.
- Externas: LLM APIs, Canva Connect OAuth, Resend.

## Fora de escopo
- Per-marca override de chave (fase 2+).

## Links
- [[../roles/admin]]
- [[US-028-brand-voice-ia]]
- [[US-036-asset-library-tags]]
