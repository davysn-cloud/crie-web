---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: aprovador
feature_ref: Layout + F6 de [[../roles/aprovador]]
priority: P0
effort: L
---

# US-051 — Fila de aprovação mobile-first (card swipeable)

## Como / Quero / Para que
**Como** aprovador (cliente da agência),
**quero** ver os posts pendentes como carrossel deslizável horizontal no mobile com preview IG-nativo de 80% da tela + 3 botões,
**para que** eu revise em 1-2 min por post sem fricção.

## Contexto
Persona não-técnica, prioriza mobile (>80% acesso mobile). Zero jargão, zero cognitive load.

## Critérios de aceitação (Gherkin)

### Cenário 1: Abrir fila via magic link
**Dado** que recebi magic link por e-mail
**Quando** clico no link no celular
**Então** entro direto na fila sem login (ver [[US-058-magic-link-auth]])
**E** vejo stack de cards horizontal com os posts pendentes
**E** cada card com preview IG ocupa 80% da tela (alto > largo em portrait).

### Cenário 2: Swipe horizontal navega
**Dado** que tenho 5 posts pendentes
**Quando** swipe horizontal para a esquerda
**Então** card atual sai, próximo entra com animação suave (<300ms)
**E** contador "1 de 5" no topo.

### Cenário 3: 3 botões na base
**Dado** que estou vendo um post
**Quando** olho a base do card
**Então** vejo exatamente 3 botões: "Aprovar" (verde), "Pedir ajuste" (amarelo), "Comentar" (azul)
**E** textos em PT-BR simples (sem jargão como "CTA" ou "engagement").

### Cenário 4: Ordenação por prazo
**Dado** que tenho 10 posts pendentes com prazos variados
**Quando** abro a fila
**Então** posts mais próximos do prazo aparecem primeiro
**E** badge "Urgente: publica em 6h" no card quando prazo < 12h.

### Cenário 5: Agrupamento por marca (multi-marca)
**Dado** que sou cliente de 2 marcas
**Quando** abro a fila
**Então** vejo seletor no topo "Marca A (3 pendentes) | Marca B (2 pendentes)"
**E** pode alternar entre elas.

### Cenário 6: Fila vazia estado
**Dado** que não há posts pendentes
**Quando** abro a fila
**Então** mensagem amigável "Tudo aprovado por aqui. Quando houver novos posts, avisamos por e-mail."
**E** ilustração leve (emoji ou spot illustration).

### Cenário 7: Perfomance em mobile 3G
**Dado** que conexão do cliente é 3G (1.5Mbps)
**Quando** abro a fila
**Então** primeiro card carrega em <3s (LCP)
**E** imagens usam placeholder blur progressive
**E** próximos cards lazy-load.

## Dependências
- Backend: `GET /approvals?approver_token=X` retornando fila filtrada pelo magic link.
- Frontend: componente stack swipeable (framer-motion), preview IG-nativo responsivo, lazy-load.
- Externas: none.

## Fora de escopo
- App nativo iOS/Android (MVP é PWA).

## Links
- [[../roles/aprovador]]
- [[US-052-preview-instagram-nativo]]
- [[US-055-1tap-aprovar-pedir-ajuste]]
- [[US-058-magic-link-auth]]
