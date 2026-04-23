---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: aprovador
feature_ref: F2 de [[../roles/aprovador]]
priority: P0
effort: L
---

# US-053 — Comentário pinado em coordenada (imagem/slide/frame)

## Como / Quero / Para que
**Como** aprovador,
**quero** clicar em qualquer ponto da imagem/slide/frame e deixar comentário com pin numerado naquele ponto,
**para que** o designer saiba exatamente onde está o problema.

## Contexto
Substitui "tá feio o canto direito" por pin exato. Pin em carrossel salva `slide_index + x + y`. Em vídeo, salva `timestamp + x + y`.

## Critérios de aceitação (Gherkin)

### Cenário 1: Pin em imagem feed
**Dado** que estou vendo Feed 1080×1080
**Quando** tap em coordenada (x=450, y=300)
**Então** aparece pin numerado "1" no ponto
**E** balão de comentário abre pedindo texto
**E** ao salvar, pin permanece fixo visível para o time.

### Cenário 2: Pin em slide específico de carrossel
**Dado** que estou no slide 3 de um carrossel
**Quando** tap em coordenada (x=200, y=800)
**Então** pin salva `slide_index=3, x=200, y=800`
**E** slides 1, 2, 4-6 não mostram este pin
**E** slide 3 mostra "1 comentário pinado".

### Cenário 3: Pin em frame de vídeo Reel
**Dado** que Reel está pausado em 00:07
**Quando** tap em coordenada (x=500, y=900)
**Então** pin salva `video_timestamp=7.0, x=500, y=900`
**E** ao re-abrir o post, vídeo pausa em 00:07 com pin visível
**E** clique no pin em outro momento vai direto ao timestamp.

### Cenário 4: Múltiplos pins com numeração
**Dado** que tenho 3 pins no mesmo slide
**Quando** vejo a imagem
**Então** pins aparecem numerados 1, 2, 3 por ordem de criação
**E** cada um abre seu próprio comentário.

### Cenário 5: Resolver pin
**Dado** que o designer corrigiu o pin 1
**Quando** clico "Marcar como resolvido" no pin
**Então** pin 1 fica cinza com checkmark
**E** permanece no histórico mas some da visualização padrão
**E** toggle "mostrar resolvidos" revela.

### Cenário 6: Reply em pin (conversa)
**Dado** que deixei pin com texto "aumentar o logo"
**E** designer respondeu "quanto maior? 20%?"
**Quando** abro o pin
**Então** vejo thread com 2 mensagens
**E** posso responder mantendo a thread.

### Cenário 7: Notificação ao time
**Dado** que criei um pin com comentário
**Quando** salvo
**Então** designer + copywriter atribuídos recebem notificação in-app
**E** e-mail consolidado (digest) em 15min se outros pins forem criados no mesmo post.

## Dependências
- Backend: tabela `approval_pins` (id, post_id, design_id, slide_index nullable, video_timestamp nullable, x, y, comment, author, resolved_at, parent_pin_id). Endpoint `POST /posts/:id/pins`.
- Frontend: canvas overlay com pins clicáveis, drawer de comentário, notificações.
- Externas: none.

## Fora de escopo
- Anotação de elementos específicos (ex: selecionar um texto exato na imagem — fase 2).

## Links
- [[../roles/aprovador]]
- [[US-054-comentario-legenda-inline]]
- [[US-057-notificacoes-aprovador]]
