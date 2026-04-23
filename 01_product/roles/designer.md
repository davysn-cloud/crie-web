---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# Painel do Designer

## Persona
Designer gráfico social. Trabalha rápido, replica layout em múltiplos formatos, respeita brand kit rígido. Sofre com "faz versão quadrada, story e retrato" para cada peça.

## Jobs-to-be-done
- Criar artes **Instagram-spec-correct** de primeira (sem retrabalho por erro de dimensão).
- Adaptar 1 layout para múltiplos formatos sem refazer.
- Manter identidade de marca travada.
- Visualizar como a arte fica no contexto real do IG (feed grid, story com UI, Reel com captions).

## Layout do painel
**Hero:** canvas editor (tela cheia ou dual-pane com variantes).
**Sidebar esquerda:** camadas + biblioteca de assets + templates.
**Sidebar direita:** brand kit + propriedades da camada + export.
**Barra inferior:** troca entre formatos (thumbnails dos 5 presets).

## Funcionalidades

### F1 — Canvas multiformato com presets Instagram
Presets travados com dimensão correta e **marcadores de safe zone**:
| Preset | Dimensão | Safe zones |
|---|---|---|
| Story / Reel | 1080×1920 | Top 250px (profile) · Bottom 350px (CTA/captions) |
| Feed 1:1 | 1080×1080 | Sem safe zone crítica |
| Feed 4:5 | 1080×1350 | Top ~100px e bottom ~100px cortados no grid preview |
| Feed 1.91:1 | 1080×566 | — |
| Reel cover (thumb) | 1080×1920, área visível 1080×1350 | Centro preservado para o crop do feed |

Overlays toggleáveis: safe zones, profile pic sobreposta (Story), caption area (Reel).

### F2 — Auto-adapt: 1 layout → N formatos
- Designer cria no formato "master" (ex: 4:5).
- Botão **"gerar variantes"** cria os outros formatos automaticamente com **smart crop** (heurística: manter rosto/logo/texto no quadro).
- Variantes ficam linkadas: editar o master propõe propagar para as variantes (com review).

### F3 — Brand kit lock
- Brand kit por marca: paleta de cores, fontes licenciadas, logos (variações), grafismos aprovados.
- Color picker **bloqueado ao kit da marca** (opção "usar cor custom" precisa justificativa).
- Font picker só mostra fontes da marca.
- Logo component com variações (horizontal, ícone, monocromático) e padding mínimo.

### F4 — Carousel builder
- Grid de 10 slides reordenáveis via drag-drop (dnd-kit).
- Navegação lateral setinhas (preview de transição).
- **Background contínuo opcional:** imagem única de 10800×1080 cortada automaticamente em 10 slides com crop matemático perfeito.
- Slide 1 com marcador "capa" + slide 10 com marcador "CTA" (visual guides).
- Import do script do [[copywriter]] (campos texto por slide preenchidos automaticamente).

### F5 — Template library
- Templates por pilar / campanha / marca.
- Criar template a partir de design atual (1 clique).
- Template traz variáveis substituíveis (título, CTA, imagem principal) — mantém estrutura, troca conteúdo.

### F6 — Asset library
- Upload de fotos, ícones, ilustrações, mockups.
- Tags obrigatórias (tipo, estilo, marca-compatível).
- Busca por tag + busca reversa por cor dominante.
- Integração Canva (import via link) e Unsplash/Pexels (API).

### F7 — Grid preview do Instagram
- Mostra os **últimos 9 posts publicados + próximos agendados + o post sendo editado**.
- Simulação fiel do feed do IG (3 colunas, crop central no feed, gaps).
- Checagem visual: "a nova arte conflita cromaticamente com o grid atual?"
- Toggle 9 / 12 posts.

### F8 — Story/Reel UI overlay
- Preview do canvas **com a UI do Instagram sobreposta** (profile pic, nome, timestamp no topo; stickers; CTA no bottom; closed captions do Reel).
- Avisa se texto crítico está sob a UI.

### F9 — Export
- JPG/PNG **sRGB <8MB** (limite prático IG).
- MP4 H.264 para Reel (AAC audio, <4GB, 30fps recomendado, até 90s feed Reels).
- Export em lote (todas as variantes de uma vez).
- Nome de arquivo padronizado: `<marca>_<campanha>_<pilar>_<formato>_<v>.ext`.

### F10 — Version lock
- Status: `draft` → `review` → `approved` → `published`.
- Ao passar para `approved`, arte é **congelada** (hash do arquivo salvo). Edição cria nova versão.
- Diff visual entre versões (slider antes/depois).

## Integrações
- **Canva Connect** (opcional, leitura/import).
- **Unsplash / Pexels** (stock).
- Meta Graph API (upload de mídia pra rascunho direto no IG Business).

## Handoffs
- **Entrada:** brief do [[estrategista]] + script do [[copywriter]] (texto para aplicar na arte).
- **Saída:** artes em todos os formatos do brief → [[aprovador]] e depois [[social-media]].

## Métricas de sucesso do painel
- Tempo "brief → arte v1 em todos os formatos" < 30 min.
- Zero posts recusados por **erro de dimensão**.
- % de artes usando template da library > 60% (sinal de biblioteca útil).

## User stories relacionadas
- A definir (US-031+).

## Links
- [[README|índice de roles]]
- [[copywriter]] · [[aprovador]]
- [[../../04_frontend/design-system]]
