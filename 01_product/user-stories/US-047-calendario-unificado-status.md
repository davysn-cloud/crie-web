---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: draft
confidence: high
role: social-media
feature_ref: F7 de [[../roles/social-media]]
priority: P1
effort: M
---

# US-047 — Calendário unificado com status colorido

## Como / Quero / Para que
**Como** social media,
**quero** calendário mês/semana agregando scheduled, published, failed, draft com cores diferentes,
**para que** eu veja status de toda operação em uma tela.

## Contexto
Diferente do calendário do estrategista (que foca em pilar/formato), este foca em pipeline de publicação.

## Critérios de aceitação (Gherkin)

### Cenário 1: View mês com todos os status
**Dado** que a marca tem 15 posts distribuídos (8 scheduled, 5 published, 1 failed, 1 draft)
**Quando** abro calendário unificado
**Então** cada card tem cor de borda: verde (published), azul (scheduled), vermelho (failed), cinza (draft)
**E** legenda visível no topo mostra cada cor.

### Cenário 2: Clique em dia mostra lista
**Dado** que 4 posts estão em 2026-04-20
**Quando** clico no dia 20
**Então** drawer lateral mostra os 4 posts com horário, status e thumb
**E** posso abrir cada um em nova tela.

### Cenário 3: Gap de conteúdo sinalizado
**Dado** que 2026-04-25 não tem nenhum post
**Quando** vejo o calendário
**Então** dia 25 tem hachura suave "sem posts"
**E** tooltip "Agendar post" que abre brief builder.

### Cenário 4: View semana mais densa
**Dado** que a marca tem 5 posts em 1 dia
**Quando** mudo para view "semana"
**Então** cada dia ocupa uma coluna alta
**E** todos os 5 posts aparecem como cards empilhados verticalmente com horário.

### Cenário 5: Filtro por status
**Dado** que quero ver apenas failed
**Quando** ativo filtro "Failed"
**Então** apenas posts com status failed aparecem
**E** counter "1 post com falha — recuperar?".

### Cenário 6: Ação rápida de republicar failed
**Dado** que vejo um post failed
**Quando** clico "Republicar"
**Então** sistema cria nova entry `publish_queue` com mesma config
**E** worker re-executa com status `scheduled`.

## Dependências
- Backend: view agregada `calendar_unified` por brand_id + periodo.
- Frontend: calendar component (pode usar FullCalendar ou custom), filtros, drawer.
- Externas: none.

## Fora de escopo
- Integração com Google Calendar externo (fase 2).

## Links
- [[../roles/social-media]]
- [[US-012-calendario-editorial-multiformato]]
- [[US-041-publicacao-meta-graph-api]]
