---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: estrategista
feature_ref: F5 de [[../roles/estrategista]]
priority: P1
effort: M
---

# US-016 — Swipe file de referências e trends

## Como / Quero / Para que
**Como** estrategista,
**quero** capturar, organizar por tag e anexar referências externas (posts de IG, Reels, imagens),
**para que** o time tenha input visual imediato e o brief chegue com contexto.

## Contexto
Substitui Google Drive/Notion de referências. Permite que designer e copywriter vejam o que inspirou o brief sem abrir outras ferramentas.

## Critérios de aceitação (Gherkin)

### Cenário 1: Capturar URL do Instagram
**Dado** que estou no swipe file da marca "Acme Co"
**Quando** colo uma URL de post público do Instagram `https://instagram.com/p/xyz`
**E** confirmo "Adicionar"
**Então** o sistema busca o og:image e og:description
**E** cria um card com thumb, autor (@handle), tipo (post/reel/carousel) e link original
**E** o estrategista pode adicionar tags.

### Cenário 2: Upload direto de imagem
**Dado** que tenho uma imagem JPG de 3MB no computador
**Quando** arrasto-a para a área de drop do swipe file
**Então** o arquivo é aceito (até 10MB, JPG/PNG/MP4)
**E** o upload vai para Supabase Storage
**E** card é criado sem autor (upload manual).

### Cenário 3: Organizar com múltiplas tags
**Dado** que um card tem tag única "educativo"
**Quando** adiciono tags "marca-referência", "carrossel" e "storytelling"
**Então** o card aparece em todos os 4 filtros de tag separados
**E** a tela de organização permite edição em lote (selecionar vários + aplicar tag).

### Cenário 4: Anexar referência direto ao brief
**Dado** que estou preenchendo um brief em [[US-015-brief-builder-handoff]]
**Quando** clico em "Anexar referência do swipe file"
**Então** abre picker modal listando o swipe file da marca atual
**E** posso selecionar múltiplas referências
**E** elas ficam anexadas ao brief como thumbs clicáveis.

### Cenário 5: Arquivar referência antiga
**Dado** que uma referência foi adicionada há >180 dias
**Quando** clico "Arquivar"
**Então** o card sai do feed principal
**E** continua acessível via filtro "Arquivadas"
**E** não aparece mais no picker de brief por padrão.

## Dependências
- Backend: tabela `swipe_items` (id, brand_id, type, source_url, media_url, author_handle, tags[], archived_at), Supabase Storage bucket `swipe-files`.
- Frontend: drag-drop de upload, grid de cards, tag manager, picker modal integrado ao brief.
- Externas: fetch de og: metadata (server-side, respeitar robots.txt do IG).

## Fora de escopo
- Scraping não-autorizado do Instagram (só og: público).
- Sincronização automática com Pinterest (fase 2).

## Links
- [[../roles/estrategista]]
- [[US-015-brief-builder-handoff]]
- [[US-036-asset-library-tags]]
