---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
role: approver
breakpoint_primary: mobile
---

# Painel — Aprovador (Cliente)

Persona e JTBD: [[../../01_product/roles/aprovador]]. **Mobile-first obrigatório**: 90% dos clientes abrem no celular. Sem jargão, sem criação de conta, magic link only.

## Rota
`/a/:magicLinkToken` — **rota pública** (fora do shell autenticado `/app/*`).
Sub-rotas:
- `/a/:token` → fila de posts pendentes (swipe horizontal)
- `/a/:token/post/:postCardId` → detalhe + comentários
- `/a/:token/history` → histórico de aprovações
- `/a/:token/settings` → preferências de notificação

**Sem magic link válido → /a/:token retorna 410 Gone** com CTA "pedir novo link" (gera e-mail para admin da agência). Não redireciona pra login.

## Layout (ASCII wireframe)

### Mobile (<768px) — PRIMARY
```
┌─────────────────────┐
│ [Logo agência]      │  Topbar white-label (logo + nome do cliente)
│ Olá, João           │  Nome vem do magic_links.approver_name
├─────────────────────┤
│ 3 posts pendentes   │  Contador
│                     │
│ ┌─────────────────┐ │  Card do post (80% da tela)
│ │                 │ │
│ │  InstagramPreview│ │  Pixel-accurate preview do IG
│ │  (feed 1:1 / 4:5 │ │  Swipe horizontal entre cards da fila
│ │  / story 9:16 /  │ │  Tap no preview → tela de detalhe
│ │  reel / carrossel)│ │
│ │  indicador 1/3   │ │
│ │                  │ │
│ └──────────────────┘ │
│                     │
│  1 · "Post de lanç..│  Título simples (sem jargão)
│  Prazo: hoje 18h   │  Prazo destacado se <24h
│                     │
│ ┌─────┬─────┬─────┐ │  3 botões na base (grandes, >44px)
│ │ ✅  │ 💬  │ ⚙️   │ │  Aprovar · Comentar · Pedir ajuste
│ └─────┴─────┴─────┘ │
│                     │
│ ● ● ●               │  Indicador de cards restantes
└─────────────────────┘
 [Rodapé: powered by crie-web]
```

### Tela de detalhe `/post/:id`
```
┌─────────────────────┐
│ ← voltar            │
├─────────────────────┤
│                     │
│  InstagramPreview   │  Full
│  full size (tap     │
│  para zoom/pin)     │
│                     │
├─────────────────────┤
│ Legenda             │  Expansível com "... ver mais"
│ "Aprenda como..."   │  Ao selecionar texto: sugerir mudança
├─────────────────────┤
│ 💬 Comentários (2)  │  Thread de pins pinados na imagem
│ · João: "cor da    │  + comentários gerais
│    letra não lê bem"│
├─────────────────────┤
│ 📝 Histórico        │  Timeline da vida do post
├─────────────────────┤
│ [Aprovar] [Ajustar] │  Sticky bottom
└─────────────────────┘
```

### Ação "Aprovar" — confirmação por swipe
```
┌─────────────────────┐
│                     │
│   [swipe ──────→]   │  Track com handle; solta = aprovado
│   Deslize para      │  Evita approve acidental
│   aprovar           │
│                     │
└─────────────────────┘
```

### Ação "Pedir ajuste" — obrigatório motivo
```
┌─────────────────────┐
│ Pedir ajuste        │
├─────────────────────┤
│ O que mudar?        │
│ ( ) Texto/legenda   │  RadioGroup
│ ( ) Arte/imagem     │
│ ( ) Horário         │
│ ( ) Outro           │
│                     │
│ [textarea opcional] │
│                     │
│ [Enviar]            │
└─────────────────────┘
```

### Desktop (≥1024px) — secundário
Versão em duas colunas — preview à esquerda, controles à direita. Mesmo fluxo, só mais espaço.

## Componentes-chave

### Reutilizados
- `Button`, `Badge`, `Card`, `Input`, `Textarea`, `RadioGroup` (a criar shadcn), `Dialog`, `Drawer` (a criar — vaul)
- [[../components/InstagramPreview]] — core do painel
- [[../components/CommentPin]] — pins em coordenadas (extensão do `ImagePinOverlay` com suporte a `slide_index` e `reel_timestamp`)
- [[../components/MagicLinkGate]] — auth layer

### A criar
- `src/features/approver/components/ApproverShell.tsx` — layout standalone (sem AgencyLayout).
- `src/features/approver/components/ApproverTopbar.tsx` — logo white-label + nome cliente.
- `src/features/approver/components/ApprovalQueue.tsx` — lista swipeable de cards (touch-gesture ou lib `embla-carousel-react`).
- `src/features/approver/components/ApprovalCard.tsx` — card com preview + título + prazo + 3 botões.
- `src/features/approver/components/ApprovalActions.tsx` — 3 botões base (grandes).
- `src/features/approver/components/ApproveSwipe.tsx` — slide-to-approve (gesture-based).
- `src/features/approver/components/RequestChangesSheet.tsx` — bottom sheet com RadioGroup motivos.
- `src/features/approver/components/CaptionInlineSuggest.tsx` — selecionar trecho da legenda + sugerir mudança (Google-Docs style).
- `src/features/approver/components/PostHistoryTimeline.tsx` — timeline simples.
- `src/features/approver/components/EmptyStateApproved.tsx` — quando fila zera.
- `src/features/approver/components/ExpiredLinkPage.tsx` — 410 Gone.
- `src/features/approver/hooks/useApprovalQueue.ts` — query fila ordenada por prazo.
- `src/features/approver/hooks/useApprove.ts` — mutation aprovar (optimistic + audit).
- `src/features/approver/hooks/useRequestChanges.ts` — mutation pedir ajuste.
- `src/features/approver/hooks/useMagicLinkSession.ts` — lê token, valida, cria sessão efêmera (cookie ou localStorage).

## Estado

### Server (TanStack Query)
| Query key | Fonte | Invalidada por |
|---|---|---|
| `["magic-link", token]` | `magic_links` + `approvers` | revogação |
| `["approval-queue", magicLinkId]` | `post_cards` stage in ("aprovacao_copy","aprovacao_arte") limit por brand | aprovação/rejeição |
| `["post-card", cardId]` com comments + history | `post_cards` + joins | novas ações |

### Client (Zustand)
- `src/stores/useApproverStore.ts` — **somente UI state**: índice atual da fila, filtro de marca (se múltiplas marcas), tema claro/escuro (respeita preference do cliente).
- Sessão do magic link em **httpOnly cookie** (preferido) — fallback localStorage assinado com JWT.
- Sem persistência de draft (comentários são enviados imediatamente).

## Interações críticas
1. **Golden path — link → aprovação em 2min** — cliente abre e-mail → clica → `/a/:token` → `MagicLinkGate` valida → fila carrega → swipe no card → tap "Aprovar" → slide-to-approve → confirmação. Tempo alvo: <2min por post.
2. **Pedir ajuste** — tap "Pedir ajuste" → bottom sheet → seleciona motivo (obrigatório) → textarea opcional → envia → card some da fila + `sonner.success("Ajuste solicitado")`.
3. **Comentário pinado** — tap no preview do post (ou imagem) → coordenada é capturada (x%/y%) → `CommentPin` cria pin numerado → textarea abre → envia → pin fica visível para o time interno.
4. **Comentário inline em legenda** — selecionar texto → tooltip "Sugerir mudança" → dialog com original/sugestão → envia como comentário tipo `caption_suggest` vinculado ao trecho.
5. **Carrossel — pin por slide** — swipe entre slides, cada slide tem índice, pin salva `{ slide_index: N, x, y }`.
6. **Link expirado / revogado** — `MagicLinkGate` detecta → redirect `ExpiredLinkPage` com CTA "Solicitar novo link" (gera e-mail ao admin).
7. **Edge — múltiplas marcas no mesmo link** — se um aprovador tem 3 marcas, mostra seletor no topo (dropdown com logos).
8. **Edge — sem conexão** — queue vira offline (IndexedDB cache via TanStack Query `persistQueryClient`); ações ficam em fila local e sincronizam quando volta.

## Formulários (RHF + Zod)

### Approve (explícita)
```ts
const approveSchema = z.object({
  magic_link_id: z.string().uuid(),
  post_card_id: z.string().uuid(),
  audit_ip: z.string().optional(), // server adiciona
});
```

### Request changes
```ts
const requestChangesSchema = z.object({
  magic_link_id: z.string().uuid(),
  post_card_id: z.string().uuid(),
  reason: z.enum(["copy","art","timing","other"]),
  note: z.string().max(500).optional(),
});
```

### Comment (pin / general / caption_suggest)
```ts
const approverCommentSchema = z.object({
  magic_link_id: z.string().uuid(),
  target_type: z.enum(["card","asset_version","copy_version","carousel_slide"]),
  target_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
  pin_x: z.number().min(0).max(100).nullable(),
  pin_y: z.number().min(0).max(100).nullable(),
  slide_index: z.number().int().min(1).max(10).nullable(),
  reel_timestamp_s: z.number().nonnegative().nullable(),
  suggest: z.object({
    original: z.string(),
    suggestion: z.string(),
    selection_start: z.number().int(),
    selection_end: z.number().int(),
  }).nullable(),
});
```

## Responsividade
- **Mobile (<640px)** — **primary**; layout single-column, botões 56px altura, touch-friendly.
- **Tablet (640–1024px)** — card mais largo, preview maior.
- **Desktop (≥1024px)** — preview à esquerda (centralizado max 560px), controles/comentários à direita.
- **Landscape mobile** — queue horizontal com preview lado a lado. Mínimo suportado: 360×640.

## Acessibilidade
- **Contraste AAA** em todos os textos (clientes frequentemente sênior).
- Botões grandes (>44×44px), espaçamento generoso.
- `aria-label` em português descritivo ("Aprovar post 'Lançamento coleção verão'").
- Slide-to-approve tem fallback botão tradicional para usuários de leitores de tela.
- Modo escuro auto-detectado (`prefers-color-scheme`).
- Navegação por teclado: `Tab` entre botões, `Enter` ativa, `←/→` entre cards da fila.
- Language attribute no `html` = `pt-BR`.

## Performance
- Bundle separado por code-splitting: `/a/:token` carrega **apenas** o bundle do aprovador (não leva AgencyLayout/WorkspaceLayout). Meta: <150KB JS gzip.
- `InstagramPreview` lazy-loaded por tipo de post (feed vs carousel vs reel).
- Thumbnails + imagens com `loading="eager"` para o card atual, `"lazy"` para próximos da fila.
- `persistQueryClient` com `localStorage` → offline read-only.
- Skeleton mínimo (o cliente espera velocidade).

## Instagram-nativo
- **Preview pixel-accurate** em [[../components/InstagramPreview]]:
  - Feed: header (profile pic 32px + @handle + menu) + imagem quadrada/4:5 + ícones ❤💬✉️🔖 + "curtido por X..." + legenda com "... ver mais" em 125 chars.
  - Carrossel: indicador 1/N, swipe gesture funcional.
  - Story: UI completa (profile topo, barra progresso, stickers interativos somente visuais, CTA bottom).
  - Reel: 9:16, ícones laterais (❤💬✉️🎵), CTA, closed captions ativas.
- Toggle "como aparece no feed" vs "como aparece no perfil (grid)" — último mostra 3x3 com crops 1:1.
- **Zero jargão**: não mostrar "pilar", "CTA", "engagement" na UI — só título do post + prazo.

## Dependências

### User stories
- US-051..US-060 (aprovador) — fila, preview IG, pin, aprovar, pedir ajuste, histórico, magic link, white-label, digest.

### Endpoints / tabelas
- `magic_links` (nova) — `token (unique)`, `workspace_id`, `approver_id`, `expires_at`, `revoked_at`, `last_used_at`, `scope (workspace|brand)`.
- `approvers` (nova) — `workspace_id`, `name`, `email`, `whatsapp?`, `notify_preferences`.
- `approvals` (já existe parcial) — `post_card_id`, `magic_link_id`, `action (approve|request_changes)`, `reason`, `note`, `ip`, `user_agent`, `created_at`.
- `approval_pins` (nova) — extensão do `comments` atual com `slide_index`, `reel_timestamp_s`.
- Endpoint `POST /api/magic-link/validate` (backend) — valida token, retorna sessão.
- Endpoint `POST /api/magic-link/request-new` — gera novo link para admin aprovar.
- Edge function `send-approval-digest` (cron segunda 9h) — resumo semanal.

### Design system a estender
- shadcn: `drawer` (vaul), `radio-group`, `checkbox`, `scroll-area` (já tem), `progress`.
- Lib carousel swipe: `embla-carousel-react` (leve, touch-friendly).
- Tokens:
  - `--color-ig-gradient-story` (borda de story/reel).
  - Modo escuro bem afinado (aprovadores abrem à noite).
- Componente `InstagramFrame` (chrome do device — iPhone / Android toggle opcional para visual fidelity no desktop).

## Fora de escopo (MVP)
- Aprovador edita legenda direto (só sugere).
- Aprovar via WhatsApp (respostas inline) — fase 2.
- Biometria para aprovação (TouchID/FaceID) — fase 2.
- Multi-usuário simultâneo com presença real-time.

## Conflitos com código existente
- **Sem rota pública hoje** no app — toda rota atual está sob `/app/*` protegida. Plano:
  1. Adicionar `<Route path="/a/:token" element={<ApproverShell />}>` antes do `<Route path="/app" element={<AuthGuard />}>`.
  2. `ApproverShell` é **independente** de `AgencyLayout`/`WorkspaceLayout` (não herda sidebar nem contexto de auth).
  3. Sessão do aprovador **não usa `useAuthStore`** — usa `useMagicLinkSession` isolado.
- `ImagePinOverlay` atual é usado no card detail interno. Novo `CommentPin` (transversal) **estende** (adiciona `slide_index` e `reel_timestamp_s`) — podemos migrar o atual para o novo contract via prop opcional `mode="internal"|"approver"`.
- Backend: `magic_links` / `approvers` não existem — bloqueador; product/backend precisa priorizar no schema.
