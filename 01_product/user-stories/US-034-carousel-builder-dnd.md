---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: designer
feature_ref: F4 de [[../roles/designer]]
priority: P0
effort: L
---

# US-034 — Carousel builder com até 10 slides reordenáveis

## Como / Quero / Para que
**Como** designer,
**quero** montar carrossel com até 10 slides reordenáveis via drag-drop, marcadores capa/CTA e opção de background contínuo,
**para que** eu produza carrosséis de alto engajamento com qualidade consistente.

## Contexto
Todos os slides de um carrossel precisam ter o mesmo ratio (1:1 ou 4:5). Background contínuo usa 1 imagem de 10800×1080 (ou 10800×1350 para 4:5) cortada matematicamente.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar carrossel com 5 slides
**Dado** que o brief pede carrossel 1080×1350 com 5 slides
**Quando** abro o carousel builder
**Então** vejo 5 slots vazios numerados 1-5
**E** slot 1 tem marcador visual "CAPA" (verde)
**E** slot 5 tem marcador "CTA" (laranja)
**E** todos os slides travam no preset 1080×1350.

### Cenário 2: Reordenar slides via drag-drop
**Dado** que os 5 slides estão preenchidos
**Quando** arrasto o slide 4 para a posição 2
**Então** a numeração recalcula (4 vira 2, e 2-3 descem)
**E** marcadores capa/CTA se ajustam (capa sempre no 1º, CTA sempre no último).

### Cenário 3: Importar script do copywriter
**Dado** que o [[US-022-modo-carrossel-script-sheet|copywriter]] enviou 5 slides com título+copy
**Quando** abro o builder
**Então** cada slide vem pré-preenchido com uma camada de texto
**E** posso arrastar a camada para posicionar
**E** o texto é editável em loco (não sobrescreve o que o copy enviou).

### Cenário 4: Background contínuo gerado
**Dado** que tenho carrossel de 6 slides e escolhi "Background contínuo"
**Quando** uploado 1 imagem de 6480×1350 (6 slides × 1080)
**Então** o sistema corta matematicamente em 6 pedaços de 1080×1350
**E** cada slide recebe seu pedaço como background
**E** preview horizontal mostra a imagem inteira como o usuário do IG verá swipando.

### Cenário 5: Validação de ratio consistente
**Dado** que todos slides estão em 1080×1350
**Quando** tento adicionar um slide 1080×1080
**Então** bloqueio com "Todos os slides de um carrossel devem ter o mesmo ratio"
**E** opção "converter todos para 1:1" disponível.

### Cenário 6: Preview com swipe real
**Dado** que finalizei o carrossel de 6 slides
**Quando** abro "Preview IG"
**Então** vejo mockup do IG com gesto de swipe funcional
**E** indicador de página (1/6, 2/6...) como no IG real.

## Dependências
- Backend: `carousel_slides` com `design_id` por slide (vincula cada slide a um design na tabela `designs`).
- Frontend: dnd-kit para reordenação, canvas embutido por slide, preview swipeable.
- Externas: none.

## Fora de escopo
- Transições animadas entre slides (não suportado pelo IG).

## Links
- [[../roles/designer]]
- [[US-022-modo-carrossel-script-sheet]]
- [[US-031-canvas-multiformato-presets-ig]]
