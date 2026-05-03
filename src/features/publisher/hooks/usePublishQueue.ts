import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PublishQueueItem, SchedulePostInput } from "@/types/publisher";

export function usePublishQueue() {
  const { currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  // Realtime subscription for status changes
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const channel = supabase
      .channel(`publish-queue:${currentWorkspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "publish_queue",
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["publish-queue", currentWorkspaceId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, queryClient]);

  return useQuery({
    queryKey: ["publish-queue", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];

      const { data, error } = await supabase
        .from("publish_queue")
        .select(
          `*,
          post_card:post_cards(
            id, title, post_type,
            asset_versions(thumbnail_url, file_url),
            copy_versions(body, caption)
          )`
        )
        .eq("workspace_id", currentWorkspaceId)
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as PublishQueueItem[];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useSchedulePost() {
  const { currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SchedulePostInput) => {
      const { data, error } = await supabase.functions.invoke("publish", {
        body: {
          action: "enqueue",
          post_card_id: input.post_card_id,
          scheduled_at: input.scheduled_at.toISOString(),
          first_comment: input.first_comment ?? null,
          cross_post_fb: input.cross_post_fb,
          cross_post_story: input.cross_post_story,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Post agendado");
      queryClient.invalidateQueries({ queryKey: ["publish-queue", currentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["post-cards", currentWorkspaceId] });
    },
    onError: (err) => {
      toast.error(`Erro ao agendar: ${err instanceof Error ? err.message : "Erro"}`);
    },
  });
}

export function useRetryPublish() {
  const { currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (queueItemId: string) => {
      const { error } = await supabase
        .from("publish_queue")
        .update({ status: "queued", error_message: null })
        .eq("id", queueItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tentativa de publicacao reagendada");
      queryClient.invalidateQueries({ queryKey: ["publish-queue", currentWorkspaceId] });
    },
    onError: () => {
      toast.error("Erro ao reagendar");
    },
  });
}
