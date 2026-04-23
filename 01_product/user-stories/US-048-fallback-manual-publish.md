---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: F8 de [[../roles/social-media]]
priority: P0
effort: M
---

# US-048 — Fallback manual (publish reminder) para Stories

## Como / Quero / Para que
**Como** social media,
**quero** que quando o formato não for 100% suportado pela API (principalmente Stories), eu receba push + e-mail com a arte pronta + legenda + 1º comentário para publicar manualmente em até 2 min,
**para que** o ciclo se feche mesmo quando a API falha.

## Contexto
API de Stories tem restrições regionais e de tipo de mídia. Fallback manual garante que a operação não trava.

## Critérios de aceitação (Gherkin)

### Cenário 1: Detectar formato não-API
**Dado** que post é Story e a marca não tem API de Stories habilitada
**Quando** worker tenta processar a fila
**Então** em vez de chamar Meta API, dispara fluxo "manual publish"
**E** push notification para o usuário social-media 5min antes do scheduled_at.

### Cenário 2: Bundle completo enviado
**Dado** que push disparou
**Quando** social-media clica notificação
**Então** abre tela "Publicar manualmente" com:
- Arte pronta para download (botão 1-clique que baixa com nome padronizado)
- Legenda no clipboard (botão "Copiar legenda")
- 1º comentário separado (botão "Copiar 1º comentário")
- Link direto para o Instagram app
**E** timer regressivo "publicar em 5min".

### Cenário 3: Marcar como publicado
**Dado** que publiquei manualmente no IG
**Quando** clico "Marcar como publicado"
**Então** modal pede URL do post publicado (opcional)
**E** status vira `published_manually`
**E** insights posteriores podem ser puxados via URL → ig_media_id.

### Cenário 4: Notificação adicional em falha de auto-post
**Dado** que post Feed tentou API e falhou após 3 retries
**Quando** auto-retry esgota
**Então** mesmo fluxo de fallback manual dispara
**E** status vira `requires_manual` com motivo do erro original.

### Cenário 5: E-mail com bundle para offline
**Dado** que push não foi lido em 2min
**Quando** sistema detecta no-read
**Então** dispara e-mail com os mesmos anexos (arte + legenda + 1º comment)
**E** também um link temporário (24h) para a tela de "Publicar manualmente".

### Cenário 6: Log de publicações manuais
**Dado** que tive 3 publicações manuais hoje
**Quando** abro report
**Então** vejo cada uma com motivo (Story / API fallback / requires_manual)
**E** tempo médio de publicação manual (desde push até "marcar publicado").

## Dependências
- Backend: flag `requires_manual` em `publish_queue`, worker que detecta tipo e escala para manual. Endpoint `POST /publish-queue/:id/mark-manual-published`. Push service (web push notifications).
- Frontend: tela "Publicar manualmente" com download e copy buttons, PWA notifications.
- Externas: Resend para e-mail, web-push library para navegador.

## Fora de escopo
- App nativo mobile (fase 3+).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-057-notificacoes-aprovador]]
