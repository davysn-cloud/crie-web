---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# Painel do Copywriter

## Persona
Redator social. Escreve legendas, roteiros de Reel, scripts de Stories. Sensível a tom de voz, hooks e limite de caracteres do Instagram.

## Jobs-to-be-done
- Escrever legendas que seguram leitura (primeira linha importa).
- Criar roteiros de Reel que convertem (hook nos primeiros 3s).
- Garantir consistência de tom de voz entre marcas.
- Reutilizar hooks e CTAs comprovados.

## Layout do painel
**Hero:** fila de briefs atribuídos (cards com prazo, pilar, formato IG).
**Workspace central:** editor dedicado ao formato (feed / Reel / Stories / carrossel).
**Sidebar direita:** bibliotecas (hooks, CTAs, hashtags) + tom de voz da marca.

## Funcionalidades

### F1 — Editor de legenda com constraints do Instagram
- Limite duro em **2.200 caracteres** com contador visível.
- **Preview "... ver mais" em 125 caracteres** — linha que mostra exatamente o que aparece no feed antes do truncamento.
- Contador de emojis (limite prático: até 30 emojis para evitar shadowban).
- Contador de linhas quebradas (IG colapsa linhas em branco — aviso visual).
- Detector de quebra de parágrafo usando caracteres invisíveis (⠀) — insert automático.

### F2 — Modo carrossel (script sheet)
- Template de 10 slides com campos por slide: **título**, **copy corpo**, **CTA visual do slide**.
- Estrutura recomendada: Slide 1 = hook, 2-9 = desenvolvimento, 10 = CTA + "salva esse post".
- Exportação do script para o [[designer]] aplicar no layout.

### F3 — Template de roteiro Reel
Campos com timestamp: **Hook (0-3s)**, **Desenvolvimento (3-X)**, **CTA (final)**.
Cada bloco tem sugestões de:
- Texto em tela (overlay) com contador de caracteres legíveis (max ~25 por linha em mobile).
- Áudio sugerido (trending sounds — link manual).
- Direção de câmera/cena (notas para designer/editor).

### F4 — Template de script Stories
Grade de frames (mínimo 3, max 10). Por frame:
- Texto principal (≤ 1 linha curta).
- Sticker (dropdown: enquete, caixinha de perguntas, quiz, slider, link, countdown, mention).
- Ação esperada (tap, swipe, DM).
Útil para narrativa sequencial (ex: storytelling em 5 frames).

### F5 — Hook library
- Biblioteca de hooks salvos (por pilar, por marca).
- Tagging de performance (👍/👎 após publicar) — aprende quais hooks rendem.
- Busca full-text ("hook sobre economia").

### F6 — CTA library
- Biblioteca de CTAs: comment-bait, save-bait, share-bait, DM CTA, link-in-bio CTA.
- Por formato IG (CTA de Story ≠ CTA de carrossel).

### F7 — Hashtag suggester
- Combina os **hashtag sets** do estrategista (do [[estrategista#F6]]) com sugestão IA baseada na legenda.
- Mostra dificuldade de ranqueamento estimada (posts com #tag / seguidores da tag).
- Limite visual em 30 (limite do IG).

### F8 — Brand voice (IA)
- Cada marca tem **brand voice card**: tom (formal/casual), vocabulário proibido, vocabulário preferido, emojis sim/não, gírias sim/não, referências de copy aprovadas.
- Botão "gerar primeira versão" que chama LLM **condicionado ao brand voice**.
- Output é rascunho — copywriter edita, nunca publica direto.

### F9 — Versionamento e diff
- Toda edição gera versão. Diff visual lado-a-lado (git-style).
- Marca "aprovado por cliente" congela a versão.

### F10 — Solicitar aprovação
Botão que envia o post (copy + arte do designer quando pronta) para a fila do [[aprovador]].

## Integrações
- LLM (Claude/OpenAI) para brand voice — API key por agência.
- Leitura de brand voice do [[../../08_shared/briefing|briefing]] / `03_backend/schema` (tabela `brand_voice`).

## Handoffs
- **Entrada:** brief do [[estrategista]].
- **Saída:** script + legenda → [[designer]] (para carrosséis/Reels onde texto está na arte) e [[aprovador]].

## Métricas de sucesso do painel
- Tempo de "brief → legenda v1" < 15 min.
- % de hooks reutilizados da library (sinal de biblioteca útil) > 30%.
- % de legendas aprovadas em v1 > 60%.

## User stories relacionadas
- A definir (US-021+).

## Links
- [[README|índice de roles]]
- [[estrategista]] · [[designer]] · [[aprovador]]
