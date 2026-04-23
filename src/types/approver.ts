import { z } from "zod";

export interface Approver {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  notify_email: boolean;
  notify_whatsapp: boolean;
  notify_weekly_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface MagicLink {
  id: string;
  agency_id: string;
  workspace_id: string | null;
  approver_id: string | null;
  token_hash: string;
  purpose: "approval" | "portal_view";
  label: string;
  email: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface MagicLinkSession {
  magic_link_id: string;
  agency_id: string;
  workspace_id: string | null;
  approver_name: string;
  approver_email: string;
  agency_name: string;
  agency_logo_url: string | null;
  primary_color: string | null;
  workspaces: { id: string; name: string; logo_url: string | null }[];
}

export interface ApprovalRequest {
  id: string;
  post_card_id: string;
  requested_by: string;
  status: "pending" | "approved" | "changes_requested";
  created_at: string;
}

export interface ApprovalPin {
  id: string;
  post_card_id: string;
  magic_link_id: string | null;
  user_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  slide_index: number | null;
  reel_timestamp_s: number | null;
  created_at: string;
}

// Zod schemas for forms
export const approveSchema = z.object({
  magic_link_id: z.string().uuid(),
  post_card_id: z.string().uuid(),
});

export const requestChangesSchema = z.object({
  magic_link_id: z.string().uuid(),
  post_card_id: z.string().uuid(),
  reason: z.enum(["copy", "art", "timing", "other"]),
  note: z.string().max(500).optional(),
});

export const approverCommentSchema = z.object({
  magic_link_id: z.string().uuid(),
  post_card_id: z.string().uuid(),
  body: z.string().min(1).max(2000),
  pin_x: z.number().min(0).max(100).nullable(),
  pin_y: z.number().min(0).max(100).nullable(),
  slide_index: z.number().int().min(1).max(10).nullable(),
});

export type ApproveInput = z.infer<typeof approveSchema>;
export type RequestChangesInput = z.infer<typeof requestChangesSchema>;
export type ApproverCommentInput = z.infer<typeof approverCommentSchema>;
