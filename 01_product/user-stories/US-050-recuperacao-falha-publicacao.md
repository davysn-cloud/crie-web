---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: Cross-feature (F1+F8) de [[../roles/social-media]]
priority: P0
effort: M
---

# US-050 — Recuperação rápida de falha de publicação

## Como / Quero / Para que
**Como** social media,
**quero** um fluxo guiado para analisar motivo da falha e republicar em <10min,
**para que** a meta de 0 posts perdidos se mantenha.

## Contexto
Métrica de sucesso do painel: tempo médio de recuperação de falha < 10min. Requer diagnóstico rápido + ações sugeridas.

## Critérios de aceitação (Gherkin)

### Cenário 1: Falha acionável com motivo clara
**Dado** que um post falhou com erro "image_resolution_too_low"
**Quando** abro o post failed
**Então** vejo card vermelho com motivo traduzido para PT: "Imagem com resolução abaixo do mínimo do Instagram (320px)"
**E** ação sugerida: "Refazer export do design em resolução maior"
**E** botão "Abrir design no designer".

### Cenário 2: Republicar após correção
**Dado** que corrigi a imagem e refiz export
**Quando** clico "Republicar" no post failed
**Então** nova entry publish_queue é criada com novo asset
**E** status anterior mantido em histórico
**E** contador "tempo de recuperação = 4min 32s" registrado.

### Cenário 3: Notificação push imediata
**Dado** que worker detectou falha
**Quando** status vira failed
**Então** push notification dispara em <30s
**E** e-mail de backup se push não entregue em 2min.

### Cenário 4: Ação em lote para falhas similares
**Dado** que 5 posts falharam com mesmo erro "token_expired"
**Quando** abro "Falhas agrupadas"
**Então** vejo grupo de 5 posts com ação sugerida "Reconectar Meta"
**E** botão "Reconectar + republicar todos".

### Cenário 5: Notificar time dependente
**Dado** que a falha é "caption_too_long"
**Quando** clico "Notificar copywriter"
**Então** copywriter recebe notificação in-app + e-mail com link direto ao post
**E** slot "awaiting copy fix" fica visível no painel do social-media.

### Cenário 6: Cálculo de SLA de recuperação
**Dado** que o time teve 5 falhas este mês com recuperação em 6, 12, 4, 8, 25 min
**Quando** abro dashboard do painel
**Então** vejo "Tempo médio de recuperação: 11 min (meta: <10min)"
**E** a falha de 25min destacada para análise post-mortem.

## Dependências
- Backend: tabela `publish_failures` (queue_id, error_code, error_message, recovered_at). Mapa de error_code → mensagem PT-BR + ação sugerida.
- Frontend: tela de falhas agrupadas, ações em lote, timer de recuperação.
- Externas: Meta error codes (documentados).

## Fora de escopo
- IA que prediz falhas antes (fase 3+).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-048-fallback-manual-publish]]
