export interface Comment {
  id: string;
  target_type: "card" | "copy_version" | "asset_version";
  target_id: string;
  parent_id: string | null;
  body: string;
  pin_x: number | null;
  pin_y: number | null;
  author_id: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  author_name?: string;
  replies?: Comment[];
}

export interface StageTransition {
  id: string;
  post_card_id: string;
  from_stage: string | null;
  to_stage: string;
  triggered_by: string;
  note: string | null;
  created_at: string;
  // Joined
  triggered_by_name?: string;
}
