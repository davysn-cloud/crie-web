import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PostType } from "@/lib/constants";

interface CreateCardParams {
  workspaceId: string;
  title: string;
  postType?: PostType;
  userId: string;
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, title, postType, userId }: CreateCardParams) => {
      const { data, error } = await supabase
        .from("post_cards")
        .insert({
          workspace_id: workspaceId,
          title,
          post_type: postType ?? null,
          stage: "ideia",
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-cards", variables.workspaceId] });
    },
  });
}
