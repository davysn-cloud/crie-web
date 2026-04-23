---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: medium
role: copywriter
feature_ref: F8 de [[../roles/copywriter]]
priority: P1
effort: L
---

# US-028 — Brand voice condicionado e gerador IA de primeira versão

## Como / Quero / Para que
**Como** copywriter,
**quero** configurar brand voice (tom, vocabulário proibido/preferido, emojis, gírias, referências) por marca e gerar primeira versão de legenda via LLM condicionado,
**para que** eu acelere a produção sem quebrar a identidade da marca.

## Contexto
Output é SEMPRE rascunho — copywriter edita antes de enviar para aprovação. Nunca publica direto.

## Critérios de aceitação (Gherkin)

### Cenário 1: Configurar brand voice card
**Dado** que sou admin/estrategista na marca "Acme Co"
**Quando** preencho: tom (casual), vocabulário proibido ["maneiro", "top"], preferido ["gente", "família"], emojis (sim), gírias (não), 3 referências de copy aprovadas
**Então** o brand voice card é salvo
**E** copywriter passa a ver "Brand Voice: Acme Co" ativo no editor.

### Cenário 2: Gerar legenda condicionada
**Dado** que o brief tem mensagem-chave "5 dicas para economizar" e pilar "Educativo"
**E** a marca tem brand voice configurado
**Quando** clico "Gerar primeira versão"
**Então** LLM é chamado com: brand voice + brief + formato IG
**E** o output aparece no editor em <10s com badge "IA rascunho"
**E** char count e contadores funcionam normalmente.

### Cenário 3: Validação de vocabulário proibido
**Dado** que a IA gerou uma legenda com a palavra "maneiro" (proibida)
**Quando** o output é renderizado
**Então** a palavra "maneiro" fica destacada em vermelho com aviso "Termo proibido pela brand voice"
**E** o copywriter precisa substituir antes de enviar para aprovação.

### Cenário 4: Regerar com feedback
**Dado** que a primeira versão não ficou boa
**Quando** clico "Regerar" com campo opcional "foque mais no benefício financeiro"
**Então** a chamada LLM inclui o feedback + a versão anterior como contexto
**E** nova versão aparece.

### Cenário 5: Limite de gerações por dia
**Dado** que o plano da agência permite 100 gerações IA/dia
**Quando** atinjo 100 gerações
**Então** próximas chamadas retornam "Limite diário atingido — upgrade disponível"
**E** o botão desabilita até meia-noite UTC.

### Cenário 6: Nunca publicar direto
**Dado** que a legenda foi gerada por IA
**Quando** tento clicar "Solicitar aprovação" sem editar
**Então** o sistema bloqueia
**E** aviso "Edite ao menos uma palavra antes de enviar — IA é ponto de partida".

## Dependências
- Backend: tabela `brand_voice` (id, brand_id, tone, banned_words[], preferred_words[], emoji_allowed, slang_allowed, reference_copies[]). Endpoint `POST /ai/generate-caption`. Counter `llm_usage_daily`.
- Frontend: form de brand voice, botão "gerar" com loading, highlight de proibidas.
- Externas: Claude/OpenAI API (chave por agência, ver [[US-069-chaves-api-agencia]]).

## Fora de escopo
- Fine-tuning real por marca (custo alto, fase 3+).
- Geração de arte IA (fase 2+).

## Links
- [[../roles/copywriter]]
- [[US-021-editor-legenda-constraints-ig]]
- [[US-069-chaves-api-agencia]]
