---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: copywriter
feature_ref: F6 de [[../roles/copywriter]]
priority: P1
effort: S
---

# US-026 — CTA library por tipo e formato IG

## Como / Quero / Para que
**Como** copywriter,
**quero** um banco de CTAs classificados por tipo (comment-bait, save-bait, share-bait, DM, link-in-bio) e por formato IG,
**para que** eu use o CTA correto para cada contexto sem pensar.

## Contexto
CTA de Story é diferente de CTA de carrossel. Ter separação por tipo evita usar "salve este post" em Story (onde não faz sentido).

## Critérios de aceitação (Gherkin)

### Cenário 1: Filtrar CTA por formato IG
**Dado** que estou escrevendo Stories e abro a CTA library
**Quando** filtro por "Stories"
**Então** vejo apenas CTAs de sticker/DM/link
**E** CTAs de "salve esse post" ficam ocultos (incompatíveis com Stories).

### Cenário 2: Filtro por tipo de CTA
**Dado** que abri a library
**Quando** seleciono tipo "save-bait"
**Então** vejo apenas CTAs como "salve para depois", "compartilhe com quem precisa ver"
**E** contador mostra "12 CTAs"

### Cenário 3: Criar CTA custom
**Dado** que tenho um CTA novo "Marca o amigo que faz isso"
**Quando** clico "Adicionar CTA"
**Então** escolho tipo (tag-bait), formatos compatíveis (Feed 1:1, Carrossel)
**E** o CTA fica na library da marca.

### Cenário 4: Inserir CTA no editor
**Dado** que estou no editor de legenda
**Quando** clico em um CTA da sidebar
**Então** é inserido no final da legenda
**E** contador de chars atualiza.

### Cenário 5: CTAs padrão do sistema
**Dado** que é uma marca nova sem CTAs criados
**Quando** abro a CTA library
**Então** vejo 20 CTAs padrão do sistema (curados) disponíveis
**E** são marcados como "template" (não editáveis, mas duplicáveis).

## Dependências
- Backend: tabela `ctas` (id, brand_id nullable, text, type, formats[], is_template).
- Frontend: sidebar com filtros, form de criação, inline insert.
- Externas: none.

## Fora de escopo
- Medir conversão por CTA (requer tracking de link clicks, fase 3).

## Links
- [[../roles/copywriter]]
- [[US-025-hook-library]]
- [[US-021-editor-legenda-constraints-ig]]
