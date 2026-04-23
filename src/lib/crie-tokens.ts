/** Crie! design tokens — centralised so theming flows cleanly. */
export const CRIE = {
  // Warm neutrals
  bg: "#F3F1EB",
  paper: "#FAF8F3",
  card: "#FFFFFF",
  ink: "#0E0E0C",
  inkSoft: "#2A2A26",
  muted: "#8B8B82",
  mutedSoft: "#B8B6AC",
  line: "#ECE9DF",
  lineSoft: "#F2EFE5",

  // Butter accent — the signature pastel yellow
  butter: "#EEF0A8",
  butterDeep: "#D9DD6E",
  butterInk: "#6B6E1F",
  butterWash: "#F6F7C9",

  // Status pillars (per brief)
  violet: "#8B5CF6",
  sky: "#0EA5E9",
  emerald: "#10B981",
  rose: "#F43F5E",
  amber: "#F59E0B",

  // Workflow stage colors
  stageIdea: "#94A3B8",
  stageCreate: "#3B82F6",
  stageApp: "#F59E0B",
  stageSched: "#06B6D4",
  stagePub: "#22C55E",
  stageFail: "#EF4444",
} as const;

export const STAGE_COLORS = {
  ideacao: { bg: "#F1F5F9", dot: "#94A3B8", label: "Ideação" },
  criacao: { bg: "#EFF6FF", dot: "#3B82F6", label: "Em criação" },
  aprovacao: { bg: "#FFFBEB", dot: "#F59E0B", label: "Aprovação" },
  agendado: { bg: "#ECFEFF", dot: "#06B6D4", label: "Agendado" },
  publicado: { bg: "#F0FDF4", dot: "#22C55E", label: "Publicado" },
} as const;

export type PostStage = keyof typeof STAGE_COLORS;

export const PILLAR_COLORS: Record<string, string> = {
  Educativo: "#8B5CF6",
  Inspiração: "#0EA5E9",
  Promocional: "#F43F5E",
  Bastidores: "#10B981",
  Datas: "#F59E0B",
};

export const ROLE_META: Record<string, { color: string; bg: string }> = {
  Admin: { color: "#64748B", bg: "#F1F5F9" },
  Estrategista: { color: "#7C3AED", bg: "#F5F3FF" },
  Copywriter: { color: "#2563EB", bg: "#EFF6FF" },
  Designer: { color: "#DB2777", bg: "#FDF2F8" },
  "Social Media": { color: "#0891B2", bg: "#ECFEFF" },
};

export const STATUS_META = {
  publicado: { label: "Publicado", color: "#22C55E", bg: "#F0FDF4" },
  agendado: { label: "Agendado", color: "#06B6D4", bg: "#ECFEFF" },
  falhou: { label: "Falhou", color: "#EF4444", bg: "#FEF2F2" },
} as const;

export const BRANDS_LIST = [
  { id: "cafebonito", name: "Café Bonito", handle: "@cafebonito", color: "#EEF0A8" },
  { id: "modazen", name: "Moda Zen", handle: "@modazen", color: "#C6D3A3" },
  { id: "viververde", name: "Viver Verde", handle: "@viververde", color: "#B8C0E0" },
  { id: "padariaestrela", name: "Padaria Estrela", handle: "@padariaestrela", color: "#F0C9CC" },
] as const;

export type BrandId = (typeof BRANDS_LIST)[number]["id"];
