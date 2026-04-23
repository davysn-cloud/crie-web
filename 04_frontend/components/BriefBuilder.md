---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — BriefBuilder

Modal/drawer com form estruturado para criar ou editar um brief de post. Usado em [[../screens/panel-estrategista]] (ao clicar em slot vazio) e acessível pelo admin/estrategista em outros painéis via `?brief=<postCardId|new>`.

## API proposta
```tsx
type BriefBuilderProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  workspaceId: string;
  initialValues?: Partial<BriefFormValues>; // preenchimento pré (duplicar, slot de calendário, etc.)
  onSubmit: (brief: BriefFormValues) => Promise<void>;
  campaigns: Campaign[];
  pillars: Pillar[];
  hashtagSets: HashtagSet[];
  members: WorkspaceMember[];
};
```

## Schema Zod (canônico)
```ts
export const briefSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(3, "Mínimo 3 caracteres").max(120),
  objective: z.enum(["awareness", "consideration", "conversion"]),
  pillar_id: z.string().uuid(),
  post_type: z.enum([
    "feed_1x1", "feed_4x5", "feed_1.91x1",
    "story", "reel",
    "carousel_1x1", "carousel_4x5",
  ]),
  target_audience: z.string().min(10).max(500),
  key_message: z.string().min(10).max(500),
  cta: z.string().min(2).max(80),
  references: z.array(z.object({
    kind: z.enum(["url", "upload"]),
    value: z.string(),
    label: z.string().optional(),
  })).max(10),
  deadline: z.coerce.date(),
  scheduled_at: z.coerce.date().optional(),
  campaign_id: z.string().uuid().nullable(),
  copywriter_id: z.string().uuid().nullable(),
  designer_id: z.string().uuid().nullable(),
  hashtag_set_id: z.string().uuid().nullable(),
}).refine(d => !d.scheduled_at || d.scheduled_at >= d.deadline,
  { message: "Agendamento deve ser >= prazo", path: ["scheduled_at"] });

export type BriefFormValues = z.infer<typeof briefSchema>;
```

## Layout ASCII — drawer (desktop)
```
┌──────────────────────────────────────────────────────┐
│ Novo brief                                    [X]    │
├──────────────────────────────────────────────────────┤
│ Seção 1 — Objetivo (accordion aberto)                │
│  · Título: [_______________________________]          │
│  · Objetivo: ( ) Awareness ( ) Considera. ( ) Conv.   │
│  · Pilar: [Educativo ▾]  [cor pillar-2 preview]      │
│  · Campanha: [Nenhuma ▾]                              │
│                                                       │
│ Seção 2 — Formato (accordion)                         │
│  · Formato: [Feed 4:5 ▾] ícones IG                   │
│                                                       │
│ Seção 3 — Conteúdo                                    │
│  · Audiência: [textarea 500 chars]                    │
│  · Mensagem-chave: [textarea 500]                     │
│  · CTA: [________________________]                    │
│                                                       │
│ Seção 4 — Referências                                 │
│  [+ URL] [+ Upload]  lista:                           │
│   · ref 1 · ref 2 · ref 3                             │
│                                                       │
│ Seção 5 — Timeline e time                             │
│  · Prazo entrega: [📅 date picker]                    │
│  · Data publicação: [📅 date picker] (optional)       │
│  · Copywriter: [avatar ▾]                             │
│  · Designer: [avatar ▾]                               │
│  · Hashtag set sugerido: [▾ "Educativo 20-25"]        │
├──────────────────────────────────────────────────────┤
│ [Cancelar]                        [Salvar rascunho]   │
│                                   [Criar brief + handoff]│
└──────────────────────────────────────────────────────┘
```

## Comportamentos
- **Form multi-step** implícito via `accordion` (seções), mas submit é atômico — usuário pode preencher em qualquer ordem.
- **Draft autosave** (Zustand+persist) enquanto editando — chave `brief-draft:<workspaceId>:<postCardId|new>`.
- **Validação progressiva** — campos com erro ganham destaque quando tocados (`useForm({ mode: "onTouched" })`).
- **Handoff automático** ao criar: cria `post_cards.stage = 'briefing'` + notifica `copywriter_id` (via realtime ou e-mail) + cria `copy_versions` vazio.
- **Slot pré-preenchido** — se vem de calendário, `scheduled_at` pré-preenchido e editável.
- **Sugestão de hashtag set** — quando pilar é selecionado, `hashtag_set_id` sugere o set mais usado pra esse pilar.
- **Preview do briefing-card** — sidebar direita (em desktop >1280px) mostra como o card vai aparecer no kanban do copywriter.

## Comportamento mobile
`Dialog` full-screen com scroll vertical; botões sticky bottom.

## Acessibilidade
- Cada seção accordion tem `<h3>` com `aria-level`.
- Campos com `aria-describedby` para mensagens de erro.
- Foco vai para o primeiro campo vazio ao abrir.
- `Esc` fecha com confirmação se houver mudanças não salvas.

## Performance
- Lazy load de `members`, `pillars`, `campaigns`, `hashtagSets` (são queries independentes).
- Debounce 500ms no título (autosave).
- `isDirty` check pelo `useFormState`.

## Onde será implementado
`src/features/strategist/components/BriefBuilder.tsx` (mas exportado de `src/components/brief/` para reuso em outros painéis se necessário).
Subcomponentes:
- `./sections/ObjectiveSection.tsx`
- `./sections/FormatSection.tsx`
- `./sections/ContentSection.tsx`
- `./sections/ReferencesSection.tsx`
- `./sections/TimelineSection.tsx`
- `./BriefPreviewSide.tsx`

## Dependências
- `react-hook-form`, `@hookform/resolvers/zod`, `zod` (já instalados)
- shadcn `Dialog`, `Sheet`, `accordion` (novo), `calendar` (novo), `select`, `radio-group` (novo)
- [[BrandKitLockedPicker]] (para ver cor do pilar)
- `src/features/strategist/hooks/usePillars`, `useCampaigns`, `useHashtagSets`

## Testes
- Validação de campos obrigatórios.
- Draft autosave + recover em reload.
- Submissão cria post_cards + copy_versions.
- Slot pré-preenchido mantém data.

## Fora de escopo
- Geração do brief por IA (fase 2).
- Dependência entre briefs (um brief filho de outro).
- Custom fields por marca.
