---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: copywriter
feature_ref: F4 de [[../roles/copywriter]]
priority: P1
effort: S
---

# US-024 — Template de script Stories (grade de frames)

## Como / Quero / Para que
**Como** copywriter,
**quero** planejar uma sequência de Stories como grade de 3 a 10 frames com texto, sticker e ação esperada por frame,
**para que** narrativas sequenciais (storytelling em Stories) sejam escritas antes da produção.

## Contexto
Stories funcionam melhor em sequência. Ter a narrativa por frame evita que o designer crie Stories isolados sem fluxo.

## Critérios de aceitação (Gherkin)

### Cenário 1: Criar sequência com 5 frames
**Dado** que o brief pede "Stories sequenciais"
**Quando** abro o template e seleciono "5 frames"
**Então** vejo 5 cards horizontais (swipeable em mobile)
**E** cada card tem: "texto principal" (max 100 chars), "sticker" (dropdown) e "ação esperada" (tap/swipe/DM).

### Cenário 2: Limite 3-10 frames
**Dado** que tento criar com 2 frames
**Quando** clico "Salvar"
**Então** mensagem "Mínimo de 3 frames para storytelling sequencial"
**E** ao tentar com 11 frames, aviso "Máximo 10 frames por sequência (limite prático IG)".

### Cenário 3: Dropdown de stickers disponíveis
**Dado** que estou no campo "sticker" do frame 2
**Quando** abro o dropdown
**Então** vejo opções: enquete, caixinha de perguntas, quiz, slider, link, countdown, mention, nenhum
**E** seleção é única por frame.

### Cenário 4: Validação de texto longo
**Dado** que digito 120 chars no "texto principal"
**Quando** passo do limite 100
**Então** aviso "Texto pode ficar cortado na Story — recomendado ≤80 chars"
**E** input continua aceitando até 200 (limite prático, não bloqueio).

### Cenário 5: Exportar script para designer
**Dado** que preenchi 5 frames
**Quando** envio ao designer
**Então** cada frame vira um slot no painel do [[US-031-canvas-multiformato-presets-ig|designer]] (preset Story 1080×1920)
**E** o texto e sticker vão como guia na camada "direção".

### Cenário 6: Reordenar frames
**Dado** que tenho 5 frames preenchidos
**Quando** arrasto o frame 4 para a posição 2
**Então** a numeração recalcula
**E** nenhuma ação/sticker se perde.

## Dependências
- Backend: tabela `story_sequences` (id, post_id, frames_json).
- Frontend: grade horizontal swipeable, dnd-kit, form por frame.
- Externas: none.

## Fora de escopo
- Animações entre frames (não suportado pelo IG API).

## Links
- [[../roles/copywriter]]
- [[US-031-canvas-multiformato-presets-ig]]
