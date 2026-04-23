---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: low
role: aprovador
feature_ref: F10 de [[../roles/aprovador]]
priority: P2
effort: S
---

# US-059 — Resumo semanal para aprovador (e-mail de segunda-feira)

## Como / Quero / Para que
**Como** aprovador,
**quero** receber e-mail toda segunda-feira com "5 posts aprovados semana passada, 3 pendentes esta semana" + thumbnails,
**para que** eu tenha visão consolidada sem abrir o portal.

## Contexto
Feature opcional, baixa prioridade. Melhora relacionamento agência-cliente com transparência sem dar trabalho.

## Critérios de aceitação (Gherkin)

### Cenário 1: E-mail disparado segunda 9h (timezone marca)
**Dado** que é 2026-04-20 (segunda) 09:00 no timezone da marca
**Quando** worker semanal dispara
**Então** aprovadores ativos recebem e-mail "Resumo semanal — [Marca X]"
**E** e-mail contém: thumbs dos 5 posts aprovados + 3 pendentes + CTA "Revisar pendentes"
**E** só dispara se houve atividade na semana (>0 posts).

### Cenário 2: Opt-out individual
**Dado** que aprovador desativou "Receber resumo semanal"
**Quando** segunda 9h chega
**Então** e-mail NÃO é enviado a esse aprovador
**E** demais aprovadores da mesma marca recebem normal.

### Cenário 3: Métricas opcionais
**Dado** que Meta Insights está conectado
**Quando** e-mail é montado
**Então** inclui bullet "top post da semana (metric: 4.2k alcance)"
**E** fallback se API não disponível: omite métricas.

### Cenário 4: Falha de e-mail não afeta outros
**Dado** que o envio para 1 aprovador falhou (endereço inválido)
**Quando** worker continua
**Então** marca aquele envio como failed
**E** outros aprovadores recebem normal
**E** admin vê erro em audit log.

### Cenário 5: Semana sem atividade
**Dado** que marca não teve posts aprovados/pendentes na semana
**Quando** worker roda
**Então** não dispara e-mail (evita ruído).

## Dependências
- Backend: worker cron semanal (segunda 9h por timezone de marca), query agregada `weekly_summary`.
- Frontend: preferência on/off na página do aprovador.
- Externas: Resend.

## Fora de escopo
- Relatório customizado pelo admin (cor, layout, — white-label avançado fase 2+).

## Links
- [[../roles/aprovador]]
- [[US-057-notificacoes-aprovador]]
