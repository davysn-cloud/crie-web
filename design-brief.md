# Crie — Complete Design Brief for AI Agent Designers

> **Purpose of this document:** Give any third-party AI design agent (Figma AI, Galileo, Relume, v0, Lovable, etc.) everything it needs to produce a full UI/UX design for the Crie SaaS platform — without reading anything else.

---

## 1. What is Crie?

**Crie** is a B2B SaaS platform for **marketing agencies** that centralizes content approval and publishing for Instagram. Today agencies juggle WhatsApp, email, Google Drive, and spreadsheets to approve posts with clients. Crie replaces all of that with:

- A **kanban workflow** (Ideation → Creation → Approval → Scheduled → Published)
- **Role-specific panels** for each team member (strategist, copywriter, designer, social media manager, admin)
- A **mobile-first client portal** where external clients approve content via magic link (no account needed)
- **Direct publishing** to Instagram via Meta Graph API
- **Multi-tenant architecture** (one agency manages many brand clients)

**Target users:** Small-to-mid Brazilian marketing agencies (5–30 people) managing 5–50 Instagram brand accounts.

**Language:** Brazilian Portuguese (pt-BR) for all UI text.

---

## 2. Design System Foundation

### 2.1 Tech Stack (for design constraints)

| Layer | Tool |
|---|---|
| Components | **shadcn/ui** (Radix primitives) — design around this library's patterns |
| Styling | **Tailwind CSS v4** with CSS custom properties |
| Icons | **Lucide React** |
| Drag & drop | **dnd-kit** |
| Toasts | **sonner** |
| Mobile drawers | **vaul** (Drawer) |

### 2.2 Color Tokens

```
Brand
  --primary:          OKLCH purple-blue (main CTA, active nav, links)
  --primary-foreground: white

Neutral (shadcn defaults)
  --background:       white / zinc-950 (dark)
  --foreground:       zinc-950 / zinc-50
  --muted:            zinc-100 / zinc-800
  --muted-foreground: zinc-500 / zinc-400
  --border:           zinc-200 / zinc-800
  --card:             white / zinc-900

Semantic
  --destructive:      red-500
  --success:          green-500
  --warning:          amber-500

Status (post stages)
  --status-ideation:  slate-400      (gray)
  --status-creating:  blue-500       (blue)
  --status-approval:  amber-500      (yellow)
  --status-scheduled: cyan-500       (cyan)
  --status-published: green-500      (green)
  --status-failed:    red-500        (red)
  --status-archived:  zinc-300       (dim gray)

Content Pillars (5 fixed colors for calendar/filter tagging)
  --pillar-1: violet-500
  --pillar-2: sky-500
  --pillar-3: emerald-500
  --pillar-4: rose-500
  --pillar-5: amber-500

Instagram
  --ig-gradient: linear-gradient(45deg, #833ab4, #fd1d1d, #fcb045)  (story ring)
```

### 2.3 Typography

| Use | Font | Weight |
|---|---|---|
| Headings | Inter (sans-serif) | 600, 700 |
| Body | Inter | 400, 500 |
| Caption editor / code | JetBrains Mono | 400 |
| Instagram preview text | System default (to match real IG) | — |

### 2.4 Spacing & Layout

- **Base unit:** 4px grid
- **Border radius:** `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs, `rounded-full` for avatars/badges
- **Sidebar:** 240px collapsed to 56px icon-only
- **Content max-width:** 1280px for most views, full-bleed for canvas/calendar
- **Responsive breakpoints:** 640 / 768 / 1024 / 1280 / 1536

### 2.5 Dark Mode

Full dark mode support required (shadcn handles this via CSS class toggle). Design both light and dark variants for every screen.

---

## 3. Information Architecture & Navigation

### 3.1 Global Shell (authenticated users)

```
┌──────────────────────────────────────────────────────┐
│ [Logo]  Agency Name ▾   [Brand Selector ▾]   🔔  👤 │  ← Top bar
├──────┬───────────────────────────────────────────────┤
│      │                                               │
│ Nav  │              Main Content Area                │
│      │                                               │
│ ──── │                                               │
│ Home │                                               │
│ Board│                                               │
│ Cal  │                                               │
│ ──── │                                               │
│ Copy │                                               │
│ Design│                                              │
│ Pub  │                                               │
│ ──── │                                               │
│ Admin│                                               │
│      │                                               │
└──────┴───────────────────────────────────────────────┘
```

**Top bar elements:**
- Logo (links to dashboard)
- Agency name with dropdown (switch agencies, if user belongs to multiple)
- Brand/Workspace selector dropdown (switch between client brands)
- Notification bell (badge count)
- User avatar menu (profile, settings, logout)

**Left sidebar navigation:**
| Section | Items | Icon |
|---|---|---|
| Overview | Dashboard / Kanban Board | `LayoutDashboard` / `Columns3` |
| Strategy | Calendar / Pillars / Campaigns / Briefs | `Calendar` / `Layers` / `Target` / `FileText` |
| Creation | Copy / Design / Assets | `Type` / `Paintbrush` / `Image` |
| Publishing | Queue / Grid Planner | `Send` / `Grid3x3` |
| Management | Team / Brands / Billing / Settings | `Users` / `Building2` / `CreditCard` / `Settings` |

Sidebar collapses to icon-only on screens < 1280px. On mobile (< 768px), sidebar becomes a bottom tab bar with 5 key items.

### 3.2 Approver Portal (separate shell, no sidebar)

```
┌──────────────────────────────────────────┐
│ [Agency Logo]        [Brand] [Language]  │  ← Minimal header
├──────────────────────────────────────────┤
│                                          │
│         Full-screen content              │
│         (swipeable cards)                │
│                                          │
│  [← Prev]    [Approve] [Changes]  [→]   │  ← Bottom action bar
└──────────────────────────────────────────┘
```

White-label: agency logo + primary color replace Crie branding.

---

## 4. All Pages & Screens

### PAGE 1: Login / Signup / Forgot Password

**Route:** `/login`, `/signup`, `/forgot-password`

**Layout:** Split screen — left side: illustration/branding, right side: form.

**Login form:**
- Email input
- Password input
- "Esqueceu a senha?" link
- "Entrar" primary button
- "Criar conta" secondary link
- Divider: "ou continue com"
- Google OAuth button

**Signup form:**
- Nome completo
- Email
- Senha (strength indicator)
- "Criar conta" button
- Terms checkbox

**Forgot password:**
- Email input
- "Enviar link de recuperacao" button
- Success state: "Verifique seu email"

---

### PAGE 2: Onboarding (first-time setup)

**Route:** `/onboarding`

**Layout:** Centered card with stepper (5 steps).

| Step | Title | Content |
|---|---|---|
| 1 | "Sobre sua agencia" | Agency name, logo upload, slug (auto-generated, editable) |
| 2 | "Primeiro cliente (marca)" | Brand name, IG handle (@), logo, timezone selector |
| 3 | "Brand kit basico" | Up to 5 colors (color picker), 2 fonts (dropdown), tone selector (Formal/Neutro/Casual/Divertido) |
| 4 | "Convide sua equipe" | Email + role multi-input (can skip) |
| 5 | "Conecte o Instagram" | Meta OAuth button → success state showing connected account |

Bottom: progress bar + "Voltar" / "Proximo" buttons. Final step: "Comecar a usar o Crie!"

---

### PAGE 3: Dashboard (Admin Home)

**Route:** `/app/:agency/admin`

**Layout:** Grid of metric cards + recent activity feed.

**Metric cards (top row):**
| Card | Value | Subtitle |
|---|---|---|
| Posts este mes | `47` | `↑12% vs mes anterior` |
| Aprovados de 1a | `78%` | `meta: 85%` |
| Tempo medio aprovacao | `4.2h` | `↓ de 6.1h` |
| Backlog (pendentes) | `12` | `3 urgentes (< 24h)` |

**Brand performance table:**
| Marca | Posts/mes | Aprov. 1a | Tempo medio | Status |
|---|---|---|---|---|
| @cafebonito | 15 | 85% | 3h | 🟢 |
| @modazen | 12 | 65% | 8h | 🟡 |

**Recent activity feed (right column):**
- Timestamped list: "Ana aprovou post #142 para @cafebonito" etc.

**Quick actions:**
- "Novo brief" button
- "Convidar membro" button

---

### PAGE 4: Kanban Board

**Route:** `/app/:agency/w/:workspace`

**Layout:** Horizontal scrollable kanban with 5 columns.

**Columns:**
| Ideacao | Em criacao | Aprovacao | Agendado | Publicado |
|---|---|---|---|---|
| Cards... | Cards... | Cards... | Cards... | Cards... |

**Card anatomy:**
```
┌─────────────────────────┐
│ [Thumbnail]             │  ← Asset preview (or placeholder gradient)
├─────────────────────────┤
│ Titulo do post          │  ← Title (truncated 2 lines)
│ 📌 Educativo  🖼 Carousel │  ← Pillar badge + format icon
│ @cafebonito             │  ← Brand name
├─────────────────────────┤
│ 👤 Ana  📅 22 abr 14:00 │  ← Assignee avatar + scheduled date
│ 💬 3  ✅ 1/2            │  ← Comment count + approval progress
└─────────────────────────┘
```

**Features:**
- Drag-drop cards between columns (with stage transition rules)
- Filter bar: by brand, pillar, format, assignee, date range
- "+ Novo post" button (opens card creation drawer)
- Click card → opens detail side panel or modal

**Card detail (slide-over panel from right, 480px wide):**
- Full preview (image/carousel/video)
- Caption (read/edit based on role)
- Stage selector dropdown
- Assignees
- Comments thread (with pin markers)
- Version history timeline
- Action buttons: "Enviar para aprovacao", "Agendar", etc.

---

### PAGE 5: Editorial Calendar (Strategist)

**Route:** `/app/:agency/w/:workspace/strategist/calendar`

**Layout:** Full-width calendar grid.

**Views:** Month (default) | Week toggle.

**Month view:**
- 7-column grid (Dom–Sab)
- Each day cell shows post thumbnails (max 3 visible, "+N" overflow)
- Post chips show: thumbnail mini + pillar color dot + format icon
- Drag-drop to reschedule
- Click day → day detail panel (list of all posts)
- Click post → card detail

**Week view:**
- Time slots (8h–22h) on Y-axis, 7 days on X-axis
- Posts as time blocks with pillar color
- Best-time suggestions shown as subtle highlight bands

**Sidebar (right):**
- Pillar distribution bar chart (target vs actual for current month)
- Upcoming deadlines list
- Quick "Novo brief" button

---

### PAGE 6: Brief Builder

**Route:** Modal/drawer overlay on any page

**Layout:** Multi-section form in a full-height drawer (right side, 640px wide).

**Sections:**

**1. Basico**
- Titulo (text input)
- Marca / Workspace (auto-filled, can change)
- Pilar (dropdown — shows pillar colors)
- Campanha (optional dropdown)

**2. Objetivo & Formato**
- Objetivo: radio group (Awareness / Consideracao / Conversao / Retencao)
- Formato IG: visual toggle group with icons
  - `Feed 1:1` | `Feed 4:5` | `Feed 1.91:1` | `Story` | `Reel` | `Carousel`

**3. Conteudo**
- Publico-alvo (textarea, 2 lines)
- Mensagem-chave (textarea, 3 lines)
- CTA desejado (text input)
- Referencias (URL inputs + file upload dropzone)

**4. Atribuicao**
- Responsavel pelo copy (member selector)
- Responsavel pelo design (member selector)
- Data limite (date picker)
- Hashtag set (dropdown)

**Footer:** "Salvar rascunho" (secondary) | "Criar brief" (primary)

---

### PAGE 7: Pillar Manager

**Route:** `/app/:agency/w/:workspace/strategist/pillars`

**Layout:** Card grid + distribution chart.

**Pillar cards (grid, 2–3 columns):**
```
┌────────────────────────────┐
│ 🟣 Educativo          [⋯] │  ← Color dot + name + menu
│ Meta: 30% | Atual: 25%    │  ← Target vs actual
│ ████████░░ 25%             │  ← Progress bar
│ 12 posts este mes          │
│ 45 hashtags configurados   │
└────────────────────────────┘
```

**Actions:** Add pillar, edit (name, color, target %), archive.

**Distribution chart (top):** Stacked bar or donut showing all pillars.

---

### PAGE 8: Caption Editor (Copywriter)

**Route:** `/app/:agency/w/:workspace/copy/write/:postCardId`

**Layout:** Two-panel split.

**Left panel (60%) — Editor:**
```
┌──────────────────────────────────────┐
│ Titulo do Post                       │
│ Pilar: Educativo  Formato: Carousel  │
├──────────────────────────────────────┤
│ Legenda                              │
│ ┌──────────────────────────────────┐ │
│ │ (monospace editor area)          │ │
│ │                                  │ │
│ │ Voce sabia que 80% das agencias │ │
│ │ ainda aprovam conteudo por       │ │
│ │ WhatsApp? 🤯                     │ │
│ │                                  │ │
│ │ Descubra como automatizar...     │ │
│ └──────────────────────────────────┘ │
│ 234/2200 chars  Preview: 98/125  ✅  │  ← Live counters
│ Emojis: 3/30  Hashtags: 12          │
├──────────────────────────────────────┤
│ Hashtags                             │
│ #marketing #agencia #conteudo ...    │
│ [Sugerir hashtags ✨]                │
├──────────────────────────────────────┤
│ Primeiro comentario (opcional)       │
│ ┌──────────────────────────────────┐ │
│ │ hashtags adicionais aqui...      │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ [Gerar com IA ✨] [Salvar] [Enviar]  │
└──────────────────────────────────────┘
```

**Right panel (40%) — Preview:**
- Instagram-accurate preview (see Component: InstagramPreview below)
- Toggle: Feed view / Grid view / Story view
- Version history dropdown (v1, v2, v3...)
- Diff toggle (side-by-side comparison between versions)

**For Carousel format — additional tabs:**
- "Slides" tab: 10 slide forms (titulo, corpo, CTA overlay, design notes per slide)
- Recommended structure hint: "Slide 1 = Hook, 2-9 = Conteudo, 10 = CTA"

**For Reel format:**
- Script sections: Hook (0-3s), Desenvolvimento (3-Xs), CTA (final)
- Text-on-screen field with char limit per line
- Audio suggestion field

**For Story format:**
- Frame grid (3-10 frames)
- Per frame: text, sticker type dropdown (poll/question/quiz/slider/link/countdown/mention), expected action

---

### PAGE 9: Copy Inbox (Copywriter Home)

**Route:** `/app/:agency/w/:workspace/copy`

**Layout:** 3-column kanban (narrower than main board).

| Para escrever | Em ajuste | Aprovado |
|---|---|---|
| Brief cards assigned to this copywriter | Posts with change requests | Completed copies |

Card shows: title, brand, format icon, deadline, brief preview snippet.

---

### PAGE 10: Design Canvas (Designer)

**Route:** `/app/:agency/w/:workspace/design/canvas/:postCardId`

**Layout:** Full-screen canvas workspace.

```
┌────┬─────────────────────────────────┬──────┐
│    │                                 │      │
│ T  │        Canvas Area              │  P   │
│ o  │     (zoom/pan, checkerboard     │  r   │
│ o  │      background)                │  o   │
│ l  │                                 │  p   │
│ b  │    ┌──────────────────┐         │  e   │
│ a  │    │                  │         │  r   │
│ r  │    │   1080 x 1350    │         │  t   │
│    │    │   (4:5 feed)     │         │  i   │
│    │    │                  │         │  e   │
│    │    │  [safe zone      │         │  s   │
│    │    │   overlay]       │         │      │
│    │    │                  │         │      │
│    │    └──────────────────┘         │      │
│    │                                 │      │
├────┴─────────────────────────────────┴──────┤
│  Format: [1:1] [4:5•] [Story] [Reel]  Zoom │  ← Bottom bar
└─────────────────────────────────────────────┘
```

**Left toolbar:**
- Upload image
- Text tool
- Shapes
- Brand kit colors (locked picker)
- Brand kit fonts (locked picker)
- Layers panel

**Right properties panel:**
- Selected element properties (position, size, rotation, opacity)
- Brand kit lock indicator (shows when using approved vs custom colors)
- Format variants list (master + generated)
- "Gerar variantes" button (auto-adapt 1→N)

**Bottom bar:**
- Format toggle group (IG presets)
- Zoom slider
- Safe zone toggle
- Grid overlay toggle
- Export button

**Carousel mode:** Bottom filmstrip of 10 slides (reorderable via drag-drop). Click slide to edit. Cover/CTA markers on slide 1 and 10.

---

### PAGE 11: Asset Library

**Route:** `/app/:agency/w/:workspace/design/assets`

**Layout:** Grid gallery with filters.

**Top bar:** Search input + filter dropdowns (kind, tags, color, source) + view toggle (grid/list) + "Upload" button.

**Asset grid:**
```
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│      │ │      │ │      │ │      │
│ img  │ │ img  │ │ icon │ │ img  │
│      │ │      │ │      │ │      │
├──────┤ ├──────┤ ├──────┤ ├──────┤
│photo │ │logo  │ │star  │ │hero  │
│📷 3MB│ │🎨 SVG│ │🎨 PNG│ │📷 5MB│
└──────┘ └──────┘ └──────┘ └──────┘
```

Each card: thumbnail, name, type icon, file size. Hover: quick actions (download, copy URL, delete). Click: detail overlay with full preview, tags editor, usage history.

**Upload:** Drag-drop zone + file picker. Progress bar per file. Tags required before confirming.

**Integrations:** Tabs for "Meus arquivos" | "Unsplash" | "Pexels" with search.

---

### PAGE 12: Brand Kit Editor

**Route:** `/app/:agency/w/:workspace/brand`

**Layout:** Organized sections with live preview.

**Sections:**

**Logo:**
- Main logo upload + secondary/icon version
- Preview on light and dark backgrounds

**Colors (max 5):**
- Color swatches with hex/OKLCH values
- Add/remove colors
- "Primary", "Secondary", "Accent" labels

**Fonts (max 2):**
- Heading font selector (from Google Fonts or upload)
- Body font selector
- Preview: "Aa Bb Cc 123" in each

**Tone of voice:**
- Selector: Formal / Neutro / Casual / Divertido
- Vocab preferido (tag input)
- Vocab proibido (tag input)
- Emoji policy: Nenhum / Moderado / Liberado

**Preview panel (right side):** Mock Instagram post using brand kit values.

---

### PAGE 13: Publish Queue (Social Media)

**Route:** `/app/:agency/w/:workspace/publisher/queue`

**Layout:** Timeline list.

```
┌───────────────────────────────────────────────────────┐
│ Hoje, 22 abr                                          │
│ ┌─────────────────────────────────────────────────────┐│
│ │ 14:00  🟢 Publicado  │ @cafebonito │ Feed 4:5     ││
│ │ "5 dicas para..."    │ [thumb]     │ [Ver no IG →] ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────┐│
│ │ 18:00  🔵 Agendado   │ @modazen   │ Carousel      ││
│ │ "Tendencias de..."   │ [thumb]     │ [Editar] [⋯]  ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────┐│
│ │ 20:00  🔴 Falhou     │ @cafebonito │ Reel         ││
│ │ "Erro: token exp..." │ [thumb]     │ [Retry] [⋯]   ││
│ └─────────────────────────────────────────────────────┘│
│                                                        │
│ Amanha, 23 abr                                         │
│ ...                                                    │
└───────────────────────────────────────────────────────┘
```

**Status indicators:** Color-coded badges (queued=gray, publishing=yellow, published=green, failed=red).

**Actions per item:** View on IG (if published), edit, retry (if failed), cancel, mark as published manually.

**Meta token health:** Banner at top if any brand's token expires within 14 days.

---

### PAGE 14: Grid Planner

**Route:** `/app/:agency/w/:workspace/publisher/grid`

**Layout:** Instagram profile mockup.

```
┌────────────────────────────────────┐
│  @cafebonito                       │
│  ┌────┐                            │
│  │pfp │  1.2K posts  45K followers │
│  └────┘  Bio text here...          │
├────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐              │
│ │ 1  │ │ 2  │ │ 3  │  ← Published │
│ └────┘ └────┘ └────┘              │
│ ┌────┐ ┌────┐ ┌────┐              │
│ │ 4  │ │ 5  │ │ 6  │  ← Scheduled │
│ └────┘ └────┘ └────┘    (dashed   │
│ ┌────┐ ┌────┐ ┌────┐    border)   │
│ │ 7  │ │ 8  │ │ 9  │  ← Drafts   │
│ └────┘ └────┘ └────┘    (dimmed)  │
└────────────────────────────────────┘
```

- Published posts: solid border, full opacity
- Scheduled: dashed border, full opacity
- Drafts: dimmed, placeholder
- Drag-drop to reorder (recalculates schedule)
- Color harmony alert if 3+ adjacent posts use same pillar

---

### PAGE 15: Unified Calendar (Publisher)

**Route:** `/app/:agency/w/:workspace/publisher/calendar`

**Layout:** Same calendar component as strategist but focused on publish status.

Posts colored by **publish status** (not pillar):
- Gray = draft
- Blue = approved, unscheduled
- Cyan = scheduled
- Yellow = publishing
- Green = published
- Red = failed

Best-time suggestion highlights on empty time slots.

---

### PAGE 16: Approver Portal — Queue (Mobile-First)

**Route:** `/a/:magicLinkToken`

**Layout:** Full-screen swipeable card stack. **Design mobile-first (375px), adapt up to desktop.**

```
Mobile (375px):
┌─────────────────────────┐
│ [Agency Logo]   @brand  │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐  │
│  │                   │  │
│  │   Instagram       │  │
│  │   Preview         │  │
│  │   (pixel-accurate)│  │
│  │                   │  │
│  │   Caption below   │  │
│  │   with "ver mais" │  │
│  │   truncation      │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
│  1/5 posts pendentes    │
│                         │
├─────────────────────────┤
│                         │
│  [💬 Comentar]          │
│                         │
│  [✅ Aprovar]  [✏️ Pedir │
│                ajuste]  │
│                         │
└─────────────────────────┘
```

**Swipe left/right** to navigate between pending posts.

**Approve action:** Tap "Aprovar" → swipe-to-confirm animation (prevents accidental approval). Shows success toast.

**Request changes:** Tap "Pedir ajuste" → bottom sheet with:
- Category: Copy / Arte / Timing / Outro (required radio)
- Note textarea (optional)
- "Enviar" button

**Carousel:** Horizontal slide dots (1/10), swipe through slides.

---

### PAGE 17: Approver — Comment Pins

**Route:** Same page, triggered by tap on image.

**Interaction:** Tap anywhere on the preview image → numbered pin appears at that coordinate → text input opens.

```
┌───────────────────────┐
│         ①             │  ← Pin at tap location
│              ②        │
│   [image]             │
│                       │
└───────────────────────┘
┌───────────────────────┐
│ Pin #2                │
│ ┌───────────────────┐ │
│ │ A cor esta muito  │ │
│ │ escura, clarear   │ │
│ └───────────────────┘ │
│ [Enviar comentario]   │
└───────────────────────┘
```

For carousels: pins are per-slide (slide_index tracked).
For captions: select text → "Sugerir mudanca" inline (Google Docs-style suggestion).

Resolved pins show with a checkmark overlay (still visible for history).

---

### PAGE 18: Approver — Post History

**Route:** `/a/:token/history`

**Layout:** Timeline list of all reviewed posts.

```
┌─────────────────────────────┐
│ Post: "5 dicas para..."     │
│ ├─ 20 abr 10:00  Enviado   │
│ ├─ 20 abr 14:30  Comentou  │
│ ├─ 21 abr 09:00  Ajustado  │
│ └─ 21 abr 11:15  Aprovado ✅│
│                              │
│ Post: "Novidade! Nossa..."   │
│ ├─ 19 abr 16:00  Enviado   │
│ └─ 19 abr 16:45  Aprovado ✅│
└─────────────────────────────┘
```

---

### PAGE 19: Team Management (Admin)

**Route:** `/app/:agency/admin/team`

**Layout:** Table with invite flow.

**Table columns:** Avatar | Nome | Email | Cargo (role badge) | Marcas atribuidas (brand chips) | Status (Ativo/Pendente) | Actions (edit, remove)

**Invite drawer:**
- Email input
- Role selector (Estrategista / Copywriter / Designer / Social Media / Admin)
- Brand assignment checkboxes
- "Enviar convite" button

**Role badges:** Color-coded (strategist=violet, copywriter=blue, designer=pink, social_media=cyan, admin=slate).

---

### PAGE 20: Brand Management (Admin)

**Route:** `/app/:agency/admin/brands`

**Layout:** Card grid.

```
┌─────────────────────────────┐
│ [Logo]  @cafebonito         │
│ Cafe Bonito Padaria         │
│                             │
│ Posts: 47/mes  Aprov: 85%   │
│ Equipe: Ana, Carlos, Maria  │
│ IG: ✅ Conectado             │
│                             │
│ [Editar] [Arquivar]        │
└─────────────────────────────┘
```

"+ Nova marca" card opens creation form (same as onboarding step 2+3).

---

### PAGE 21: Approver Management (Admin)

**Route:** `/app/:agency/admin/approvers`

**Layout:** Table grouped by brand.

**Columns:** Nome | Email | Marca | Ultimo acesso | Status do link | Actions

**Actions:** Re-enviar link | Revogar | Copiar link

Status: "Ativo" (green), "Expirado" (yellow), "Revogado" (red), "Nunca acessou" (gray).

---

### PAGE 22: Billing (Admin)

**Route:** `/app/:agency/admin/billing`

**Layout:** Plan card + usage meters + invoice table.

**Current plan card:**
```
┌────────────────────────────────────┐
│ Plano: Profissional   R$ 297/mes  │
│                                    │
│ Membros:    5/10  ████████░░       │
│ Marcas:     3/15  ██░░░░░░░░       │
│ Posts/mes: 47/∞   (ilimitado)     │
│                                    │
│ [Gerenciar no Stripe →]           │
└────────────────────────────────────┘
```

**Invoice table:** Data | Valor | Status (Pago/Pendente) | PDF link

---

### PAGE 23: White-Label Settings (Admin)

**Route:** `/app/:agency/admin/white-label`

**Layout:** Form + live preview.

**Settings:**
- Agency logo upload (appears in approver portal header)
- Primary color picker (used in approver portal buttons/accents)
- Subdominio: `[input].crieweb.com` or custom CNAME field
- Email from-address (with DKIM/SPF setup guide link)
- Toggle: "Remover 'powered by Crie'" (enterprise only, grayed out for other plans)

**Live preview (right side):** Mini iframe showing approver portal with current settings applied.

---

### PAGE 24: Integrations (Admin)

**Route:** `/app/:agency/admin/integrations`

**Layout:** Integration cards grid.

**Cards:**
| Integration | Status | Actions |
|---|---|---|
| Instagram (Meta) | Per brand: Connected/Disconnected | Connect / Disconnect per brand |
| Stripe | Connected | Manage |
| Resend (email) | Configured | Edit API key |
| Slack notifications | Not connected | Connect |
| Discord notifications | Not connected | Connect |

Each card shows logo, name, status badge, action button.

---

### PAGE 25: Audit Log (Admin)

**Route:** `/app/:agency/admin/audit`

**Layout:** Filterable table.

**Filters (top):** Date range | Actor (user/system dropdown) | Action type | Brand | Search

**Table columns:** Data/hora | Ator | Acao | Entidade | Detalhes (expandable JSON) | IP

**Export:** "Exportar CSV" button.

Rows alternate white/gray. Expandable rows show diff JSON in formatted view.

---

### PAGE 26: Notifications Panel

**Trigger:** Click bell icon in top bar.

**Layout:** Dropdown panel (400px wide, max 500px tall with scroll).

**Notification types:**
- "Post X foi aprovado por [Cliente]" — green dot
- "Novo comentario em Post X" — blue dot
- "[Cliente] pediu ajustes em Post X" — amber dot
- "Publicacao de Post X falhou" — red dot
- "Token do Instagram de @brand expira em 7 dias" — red dot

Each notification: icon + text + timestamp + unread dot. Click navigates to relevant post/page.

"Marcar todas como lidas" link at top. "Ver todas" link at bottom (goes to full notifications page).

---

## 5. Key Reusable Components

### 5.1 InstagramPreview

Pixel-accurate rendering of how a post will look on Instagram. Used in: caption editor, approver portal, grid planner, card detail.

**Variants:**
- **Feed post:** Profile pic (32px circle) + username + "..." menu → image (1:1 or 4:5 or 1.91:1) → action icons (heart, comment, share, save) → likes count → caption with "... mais" truncation at 125 chars → timestamp
- **Carousel:** Same as feed + slide indicator dots (1/10) + left/right arrows
- **Story:** Full 9:16 with top bar (profile pic + username + timestamp), progress bars, bottom reply input
- **Reel:** Full 9:16 with bottom overlay (username, caption, music), right sidebar (heart, comment, share)

### 5.2 PostCard (Kanban)

Used in: kanban board, calendar, copy inbox. Shows thumbnail, title, pillar badge, format icon, assignee, deadline, status.

### 5.3 BrandSelector

Dropdown in top bar. Shows brand logo + name + IG handle. "Todas as marcas" option for cross-brand views.

### 5.4 CommentThread

Used in: card detail panel, approver portal. Threaded comments with avatar, name, timestamp, body. Pin reference if applicable.

### 5.5 StageProgressBar

Horizontal stepper showing: Ideacao → Em criacao → Aprovacao → Agendado → Publicado. Current stage highlighted. Used in card detail.

### 5.6 MagicLinkBanner

Shown in approver portal. "Voce esta revisando como [Nome]. Este link expira em Xh." Subtle info banner.

---

## 6. Key Interactions & Micro-interactions

| Interaction | Where | Behavior |
|---|---|---|
| Drag-drop | Kanban, calendar, carousel slides, grid planner | Ghost card follows cursor, drop zone highlights, smooth transition animation |
| Swipe to confirm | Approver approve button | Slide thumb right to confirm (like iOS "slide to unlock") |
| Swipe carousel | Approver, IG preview | Horizontal swipe with momentum, snap to slides |
| Pin placement | Approver image tap | Ripple effect on tap, pin fades in with number |
| Version diff | Caption editor | Side-by-side with red/green highlighting (git-style) |
| Character counter | Caption editor | Smooth color transition: gray → amber (>80%) → red (>100%) |
| Auto-save | Caption editor, canvas | Subtle "Salvando..." → "Salvo" indicator in toolbar |
| Toast notifications | Global | Bottom-right, auto-dismiss 5s, stack up to 3 |
| Skeleton loading | All data views | Shimmer animation matching card/table shapes |
| Empty states | All lists/grids | Illustration + message + primary action CTA |

---

## 7. Empty States (important for first-use experience)

| Page | Empty State Message | CTA |
|---|---|---|
| Kanban | "Nenhum post ainda. Comece criando seu primeiro brief!" | "Criar brief" |
| Calendar | "Seu calendario esta vazio. Agende seu primeiro post!" | "Criar brief" |
| Copy inbox | "Nenhum texto para escrever. Aguarde um brief do estrategista." | — |
| Asset library | "Nenhum arquivo enviado. Comece enviando seus assets." | "Enviar arquivo" |
| Publish queue | "Nenhum post agendado. Aprove conteudo para comecar a agendar." | "Ver board" |
| Grid planner | "Nenhum post no grid. Agende posts para visualizar o perfil." | "Ver calendario" |
| Approver queue | "Tudo aprovado! Nenhum post pendente de revisao." | — |
| Team | "Voce e o unico membro. Convide sua equipe!" | "Convidar membro" |
| Audit log | "Nenhuma atividade registrada ainda." | — |

Each empty state should have a simple, friendly illustration (line-art style, using brand primary color).

---

## 8. Responsive Behavior Summary

| Breakpoint | Layout |
|---|---|
| < 640px (mobile) | Single column, bottom tab nav (5 items), drawers instead of side panels, stacked cards |
| 640–1024px (tablet) | Collapsed sidebar (icons only), 2-column grids, side panels overlay |
| 1024–1280px | Full sidebar, 3-column grids, side panels push content |
| > 1280px | Full sidebar + right detail panel visible simultaneously |

**Mobile-blocked pages:** Design Canvas (show message: "Use um computador para editar designs"), Admin settings.

**Mobile-optimized pages:** Approver portal (primary use case), Kanban (vertical scroll), Calendar (week view default).

---

## 9. Accessibility Requirements

- All interactive elements: keyboard navigable (tab order, Enter/Space activation)
- Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- All images: alt text
- Status colors: always paired with icon or text label (not color-only)
- Focus rings: visible, high-contrast
- Screen reader: proper heading hierarchy (h1-h6), ARIA labels on icon-only buttons
- Reduced motion: respect `prefers-reduced-motion`

---

## 10. Design Deliverables Checklist

When designing Crie, produce:

- [ ] **Light + Dark mode** for every screen
- [ ] **Mobile + Desktop** for responsive pages
- [ ] **Empty states** for every list/grid view
- [ ] **Loading states** (skeleton shimmer)
- [ ] **Error states** (failed publish, expired token, etc.)
- [ ] **Hover / Active / Focus / Disabled** states for interactive elements
- [ ] **Approver portal** in white-label variant (agency-branded)
- [ ] **Onboarding flow** (5 steps)
- [ ] All **6 role-specific panels** with their sub-pages
- [ ] **Component library** page showing all reusable components

---

## 11. Sitemap Summary (all routes)

```
/login
/signup
/forgot-password
/onboarding (5 steps)

/app/:agency/
  ├── (dashboard)
  ├── w/:workspace/
  │   ├── (kanban board)
  │   ├── strategist/
  │   │   ├── calendar
  │   │   ├── pillars
  │   │   ├── campaigns
  │   │   └── performance
  │   ├── copy/
  │   │   ├── (inbox)
  │   │   ├── write/:postCardId
  │   │   └── libraries (hooks, CTAs, hashtags)
  │   ├── design/
  │   │   ├── canvas/:postCardId
  │   │   ├── assets
  │   │   ├── templates
  │   │   └── brand-kit
  │   ├── publisher/
  │   │   ├── queue
  │   │   ├── calendar
  │   │   ├── grid
  │   │   └── settings
  │   ├── card/:id (detail modal)
  │   ├── brand (brand kit editor)
  │   └── members
  ├── admin/
  │   ├── (dashboard)
  │   ├── brands
  │   ├── team
  │   ├── approvers
  │   ├── billing
  │   ├── white-label
  │   ├── integrations
  │   └── audit
  └── notifications

/a/:magicLinkToken (approver portal — separate shell)
  ├── (queue)
  ├── post/:postCardId
  ├── history
  └── settings
```

---

*This document contains everything needed to design the complete Crie platform. All UI text should be in Brazilian Portuguese (pt-BR). When in doubt, prioritize the approver mobile experience — it's the core differentiator.*
