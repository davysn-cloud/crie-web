---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
role: admin
breakpoint_primary: desktop
---

# Painel — Admin da Agência

Persona e JTBD: [[../../01_product/roles/admin]]. Gerencia marcas, time, permissões, billing, white-label.

## Rota
`/app/:agencySlug/admin` (aninhada no `AgencyLayout`, **não** no `WorkspaceLayout` — admin é escopo agência).
Sub-rotas:
- `.../admin` → dashboard (KPIs + onboarding checklist)
- `.../admin/brands` → gestor de marcas (clientes)
- `.../admin/brands/new` → criar marca (wizard 3 steps)
- `.../admin/brands/:id` → detalhe da marca + membros atribuídos
- `.../admin/team` → membros da agência (convites, roles)
- `.../admin/team/invite` → dialog de convite
- `.../admin/permissions` → matriz role × ação × escopo
- `.../admin/approvers` → gerir aprovadores (clientes externos) + magic links
- `.../admin/billing` → plano, usage, faturas (Stripe portal)
- `.../admin/white-label` → logo, cor primária, subdomínio, e-mail custom
- `.../admin/integrations` → conexões Meta por marca + chaves API (Resend, Stripe, LLM)
- `.../admin/audit` → audit log (filtrável, exportável)

**Decisão:** **Desktop-primário (≥1024px)**. Tablet aceitável para leitura. Mobile não suportado para operações de admin.

## Layout (ASCII wireframe)

### Desktop — dashboard (`.../admin`)
```
┌──────────────────────────────────────────────────────────────────────────┐
│ AgencySidebar          │ Admin topbar: "Admin — <nome da agência>"        │
│                        ├───────────────────────────────────────────────── │
│ · Dashboard *          │ Onboarding checklist (se incompleto):            │
│ · Marcas               │ [✓ Brand kit] [✓ IG business] [☐ 1º membro]     │
│ · Time                 │ [☐ 1º aprovador] [☐ 1º brief]     Progresso 60% │
│ · Permissões           │                                                  │
│ · Aprovadores          ├────────────────┬────────────────┬─────────────── │
│ · Billing              │ Posts no mês   │ % aprovado v1  │ Backlog       │
│ · White-label          │    247         │    68%         │   12 pendentes │
│ · Integrações          │                │                │               │
│ · Audit log            ├────────────────┴────────────────┴─────────────── │
│                        │ Ranking marcas                  │ Tempo por step │
│                        │ 1. Acme        45 posts         │ Brief→Copy 2h  │
│                        │ 2. Beta        32 posts         │ Copy→Des 4h    │
│                        │ 3. Gamma        18 posts         │ Des→Aprov 8h   │
│                        │                                  │ Aprov→Pub 3h   │
│                        │ [Export CSV]                     │                │
│                        │                                  │ [Ver detalhes] │
└────────────────────────┴──────────────────────────────────────────────────┘
```

### `.../admin/brands` — lista de marcas
```
┌────────────────────────────────────────────────┐
│ Marcas (4/5)                         [+Nova]    │
├────────────────────────────────────────────────┤
│ Table:                                          │
│ | Logo │ Nome   │ Posts mês │ % v1 │ Status │ ⋮│
│ | 🅰️  │ Acme   │   45      │ 72%  │ Ativa  │ ⋮│
│ | 🅱️  │ Beta   │   32      │ 60%  │ Ativa  │ ⋮│
│ | 🅶️  │ Gamma  │   0       │ —    │ Arquiv.│ ⋮│
│ ...                                             │
└────────────────────────────────────────────────┘
Click → detalhe /brands/:id com tabs:
 [Info] [Membros atribuídos] [Brand kit (→/brand)] [Aprovadores] [IG connection]
```

### `.../admin/brands/new` — wizard 3 steps
```
Step 1: Identidade (nome, @handle IG, fuso, logo)
Step 2: Brand kit básico (3 cores + 1 fonte + 3 pilares sugeridos)
Step 3: Primeiro aprovador (nome, e-mail → envia magic link)
```

### `.../admin/team` — membros
```
┌────────────────────────────────────────────────┐
│ Membros (5/10 seats)                [+Convidar] │
├────────────────────────────────────────────────┤
│ Grid:                                           │
│ | Avatar │ Nome   │ Role*│ Marcas atrib. │ ⋮  │
│ | 👩    │ Maria  │ Copy │ Acme, Beta    │ ⋮  │
│ | 🧔    │ João   │ Des. │ Acme          │ ⋮  │
│ ...                                             │
│ * roles: strategist, copywriter, designer,     │
│   social_media, admin                          │
└────────────────────────────────────────────────┘
```

### `.../admin/permissions` — matriz
```
┌──────────────────────────────────────────────────┐
│ Matriz de permissões                              │
├──────────────────────────────────────────────────┤
│              │strat│copy │des  │soc  │admin     │
│ Criar brief  │  ✓  │  ✗  │  ✗  │  ✗  │  ✓      │
│ Editar copy  │  ✗  │  ✓  │  ✗  │  ✗  │  ✓      │
│ ...          │     │     │     │     │          │
├──────────────────────────────────────────────────┤
│ (Editável? No MVP só read-only; fase 2 custom)   │
└──────────────────────────────────────────────────┘
```

### `.../admin/approvers`
Lista de aprovadores cadastrados com: nome, e-mail, marcas, último acesso, ações [Re-emitir link] [Revogar] [Ver histórico].

### `.../admin/billing`
- Plano atual (nome + preço).
- Usage: seats 5/10 · marcas 4/5 · posts no mês.
- Histórico de faturas (tabela).
- Botão "Atualizar plano" → redireciona Stripe Billing Portal.

### `.../admin/white-label`
- Logo upload.
- Cor primária (color picker que **sobrescreve** token `--color-primary` para o portal do aprovador daquela agência).
- Subdomínio: `cliente.<agencia>.crieweb.com` ou custom CNAME (guia passo-a-passo).
- E-mail from-address (setup DKIM/SPF guiado).
- Toggle "Remover 'powered by crie-web'" (só plano enterprise).

### `.../admin/integrations`
- Conta Meta por marca (OAuth).
- Chaves API globais (Resend, Stripe webhook, LLM).
- Webhooks (Slack/Discord).

### `.../admin/audit`
Table filtrável: data, usuário, ação, target, IP. Export CSV.

### Mobile (<768px)
Somente dashboard read-only. Operações CRUD bloqueadas com CTA "abra no desktop".

## Componentes-chave

### Reutilizados
- `Card`, `Button`, `Badge`, `Tabs`, `Dialog`, `Sheet`, `Input`, `Textarea`, `Select`, `Separator`, `Tooltip`, `DropdownMenu`, `Popover`, `Avatar`, `ScrollArea`
- `AgencyMembersPage` atual → **evolui** para `/admin/team`
- `AgencySettingsPage` atual → **evolui** para `/admin/white-label` + `/admin/integrations`
- `WorkspaceMembersPage` → referenciado no detalhe da marca `/admin/brands/:id/members` (ou espelhado)
- `CreateWorkspaceDialog` → reusa para wizard de marca nova
- `BrandProfilePage` (`/brand`) → link a partir de `/admin/brands/:id/brand-kit`

### A criar
- `src/features/admin/AdminLayout.tsx` — sidebar esquerda específica de admin (dentro de `AgencyLayout`).
- `src/features/admin/components/AdminDashboard.tsx` — KPIs + onboarding checklist.
- `src/features/admin/components/OnboardingChecklist.tsx` — 5 passos com progresso.
- `src/features/admin/components/UsageKpiCards.tsx` — cards de KPI agregados.
- `src/features/admin/components/BrandsTable.tsx` — table com ações.
- `src/features/admin/components/BrandCreateWizard.tsx` — 3 steps (RHF multi-step).
- `src/features/admin/components/BrandDetailPage.tsx` — tabs info/members/brand kit/approvers/meta.
- `src/features/admin/components/TeamTable.tsx` — membros da agência + filters.
- `src/features/admin/components/InviteMemberDialog.tsx` — email + role.
- `src/features/admin/components/PermissionsMatrix.tsx` — matriz role × action.
- `src/features/admin/components/ApproversTable.tsx` — aprovadores + magic link actions.
- `src/features/admin/components/MagicLinkActions.tsx` — re-emitir / revogar (gera novo token).
- `src/features/admin/components/BillingPage.tsx` — plano + usage + faturas.
- `src/features/admin/components/WhiteLabelForm.tsx` — logo + cor + subdomain + email.
- `src/features/admin/components/IntegrationsPage.tsx` — Meta OAuth + chaves API + webhooks.
- `src/features/admin/components/AuditLogTable.tsx` — filtrável + export CSV.
- `src/features/admin/components/ColorTokenOverride.tsx` — live preview da cor primária aplicada.
- `src/features/admin/hooks/useAdminKpis.ts` — agregações (posts, approval rate, times).
- `src/features/admin/hooks/useBrands.ts`, `useTeam.ts`, `useApprovers.ts`, `useBilling.ts`, `useWhiteLabel.ts`, `useAuditLog.ts`.
- `src/hooks/useRoleCapabilities.ts` — matriz de capacidades derivada do role (consumida por gates de ação em todo o app).

## Estado

### Server (TanStack Query)
| Query key | Fonte | Invalidada por |
|---|---|---|
| `["admin-kpis", agencyId, month]` | agregação multi-tabela | qualquer mutação importante |
| `["brands", agencyId]` | `workspaces` (brand=workspace no schema atual) | CRUD brand |
| `["brand", workspaceId]` | join com `brand_profiles` | edição |
| `["team", agencyId]` | `agency_members` + `workspace_members` | invite/remove |
| `["permissions", agencyId]` | matriz (hardcoded + overrides) | — |
| `["approvers", workspaceId?]` | `approvers` + `magic_links` | CRUD |
| `["billing", agencyId]` | Stripe API + `agencies` | webhook |
| `["white-label", agencyId]` | `agencies.white_label_json` | save |
| `["integrations", agencyId]` | `meta_connections`, `api_keys` (encrypted) | save |
| `["audit", agencyId, filters]` | `audit_log` (nova) paginado | nova ação |

### Client (Zustand)
- `src/stores/useAdminStore.ts` — filtros da audit log, paginação, view atual.
- Sem drafts persistentes (operações curtas, com validação imediata).

## Interações críticas
1. **Golden path onboarding** — admin novo → dashboard mostra checklist → segue 5 passos → progresso atualiza em realtime → fim = libera entrada no kanban.
2. **Criar marca (wizard)** — clica `+ Nova` → step 1 → step 2 → step 3 → submit cria `workspaces` + `brand_profiles` + (opcional) `approvers`+`magic_links` → toast `sonner.success` + redirect para detalhe.
3. **Convite de membro** — e-mail + role → envia magic link via Resend → `agency_members.invited_email` + `accepted_at=null` → quando aceita, `accepted_at` preenche.
4. **Revogar aprovador** — confirm dialog → `magic_links.revoked_at = now()` → invalidação + toast. Links em uso morrem no próximo refresh.
5. **Mudança de plano (upgrade)** — botão → redireciona Stripe portal → webhook atualiza `agencies.subscription_status` + `seat_limit` → `useAdminKpis` invalida.
6. **White-label — cor primária** — color picker → live preview em iframe do portal do aprovador → save → atualiza `agencies.primary_color` → próximos carregamentos do `/a/:token` daquela agência aplicam o token.
7. **Audit log export** — filtro por usuário/período → [Export CSV] → download client-side (PapaParse) ou server-side (edge function para logs grandes).
8. **Edge — exceder seats** — ao convidar 11º membro com plano de 10 → bloqueia com CTA "fazer upgrade".

## Formulários (RHF + Zod)

### Brand (wizard)
```ts
const brandStep1 = z.object({
  name: z.string().min(2).max(80),
  ig_handle: z.string().regex(/^@?[\w.]+$/).optional(),
  timezone: z.string(),
  logo_url: z.string().url().optional(),
});
const brandStep2 = z.object({
  colors: z.array(z.object({ hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), name: z.string() })).min(1).max(5),
  primary_font: z.object({ family: z.string(), weight: z.string() }).optional(),
  pillars_suggestion: z.array(z.object({ name: z.string(), target_percent: z.number() })).optional(),
});
const brandStep3 = z.object({
  approver_name: z.string().min(2).optional(),
  approver_email: z.string().email().optional(),
  send_magic_link: z.boolean().default(false),
});
```

### Invite member
```ts
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["strategist","copywriter","designer","social_media","admin"]),
  workspace_ids: z.array(z.string().uuid()).min(0),
});
```

### Approver
```ts
const approverSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  whatsapp: z.string().optional(),
  notify: z.object({
    email: z.boolean().default(true),
    whatsapp: z.boolean().default(false),
    weekly_digest: z.boolean().default(true),
  }),
});
```

### White-label
```ts
const whiteLabelSchema = z.object({
  logo_url: z.string().url().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  subdomain: z.string().regex(/^[a-z0-9-]{3,40}$/).nullable(),
  custom_domain: z.string().optional(),
  email_from_address: z.string().email().nullable(),
  hide_crieweb_branding: z.boolean().default(false),
});
```

### Integrações (chaves API)
```ts
const apiKeySchema = z.object({
  provider: z.enum(["resend","stripe","openai","anthropic","unsplash","canva"]),
  key_encrypted: z.string().min(10),
  label: z.string().max(80),
});
```

## Responsividade
- **Desktop (≥1280px)** — layout 2 colunas (sidebar + conteúdo).
- **Laptop (1024–1280px)** — idem.
- **Tablet (768–1024px)** — sidebar vira menu top; tabelas scroll horizontal.
- **Mobile (<768px)** — somente leitura do dashboard; outras seções bloqueadas.

## Acessibilidade
- Tabelas com cabeçalho `<th scope>`, linhas com `aria-labelledby`.
- Ações destrutivas (revogar link, arquivar marca) usam `AlertDialog` com confirmação textual ("digite o nome da marca para confirmar").
- Cores de status em tabelas têm ícone + label.
- `⌘/Ctrl+K` abre command palette com ações rápidas ("Criar marca", "Convidar membro", "Ver audit log").

## Performance
- Tabelas virtualizadas (`@tanstack/react-virtual`) quando >100 linhas (audit log).
- Paginação server-side para audit log (page size 50).
- Skeleton em KPI cards + table.
- Webhook Stripe reflete realtime via realtime channel Supabase (canal `agency:<id>`).

## Instagram-nativo
- Integrações Meta per-marca: OAuth flow inicial + renovação automática de long-lived token (cron backend).
- White-label afeta portal do aprovador (IG preview usa cor primária como accent em badges mas **não altera fidelidade do IG real**).

## Dependências

### User stories
- US-061..US-080 (admin) — marcas, time, permissões, aprovadores, billing, white-label, integrações, audit log, onboarding.

### Endpoints / tabelas
- `agencies` (já existe) — estender: `primary_color`, `logo_url`, `subdomain`, `custom_domain`, `email_from`, `hide_branding`.
- `workspaces` (= marcas) já existe.
- `brand_profiles` (já existe) — estender com logos[], graphics[] (também solicitado pelo designer).
- `agency_members` (já existe).
- `workspace_members` (já existe).
- `approvers` (nova).
- `magic_links` (nova).
- `audit_log` (nova) — `actor_id`, `agency_id`, `workspace_id`, `action`, `target_type`, `target_id`, `meta_json`, `ip`, `user_agent`, `created_at`.
- `api_keys` (nova) — por agency, criptografadas (pgcrypto).
- `meta_connections` (nova, compartilhado com publisher).
- Endpoints:
  - `POST /api/stripe/checkout-session`
  - `GET /api/stripe/portal-url`
  - `POST /api/meta/oauth/callback`
  - `POST /api/audit/export` (edge function — CSV streaming).

### Design system a estender
- shadcn: `table`, `alert-dialog`, `command`, `progress`, `toggle`, `accordion`, `checkbox`, `radio-group`.
- Token override mechanism: API para agência setar `--color-primary` customizado aplicado **somente no portal do aprovador** (via CSS custom properties por subdomain/query param).

## Fora de escopo (MVP)
- Permissões customizáveis (matriz editável). No MVP é read-only.
- SSO (SAML/OIDC) — fase 2.
- Sub-agências / multi-tenant aninhado.
- Multi-moeda no billing (só BRL no MVP, ou só USD — decisão pendente).

## Conflitos com código existente
- `AgencySettingsPage` atual cobre nome + logo + plano; **migrar seções** para `/admin/white-label` e `/admin/billing`, deixando `/admin` como dashboard. Rota `/settings` vira alias temporário de `/admin/white-label`.
- `AgencyMembersPage` vira `/admin/team`. Mantemos componente, só muda rota.
- `AgencySidebar` (hoje estático) precisa ganhar entrada "Admin" visível apenas para `agency_members.role=owner|admin`.
- Backend: tabelas `approvers`, `magic_links`, `audit_log`, `api_keys`, `meta_connections` não existem — **bloqueador crítico**.
