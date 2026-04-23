import { z } from "zod";
import type { PublishStatus } from "@/lib/constants";

export interface PublishQueueItem {
  id: string;
  post_card_id: string;
  workspace_id: string;
  scheduled_at: string;
  status: PublishStatus;
  error_message: string | null;
  retry_count: number;
  ig_media_id: string | null;
  published_url: string | null;
  first_comment: string | null;
  cross_post_fb: boolean;
  cross_post_story: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  post_card?: {
    id: string;
    title: string;
    post_type: string | null;
    asset_versions?: { thumbnail_url: string | null; file_url: string }[];
    copy_versions?: { body: string; caption: string | null }[];
  };
}

export interface MetaConnection {
  id: string;
  workspace_id: string;
  ig_business_account_id: string;
  fb_page_id: string;
  expires_at: string;
  status: "active" | "expiring" | "expired";
  created_at: string;
}

// Zod schemas
export const schedulePostSchema = z.object({
  post_card_id: z.string().uuid(),
  scheduled_at: z.coerce.date().refine(
    (d) => d > new Date(Date.now() + 15 * 60_000),
    "Deve ser pelo menos 15 minutos no futuro"
  ),
  first_comment: z.string().max(2200).optional(),
  cross_post_fb: z.boolean().default(false),
  cross_post_story: z.boolean().default(false),
});

export type SchedulePostInput = z.infer<typeof schedulePostSchema>;
