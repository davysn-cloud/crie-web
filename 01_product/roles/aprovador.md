---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# Painel do Aprovador (Cliente)

## Persona
Cliente da agência. Geralmente NÃO é usuário profissional de ferramenta social — é dono de loja, gestor de marketing do cliente, etc. **Zero tolerância a atrito.** Quer só "ver, aprovar ou pedir ajuste".

## Jobs-to-be-done
- Revisar posts pendentes em 1-2 min por post.
- Ver exatamente como o post vai aparecer no Instagram (não um "mockup de design").
- Deixar feedback específico (qual slide do carrossel, qual parte da imagem, qual palavra da legenda).
- Aprovar sem confusão.

## Princípios de design (diferente dos outros painéis)
- **Mobile-first** (cliente abre no celular em 90% dos casos).
- **Zero jargão de marketing** (não falar "pilar", "engagement", "CTA" na UI dele).
- **Magic link** por e-mail — nenhuma criação de conta obrigatória para o MVP.
- **Preview em primeiro plano**, controles secundários.

## Layout do painel
**Tela principal:** fila de posts pendentes em **card carrossel deslizável** (swipe horizontal no mobile).
**Por card:** preview Instagram-nativo ocupando 80% da tela + 3 botões na base: **Aprovar** · **Pedir ajuste** · **Comentar**.
**Tela de detalhe:** clique no preview abre comentários pinados + legenda.

## Funcionalidades

### F1 — Preview Instagram-nativo (não é mockup de design)
- Renderização **pixel-accurate** do IG:
  - Feed: header da conta + imagem + ícones de ação + legenda com "... ver mais".
  - Carrossel: indicador de slide (1/10, 2/10...), swipe horizontal funciona.
  - Story: UI completa com profile no topo, stickers, barra de progresso.
  - Reel: tela 9:16, CTA, captions ativadas por padrão.
- Toggle "como aparece no feed" vs "como aparece no perfil (grid)".

### F2 — Comentário pinado em coordenada
- Clique em qualquer ponto da imagem/slide → pin numerado com caixa de comentário.
- Em carrosséis, pin é por slide (salva slide index + x/y).
- Em Stories/Reel, pin pode ser sobre elemento dinâmico (frame específico do vídeo com timestamp).
- Resolver pin (checkmark) oculta mas mantém histórico.

### F3 — Comentário inline na legenda
- Selecionar texto da legenda → sugerir alteração (modelo "track changes" tipo Google Docs).
- Ver original vs sugestão lado a lado.

### F4 — 1-tap aprovar / pedir ajuste
- **Aprovar** → confirmação com swipe (evitar approve acidental). Timestamp + IP opcional para auditoria.
- **Pedir ajuste** → obrigatório selecionar motivo (dropdown curto: copy, arte, timing, outro) + campo texto opcional. Gera notificação para [[copywriter]] e/ou [[designer]].

### F5 — Histórico do post
- Timeline: "enviado para aprovação em X" → "comentário do cliente em Y" → "ajuste feito em Z" → "aprovado em W".
- Cada versão (copy + arte) acessível para comparação.

### F6 — Fila priorizada
Ordenação padrão: **mais próximo do prazo de publicação primeiro**.
Agrupamentos: por marca (se o cliente tem múltiplas), por campanha.

### F7 — Notificações
- E-mail quando há posts pendentes (limite 1 e-mail por marca por dia, digest).
- Push / WhatsApp (opcional — depende do canal configurado pela agência).
- Lembrete automático 24h antes do deadline se ainda pendente.

### F8 — Portal white-label
- Subdomínio da agência (ex: `cliente.agencia.crieweb.com`).
- Logo e cor primária da agência (não do crie-web).
- Rodapé discreto: "powered by crie-web".

### F9 — Magic link auth
- Cliente clica no e-mail → entra sem senha (link expira em 24h).
- Múltiplos aprovadores possíveis (ex: gerente + dono) — cada um com link próprio.
- Audit log: quem aprovou o quê.

### F10 — Resumo semanal (opcional)
E-mail automático segunda-feira com "5 posts aprovados semana passada, 3 pendentes esta semana" + thumbnails.

## Integrações
- **Resend / SendGrid** para e-mail transacional.
- Opcional: WhatsApp Business API (fase 2).

## Handoffs
- **Entrada:** post pronto (arte + legenda) do [[copywriter]] + [[designer]] após revisão interna.
- **Saída:** status `approved` libera para o [[social-media]] agendar.

## Métricas de sucesso do painel
- Tempo médio "enviado → decidido" < 18h (meta agressiva).
- % de clientes que acessam no mobile > 80% (confirma hipótese).
- Satisfação do cliente com o processo (CSAT/NPS).

## User stories relacionadas
- A definir (US-051+).

## Links
- [[README|índice de roles]]
- [[copywriter]] · [[designer]] · [[social-media]]
- [[admin#white-label]]
