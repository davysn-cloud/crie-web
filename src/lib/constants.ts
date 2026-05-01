export const POST_STAGES = [
  { value: "ideia", label: "Ideia", color: "bg-purple-100 text-purple-800" },
  { value: "briefing", label: "Briefing", color: "bg-blue-100 text-blue-800" },
  { value: "copy", label: "Copy", color: "bg-yellow-100 text-yellow-800" },
  { value: "aprovacao_copy", label: "Aprovação de Copy", color: "bg-orange-100 text-orange-800" },
  { value: "design", label: "Design", color: "bg-pink-100 text-pink-800" },
  { value: "aprovacao_arte", label: "Aprovação de Arte", color: "bg-red-100 text-red-800" },
  { value: "agendado", label: "Agendado", color: "bg-cyan-100 text-cyan-800" },
  { value: "publicado", label: "Publicado", color: "bg-green-100 text-green-800" },
] as const;

export type PostStage = (typeof POST_STAGES)[number]["value"];

export const WORKSPACE_ROLES = [
  { value: "owner", label: "Dono" },
  { value: "strategist", label: "Estrategista" },
  { value: "copywriter", label: "Copywriter" },
  { value: "designer", label: "Designer" },
  { value: "social_media", label: "Social Media" },
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number]["value"];

export const POST_TYPES = [
  { value: "feed", label: "Feed" },
  { value: "story", label: "Story" },
  { value: "reels", label: "Reels" },
  { value: "carrossel", label: "Carrossel" },
] as const;

export type PostType = (typeof POST_TYPES)[number]["value"];

/** Extended IG format types used in designer/publisher panels */
export const IG_FORMAT_TYPES = [
  { value: "feed_1_1", label: "Feed 1:1" },
  { value: "feed_4_5", label: "Feed 4:5" },
  { value: "feed_1_91_1", label: "Feed 1.91:1" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carrossel" },
] as const;

export type IGFormatType = (typeof IG_FORMAT_TYPES)[number]["value"];

/** Publish queue statuses */
export const PUBLISH_STATUSES = [
  { value: "queued", label: "Na fila", color: "bg-gray-100 text-gray-800" },
  { value: "scheduled", label: "Agendado", color: "bg-cyan-100 text-cyan-800" },
  { value: "publishing", label: "Publicando", color: "bg-purple-100 text-purple-800" },
  { value: "published", label: "Publicado", color: "bg-blue-100 text-blue-800" },
  { value: "failed", label: "Falhou", color: "bg-red-100 text-red-800" },
] as const;

export type PublishStatus = (typeof PUBLISH_STATUSES)[number]["value"];

/** Brief objectives */
export const BRIEF_OBJECTIVES = [
  { value: "awareness", label: "Awareness" },
  { value: "consideration", label: "Consideração" },
  { value: "conversion", label: "Conversão" },
] as const;

export type BriefObjective = (typeof BRIEF_OBJECTIVES)[number]["value"];
