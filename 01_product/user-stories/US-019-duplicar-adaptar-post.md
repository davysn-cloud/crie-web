---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: estrategista
feature_ref: F8 de [[../roles/estrategista]]
priority: P1
effort: S
---

# US-019 — Duplicar + adaptar post de sucesso

## Como / Quero / Para que
**Como** estrategista,
**quero** pegar um post de alto desempenho e gerar um novo brief herdando pilar, formato e estrutura,
**para que** eu economize tempo em posts recorrentes.

## Contexto
Útil para séries ("dica da semana"), posts sazonais e replicação de fórmulas comprovadas. Muda o conteúdo mantendo o formato vencedor.

## Critérios de aceitação (Gherkin)

### Cenário 1: Duplicar do performance panel
**Dado** que estou no [[US-018-performance-panel-insights|performance panel]] vendo o post top "Como economizar nas compras"
**Quando** clico no menu "Duplicar + adaptar"
**Então** abre o brief builder pré-preenchido com: mesmo pilar, mesmo formato IG (Carrossel 1080×1350), mesmo CTA, mesma audiência
**E** o campo "mensagem-chave" está vazio aguardando nova mensagem.

### Cenário 2: Vínculo com post original
**Dado** que criei um novo post a partir de "duplicar + adaptar"
**Quando** salvo o novo brief
**Então** o novo post tem `source_post_id` apontando para o original
**E** na view de detalhes vejo link "Adaptado de: Como economizar nas compras"
**E** o performance panel pode agrupar "série de 4 posts derivados".

### Cenário 3: Duplicar preservando arte master
**Dado** que o post original tem arte carrossel em master 1080×1350
**Quando** duplico marcando "Copiar arte como ponto de partida"
**Então** o [[US-032-auto-adapt-master-variantes|designer]] recebe a arte duplicada como novo rascunho
**E** pode alterar texto/imagens sem afetar o original.

### Cenário 4: Duplicar dentro de uma campanha
**Dado** que existe campanha "Dicas da Semana" com 3 posts
**Quando** duplico um dos posts via "Duplicar + adaptar"
**Então** o novo post já vem vinculado à mesma campanha
**E** herda a mensagem-chave da campanha.

### Cenário 5: Múltiplas duplicatas mantêm árvore
**Dado** que o post A foi duplicado gerando B, e B foi duplicado gerando C
**Quando** abro o post C
**Então** vejo breadcrumb "C ← B ← A"
**E** posso navegar na árvore.

## Dependências
- Backend: campo `source_post_id` em `posts`. Endpoint `POST /posts/:id/duplicate`.
- Frontend: menu dropdown no card de post, pré-preenchimento do brief builder.
- Externas: none.

## Fora de escopo
- IA sugerindo "esse post é candidato a ser replicado" (fase 2).

## Links
- [[../roles/estrategista]]
- [[US-015-brief-builder-handoff]]
- [[US-018-performance-panel-insights]]
