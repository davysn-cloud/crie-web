import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useApproverStore } from "@/stores/useApproverStore";
import type { PostCard } from "@/types";

export function useApprovalQueue() {
  const session = useApproverStore((s) => s.session);

  return useQuery({
    queryKey: ["approval-queue", session?.magic_link_id],
    queryFn: async () => {
      if (!session) return [];

      // Fetch posts pending approval for this magic link's workspaces
      const workspaceIds = session.workspaces.map((w) => w.id);

      const { data, error } = await supabase
        .from("post_cards")
        .select(
          `*,
          copy_versions(id, version, body, caption, is_approved, created_at),
          asset_versions(id, version, file_url, thumbnail_url, is_approved, created_at)`
        )
        .in("workspace_id", workspaceIds)
        .in("stage", ["aprovacao_copy", "aprovacao_arte"])
        .eq("archived", false)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PostCard[];
    },
    enabled: !!session,
    staleTime: 30_000,
  });
}
