---
created: 2026-04-15
updated: 2026-04-15
owner: product
status: active
confidence: high
---

# User Stories — Índice completo (MVP + painéis role-based)

> Este índice agrega **US-001 a US-070**. US-001 a US-011 são as stories base do MVP (auth, workspace, kanban, aprovação). US-012 a US-070 quebram os 6 painéis personalizados (estrategista, copywriter, designer, social-media, aprovador, admin) em features Instagram-nativas.

## Legenda
- **Prioridade:** P0 = MVP beta fechado · P1 = polimento beta · P2 = pós-beta
- **Effort:** S (≤2d) · M (3-5d) · L (1-2sem) · XL (>2sem)
- Paths relativos a `01_product/user-stories/`.

## Personas
- **Gestor de agência** — dono/PM da agência (role `admin`).
- **Criador** — estrategista / copywriter / designer / social-media da agência.
- **Cliente (marca)** — aprovador externo.

---

## Stories MVP base (US-001 a US-011)

### Auth & Workspace
- US-001: Como gestor, quero criar uma conta e meu workspace da agência.
- US-002: Como gestor, quero convidar membros internos (criadores).
- US-003: Como gestor, quero convidar o cliente externo com acesso limitado.

### Clientes (marcas)
- US-004: Como gestor, quero cadastrar uma marca dentro do workspace.
- US-005: Como gestor, quero vincular membros da agência a cada marca.

### Kanban
- US-006: Como criador, quero criar um card de post (texto + mídia).
- US-007: Como criador, quero mover o card entre colunas (dnd-kit).
- US-008: Como criador, quero anexar imagens/vídeos ao card.

### Aprovação & Colaboração
- US-009: Como criador, quero enviar um card para aprovação do cliente.
- US-010: Como cliente, quero aprovar ou pedir ajustes com comentário.
- US-011: Como gestor, quero ver histórico de quem aprovou e quando.

---

## Estrategista (US-012 a US-020)

| ID | Título | Prio | Effort |
|---|---|---|---|
| [[US-012-calendario-editorial-multiformato]] | Calendário editorial multiformato (mês/semana) | P0 | L |
| [[US-013-gestor-pilares-distribuicao]] | Gestor de pilares com distribuição real vs alvo | P1 | M |
| [[US-014-campaign-groups-timeline]] | Campaign groups com timeline e herança de brief | P1 | M |
| [[US-015-brief-builder-handoff]] | Brief builder estruturado com handoff automático | P0 | L |
| [[US-016-swipe-file-trends]] | Swipe file de referências e trends | P1 | M |
| [[US-017-hashtag-sets-biblioteca]] | Biblioteca de hashtag sets por pilar/audiência | P1 | S |
| [[US-018-performance-panel-insights]] | Performance panel com Meta Graph Insights | P1 | L |
| [[US-019-duplicar-adaptar-post]] | Duplicar + adaptar post de sucesso | P1 | S |
| [[US-020-selecionar-marca-contexto]] | Seletor de marca multi-tenant no painel | P0 | S |

---

## Copywriter (US-021 a US-030)

| ID | Título | Prio | Effort |
|---|---|---|---|
| [[US-021-editor-legenda-constraints-ig]] | Editor de legenda com constraints do Instagram | P0 | M |
| [[US-022-modo-carrossel-script-sheet]] | Modo carrossel (script sheet por slide) | P0 | M |
| [[US-023-roteiro-reel-timestamps]] | Template de roteiro Reel com timestamps | P1 | M |
| [[US-024-script-stories-frames]] | Template de script Stories (grade de frames) | P1 | S |
| [[US-025-hook-library]] | Hook library com tagging de performance | P1 | S |
| [[US-026-cta-library]] | CTA library por tipo e formato IG | P1 | S |
| [[US-027-hashtag-suggester-ia]] | Hashtag suggester combinando sets + IA | P1 | M |
| [[US-028-brand-voice-ia]] | Brand voice condicionado e gerador IA v1 | P1 | L |
| [[US-029-versionamento-diff-copy]] | Versionamento de legenda com diff visual | P0 | M |
| [[US-030-solicitar-aprovacao-copy]] | Solicitar aprovação do cliente (copy + arte) | P0 | S |

---

## Designer (US-031 a US-040)

| ID | Título | Prio | Effort |
|---|---|---|---|
| [[US-031-canvas-multiformato-presets-ig]] | Canvas multiformato com presets IG e safe zones | P0 | XL |
| [[US-032-auto-adapt-master-variantes]] | Auto-adapt: 1 layout master → N variantes | P0 | XL |
| [[US-033-brand-kit-lock]] | Brand kit lock (paleta, fontes, logos) | P0 | M |
| [[US-034-carousel-builder-dnd]] | Carousel builder com até 10 slides reordenáveis | P0 | L |
| [[US-035-template-library]] | Template library por pilar/campanha/marca | P1 | M |
| [[US-036-asset-library-tags]] | Asset library com tags + busca reversa por cor | P1 | M |
| [[US-037-grid-preview-instagram]] | Grid preview do Instagram (9 ou 12 posts) | P0 | M |
| [[US-038-story-reel-ui-overlay]] | Preview com UI do IG sobreposta | P1 | S |
| [[US-039-export-jpg-png-mp4]] | Export JPG/PNG/MP4 respeitando specs IG | P0 | M |
| [[US-040-version-lock-designer]] | Version lock do design (approved congelado) | P0 | M |

---

## Social Media / Publisher (US-041 a US-050)

| ID | Título | Prio | Effort |
|---|---|---|---|
| [[US-041-publicacao-meta-graph-api]] | Fila de publicação via Meta Graph API | P0 | XL |
| [[US-042-melhor-horario-sugestao]] | Sugestão de melhor horário via Insights | P1 | M |
| [[US-043-primeiro-comentario-automatico]] | Primeiro comentário automático (hashtags) | P0 | S |
| [[US-044-grid-planner-dnd]] | Grid planner com drag-drop e monotonia | P1 | M |
| [[US-045-detector-conflitos-agendamento]] | Detector de conflitos antes de agendar | P0 | S |
| [[US-046-cross-post-toggle]] | Cross-post: Reel → Facebook / Stories | P2 | M |
| [[US-047-calendario-unificado-status]] | Calendário unificado com status colorido | P1 | M |
| [[US-048-fallback-manual-publish]] | Fallback manual (publish reminder) para Stories | P0 | M |
| [[US-049-health-check-meta-token]] | Health check do token Meta + alerta pré-expiração | P0 | S |
| [[US-050-recuperacao-falha-publicacao]] | Recuperação rápida de falha de publicação | P0 | M |

---

## Aprovador (US-051 a US-060)

| ID | Título | Prio | Effort |
|---|---|---|---|
| [[US-051-fila-aprovacao-mobile]] | Fila de aprovação mobile-first (card swipeable) | P0 | L |
| [[US-052-preview-instagram-nativo]] | Preview Instagram-nativo pixel-accurate | P0 | L |
| [[US-053-comentario-pinado-coordenada]] | Comentário pinado em coordenada | P0 | L |
| [[US-054-comentario-legenda-inline]] | Comentário inline na legenda (track changes) | P1 | M |
| [[US-055-1tap-aprovar-pedir-ajuste]] | 1-tap aprovar / pedir ajuste com confirmação | P0 | M |
| [[US-056-historico-post-timeline]] | Histórico do post (timeline de ações) | P1 | S |
| [[US-057-notificacoes-aprovador]] | Notificações (e-mail digest + lembrete deadline) | P1 | S |
| [[US-058-magic-link-auth]] | Magic link auth para aprovador (sem senha) | P0 | M |
| [[US-059-resumo-semanal-aprovador]] | Resumo semanal (e-mail segunda-feira) | P2 | S |
| [[US-060-multi-aprovador-votacao]] | Multi-aprovador com regra de votação | P2 | M |

---

## Admin (US-061 a US-070)

| ID | Título | Prio | Effort |
|---|---|---|---|
| [[US-061-gestor-marcas-brandkit]] | Cadastro e arquivo de marcas com brand kit | P0 | M |
| [[US-062-atribuir-membros-marcas]] | Convidar membros e atribuir por marca | P0 | M |
| [[US-063-permissoes-granulares]] | Permissões granulares role × ação × marca | P0 | M |
| [[US-064-usage-dashboard]] | Usage dashboard com KPIs da operação | P1 | M |
| [[US-065-billing-plano-stripe]] | Billing & plano (Stripe) com limites visíveis | P2 | XL |
| [[US-066-magic-link-management]] | Gestão de aprovadores e magic links | P0 | S |
| [[US-067-white-label-subdominio]] | White-label básico (subdomínio + logo + cor) | P1 | L |
| [[US-068-conectar-instagram-oauth]] | Conectar IG Business via OAuth Meta | P0 | M |
| [[US-069-chaves-api-agencia]] | Chaves de API em nível de agência | P1 | S |
| [[US-070-audit-log-imutavel]] | Audit log imutável com filtros e export | P1 | M |

---

## Distribuição de prioridades (US-012 a US-070, 59 stories)

| Prioridade | Qtd | % | Descrição |
|---|---|---|---|
| **P0 — MVP beta fechado** | 30 | 51% | bloqueia onboarding dos 3-5 pilotos |
| **P1 — polimento beta** | 25 | 42% | entrega durante o beta com feedback dos pilotos |
| **P2 — pós-beta** | 4 | 7% | depende de decisão comercial (billing, multi-aprovador, cross-post, resumo semanal) |

## Principais cadeias de dependência (entrada para backend)

1. **Publicação:** [[US-068-conectar-instagram-oauth]] → [[US-049-health-check-meta-token]] → [[US-041-publicacao-meta-graph-api]] → [[US-043-primeiro-comentario-automatico]] → [[US-050-recuperacao-falha-publicacao]].
2. **Aprovação:** [[US-058-magic-link-auth]] → [[US-051-fila-aprovacao-mobile]] → [[US-052-preview-instagram-nativo]] → [[US-055-1tap-aprovar-pedir-ajuste]].
3. **Handoff interno:** [[US-015-brief-builder-handoff]] → [[US-021-editor-legenda-constraints-ig]] + [[US-031-canvas-multiformato-presets-ig]] → [[US-030-solicitar-aprovacao-copy]].
4. **Multi-tenant:** [[US-061-gestor-marcas-brandkit]] → [[US-062-atribuir-membros-marcas]] → [[US-063-permissoes-granulares]] → [[US-020-selecionar-marca-contexto]].

## Links
- [[../ideia]]
- [[../roadmap]]
- [[../roles/README]]
- [[../../08_shared/briefing]]
