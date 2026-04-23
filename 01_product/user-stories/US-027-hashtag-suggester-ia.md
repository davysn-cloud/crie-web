---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: copywriter
feature_ref: F7 de [[../roles/copywriter]]
priority: P1
effort: M
---

# US-027 — Hashtag suggester combinando sets + IA

## Como / Quero / Para que
**Como** copywriter,
**quero** sugestões de hashtags combinando os sets da marca (de [[US-017-hashtag-sets-biblioteca]]) com análise IA da minha legenda,
**para que** eu atinja o limite de 30 hashtags relevantes sem pesquisar manualmente.

## Contexto
Complementa os sets pré-definidos do estrategista com hashtags IA específicas ao conteúdo da legenda.

## Critérios de aceitação (Gherkin)

### Cenário 1: Gerar sugestão a partir da legenda
**Dado** que escrevi uma legenda sobre "5 dicas para economizar nas compras"
**Quando** clico "Sugerir hashtags"
**Então** o sistema chama LLM passando a legenda + pilar + brand voice
**E** recebe 20-30 hashtags sugeridas em <5s
**E** cada hashtag tem score estimado (alta/média/baixa concorrência).

### Cenário 2: Combinar com hashtag set do pilar
**Dado** que o pilar "Educativo" tem set "Economia Doméstica" com 18 hashtags
**E** a IA sugeriu 22 hashtags novas
**Quando** o picker abre
**Então** vejo 2 colunas: "Do set (18)" + "IA sugeriu (22)" com overlap desduplicado
**E** posso selecionar até 30 no total.

### Cenário 3: Métrica de dificuldade de ranqueamento
**Dado** que uma hashtag sugerida é `#economia` (20M posts)
**Quando** vejo detalhes
**Então** score "difícil" (vermelho) aparece
**E** para `#economiadomesticabrasil` (15k posts) score "fácil" (verde)
**E** fórmula documentada: `log(post_count)`.

### Cenário 4: Limite visual 30
**Dado** que selecionei 29 hashtags
**Quando** tento selecionar mais 2
**Então** a 30ª entra
**E** a 31ª é bloqueada com "Limite do Instagram: 30 hashtags".

### Cenário 5: Fallback sem IA
**Dado** que a API LLM está fora ou a marca não tem chave configurada
**Quando** clico "Sugerir hashtags"
**Então** o sistema mostra apenas os sets do pilar
**E** aviso "IA indisponível — usando sets da marca".

### Cenário 6: Inserir no 1º comentário (não na legenda)
**Dado** que selecionei 28 hashtags
**Quando** clico "Adicionar ao 1º comentário"
**Então** as hashtags vão para o campo `first_comment` do post (ver [[US-043-primeiro-comentario-automatico]])
**E** não entram na legenda, preservando estética do feed.

## Dependências
- Backend: endpoint `POST /hashtags/suggest` (caption, brand_id) → chama LLM com cache, retorna JSON. Tabela `hashtag_counts` (tag → post_count cached).
- Frontend: picker modal dual-column, seletor de destino (legenda vs 1º comment).
- Externas: API LLM (Claude/OpenAI), API oficial ou scrape cached de post counts.

## Fora de escopo
- Detecção de shadowban (listas públicas de tags banidas podem ser usadas em fase 2).

## Links
- [[../roles/copywriter]]
- [[US-017-hashtag-sets-biblioteca]]
- [[US-043-primeiro-comentario-automatico]]
