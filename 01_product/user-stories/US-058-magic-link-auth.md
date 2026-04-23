---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: aprovador
feature_ref: F9 de [[../roles/aprovador]]
priority: P0
effort: M
---

# US-058 — Magic link auth para aprovador (sem senha)

## Como / Quero / Para que
**Como** aprovador,
**quero** acessar o portal via link único recebido por e-mail (válido 24h), sem criar conta,
**para que** eu não tenha fricção de setup.

## Contexto
Persona não-técnica. Senha é barreira. Magic link é padrão em ferramentas de aprovação (Figma Share, Loom). Audit log preserva rastreabilidade.

## Critérios de aceitação (Gherkin)

### Cenário 1: Geração de magic link
**Dado** que copywriter clicou "Solicitar aprovação" para um post
**Quando** sistema gera link
**Então** URL no formato `https://portal.crieweb.com/a/<token-hash-64>?brand=<brand-slug>`
**E** token armazenado hash-only (nunca em plaintext)
**E** expira em 24h após geração.

### Cenário 2: Uso do link
**Dado** que aprovador clica no link
**Quando** sistema valida
**Então** cria sessão de 24h (cookie httpOnly + secure)
**E** registra `last_access_at` no aprovador
**E** redireciona para a fila (ou post específico se link for deep-linked).

### Cenário 3: Link expirado
**Dado** que aprovador clica em link com 36h de idade
**Quando** sistema valida
**Então** redirect para página "Link expirado"
**E** botão "Receber novo link" (envia por e-mail cadastrado)
**E** registra tentativa de uso em audit log.

### Cenário 4: Múltiplos aprovadores
**Dado** que marca tem 2 aprovadores (Dono + Gerente)
**Quando** post é enviado para ambos
**Então** 2 links únicos são gerados (1 por aprovador)
**E** ações de cada um ficam vinculadas ao token usado.

### Cenário 5: Revogação
**Dado** que admin da agência revogou o acesso de um aprovador
**Quando** o aprovador tenta usar link ativo
**Então** bloqueio com "Acesso revogado — contate sua agência"
**E** nenhuma ação permitida.

### Cenário 6: Rate limit
**Dado** que alguém tentou 10 links inválidos no mesmo IP em 5min
**Quando** 11ª tentativa
**Então** bloqueio por 15min
**E** e-mail para admin da agência "possível ataque ao portal da marca X".

### Cenário 7: Audit log completo
**Dado** que aprovador aprovou 3 posts
**Quando** admin abre audit log
**Então** vê: token usado, IP, user-agent, timestamps, ações realizadas
**E** log é imutável (append-only).

## Dependências
- Backend: tabela `magic_links` (id, approver_id, brand_id, token_hash, expires_at, used_at, revoked_at). Endpoint `POST /approvers/:id/links`. Middleware para validar sessão.
- Frontend: landing page que consome o token, tela de "link expirado", formulário reenvio.
- Externas: Resend (e-mail), ver [[../../02_architecture/adr/transactional-email]].

## Fora de escopo
- OTP numérico (6 dígitos) como fallback (fase 2 — útil para ambientes mobile restritos).

## Links
- [[../roles/aprovador]]
- [[US-066-magic-link-management]]
- [[US-070-audit-log-imutavel]]
