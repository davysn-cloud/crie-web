---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: designer
feature_ref: F8 de [[../roles/designer]]
priority: P1
effort: S
---

# US-038 — Preview com UI do Instagram sobreposta (Story/Reel)

## Como / Quero / Para que
**Como** designer,
**quero** ver o canvas com a UI do IG sobreposta (profile pic, barra de progresso, stickers, closed captions),
**para que** eu evite colocar texto crítico embaixo de elementos da UI do IG.

## Contexto
Texto sob a UI é o erro mais comum em Stories e Reels. Overlay ajuda a visualizar o resultado final.

## Critérios de aceitação (Gherkin)

### Cenário 1: Overlay ativo em Story
**Dado** que estou em canvas Story 1080×1920
**Quando** ativo "Preview UI IG"
**Então** vejo overlay com: profile pic circular (56×56) top-left, nome do perfil ao lado, barra de progresso topo, área bottom 350px com input de reply, botões de reação
**E** opacidade do overlay ajustável (20-80%).

### Cenário 2: Alerta de texto sob UI
**Dado** que inseri uma camada de texto na posição y=50 (zona do profile)
**Quando** ative "Preview UI IG"
**Então** camada de texto fica destacada em vermelho
**E** aviso flutuante "Texto crítico sob a UI do Story — ajuste posição"
**E** botão "Mover para safe zone" que reposiciona automaticamente.

### Cenário 3: Overlay de Reel com captions
**Dado** que estou em canvas Reel 1080×1920
**Quando** ativo "Preview UI IG"
**Então** overlay inclui: profile pic bottom-left, nome + música, CTA à direita, area de closed captions centro-bottom
**E** toggle "mostrar legenda" ativa/desativa a área de captions.

### Cenário 4: Sticker mockup customizável
**Dado** que copy enviou script Stories com sticker "enquete" ([[US-024-script-stories-frames]])
**Quando** abro o canvas desse frame
**Então** mockup da enquete aparece na posição x/y configurada pelo copy
**E** designer pode mover a posição final dentro da safe zone.

### Cenário 5: Export ignora o overlay
**Dado** que ativei "Preview UI IG" e exporto
**Quando** o export completa
**Então** o JPG/PNG/MP4 exportado NÃO contém a UI mockup
**E** é pixel-perfect do canvas limpo.

## Dependências
- Backend: none (overlay é client-side).
- Frontend: camada de overlay SVG com profile/stickers/captions, detector de colisão bbox texto vs UI.
- Externas: none.

## Fora de escopo
- Simulação exata de cada feature do IG (stickers diferentes por região, etc).

## Links
- [[../roles/designer]]
- [[US-031-canvas-multiformato-presets-ig]]
- [[US-024-script-stories-frames]]
