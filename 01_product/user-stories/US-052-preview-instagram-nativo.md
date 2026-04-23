---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: aprovador
feature_ref: F1 de [[../roles/aprovador]]
priority: P0
effort: L
---

# US-052 — Preview Instagram-nativo pixel-accurate (não mockup de design)

## Como / Quero / Para que
**Como** aprovador (cliente),
**quero** ver cada post exatamente como aparecerá no Instagram (feed, carrossel com swipe, Story com UI completa, Reel com CTA e captions),
**para que** eu decida com base no resultado real, não em um mockup aproximado.

## Contexto
Diferença crítica em relação a ferramentas tradicionais (Trello/Figma de aprovação): preview tem que ser pixel-perfect do IG real.

## Critérios de aceitação (Gherkin)

### Cenário 1: Preview Feed com "... ver mais"
**Dado** que post é Feed 1:1 com legenda de 500 chars
**Quando** abro preview
**Então** vejo header da conta (avatar + @handle), imagem 1080×1080, ícones de ação (❤ 💬 📤 🔖), contador de likes mockado, legenda truncada em 125 chars + "... ver mais"
**E** clicar em "ver mais" expande legenda inteira.

### Cenário 2: Carrossel com swipe
**Dado** que post é carrossel de 6 slides
**Quando** abro preview
**Então** vejo slide 1 com indicador "1/6"
**E** swipe horizontal avança slide por slide
**E** transição idêntica ao IG nativo.

### Cenário 3: Story com UI completa
**Dado** que post é Story 1080×1920
**Quando** abro preview
**Então** vejo topo: profile pic + nome + timestamp + barra de progresso
**E** bottom: campo "enviar mensagem" + botões reação
**E** auto-play do vídeo (se aplicável) por 5s.

### Cenário 4: Reel com captions ativadas
**Dado** que post é Reel 1080×1920 de 30s
**Quando** abro preview
**Então** vejo tela vertical 9:16 com vídeo auto-play muted
**E** overlay: profile + nome de música bottom-left, CTA right, captions centro-bottom
**E** toggle "ver com som".

### Cenário 5: Toggle feed vs grid
**Dado** que estou no preview
**Quando** ativo toggle "Como aparece no perfil"
**Então** vejo card no crop central do feed grid (1:1)
**E** posição simulada em grid 3 colunas com posts existentes ao redor.

### Cenário 6: Preview funcional mesmo offline
**Dado** que carreguei o preview uma vez
**Quando** perco conexão
**Então** preview continua funcional (cache do service worker)
**E** posso swipe, aprovar ou comentar
**E** ações vão para queue sincronizada quando voltar online.

## Dependências
- Backend: payload da API retorna todos os media URLs + metadata necessária para renderizar preview.
- Frontend: componente `<InstagramPreview />` com variantes por formato, service worker para offline.
- Externas: none.

## Fora de escopo
- Simulação de outros apps (WhatsApp, TikTok).

## Links
- [[../roles/aprovador]]
- [[US-051-fila-aprovacao-mobile]]
- [[US-037-grid-preview-instagram]]
