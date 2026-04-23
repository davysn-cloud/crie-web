---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: copywriter
feature_ref: F1 de [[../roles/copywriter]]
priority: P0
effort: M
---

# US-021 — Editor de legenda com constraints do Instagram

## Como / Quero / Para que
**Como** copywriter,
**quero** escrever legendas em um editor que mostra limite de 2.200 chars, preview do "... ver mais" em 125 chars e contador de emojis,
**para que** eu pare de publicar texto truncado ou com quebras quebradas no feed.

## Contexto
Editor central do painel. Todos os limites vêm da documentação oficial do Instagram (2200 chars totais, ~125 chars antes do "... ver mais"). Quebras de linha no IG colapsam se só tiverem espaço — precisa do caractere invisível `⠀`.

## Critérios de aceitação (Gherkin)

### Cenário 1: Contador de caracteres
**Dado** que estou no editor de legenda
**Quando** digito 1.800 caracteres
**Então** o contador mostra "1800 / 2200"
**E** a cor do contador é neutra.

### Cenário 2: Bloqueio em 2.200 caracteres
**Dado** que já tenho 2.200 caracteres
**Quando** tento digitar mais
**Então** a entrada é bloqueada
**E** contador fica vermelho "2200 / 2200 — limite do Instagram"
**E** aviso "Texto além do limite será truncado pelo Instagram" mesmo se cliente tentar colar.

### Cenário 3: Preview "... ver mais" em 125 chars
**Dado** que escrevi "Essa é minha primeira linha. Essa é a segunda linha que já passou de 125 caracteres e vai aparecer cortada."
**Quando** vejo a seção de preview
**Então** a preview mostra o texto até o caractere 125 seguido de "... ver mais"
**E** o corte é destacado visualmente com uma linha tracejada na posição 125.

### Cenário 4: Contador de emojis com aviso em 30
**Dado** que minha legenda tem 29 emojis
**Quando** adiciono mais 2 emojis (totalizando 31)
**Então** o contador mostra "31 emojis" em vermelho
**E** aparece "Mais de 30 emojis pode acionar shadowban — considere reduzir".

### Cenário 5: Inserção automática do caractere invisível
**Dado** que pressiono Enter duas vezes seguidas no editor (quebra de parágrafo vazia)
**Quando** o sistema detecta a linha vazia
**Então** insere automaticamente o caractere `⠀` (Braille space U+2800) na linha
**E** preview confirma que a quebra será preservada no IG
**E** toggle "mostrar caracteres invisíveis" revela onde estão.

### Cenário 6: Contador de linhas visível
**Dado** que escrevi 8 linhas de texto
**Quando** olho o painel lateral
**Então** vejo "8 parágrafos (7 quebras preservadas via ⠀)"
**E** aviso amarelo se alguma quebra não tem ⠀ (risco de colapso).

## Dependências
- Backend: tabela `post_versions` (id, post_id, caption, emoji_count, char_count, author_id, created_at).
- Frontend: componente `<CaptionEditor />` com contadores, preview lateral, Zustand para autosave.
- Externas: biblioteca `emoji-regex` para contagem confiável.

## Fora de escopo
- Correção ortográfica (usar browser nativo).
- Tradução automática.

## Links
- [[../roles/copywriter]]
- [[US-025-cta-library]]
- [[US-028-brand-voice-ia]]
