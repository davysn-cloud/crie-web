import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PostCard } from "@/types";

interface UseCalendarOptions {
  month: Date;
  pillarId?: string | null;
  status?: string | null;
  formatFilter?: string | null;
}

export function useCalendar({ month, pillarId, status, formatFilter }: UseCalendarOptions) {
  const { currentWorkspaceId } = useAuthStore();

  return useQuery({
    queryKey: ["calendar", currentWorkspaceId, format(month, "yyyy-MM"), pillarId, status, formatFilter],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];

      let query = supabase
        .from("post_cards")
        .select(
          `*,
          copy_versions(id, version, is_approved),
          asset_versions(id, version, thumbnail_url, is_approved)`
        )
        .eq("workspace_id", currentWorkspaceId)
        .eq("archived", false)
        .gte("scheduled_at", startOfMonth(month).toISOString())
        .lte("scheduled_at", endOfMonth(month).toISOString())
        .order("scheduled_at");

      if (status) {
        query = query.eq("stage", status);
      }

      if (formatFilter) {
        query = query.eq("post_type", formatFilter);
      }

      // TODO: pillar_id filter when column exists

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PostCard[];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });
}
