---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: designer
feature_ref: F9 de [[../roles/designer]]
priority: P0
effort: M
---

# US-039 — Export JPG/PNG/MP4 respeitando specs IG

## Como / Quero / Para que
**Como** designer,
**quero** exportar artes em JPG/PNG (sRGB, <8MB) e vídeos em MP4 H.264 (<4GB, até 90s Reel),
**para que** a publicação via Meta API não seja recusada por spec inválida.

## Contexto
Erro de dimensão/peso é o #1 motivo de rejeição pela Meta API. Export correto é a última barreira.

## Critérios de aceitação (Gherkin)

### Cenário 1: Export JPG validado
**Dado** que tenho design Feed 1080×1350 finalizado
**Quando** clico "Exportar JPG"
**Então** arquivo é gerado em sRGB, compressão ~85, tamanho final < 8MB
**E** nome do arquivo segue padrão `<marca>_<campanha>_<pilar>_<formato>_v<N>.jpg`
**E** download inicia automaticamente.

### Cenário 2: Export em lote (variantes)
**Dado** que tenho master + 3 variantes
**Quando** clico "Exportar todas"
**Então** ZIP é gerado com 4 arquivos nomeados corretamente
**E** progresso mostrado (25%, 50%, 75%, 100%)
**E** download automático do ZIP.

### Cenário 3: Aviso se JPG > 8MB
**Dado** que tentei exportar com alta qualidade e resultado >8MB
**Quando** o export detecta o tamanho
**Então** sistema propõe "Reduzir qualidade" (barra 90→80→70) até ficar <8MB
**E** aviso "Limite prático do IG é 8MB por imagem".

### Cenário 4: Export MP4 para Reel
**Dado** que finalizei Reel 1080×1920 de 45s
**Quando** clico "Exportar MP4"
**Então** vídeo é encodado H.264, AAC audio, 30fps
**E** tamanho < 4GB (normalmente muito menor)
**E** validação de duração ≤90s (Reel feed).

### Cenário 5: Rejeição de duração inválida
**Dado** que o canvas Reel tem 95s
**Quando** clico exportar
**Então** bloqueio com "Reel no feed tem limite de 90s — reduza duração".

### Cenário 6: Export direto para publish queue
**Dado** que estou pronto para agendar
**Quando** clico "Exportar + enviar para publish"
**Então** arquivo é armazenado em Supabase Storage (bucket `published-media`)
**E** referência é linkada ao `publish_queue` entry (ver [[US-041-publicacao-meta-graph-api]])
**E** designer não precisa fazer upload manual depois.

## Dependências
- Backend: worker server-side para export de vídeo (ffmpeg), upload para Storage, link ao publish_queue. Endpoint `POST /designs/:id/export`.
- Frontend: botão de export, progress bar, opção "enviar para publish".
- Externas: ffmpeg (worker server-side), Supabase Storage.

## Fora de escopo
- Export para outros formatos (PDF, SVG — fase 2).
- Watermark removal (NA — plataforma não usa watermark).

## Links
- [[../roles/designer]]
- [[US-032-auto-adapt-master-variantes]]
- [[US-041-publicacao-meta-graph-api]]
