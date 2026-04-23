import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types/comments";

export function useComments(targetType: Comment["target_type"], targetId: string) {
  return useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!targetId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      targetType: Comment["target_type"];
      targetId: string;
      body: string;
      parentId?: string;
      pinX?: number;
      pinY?: number;
      authorId: string;
    }) => {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          target_type: params.targetType,
          target_id: params.targetId,
          body: params.body,
          parent_id: params.parentId ?? null,
          pin_x: params.pinX ?? null,
          pin_y: params.pinY ?? null,
          author_id: params.authorId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.targetType, variables.targetId],
      });
    },
  });
}

export function useResolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { commentId: string; resolved: boolean }) => {
      const { error } = await supabase
        .from("comments")
        .update({ resolved: params.resolved })
        .eq("id", params.commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}
