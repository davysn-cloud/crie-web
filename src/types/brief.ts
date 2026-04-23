import { z } from "zod";

export interface Brief {
  id: string;
  workspace_id: string;
  post_card_id: string | null;
  title: string;
  objective: "awareness" | "consideration" | "conversion";
  pillar_id: string | null;
  post_type: string;
  target_audience: string;
  key_message: string;
  cta: string;
  references: { kind: "url" | "upload"; value: string }[];
  deadline: string;
  scheduled_at: string | null;
  campaign_id: string | null;
  copywriter_id: string | null;
  designer_id: string | null;
  hashtag_set_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Pillar {
  id: string;
  workspace_id: string;
  name: string;
  color_token: string;
  target_percent: number;
  description: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  goal: string | null;
  pillar_id: string | null;
  created_at: string;
}

// Zod schemas
export const briefSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().min(3).max(120),
  objective: z.enum(["awareness", "consideration", "conversion"]),
  pillar_id: z.string().uuid().nullable(),
  post_type: z.enum(["feed_1x1", "feed_4x5", "feed_1_91x1", "story", "reel", "carousel"]),
  target_audience: z.string().min(10).max(500),
  key_message: z.string().min(10).max(500),
  cta: z.string().min(2).max(80),
  references: z.array(z.object({ kind: z.enum(["url", "upload"]), value: z.string() })).max(10),
  deadline: z.coerce.date(),
  scheduled_at: z.coerce.date().optional().nullable(),
  campaign_id: z.string().uuid().nullable().optional(),
  copywriter_id: z.string().uuid().nullable().optional(),
  designer_id: z.string().uuid().nullable().optional(),
  hashtag_set_id: z.string().uuid().nullable().optional(),
});

export type BriefInput = z.infer<typeof briefSchema>;

export const pillarSchema = z.object({
  name: z.string().min(2).max(40),
  color_token: z.enum(["pillar-1", "pillar-2", "pillar-3", "pillar-4", "pillar-5"]),
  target_percent: z.number().min(0).max(100),
  description: z.string().max(200).optional(),
});

export type PillarInput = z.infer<typeof pillarSchema>;
