---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: designer
feature_ref: F2 de [[../roles/designer]]
priority: P0
effort: XL
---

# US-032 — Auto-adapt: 1 layout master → N variantes

## Como / Quero / Para que
**Como** designer,
**quero** criar no formato master (ex: Feed 4:5) e gerar variantes (Story, 1:1, 1.91:1) com smart crop que preserva rosto/logo/texto,
**para que** eu pare de refazer a mesma peça 4 vezes.

## Contexto
Segunda maior feature do painel. Core do valor para designer: 1 arte → 5 formatos. Variantes linkadas ao master para propagação de mudança.

## Critérios de aceitação (Gherkin)

### Cenário 1: Gerar variantes do master
**Dado** que tenho um canvas master em Feed 4:5 (1080×1350) com logo, título, foto e CTA
**Quando** clico "Gerar variantes" e seleciono [Story 9:16, Feed 1:1, Feed 1.91:1]
**Então** o sistema cria 3 novos canvases com dimensões corretas
**E** elementos são reposicionados usando smart crop (heurística: rosto/logo/texto permanecem no frame)
**E** cada variante fica com badge "derivada de master".

### Cenário 2: Smart crop preserva logo
**Dado** que o master tem logo no canto superior direito em área 100×100
**Quando** gero variante Story 9:16
**Então** o logo fica na mesma posição relativa (canto superior direito) do novo canvas
**E** respeitando a safe zone (não atrás da profile pic).

### Cenário 3: Editar master propõe propagação
**Dado** que o master foi editado (logo aumentado 20%)
**Quando** clico "Aplicar ao master"
**Então** aparece modal "3 variantes derivadas — propagar mudança?"
**E** seleciono quais variantes atualizar
**E** cada variante fica em status `needs_review` após propagação.

### Cenário 4: Variante editada manualmente desvincula parcialmente
**Dado** que variante Story foi editada diretamente (não via master)
**Quando** o master muda depois
**Então** o sistema sinaliza "variante Story foi editada manualmente — propagar pode sobrescrever"
**E** pede confirmação explícita.

### Cenário 5: Exportação em lote das variantes
**Dado** que tenho master + 3 variantes finalizadas
**Quando** clico "Exportar todas"
**Então** baixa ZIP com 4 arquivos nomeados `<marca>_<pilar>_<formato>_v<N>.jpg`
**E** formato segue padrão de [[US-039-export-jpg-png-mp4]].

### Cenário 6: Regenerar variante específica
**Dado** que a variante 1:1 ficou ruim
**Quando** clico "Regenerar variante" naquela específica
**Então** apenas aquela variante é recriada do master
**E** as outras permanecem intocadas.

## Dependências
- Backend: campo `master_design_id` em `designs`, worker server-side para smart crop (opcional — pode ser 100% client no MVP), tabela `design_links` (master_id, variant_id, last_sync_at).
- Frontend: heurística de smart crop client-side (detecta bounding box de elementos principais), botão "gerar variantes", propagação com modal.
- Externas: opcional — API de face detection (face-api.js local ou Google Vision para fase 2).

## Fora de escopo
- Smart crop baseado em IA real (fase 2 — usar face-api.js no MVP para rostos).
- Adaptação de vídeo entre formatos (responsabilidade do Reel).

## Links
- [[../roles/designer]]
- [[US-031-canvas-multiformato-presets-ig]]
- [[US-039-export-jpg-png-mp4]]
