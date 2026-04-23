---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — BrandKitLockedPicker

Color / font / logo picker travado no brand kit da marca, para preservar identidade visual. Usado no canvas do designer ([[../screens/panel-designer]]), no gestor de pilares ([[../screens/panel-estrategista]]) e em qualquer lugar onde cor/fonte da marca seja escolhida.

## API proposta
```tsx
type BrandKit = {
  colors: Array<{ hex: string; name: string; usage?: string }>;
  fonts: Array<{ family: string; weight: string; url?: string; usage?: string }>;
  logos: Array<{ kind: "horizontal"|"icon"|"monochrome"; url: string; minPadding?: number }>;
};

type ColorPickerProps = {
  brandKit: BrandKit;
  value: string | null;              // hex
  onChange: (hex: string) => void;
  allowCustom?: boolean;             // default false
  onCustomJustify?: (hex: string, reason: string) => void; // obrigatório quando allowCustom + custom escolhido
  label?: string;
};

type FontPickerProps = {
  brandKit: BrandKit;
  value: { family: string; weight: string } | null;
  onChange: (v: { family: string; weight: string }) => void;
  showPreview?: boolean;
};

type LogoPickerProps = {
  brandKit: BrandKit;
  value: string | null;              // logo url
  onChange: (url: string) => void;
};
```

## Layout ASCII — color picker
```
┌──────────────────────────────────┐
│ Cor da marca            [🔒 travado]│
├──────────────────────────────────┤
│ Paleta:                           │
│ ▇ #1A1A1A  Título                │ cada swatch mostra name + usage
│ ▇ #FF4500  Destaque              │
│ ▇ #F5F5F5  Fundo                 │
│ ▇ #2E8B57  Secundária            │
│                                   │
│ ─────────────────────              │
│ [ ] Usar cor custom               │ collapsed by default
│                                   │
│ (se marcado):                     │
│  #_______ (hex input)             │
│  Justifique:                      │
│  [textarea — obrigatório]          │
│  [Salvar (loga no audit)]         │
└──────────────────────────────────┘
```

## Layout — font picker
```
┌──────────────────────────────────┐
│ Fonte da marca             [🔒]  │
├──────────────────────────────────┤
│ Opções:                           │
│ ● Inter - 700    [preview: Aa]   │
│ ○ Inter - 400    [preview: Aa]   │
│ ○ Playfair - 700 [preview: Aa]   │
└──────────────────────────────────┘
```

## Layout — logo picker
```
┌──────────────────────────────────┐
│ Variação do logo                  │
├──────────────────────────────────┤
│ [▭ horizontal*] [○ ícone] [● mono]│
│                                   │
│   [preview grande do logo]        │
│   min padding: 20px               │
└──────────────────────────────────┘
```

## Comportamentos
- **Locked por padrão** — só mostra cores/fontes/logos do `brandKit`.
- **Custom com justificativa** — `allowCustom=true` adiciona checkbox "usar cor custom" → abre hex input + textarea de justificativa (obrigatória). Ao salvar, chama `onCustomJustify(hex, reason)` → backend registra no `audit_log` com `target_type="brand_lock_override"`.
- **Admin pode desabilitar custom completamente** — prop `allowCustom={false}` esconde opção.
- **Preview live** — font picker mostra "Aa" com a fonte carregada (preload via `FontFace` API se `url` fornecido).
- **Swatches com `usage`** — tooltip mostra para que a cor é usada ("Título", "CTA", "Fundo").
- **Fonts não carregadas** — mostra skeleton swatch com nome da família + weight até fonte carregar.

## Acessibilidade
- Cada swatch = `<button>` com `aria-label="Cor {name}, {hex}"`.
- Contraste do swatch com borda >= 3:1 (mesmo em cores claras).
- Ícone 🔒 tem `title="Travado ao brand kit"`.
- Textarea de justificativa é `aria-required="true"`.
- Atalho teclado: arrow para navegar entre swatches.

## Performance
- Preload de fonts via `<link rel="preload" as="font">` no root da app se `brandKit.fonts[].url` presente.
- Popover mount-on-demand.

## Onde será implementado
`src/components/brand-kit/` (shared).
- `./ColorLockedPicker.tsx`
- `./FontLockedPicker.tsx`
- `./LogoLockedPicker.tsx`
- `./useBrandLockOverride.ts` — chama `onCustomJustify` + mostra confirm dialog.

## Dependências
- shadcn `Popover`, `Textarea`, `Checkbox`, `RadioGroup`, `Tooltip`.
- `src/types/index.ts` já tem `BrandColor`, `BrandFont` — estender com `usage` + adicionar `BrandLogo`.
- `src/features/brand/BrandProfilePage.tsx` — já existe editor; reusa o mesmo `brand_profiles` table.

## Integração backend
- Lê `brand_profiles` via `useBrandKit(workspaceId)` hook existente.
- Override custom registra em `audit_log` com context: `{ hex, reason, post_card_id?, asset_version_id? }`.

## Fora de escopo
- Auto-detecção de cor de imagem (sugerir cor dominante).
- Troca automática de fontes se não licenciada (WOFF2 hosted).
- Dark mode variations do logo (fase 2).
