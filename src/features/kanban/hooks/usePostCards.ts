import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PostCard } from "@/types";

export function usePostCards(workspaceId: string | null) {
  return useQuery({
    queryKey: ["post-cards", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from("post_cards")
        .select(
          `*,
          copy_versions(id, version, is_approved, created_at),
          asset_versions(id, version, is_approved, thumbnail_url, created_at),
          briefs(assignee_copy, assignee_design)`,
        )
        .eq("workspace_id", workspaceId)
        .eq("archived", false)
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PostCard[];
    },
    enabled: !!workspaceId,
  });
}
