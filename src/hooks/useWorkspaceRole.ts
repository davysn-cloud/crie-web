import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { WorkspaceRole } from "@/lib/constants";

export function useWorkspaceRole() {
  const { currentWorkspaceId, user } = useAuthStore();

  return useQuery({
    queryKey: ["workspace-role", currentWorkspaceId, user?.id],
    queryFn: async () => {
      if (!currentWorkspaceId || !user) return null;

      const { data, error } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", currentWorkspaceId)
        .eq("user_id", user.id)
        .single();

      if (error) return null;
      return (data?.role ?? null) as WorkspaceRole | null;
    },
    enabled: !!currentWorkspaceId && !!user,
  });
}
