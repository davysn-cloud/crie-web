---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: admin
feature_ref: F6 de [[../roles/admin]]
priority: P1
effort: L
---

# US-067 — White-label básico (subdomínio + logo + cor)

## Como / Quero / Para que
**Como** admin,
**quero** customizar o portal do aprovador com subdomínio da agência (`cliente.agencia.crieweb.com` ou CNAME custom), logo e cor primária,
**para que** o cliente sinta que está em uma ferramenta da agência, não do crie-web.

## Contexto
Branding é requisito comercial comum em agências B2B. Rodapé "powered by crie-web" até o plano enterprise (quando pode ser removido).

## Critérios de aceitação (Gherkin)

### Cenário 1: Configurar subdomínio simples
**Dado** que sou admin
**Quando** configuro subdomínio "acme" (agência escolhe o próprio)
**Então** portal do aprovador fica disponível em `acme.crieweb.com`
**E** DNS do crie-web já aponta wildcard para este
**E** propagação <5min.

### Cenário 2: Configurar CNAME custom
**Dado** que quero `portal.acme.com.br`
**Quando** configuro CNAME apontando para `acme.crieweb.com`
**Então** setup guiado mostra as entradas DNS necessárias
**E** sistema valida propagação do DNS
**E** quando pronto, SSL é emitido automaticamente (Let's Encrypt via Vercel).

### Cenário 3: Logo customizado
**Dado** que faço upload do logo da agência (PNG 300×80)
**Quando** salvo
**Então** logo aparece no topo do portal do aprovador
**E** também no e-mail de magic link
**E** logo do crie-web NÃO aparece em lugar nenhum.

### Cenário 4: Cor primária
**Dado** que escolho cor #2563EB como primária da agência
**Quando** salvo
**Então** CSS variables do portal do aprovador usam essa cor
**E** botões, links e destaques seguem
**E** contraste WCAG AA validado automaticamente.

### Cenário 5: Rodapé "powered by"
**Dado** que plano é "Pro"
**Quando** aprovador abre portal
**Então** rodapé discreto "powered by crie-web" aparece
**E** apenas plano enterprise pode remover (config hidden por enquanto).

### Cenário 6: E-mail from-address custom
**Dado** que configurei `aprovacoes@acme.com` como from
**E** validei SPF/DKIM via wizard
**Quando** magic link é disparado
**Então** e-mail chega de `aprovacoes@acme.com` (não do crie-web)
**E** reply-to aponta para o mesmo
**E** validation falha se DNS não verificado.

### Cenário 7: Painel admin da agência NÃO é white-label
**Dado** que configurei white-label
**Quando** admin acessa seu próprio painel da agência
**Então** branding continua crie-web (white-label é só pro aprovador)
**E** aviso claro na config.

## Dependências
- Backend: tabela `agency_branding` (agency_id, subdomain, custom_domain, logo_url, primary_color, email_from, dns_verified). DNS verification worker.
- Frontend: wizard de setup, live preview, validação de contraste.
- Externas: Vercel (wildcard domain + custom domain), Resend (domain verification), DNS APIs.

## Fora de escopo
- White-label da app da agência (só portal do aprovador no MVP).
- Multi-branding por marca dentro da mesma agência (fase 3+).

## Links
- [[../roles/admin]]
- [[US-051-fila-aprovacao-mobile]]
- [[US-058-magic-link-auth]]
