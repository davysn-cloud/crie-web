---
created: 2026-04-15
updated: 2026-04-16
owner: backend
status: active
confidence: high
---

# Schema do Banco (Supabase/Postgres 15)

> Fonte da verdade da modelagem do crie-web. Reescrito em 2026-04-15 após [[audit-2026-04-15|auditoria]]. Todo comportamento de RLS e nome de tabela/coluna é **canônico** neste doc — divergências nas migrations devem ser corrigidas via nova migration.

## Convenções
- `snake_case` plural para tabela, singular para coluna.
- PK sempre `id uuid DEFAULT gen_random_uuid()` salvo PKs compostas explícitas.
- Toda tabela tem `created_at timestamptz DEFAULT now()`.
- Tabelas mutáveis têm `updated_at timestamptz DEFAULT now()` com trigger `update_updated_at()`.
- Tabelas onde histórico importa têm `deleted_at timestamptz NULL` (soft delete).
- FKs com `ON DELETE CASCADE` quando o filho não faz sentido sem o pai; `ON DELETE SET NULL` para referências externas opcionais.
- **RLS ligado em TODA tabela.** Sem exceção.
- Multi-tenant: toda tabela de domínio se resolve a um `agency_id` via join ou FK direta. Policies usam helpers `is_agency_member(uuid)` / `is_workspace_member(uuid)`.
- Aprovador (cliente externo) NÃO é `auth.uid()` — acessa via `magic_links.token` e RPC/Edge Function dedicada, nunca consulta tabela diretamente pelo client.

## Helpers RLS (já existentes)
```sql
is_agency_member(agency uuid) → bool          -- agency_members WHERE user_id = auth.uid()
is_workspace_member(ws uuid) → bool           -- workspace_members WHERE user_id = auth.uid()
get_agency_id_for_workspace(ws uuid) → uuid
can_access_comment_target(t_type, t_id) → bool
```

## Helpers RLS (NOVOS — criar em migration de saneamento futura, opcional)
```sql
is_agency_admin(agency uuid) → bool            -- membership com role owner|admin
has_magic_link_access(token uuid, ws uuid) → bool  -- valida magic_link do aprovador
```

---

# 1. Tabelas existentes (aplicadas via migrations 00001–00007)

## 1.1 `agencies`
Tenant raiz.

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO | — |
| slug | text (UNIQUE) | NO | — |
| logo_url | text | YES | — |
| owner_id | uuid FK→auth.users | NO | — |
| stripe_customer_id | text | YES | — |
| stripe_subscription_id | text | YES | — |
| subscription_status | enum `subscription_status` | YES | 'trialing' |
| seat_limit | integer | YES | 3 |
| created_at / updated_at | timestamptz | NO | now() |

**Índices:** PK, UNIQUE(slug).
**FKs sem índice (gap):** `owner_id`.
**RLS:**
- SELECT: `is_agency_member(id)`.
- UPDATE: `is_agency_member(id)`.
- INSERT: `owner_id = auth.uid()`.
- DELETE: **sem policy** (deleção controlada via Edge Function de service_role).

## 1.2 `agency_members`
Usuário ↔ agência.

| Coluna | Tipo | Nullable |
|---|---|---|
| id | uuid PK | NO |
| agency_id | uuid FK→agencies CASCADE | NO |
| user_id | uuid FK→auth.users CASCADE | NO |
| display_name | text | NO |
| avatar_url | text | YES |
| invited_email | text | YES |
| role | enum `agency_role` ('owner'/'admin'/'strategist'/'copywriter'/'designer'/'social_media') | NO |
| accepted_at | timestamptz | YES |
| created_at | timestamptz | NO |

**UNIQUE:** `(agency_id, user_id)`.
**Índices:** `user_id`, `agency_id`.
**RLS:** SELECT/INSERT/DELETE via `is_agency_member(agency_id)`.
**P-SPEC-004:** `accepted_at` NULL = convite pendente, NOT NULL = membro ativo. Todas as RLS helpers (`is_agency_member`, `is_workspace_member`, `is_agency_admin`, `can_read_integration`) filtram `accepted_at IS NOT NULL`.
**P-SPEC-006:** `role` usa enum `agency_role`. Matriz role x acao documentada em migration 00019.

## 1.3 `workspaces`
Marca/cliente da agência. **Atenção:** este nome diverge do sentido histórico de "agência" — no crie-web, workspace = marca.

| Coluna | Tipo | Nullable |
|---|---|---|
| id | uuid PK | NO |
| agency_id | uuid FK→agencies CASCADE | NO |
| name | text | NO |
| slug | text | NO |
| archived | boolean | YES (default false) |
| created_at/updated_at | timestamptz | NO |

**UNIQUE:** `(agency_id, slug)`.
**Índices:** `agency_id`.
**RLS:** SELECT/INSERT/UPDATE via `is_agency_member(agency_id)`.

## 1.4 `workspace_members`
Papel dentro da marca.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| user_id | uuid FK→auth.users CASCADE |
| role | enum `workspace_role` ('strategist'/'copywriter'/'designer'/'social_media'/'viewer') |
| created_at | timestamptz |

**UNIQUE:** `(workspace_id, user_id)`.
**Índices:** `workspace_id`, `user_id`.
**RLS:** SELECT via `is_workspace_member(workspace_id)`; INSERT/UPDATE/DELETE via `is_agency_member(get_agency_id_for_workspace(workspace_id))`.

## 1.5 `brand_profiles`
1:1 com workspace. Já guarda embrião de brand_kit + brand_voice (cores, fontes, tom, do_not_say). Vai ser **estendida** pela tabela nova `brand_voice`.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid UNIQUE FK→workspaces CASCADE |
| brand_name, tone_of_voice, target_audience, instagram_handle, logo_url, extra_guidelines | text |
| do_not_say, keywords | text[] |
| colors, fonts | jsonb |
| moodboard_urls | text[] |
| created_at/updated_at | timestamptz |

**RLS:** `is_workspace_member(workspace_id)` SELECT/INSERT/UPDATE.

## 1.6 `post_cards`
Post/card do kanban.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| title | text NOT NULL |
| stage | enum `post_stage` |
| post_type | text |
| scheduled_at, published_at | timestamptz |
| published_url, ig_media_id | text |
| assigned_to, created_by | uuid FK→auth.users |
| sort_order | integer |
| archived | boolean |
| created_at/updated_at | timestamptz |

**Índices:** `workspace_id`, `(workspace_id, stage)`, `assigned_to`, partial em `scheduled_at WHERE NOT NULL`.
**Gaps de índice:** `created_by`.
**RLS:** todas ações via `is_workspace_member(workspace_id)`.

## 1.7 `copy_versions`
Versões de texto por card.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_card_id | uuid FK→post_cards CASCADE |
| version | integer |
| body, caption | text |
| hashtags | text[] |
| is_approved | bool |
| approved_by, created_by | uuid FK→auth.users |
| ai_generated | bool |
| created_at | timestamptz |

**Índices:** `post_card_id`.
**Gaps:** `approved_by` sem índice.
**RLS:** encadeada via `post_cards.workspace_id`.

## 1.8 `asset_versions`
Versões de arte por card.

Estrutura análoga a copy_versions com `file_url`, `file_type`, `thumbnail_url`, `width`, `height`.
**RLS:** análoga.

## 1.9 `agency_invites`
Convites pendentes para virar `agency_members`.

| Coluna | Tipo |
|---|---|
| id, agency_id, email, display_name, default_role, invited_by, accepted_at, created_at | — |

**UNIQUE:** `(agency_id, email)`.
**Gaps:** falta `expires_at`, falta índice em `email`. (Deixar para migration futura, não crítico.)
**RLS:** membros veem tudo; `anon` pode `SELECT` onde `accepted_at IS NULL` (para página /signup/member).

## 1.10 `comments`
Comentário polimórfico (card/copy_version/asset_version) com pin opcional.

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| target_type | enum `comment_target_type` |
| target_id | uuid |
| parent_id | uuid FK→self CASCADE |
| body | text |
| pin_x, pin_y | float (0..1 normalizado) |
| author_id | uuid FK→auth.users |
| resolved | bool |
| created_at/updated_at | timestamptz |

**Índices:** `(target_type, target_id)`, `parent_id`.
**Gaps:** `author_id` sem índice.
**RLS:** via `can_access_comment_target(target_type, target_id)`.

## 1.11 `stage_transitions`
Audit log de mudanças de stage (append-only).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_card_id | uuid FK→post_cards CASCADE |
| from_stage, to_stage | enum `post_stage` |
| triggered_by | uuid FK→auth.users |
| note | text |
| created_at | timestamptz |

**RLS:** SELECT/INSERT via `is_workspace_member(post_card.workspace_id)`. Sem UPDATE/DELETE (imutável).

---

# 2. Tabelas NOVAS (a criar nas migrations 00008+)

Todas têm frontmatter RLS: `ENABLE ROW LEVEL SECURITY` + policies que resolvem a `workspace_id` ou `agency_id`. Todas seguem as convenções (PK uuid, created_at/updated_at, deleted_at onde faz sentido).

## 2.1 `pillars` — migration `..._pillars_campaigns_briefs.sql`
Pilares de conteúdo por marca (Estrategista F2).

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid PK | NO | gen_random_uuid() |
| workspace_id | uuid FK→workspaces CASCADE | NO | — |
| name | text | NO | — |
| color | text | NO | '#8884d8' |
| description | text | YES | — |
| target_percentage | int | NO | 0 | (0-100, CHECK 0..100) |
| sort_order | int | NO | 0 |
| archived | bool | NO | false |
| created_at/updated_at | timestamptz | NO | now() |

**Índices:** `workspace_id`, UNIQUE(`workspace_id`, lower(`name`)).
**CHECK:** `target_percentage BETWEEN 0 AND 100`.
**RLS:**
- SELECT/INSERT/UPDATE/DELETE: `is_workspace_member(workspace_id)`.

**Relacionamentos:** referenciado por `briefs.pillar_id`, `post_cards.pillar_id` (adicionar via ALTER em migration separada no futuro, não bloqueante), `hashtag_sets.pillar_id`, `hooks_library.pillar_id`, `ctas_library.pillar_id`.

## 2.2 `campaigns` — mesma migration
Agrupar posts sob uma campanha (Estrategista F3).

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid PK | NO | gen_random_uuid() |
| workspace_id | uuid FK→workspaces CASCADE | NO | — |
| name | text | NO | — |
| goal | text | YES | — |
| starts_at, ends_at | date | YES | — |
| brief_id | uuid FK→briefs SET NULL | YES | — |
| color | text | YES | — |
| archived | bool | NO | false |
| created_at/updated_at | timestamptz | NO | now() |

**Índices:** `workspace_id`, `(workspace_id, starts_at, ends_at)`, `brief_id`.
**CHECK:** `ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at`.
**RLS:** `is_workspace_member`.

## 2.3 `briefs` — mesma migration
Brief estruturado (Estrategista F4).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE NOT NULL |
| post_card_id | uuid FK→post_cards CASCADE **UNIQUE NULLABLE** (1:1 quando atrelado a um card; um brief pode existir antes do card) |
| pillar_id | uuid FK→pillars SET NULL |
| campaign_id | uuid FK→campaigns SET NULL |
| objective | enum `brief_objective` ('awareness'/'consideration'/'conversion'/'retention') |
| ig_format | enum `ig_format` ('feed_1_1'/'feed_4_5'/'feed_1_91_1'/'story'/'reel'/'carousel') |
| target_audience | text |
| key_message | text |
| cta | text |
| references_json | jsonb DEFAULT '[]' (array de {type:'url'\|'image', value, note}) |
| due_at | timestamptz |
| assignee_copy, assignee_design | uuid FK→auth.users SET NULL |
| created_by | uuid FK→auth.users NOT NULL |
| hashtag_set_id | uuid FK→hashtag_sets SET NULL |
| status | enum `brief_status` ('draft'/'active'/'done'/'archived') DEFAULT 'draft' |
| created_at/updated_at/deleted_at | timestamptz |

**Índices:** `workspace_id`, `pillar_id`, `campaign_id`, `post_card_id` (UNIQUE), `assignee_copy`, `assignee_design`, `due_at`.
**RLS:** `is_workspace_member(workspace_id)`. **P-SPEC-005:** SELECT/UPDATE/DELETE policies now filter `AND deleted_at IS NULL`. Strategists can view deleted briefs via separate policy.

## 2.4 `hashtag_sets` + `hashtag_set_items` — migration `..._hashtags_hooks_ctas.sql`

### `hashtag_sets`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| name | text NOT NULL |
| pillar_id | uuid FK→pillars SET NULL |
| description | text |
| archived | bool DEFAULT false |
| created_at/updated_at | timestamptz |

**UNIQUE:** `(workspace_id, lower(name))`.
**Índices:** `workspace_id`, `pillar_id`.
**RLS:** `is_workspace_member`.

### `hashtag_set_items`
Tag individual dentro de um set (permite stats por tag).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| hashtag_set_id | uuid FK→hashtag_sets CASCADE |
| tag | text NOT NULL (sem #) |
| sort_order | int DEFAULT 0 |
| avg_reach | int (denormalized stat) |
| created_at | timestamptz |

**UNIQUE:** `(hashtag_set_id, lower(tag))`.
**CHECK:** `char_length(tag) BETWEEN 1 AND 100` e `tag !~ '^#'`.
**Índices:** `hashtag_set_id`.
**RLS:** encadeada em `hashtag_sets.workspace_id`.

## 2.5 `hooks_library` + `ctas_library` — mesma migration
Bibliotecas com performance tag (Copy F5/F6).

### `hooks_library`
| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| body | text NOT NULL |
| ig_format | enum `ig_format` |
| pillar_id | uuid FK→pillars SET NULL |
| performance | enum `performance_tag` ('positive'/'negative'/'neutral') DEFAULT 'neutral' |
| uses_count | int DEFAULT 0 |
| created_by | uuid FK→auth.users |
| created_at/updated_at | timestamptz |

**Índices:** `workspace_id`, `pillar_id`, `(workspace_id, performance)`. Full-text em `body` (generated tsvector + GIN).
**RLS:** `is_workspace_member`.

### `ctas_library`
Mesma forma que `hooks_library` + coluna `cta_kind enum('comment_bait'/'save_bait'/'share_bait'/'dm'/'link_in_bio')`.

## 2.6 `brand_voice` — migration `..._brand_voice.sql`
Tom da marca p/ IA (Copy F8). **Estende** `brand_profiles` (que já tem `tone_of_voice`/`do_not_say`) com estrutura mais rica para prompt engineering.

**Decisão:** tabela nova 1:1 com `workspaces` (pode coexistir com `brand_profiles`), pois o uso é diferente (prompt LLM) e as colunas não casam com o `brand_profiles` atual. Alternativa rejeitada: adicionar colunas em `brand_profiles` — mais acoplamento, menos clareza.

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid PK | NO | gen_random_uuid() |
| workspace_id | uuid UNIQUE FK→workspaces CASCADE | NO | — |
| tone | enum `voice_tone` ('formal'/'neutral'/'casual'/'playful') | NO | 'neutral' |
| vocab_preferred | text[] | NO | '{}' |
| vocab_forbidden | text[] | NO | '{}' |
| emoji_policy | enum `emoji_policy` ('none'/'sparingly'/'freely') | NO | 'sparingly' |
| slang_allowed | bool | NO | false |
| approved_examples_json | jsonb | NO | '[]' (array de exemplos de copy aprovada) |
| system_prompt_override | text | YES | — (se agência quiser sobrescrever o template) |
| llm_model | text | NO | 'claude-3-5-sonnet' |
| llm_temperature | numeric(3,2) | NO | 0.70 |
| created_at/updated_at | timestamptz | NO | now() |

**Índices:** `workspace_id` UNIQUE.
**CHECK:** `llm_temperature BETWEEN 0 AND 2`.
**RLS:** `is_workspace_member`.

## 2.7 `post_drafts` — migration `..._post_drafts_formats_carousel.sql`
Rascunho ativo de um card (WIP que ainda não virou `copy_version`/`asset_version`). Permite auto-save sem poluir o histórico de versões.

**Decisão:** nova tabela (em vez de estender `post_cards`) — separa "estado de trabalho" de "metadados do card". Tradeoff: 1 query a mais ao abrir o card. Alternativa rejeitada: colunas `draft_copy`, `draft_asset_url` em `post_cards` — esconde semântica.

| Coluna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid PK | NO | gen_random_uuid() |
| post_card_id | uuid UNIQUE FK→post_cards CASCADE | NO | — |
| body | text | YES | — |
| caption | text | YES | — |
| hashtags | text[] | NO | '{}' |
| carousel_script_json | jsonb | NO | '[]' (array por slide; shape em `carousel_slides` abaixo para versão final) |
| reel_script_json | jsonb | NO | '{}' (hook/dev/cta + audio ref) |
| stories_script_json | jsonb | NO | '[]' (array por frame) |
| updated_by | uuid FK→auth.users SET NULL | YES | — |
| version | integer | NO | 1 |
| created_at/updated_at | timestamptz | NO | now() |

**Índices:** UNIQUE(post_card_id).
**RLS:** encadeada a `post_cards.workspace_id`.
**Optimistic lock (P-SPEC-001):** trigger `trg_post_drafts_version` auto-increments `version` on every UPDATE. RPC `update_post_draft(p_id, p_expected_version, p_data)` applies update only if `version = p_expected_version`; raises SQLSTATE 40001 on conflict.

## 2.8 `post_formats` — mesma migration
Variantes por formato IG para um post (Designer F1/F2).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_card_id | uuid FK→post_cards CASCADE |
| ig_format | enum `ig_format` |
| is_master | bool DEFAULT false (é o formato-origem do "auto-adapt") |
| master_format_id | uuid FK→post_formats SET NULL (aponta para o master quando esta é uma variante) |
| asset_version_id | uuid FK→asset_versions SET NULL (arte aprovada/ativa dessa variante) |
| safe_zone_json | jsonb DEFAULT '{}' |
| created_at/updated_at | timestamptz |

**UNIQUE:** `(post_card_id, ig_format)`.
**CHECK:** `NOT (is_master AND master_format_id IS NOT NULL)`.
**Índices:** `post_card_id`, `master_format_id`, `asset_version_id`.
**RLS:** encadeada a `post_cards.workspace_id`.

## 2.9 `carousel_slides` — mesma migration
Slides individuais de um carrossel (Designer/Copy F4).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_format_id | uuid FK→post_formats CASCADE (o formato carrossel específico) |
| slide_index | int NOT NULL (0-9) |
| title | text |
| body | text |
| cta_overlay | text |
| asset_version_id | uuid FK→asset_versions SET NULL |
| notes | text |
| created_at/updated_at | timestamptz |

**UNIQUE:** `(post_format_id, slide_index)`.
**CHECK:** `slide_index BETWEEN 0 AND 9`.
**Índices:** `post_format_id`.
**RLS:** encadeada via `post_format_id → post_card.workspace_id`.

## 2.10 `asset_library` — migration `..._assets_templates.sql`
Uploads reutilizáveis (Designer F6).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| storage_path | text NOT NULL |
| public_url | text |
| kind | enum `asset_kind` ('image'/'video'/'icon'/'illustration'/'mockup'/'logo') |
| tags | text[] DEFAULT '{}' |
| dominant_color | text (hex) |
| width, height | int |
| bytes | bigint |
| source | enum `asset_source` ('upload'/'canva'/'unsplash'/'pexels') DEFAULT 'upload' |
| external_ref | text (ID externo ou URL de origem) |
| created_by | uuid FK→auth.users |
| archived | bool DEFAULT false |
| created_at/updated_at | timestamptz |

**Índices:** `workspace_id`, GIN em `tags`, `(workspace_id, kind)`, `dominant_color`.
**RLS:** `is_workspace_member`.

## 2.11 `templates` — mesma migration
Templates de design (Designer F5).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| name | text NOT NULL |
| pillar_id | uuid FK→pillars SET NULL |
| campaign_id | uuid FK→campaigns SET NULL |
| ig_format | enum `ig_format` |
| source_post_card_id | uuid FK→post_cards SET NULL (post usado para criar o template) |
| thumbnail_url | text |
| variables_json | jsonb DEFAULT '[]' (definição das variáveis: título, CTA, imagem principal) |
| payload_json | jsonb DEFAULT '{}' (serialização do canvas) |
| usage_count | int DEFAULT 0 |
| archived | bool DEFAULT false |
| created_at/updated_at | timestamptz |

**Índices:** `workspace_id`, `pillar_id`, `(workspace_id, ig_format)`.
**RLS:** `is_workspace_member`.

## 2.12 `post_versions` — migration `..._post_versions.sql`
Snapshot completo de um post em um momento (Copy/Designer F9/F10). Complementa `copy_versions`/`asset_versions` com um snapshot no nível do card (copy + todos os assets + meta).

**Decisão:** snapshot completo em JSONB, não diff. Ver [[../02_architecture/adr/post-versioning|ADR post-versioning]].

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_card_id | uuid FK→post_cards CASCADE |
| version | int NOT NULL |
| label | text (ex: "v3 — após feedback do cliente") |
| payload_json | jsonb NOT NULL (snapshot: copy, hashtags, asset_version_ids por formato, brief ref, etc.) |
| is_locked | bool DEFAULT false (congelado após aprovação) |
| locked_by | uuid FK→auth.users SET NULL |
| locked_at | timestamptz |
| created_by | uuid FK→auth.users NOT NULL |
| created_at | timestamptz |

**UNIQUE:** `(post_card_id, version)`.
**Índices:** `post_card_id`, `(post_card_id, is_locked)`.
**RLS:** encadeada via `post_cards.workspace_id`; DELETE **nunca** (sem policy).

## 2.13 `approval_requests` — migration `..._approval_flow.sql`
Fluxo de aprovação com o cliente externo (Aprovador F4).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_card_id | uuid FK→post_cards CASCADE |
| post_version_id | uuid FK→post_versions SET NULL (snapshot exato sendo aprovado) |
| workspace_id | uuid FK→workspaces CASCADE (desnormalizado p/ RLS) |
| requested_by | uuid FK→auth.users NOT NULL |
| assignee_email | text NOT NULL (cliente recebe magic link) |
| assignee_label | text (nome do aprovador) |
| status | enum `approval_status` ('pending'/'approved'/'changes_requested'/'cancelled'/'expired'/'superseded') DEFAULT 'pending' |
| decision_note | text |
| reason_code | enum `approval_reason` ('copy'/'arte'/'timing'/'outro') |
| decided_at | timestamptz |
| decided_via_magic_link_id | uuid FK→magic_links SET NULL |
| expires_at | timestamptz NOT NULL (default now()+7d) |
| created_at/updated_at | timestamptz |

**Índices:** `post_card_id`, `workspace_id`, `status`, `assignee_email`, `expires_at`.
**RLS:**
- Membros (agency): SELECT/INSERT/UPDATE via `is_workspace_member(workspace_id)`.
- Aprovador (anon com magic_link válido): acesso **exclusivamente via Edge Function** com service_role — não há policy para `anon` aqui; policy `anon` SELECT/UPDATE só se for para via PostgREST com header custom (não faremos no MVP).
**Resubmission (P-SPEC-002):** trigger `trg_supersede_pending_approvals` auto-sets `status='superseded'` on existing pending requests for the same `post_card_id` when a new request is inserted.

## 2.14 `approval_pins` — mesma migration
Comentários em (x,y) por slide/frame (Aprovador F2). Substitui/complementa `comments.pin_x/y` com mais contexto.

**Decisão:** tabela normalizada. Ver [[../02_architecture/adr/approval-pins-storage|ADR pins storage]].

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| approval_request_id | uuid FK→approval_requests CASCADE |
| slide_index | int (NULL para single image/feed; 0-9 para carrossel) |
| frame_timestamp_ms | int (NULL exceto Reel/Stories onde é momento no vídeo) |
| pin_x, pin_y | numeric(5,4) (0.0000..1.0000 normalizado) |
| body | text NOT NULL |
| target | enum `pin_target` ('image'/'caption') DEFAULT 'image' |
| caption_range_start, caption_range_end | int (NULL quando target='image'; índice de caracteres quando target='caption') |
| author_label | text NOT NULL (nome do aprovador — vem do magic_link) |
| author_email | text NOT NULL |
| resolved | bool DEFAULT false |
| resolved_by | uuid FK→auth.users SET NULL (membro da agência que resolveu) |
| resolved_at | timestamptz |
| created_at/updated_at | timestamptz |

**Índices:** `approval_request_id`, `(approval_request_id, resolved)`, `slide_index`.
**CHECK:** `pin_x BETWEEN 0 AND 1 AND pin_y BETWEEN 0 AND 1`; `(target='caption') = (caption_range_start IS NOT NULL AND caption_range_end IS NOT NULL)`.
**RLS:** SELECT/UPDATE via membros da workspace através do `approval_request`; INSERT pelo aprovador vai via Edge Function service_role (não direto).

## 2.15 `magic_links` — mesma migration
Auth sem conta para aprovador externo (Aprovador F9 / Admin F7).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| agency_id | uuid FK→agencies CASCADE |
| workspace_id | uuid FK→workspaces CASCADE (NULL = escopo agência; típico: workspace específico) |
| purpose | enum `magic_link_purpose` ('approval'/'portal_view') DEFAULT 'approval' |
| approval_request_id | uuid FK→approval_requests SET NULL (quando purpose='approval') |
| token_hash | text NOT NULL (SHA-256 do token em plaintext; plaintext só sai uma vez na criação) |
| email | text NOT NULL |
| label | text |
| created_by | uuid FK→auth.users NOT NULL |
| expires_at | timestamptz NOT NULL |
| revoked_at | timestamptz |
| used_at | timestamptz (first use; múltiplos usos permitidos até expires_at) |
| use_count | int DEFAULT 0 |
| last_used_ip | inet |
| last_used_user_agent | text |
| created_at | timestamptz |

**UNIQUE:** `token_hash`.
**Índices:** `agency_id`, `workspace_id`, `email`, `approval_request_id`, `expires_at`.
**RLS:**
- Membros da agency: SELECT/INSERT/UPDATE (para revogar) via `is_agency_member(agency_id)`.
- **Sem policy para `anon`.** Validação do token só acontece server-side em Edge Function com service_role.

**Security:** token plaintext de 256 bits (base64url) gerado na criação, retornado UMA vez, persistido como `sha256(token)`. Revogação = setar `revoked_at`. Ver [[../02_architecture/adr/approver-auth|ADR approver-auth]].

## 2.16 `publish_queue` — migration `..._publish_queue.sql`
Fila Meta Graph API (Social F1).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| post_card_id | uuid FK→post_cards CASCADE |
| workspace_id | uuid FK→workspaces CASCADE (denormalizado) |
| ig_format | enum `ig_format` |
| scheduled_at | timestamptz NOT NULL |
| status | enum `publish_status` ('queued'/'publishing'/'published'/'failed'/'cancelled') DEFAULT 'queued' |
| caption_snapshot | text |
| first_comment_snapshot | text |
| media_snapshot_json | jsonb (URLs + order) |
| ig_business_account_id | text (Meta) |
| ig_creation_id | text (container Meta, passo 1 da API) |
| ig_media_id | text (post publicado, final) |
| published_url | text |
| cross_post_fb | bool DEFAULT false |
| cross_post_story | bool DEFAULT false |
| last_error | text |
| attempts_count | int DEFAULT 0 |
| locked_by_worker | text (worker id que pegou o job) |
| locked_until | timestamptz |
| created_by | uuid FK→auth.users |
| created_at/updated_at | timestamptz |

**Índices:** `workspace_id`, `post_card_id`, `(status, scheduled_at)` (worker pega próximos jobs), `scheduled_at`, `ig_media_id`.
**RLS:** `is_workspace_member(workspace_id)` SELECT/INSERT/UPDATE/DELETE (apenas antes de status='publishing').

## 2.17 `publish_attempts` — mesma migration
Retry/histórico de tentativas (Social F1).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| publish_queue_id | uuid FK→publish_queue CASCADE |
| attempt_number | int NOT NULL |
| started_at | timestamptz NOT NULL |
| finished_at | timestamptz |
| outcome | enum `attempt_outcome` ('success'/'retryable_error'/'permanent_error') |
| http_status | int |
| meta_api_code | text |
| error_message | text |
| request_payload | jsonb |
| response_payload | jsonb |
| created_at | timestamptz |

**UNIQUE:** `(publish_queue_id, attempt_number)`.
**Índices:** `publish_queue_id`, `(publish_queue_id, outcome)`.
**RLS:** encadeada via `publish_queue.workspace_id`. Append-only (sem UPDATE/DELETE policy).

## 2.18 `insights` — migration `..._insights.sql`
Performance (Estrategista F7).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| workspace_id | uuid FK→workspaces CASCADE |
| post_card_id | uuid FK→post_cards CASCADE (NULL se for post externo / histórico importado) |
| ig_media_id | text NOT NULL |
| fetched_at | timestamptz NOT NULL |
| impressions | int |
| reach | int |
| engagement | int |
| saves | int |
| shares | int |
| comments_count | int |
| likes_count | int |
| video_views | int |
| plays | int |
| profile_visits | int |
| follows | int |
| raw_json | jsonb (payload completo do Meta para auditoria / campos novos) |
| created_at | timestamptz |

**UNIQUE:** `(ig_media_id, fetched_at)` (snapshots temporais).
**Índices:** `workspace_id`, `post_card_id`, `ig_media_id`, `fetched_at`.
**RLS:** `is_workspace_member`.

## 2.19 `audit_log` — migration `..._audit_log.sql`
Log imutável (Admin F8).

| Coluna | Tipo |
|---|---|
| id | uuid PK |
| agency_id | uuid FK→agencies CASCADE NOT NULL |
| workspace_id | uuid FK→workspaces CASCADE (NULL para eventos de agency-scope) |
| actor_type | enum `audit_actor` ('user'/'magic_link'/'system'/'worker') NOT NULL |
| actor_id | uuid (user_id OR magic_link_id conforme `actor_type`) |
| actor_label | text (email/nome snapshotado) |
| action | text NOT NULL (ex: 'post.created', 'approval.approved', 'publish.succeeded') |
| entity_type | text (ex: 'post_card') |
| entity_id | uuid |
| diff_json | jsonb (before/after) |
| ip | inet |
| user_agent | text |
| created_at | timestamptz NOT NULL DEFAULT now() |

**Índices:** `(agency_id, created_at DESC)`, `(workspace_id, created_at DESC)`, `actor_id`, `(entity_type, entity_id)`, `action`.
**RLS:**
- SELECT: membros de agency (`is_agency_member(agency_id)`).
- INSERT: apenas service_role (via trigger ou Edge Function).
- UPDATE/DELETE: **sem policy** — imutável.

---

# 3. Novos ENUMS a criar

Na migration de cada grupo, criar estes tipos ANTES das tabelas que os usam:

| Enum | Valores |
|---|---|
| `ig_format` | `feed_1_1`, `feed_4_5`, `feed_1_91_1`, `story`, `reel`, `carousel` |
| `brief_objective` | `awareness`, `consideration`, `conversion`, `retention` |
| `brief_status` | `draft`, `active`, `done`, `archived` |
| `performance_tag` | `positive`, `negative`, `neutral` |
| `cta_kind` | `comment_bait`, `save_bait`, `share_bait`, `dm`, `link_in_bio` |
| `voice_tone` | `formal`, `neutral`, `casual`, `playful` |
| `emoji_policy` | `none`, `sparingly`, `freely` |
| `asset_kind` | `image`, `video`, `icon`, `illustration`, `mockup`, `logo` |
| `asset_source` | `upload`, `canva`, `unsplash`, `pexels` |
| `agency_role` | `owner`, `admin`, `strategist`, `copywriter`, `designer`, `social_media` |
| `workspace_role` | `strategist`, `copywriter`, `designer`, `social_media`, `viewer` |
| `approval_status` | `pending`, `approved`, `changes_requested`, `cancelled`, `expired`, `superseded` |
| `approval_reason` | `copy`, `arte`, `timing`, `outro` |
| `magic_link_purpose` | `approval`, `portal_view` |
| `pin_target` | `image`, `caption` |
| `publish_status` | `queued`, `publishing`, `published`, `failed`, `cancelled` |
| `attempt_outcome` | `success`, `retryable_error`, `permanent_error` |
| `audit_actor` | `user`, `magic_link`, `system`, `worker` |

---

# 4. Relacionamentos (visão alto nível)

```
agencies 1─* agency_members *─1 auth.users
agencies 1─* workspaces 1─* workspace_members *─1 auth.users
workspaces 1─1 brand_profiles
workspaces 1─1 brand_voice
workspaces 1─* pillars
workspaces 1─* campaigns ─* posts (via post_card.campaign_id futura)
workspaces 1─* briefs ─? post_cards (1:1 opcional)
workspaces 1─* hashtag_sets 1─* hashtag_set_items
workspaces 1─* hooks_library
workspaces 1─* ctas_library
workspaces 1─* asset_library
workspaces 1─* templates
workspaces 1─* post_cards
  post_cards 1─* copy_versions
  post_cards 1─* asset_versions
  post_cards 1─1 post_drafts
  post_cards 1─* post_formats ─* carousel_slides
  post_cards 1─* post_versions
  post_cards 1─* comments (target_type='card')
  post_cards 1─* stage_transitions
  post_cards 1─* approval_requests 1─* approval_pins
  post_cards 1─* publish_queue 1─* publish_attempts
  post_cards 1─* insights
agencies/workspaces 1─* magic_links
agencies 1─* audit_log
```

# 5. Ajustes incrementais pendentes (não bloqueantes)

Para uma migration futura de saneamento (não inclusa neste plano):
- `ALTER TABLE post_cards ADD COLUMN pillar_id uuid REFERENCES pillars(id) ON DELETE SET NULL;`
- `ALTER TABLE post_cards ADD COLUMN campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL;`
- `ALTER TABLE post_cards ADD COLUMN brief_id uuid REFERENCES briefs(id) ON DELETE SET NULL;` (duplica o UNIQUE de briefs.post_card_id — escolher um lado)
- Índices faltantes documentados na [[audit-2026-04-15#Faltando]].
- `ALTER TYPE comment_target_type ADD VALUE 'brief';` + `'carousel_slide'`.
- `ALTER TYPE workspace_role ADD VALUE 'admin';` (hoje só `owner` tem poder admin).

# Links
- [[audit-2026-04-15]] — delta schema.md ↔ migrations reais
- [[../02_architecture/stack]]
- [[../02_architecture/adr/approval-pins-storage]]
- [[../02_architecture/adr/post-versioning]]
- [[../02_architecture/adr/approver-auth]]
- [[../02_architecture/adr/storage-assets]]
- [[api/publish]] · [[api/magic-link]] · [[api/llm-brand-voice]] · [[api/insights-sync]] · [[api/auto-adapt]]
- [[../01_product/roles/README]]
