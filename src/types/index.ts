import type { PostStage, WorkspaceRole, PostType } from "@/lib/constants";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  seat_limit: number;
  created_at: string;
  updated_at: string;
}

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  invited_email: string | null;
  accepted_at: string | null;
  /** Agency-level role. Optional — column added in migration 00019. */
  role?: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  agency_id: string;
  name: string;
  slug: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface BrandProfile {
  id: string;
  workspace_id: string;
  brand_name: string | null;
  tone_of_voice: string | null;
  target_audience: string | null;
  do_not_say: string[];
  keywords: string[];
  colors: BrandColor[];
  fonts: BrandFont[];
  moodboard_urls: string[];
  logo_url: string | null;
  extra_guidelines: string | null;
  instagram_handle: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandColor {
  hex: string;
  name: string;
  usage?: string;
}

export interface BrandFont {
  family: string;
  weight: string;
  usage?: string;
}

export interface PostCard {
  id: string;
  workspace_id: string;
  title: string;
  stage: PostStage;
  post_type: PostType | null;
  scheduled_at: string | null;
  published_at: string | null;
  published_url: string | null;
  ig_media_id: string | null;
  assigned_to: string | null;
  created_by: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  // Joined relations
  copy_versions?: CopyVersion[];
  asset_versions?: AssetVersion[];
}

export interface CopyVersion {
  id: string;
  post_card_id: string;
  version: number;
  body: string;
  caption: string | null;
  hashtags: string[];
  is_approved: boolean;
  approved_by: string | null;
  created_by: string;
  ai_generated: boolean;
  created_at: string;
}

export interface AssetVersion {
  id: string;
  post_card_id: string;
  version: number;
  file_url: string;
  file_type: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  is_approved: boolean;
  approved_by: string | null;
  created_by: string;
  created_at: string;
}
