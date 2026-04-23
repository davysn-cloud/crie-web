---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: aprovador
feature_ref: F5 de [[../roles/aprovador]]
priority: P1
effort: S
---

# US-056 — Histórico do post (timeline de ações)

## Como / Quero / Para que
**Como** aprovador,
**quero** ver timeline do post ("enviado para aprovação → comentário → ajuste → aprovado") com versões acessíveis,
**para que** eu entenda o caminho percorrido antes de decidir.

## Contexto
Reforça confiança do cliente. Cada etapa tem ator + timestamp + ação.

## Critérios de aceitação (Gherkin)

### Cenário 1: Timeline vertical
**Dado** que post passou por 4 etapas (enviado, comentado, ajustado, aprovação pendente)
**Quando** abro "Histórico"
**Então** vejo timeline vertical com ícone + ação + timestamp + autor
**E** exemplo: "2026-04-15 14:30 — João (copywriter) enviou para aprovação"
**E** linha tracejada conectando os eventos.

### Cenário 2: Acessar versão específica
**Dado** que versão 2 da legenda aparece na timeline
**Quando** clico "Ver v2"
**Então** preview alterna para essa versão com badge "Visualizando v2 (não atual)"
**E** todos os comentários daquela versão aparecem
**E** botão "voltar à versão atual" sempre visível.

### Cenário 3: Comparar duas versões
**Dado** que existem v2 e v5 na timeline
**Quando** clico "Comparar" em cada uma
**Então** abre modal diff lado-a-lado
**E** mostra legenda antes/depois + arte antes/depois.

### Cenário 4: Filtro por tipo de ação
**Dado** que a timeline tem 20 eventos
**Quando** filtro por "comentários"
**Então** vejo apenas eventos de comentário
**E** toggle remove filtro.

### Cenário 5: Mobile compact
**Dado** que estou no mobile
**Quando** abro histórico
**Então** timeline é compacta (só ação + timestamp relativo tipo "há 2h")
**E** expand por tap revela detalhes.

## Dependências
- Backend: tabela `post_events` append-only (id, post_id, type, actor_id, actor_role, payload_json, created_at). View `post_timeline`.
- Frontend: timeline component, diff modal.
- Externas: none.

## Fora de escopo
- Export do histórico como PDF (fase 2, para audit dos clientes).

## Links
- [[../roles/aprovador]]
- [[US-029-versionamento-diff-copy]]
- [[US-040-version-lock-designer]]
