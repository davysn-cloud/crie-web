---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: high
---

# ADR 004 — Armazenamento de pins de aprovação (JSONB vs normalizado)

## Contexto
O painel do aprovador ([[../../01_product/roles/aprovador|aprovador]] F2) permite criar comentários pinados em (x,y) sobre imagens, por slide de carrossel ou frame de Reel. Precisamos decidir como persistir.

Opções:
1. **Tabela normalizada `approval_pins`** — 1 linha por pin, colunas `slide_index`, `pin_x`, `pin_y`, `body`, `target`, `caption_range_*`, `resolved`, etc.
2. **JSONB em `approval_requests.pins`** — array no próprio request.
3. **Reaproveitar `comments` já existente** — ele já tem `pin_x`, `pin_y`, polymorphic `target_type/target_id`.

## Opções avaliadas

### A) Tabela normalizada dedicada
Prós:
- Queries ricas: "pins não resolvidos deste request", "pins criados pelo email X", "pins por slide".
- Índices específicos (`(approval_request_id, resolved)`).
- RLS clara.
- Fácil adicionar colunas (ex: `pin_shape`, `attachment_url`).
- Suporta **comentário inline na legenda** com `caption_range_start/end`.

Contras:
- +1 tabela.
- JOIN a mais quando carregamos o `approval_request` completo.

### B) JSONB em `approval_requests.pins`
Prós:
- 1 query carrega tudo.
- Menos tabelas.

Contras:
- Update atômico de pin individual exige `jsonb_set` com path — complexo.
- Resolver pin = reescrever JSON.
- Sem índices por pin.
- Validação de shape via CHECK é limitada.
- Race condition: dois aprovadores criando pins em paralelo, UPDATE do jsonb full podem perder.

### C) Reaproveitar `comments`
Prós:
- Evita duplicação conceitual com `comments.pin_x/pin_y`.
- RLS e realtime já existem.

Contras:
- Contexto é diferente: `comments` é colaboração interna com `author_id = auth.uid()`. Pins do aprovador vêm de `magic_link` — **aprovador não tem `auth.uid()`**. Precisaríamos `NULL author_id` ou um auth.uid() fake, o que polui semântica.
- Falta `slide_index`, `frame_timestamp_ms`, `caption_range_*`.
- `comment_target_type` precisaria estender para `approval_request`.
- Se cliente decide mudar, precisaria mexer em uma tabela de dois usos.

## Decisão

**Opção A: tabela normalizada `approval_pins`.**

Racional:
- Separação semântica clara: `comments` é interno (author_id → users), `approval_pins` é externo (author_email → magic_link).
- RLS simpler: pins são acessíveis via `approval_request → workspace`.
- Permite evoluir o modelo do aprovador sem risco de regressão no fluxo interno.
- Race conditions resolvidas naturalmente (INSERT por row).

Trade-off aceito:
- +1 tabela, +1 JOIN ao carregar request. Custo baixo dado o volume esperado (< 20 pins por request típico).

## Consequências
- `comments.pin_x/pin_y` fica como funcionalidade interna (ex: designer/copy anotando um card) — não é usado no fluxo do aprovador.
- Frontend precisa carregar `approval_pins` em endpoint separado (ou include no `/magic-link/verify` response — ver [[../../03_backend/api/magic-link#magic-link-verify]]).
- Se surgir desejo de "comentários do aprovador não-pinados" (só texto), adicionamos `target='general'` ou usamos o `decision_note` do `approval_requests`.

## Links
- [[../../03_backend/schema#approval_pins]]
- [[../../03_backend/api/magic-link]]
- [[../../01_product/roles/aprovador#F2]]
