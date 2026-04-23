---
created: 2026-04-15
updated: 2026-04-15
owner: qa
status: draft
confidence: medium
priority: P0
covers: [US-015, US-020, US-021, US-029, US-030, US-031, US-032, US-033, US-034, US-037, US-039, US-040, US-041, US-043, US-044, US-045, US-049, US-068]
---

# E2E Flow 1: Brief → Aprovação → Publicação (happy path)

> Valida a espinha dorsal do produto: estrategista cria brief, copywriter/designer executam em paralelo, revisão interna, envio ao cliente, aprovação, agendamento, publicação real via Meta Graph API, captura de insights.

## Personas envolvidas
1. **Estrategista** (Agência A, workspace "Marca Solaris") — autenticado via Supabase Auth.
2. **Copywriter** (mesma agência) — autenticado.
3. **Designer** (mesma agência) — autenticado.
4. **Social Media / Publisher** (mesma agência) — autenticado.
5. **Aprovador** (cliente externo da Marca Solaris) — via magic_link.

## Pré-condições (setup do ambiente)
- Seed: Agência A com workspace "Marca Solaris".
- `brand_profiles` e `brand_voice` da workspace configurados (cores, fontes, tom).
- 3 `pillars` criados: "Educacional", "Promocional", "Bastidores".
- Membros com `workspace_members.role` atribuídos: estrategista, copywriter, designer, social_media.
- `agency_integrations` com row Meta Graph API ativa (token criptografado via pgsodium, `ig_business_account_id` válido).
- Feature flags: `brief_builder`, `multi_format_canvas`, `publish_queue` todas ON.
- Mocks ativos: `GraphAPI`, `Resend`, `LLM`.
- Cron `publish_worker_tick` desabilitado no CI (disparado manualmente via Edge Function direct invocation para determinismo).

## Passos (sequência numerada)

### Ato I — Brief (Estrategista, US-015)
1. **Dado** o estrategista logado no painel `/estrategista` da Marca Solaris.
2. **Quando** clica "Novo brief" → preenche `objective='awareness'`, `ig_format='carousel'`, `key_message`, `cta`, `target_audience`, vincula `pillar_id` "Educacional", define `due_at` = hoje+3d, atribui `assignee_copy` e `assignee_design`, adiciona 2 `references_json` (1 URL, 1 imagem).
3. **Então** na UI aparece o card do brief na fila "Active"; **no DB** há row em `briefs` com `status='active'`, FKs corretas, `workspace_id` = workspace da Marca Solaris.
4. **E** `audit_log` contém evento `brief.created` com `actor_type='user'`.

### Ato II — Handoff paralelo (Copywriter + Designer)
5. **Quando** copywriter abre painel `/copywriter`, filtra "atribuídos a mim" → vê o brief.
6. **Quando** clica "Escrever legenda" → abre editor com constraints IG (contador 0/2200, alerta em 2000, bloqueio em 2200) (US-021). Escreve 180 chars + 8 hashtags.
7. **E** salva → **no DB** cria row em `post_cards` com `stage='writing'` vinculada ao brief (via `briefs.post_card_id` UNIQUE populado), + row em `post_drafts`, + row em `copy_versions` v1.
8. **Quando** designer abre painel `/designer`, vê o mesmo card.
9. **Quando** abre `MultiFormatCanvas` → `post_formats` para `carousel` é criado; adiciona 5 slides (US-034), `brand_kit_lock` ON (cores e fontes bloqueadas do brand kit — US-033).
10. **E** usa auto-adapt para gerar variante `feed_4_5` do slide 1 (US-032) → Edge Function `/auto-adapt` retorna novo `carousel_slides` rows e/ou `post_formats` nova row; asset exportado em `asset_library`.
11. **Então** **no DB** `carousel_slides` tem 5 rows com `slide_index` 0..4 respeitando `CHECK slide_index BETWEEN 0 AND 9`; `asset_versions` tem v1 por slide.

### Ato III — Revisão interna + envio ao cliente (US-030)
12. **Quando** copywriter clica "Enviar para aprovação" → modal captura `assignee_email` + `assignee_label` do aprovador.
13. **Então** Edge Function `/approval/create` cria snapshot em `post_versions` v1 (payload_json com copy, carousel_slides, hashtags), cria `approval_requests` com `status='pending'`, `post_version_id` vinculado, `expires_at = now()+7d`, cria `magic_links` com `token_hash` (plaintext retornado uma vez ao backend), e dispara `Resend.send()` com o link.
14. **E** `post_cards.stage='in_review_client'`; `stage_transitions` tem a transição.
15. **Assert mock Resend:** payload contém `to=assignee_email`, link contém `/a/<token>` com token plaintext de 43 chars base64url (256 bits).

### Ato IV — Aprovação pelo cliente (US-051, US-052, US-055, US-058)
16. **Quando** aprovador (novo browser context, iPhone 13 emulation) abre `/a/<token>` → Edge Function `/magic-link/verify` valida `sha256(token)` contra `magic_links.token_hash`, retorna JWT ephemeral HS256 exp 30min.
17. **Então** UI mostra preview Instagram-nativo pixel-accurate (US-052) com os 5 slides swipeable; safe zones marcadas; brand handle correto.
18. **Quando** aprovador clica "Aprovar" → Edge Function `/approval/decide` com body `{decision:'approved'}` + Authorization: Bearer <jwt>.
19. **Então** **no DB** `approval_requests.status='approved'`, `decided_at=now()`, `decided_via_magic_link_id` preenchido; `post_versions.is_locked=true`, `locked_by`=creator da agência (system actor); `post_cards.stage='approved'`; `audit_log` `approval.approved` com `actor_type='magic_link'`.

### Ato V — Agendamento + publicação (Social Media, US-041, US-043, US-044, US-045)
20. **Quando** social media abre `/social-media` → vê o card no Grid Planner (US-044) com indicador "pronto para agendar".
21. **Quando** arrasta o card para o slot de horário hoje+1h no calendário → detector de conflitos (US-045) passa (sem conflito).
22. **E** preenche `first_comment_snapshot` com hashtags.
23. **Quando** confirma → Edge Function `/publish/enqueue` cria row em `publish_queue` com `status='queued'`, `scheduled_at`, `media_snapshot_json`, `ig_format='carousel'`, `cross_post_fb=false`.
24. **Então** **no DB** `publish_queue` tem 1 row; `audit_log` `publish.enqueued`.
25. **Quando** cron `publish_worker_tick` é disparado manualmente em `scheduled_at` → worker pega o job (`SELECT FOR UPDATE SKIP LOCKED`), marca `status='publishing'`, lê `agency_integrations.secret_ciphertext` via `decrypt_integration_secret()` (function security definer).
26. **E** mock `GraphAPI.createContainer()` retorna 5 container IDs (um por slide), depois `GraphAPI.createCarouselContainer()` retorna ID mestre, depois `GraphAPI.publish()` retorna `{id: "ig_media_123"}`.
27. **Então** **no DB** `publish_queue.status='published'`, `ig_media_id='ig_media_123'`, `published_url` preenchido; `publish_attempts` tem 1 row com `outcome='success'`; `post_cards.published_at`, `ig_media_id` preenchidos; `stage='published'`.
28. **E** primeiro comentário: mock `GraphAPI.postComment(ig_media_id, first_comment)` chamado exatamente 1 vez (US-043).

### Ato VI — Insights (US-018)
29. **Quando** cron `insights_sync_tick` é disparado +60min depois → Edge Function `/insights-sync` chama `GraphAPI.getInsights(ig_media_id)` (mock retorna impressions, reach, engagement, saves).
30. **Então** **no DB** row em `insights` com `ig_media_id`, `fetched_at`, métricas populadas; `raw_json` com payload completo; `UNIQUE(ig_media_id, fetched_at)` respeitado.
31. **E** estrategista volta ao painel → Performance Panel mostra o post com métricas.

## Asserções críticas
- [ ] `post_versions.is_locked=true` após aprovação — nenhuma mutação possível em `copy_versions`/`asset_versions` referenciados pelo snapshot (US-040).
- [ ] `publish_attempts` tem `attempt_number=1, outcome='success'` — sem retries no happy path.
- [ ] Post publicado em **±60s** de `scheduled_at` (cron de 60s de janela).
- [ ] Nenhuma requisição ao Meta Graph API saiu do navegador — **100% das chamadas originam da Edge Function** (assert via intercept).
- [ ] Plaintext do token Meta **nunca aparece** em response body, em `audit_log.diff_json`, ou em logs da Edge Function (grep nos logs capturados do teste).
- [ ] Plaintext do `magic_link` token só aparece 1 vez (na response do `/approval/create`) e no payload do Resend. Nunca em `magic_links.token_hash`.
- [ ] `audit_log` tem exatamente estes eventos nesta ordem: `brief.created`, `post.created`, `copy_version.created`, `asset_version.created` (×N), `approval.requested`, `approval.approved`, `publish.enqueued`, `publish.started`, `publish.succeeded`, `insights.fetched`.
- [ ] `workspace_id` presente em todas as rows criadas (nenhum NULL em tabelas denormalizadas).

## Edge cases a incluir no mesmo fluxo
- **Meta API 429 (rate limit):** worker marca `outcome='retryable_error'`, `attempts_count=1`, mantém `status='queued'`, agenda retry com backoff `60s * 2^1`. Segundo tick sucede.
- **Meta API 400 (mídia inválida — dimensões erradas):** worker marca `outcome='permanent_error'`, `status='failed'`, **não** retenta. Notifica social media via toast + `audit_log`.
- **Token Meta expirado (401):** worker marca `failed` imediatamente + dispara evento `meta_token.expired` → Admin recebe banner (US-049).
- **Aprovador tenta aprovar após `expires_at`:** `/approval/decide` retorna 410 Gone, UI mostra "Link expirado, peça novo".
- **Legenda com 2201 chars:** editor bloqueia submit client-side; se contornar, Edge Function `/publish/enqueue` rejeita com Zod.
- **Carrossel com 11 slides:** UI bloqueia; CHECK no DB valida `slide_index BETWEEN 0 AND 9`.
- **Concorrência: 2 editores no mesmo post:** segundo editor recebe optimistic lock fail; post_drafts.updated_at serve de ETag (precisa de header `If-Match`) — **P-SPEC 001**: não está claro no contrato se `post_drafts` tem lock otimista.
- **Double-click em "Enviar aprovação":** idempotency — segundo POST no mesmo `post_version_id` retorna o `approval_request` existente em vez de criar duplicata.
- **Social agenda 2 posts no mesmo horário exato:** detector de conflitos (US-045) avisa; override explícito permitido.
- **Perda de conexão durante upload de asset:** retry automático no TanStack Query com backoff, asset final cai em `asset_library` apenas se upload completou.

## Mocks necessários
- `GraphAPI.createContainer({media, caption})` → `{id: "container_<uuid>"}` em 200ms.
- `GraphAPI.createCarouselContainer({children})` → `{id: "carousel_<uuid>"}` em 200ms.
- `GraphAPI.publish({creation_id})` → `{id: "ig_media_<n>"}` em 300ms.
- `GraphAPI.postComment(media_id, text)` → `{id: "comment_<uuid>"}`.
- `GraphAPI.getInsights(media_id)` → payload fixo determinístico (`{impressions:1200, reach:800, engagement:45, saves:12, shares:3, likes:60, comments:4}`).
- `Resend.send(payload)` → captura chamadas; retorna `{id: "email_<uuid>"}`.
- `LLM.generate(prompt)` → retorna string fixa quando brand_voice gen for disparado.
- `pgsodium.decrypt_integration_secret(cipher)` — **NÃO mockado**, usa cipher real de seed (testa a via completa da criptografia).

## Tempo esperado do fluxo completo
<45s** em CI com mocks; <90s em staging com Supabase branch DB.

## Falhas aceitáveis vs inaceitáveis
**Aceitáveis** (teste ainda passa):
- Latência variável do mock Meta API (jitter ±100ms).
- Ordem dos eventos de `audit_log` do mesmo timestamp com tiebreak arbitrário.

**Inaceitáveis** (teste falha imediatamente):
- Qualquer leak de secret (plaintext Meta token, plaintext magic_link, SERVICE_ROLE_KEY no bundle).
- `post_versions.is_locked=false` após aprovação.
- Publish sucesso sem row em `publish_attempts`.
- Aprovação gerando mais de 1 snapshot em `post_versions`.
- `audit_log` com `actor_type` errado (ex: `user` quando foi `magic_link`).
- Asset final violando spec IG (dimensão diferente do `ig_format`).

## Links
- [[../../../01_product/user-stories/US-015-brief-builder-handoff]]
- [[../../../01_product/user-stories/US-031-canvas-multiformato-presets-ig]]
- [[../../../01_product/user-stories/US-041-publicacao-meta-graph-api]]
- [[../../../01_product/user-stories/US-055-1tap-aprovar-pedir-ajuste]]
- [[../../../02_architecture/adr/006-approver-auth]]
- [[../../../02_architecture/adr/008-agency-integrations-encryption]]
- [[../../../02_architecture/adr/009-cron-runner]]
- [[../../../03_backend/api/publish]]
- [[../../../03_backend/api/magic-link]]
- [[../../../03_backend/api/insights-sync]]
- [[../../security-checklist]]
- [[../../bugs]]
