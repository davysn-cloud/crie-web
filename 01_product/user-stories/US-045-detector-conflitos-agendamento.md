---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: F5 de [[../roles/social-media]]
priority: P0
effort: S
---

# US-045 — Detector de conflitos antes de confirmar agendamento

## Como / Quero / Para que
**Como** social media,
**quero** alertas automáticos de conflitos (dois posts mesma hora, feriado sensível, fora de campanha, não aprovado) antes de confirmar agendamento,
**para que** eu não publique errado ou em horário inapropriado.

## Contexto
Detecta classes de erro comuns. Alerta é bloqueante (precisa override explícito) ou informativo conforme gravidade.

## Critérios de aceitação (Gherkin)

### Cenário 1: Dois posts mesma hora bloqueia
**Dado** que existe post agendado para 2026-04-20T10:00 da marca "Acme"
**Quando** tento agendar outro post da "Acme" para o mesmo horário
**Então** bloqueio com modal "Outro post já agendado para este horário"
**E** opções: "ajustar para ±15min" ou "cancelar"
**E** agendamento não completa sem override.

### Cenário 2: Feriado sensível avisa
**Dado** que 2026-07-07 é Dia Nacional (feriado configurado no sistema)
**Quando** agendo post promocional para 2026-07-07
**Então** aviso amarelo "Data comercial sensível — confirmar intenção"
**E** não bloqueia, mas exige checkbox "Ciente do contexto".

### Cenário 3: Overlap de campanha
**Dado** que o post é vinculado à campanha "Black Friday" (2026-11-20 a 2026-11-30)
**Quando** agendo para 2026-12-05 (fora da campanha)
**Então** aviso "Post fora da janela da campanha Black Friday"
**E** opções: "Estender campanha" ou "Remover vínculo" ou "Cancelar".

### Cenário 4: Post não aprovado bloqueia
**Dado** que o design ainda está `in_review` (não aprovado pelo cliente)
**Quando** tento agendar
**Então** bloqueio duro com "Post não aprovado pelo cliente — aprovação obrigatória para agendar"
**E** link para a fila de aprovação pendente.

### Cenário 5: Timezone conflitante
**Dado** que o usuário está em America/Sao_Paulo mas a marca é em Europe/Lisbon
**Quando** confirmo "10:00"
**Então** modal mostra "Você agendou 10:00 BRT (Brasil) = 14:00 WET (Portugal/marca) — correto?"
**E** usuário confirma timezone da marca.

### Cenário 6: Múltiplos alertas simultâneos
**Dado** que tento agendar post não aprovado + mesmo horário + feriado
**Quando** clico confirmar
**Então** modal consolida os 3 alertas ordenados por gravidade (bloqueio > aviso)
**E** resolve primeiro o bloqueio antes de confirmar.

## Dependências
- Backend: tabela `calendar_holidays` (date, country, description, sensitivity), função `validate_schedule(post_id, scheduled_at)` retornando array de warnings/errors.
- Frontend: modal de validação com severity colors.
- Externas: dataset de feriados (PT-BR, EN-US, EN-GB — seed inicial).

## Fora de escopo
- Detecção de eventos globais em tempo real (fase 2+).

## Links
- [[../roles/social-media]]
- [[US-041-publicacao-meta-graph-api]]
- [[US-014-campaign-groups-timeline]]
