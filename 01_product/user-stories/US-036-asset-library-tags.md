---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: designer
feature_ref: F6 de [[../roles/designer]]
priority: P1
effort: M
---

# US-036 — Asset library com tags + busca reversa por cor

## Como / Quero / Para que
**Como** designer,
**quero** uma biblioteca de fotos/ícones/ilustrações com tags obrigatórias e busca reversa por cor dominante,
**para que** eu encontre assets rapidamente sem abrir o computador ou Dropbox.

## Contexto
Troca Google Drive compartilhado. Tags obrigatórias garantem que assets sejam encontráveis. Busca reversa por cor é diferencial para manter consistência cromática.

## Critérios de aceitação (Gherkin)

### Cenário 1: Upload com tags obrigatórias
**Dado** que uploado 3 imagens JPG
**Quando** o upload termina
**Então** modal pede tags antes de salvar
**E** campos obrigatórios: tipo (foto/ícone/ilustração/mockup), estilo (minimalista/fotográfico/ilustrado), marca-compatível (multi-select)
**E** sem preencher as 3 tags obrigatórias, o asset fica em quarentena.

### Cenário 2: Busca por tag combinada
**Dado** que tenho 500 assets
**Quando** filtro por tipo="foto" + estilo="minimalista" + marca="Acme"
**Então** resultado em <500ms
**E** vejo grid de thumbnails com infinite scroll.

### Cenário 3: Busca reversa por cor dominante
**Dado** que preciso de imagem com paleta azul
**Quando** uso o color picker "Buscar por cor" e seleciono #2563EB
**Então** sistema retorna assets cuja cor dominante (ou secundária) esteja dentro de ΔE ≤ 15 da cor escolhida
**E** resultado ordenado por proximidade cromática.

### Cenário 4: Import via Canva link
**Dado** que tenho um link de design Canva
**Quando** colo o link no upload
**Então** sistema faz import (se Canva Connect configurado — ver [[US-069-chaves-api-agencia]])
**E** asset aparece na library com metadata "origem: Canva".

### Cenário 5: Import Unsplash/Pexels
**Dado** que busco "laptop" em Unsplash integrado
**Quando** clico em uma imagem
**Então** download + adiciona tags automáticas ("foto", "laptop", "Unsplash")
**E** designer completa tag "marca-compatível" manualmente.

### Cenário 6: Arquivar asset não-utilizado
**Dado** que um asset tem 0 usos em 180 dias
**Quando** admin roda "limpeza de library"
**Então** assets sem uso ficam marcados `archive_candidate=true`
**E** filtro padrão esconde arquivados; "ver todos" mostra.

## Dependências
- Backend: tabela `assets` (id, brand_id, type, style, tags[], file_url, dominant_colors[], source, used_count, archive_candidate). Worker para extrair cor dominante no upload (color-thief ou similar).
- Frontend: drag-drop de upload, filtros combinados, color picker para busca reversa.
- Externas: Unsplash API, Pexels API, Canva Connect (fase 2).

## Fora de escopo
- Integração com DAM externo enterprise (fase 3+).
- IA que sugere assets baseado no brief (fase 2).

## Links
- [[../roles/designer]]
- [[US-035-template-library]]
- [[US-069-chaves-api-agencia]]
