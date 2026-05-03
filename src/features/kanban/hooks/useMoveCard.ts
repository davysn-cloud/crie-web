import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PostStage } from "@/lib/constants";
import type { PostCard } from "@/types";

interface MoveCardParams {
  cardId: string;
  fromStage?: PostStage;
  newStage: PostStage;
  workspaceId: string;
  userId: string;
}

export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, fromStage, newStage, userId }: MoveCardParams) => {
      const { error } = await supabase
        .from("post_cards")
        .update({ stage: newStage })
        .eq("id", cardId);

      if (error) throw error;

      // Registrar transição no audit log
      await supabase.from("stage_transitions").insert({
        post_card_id: cardId,
        from_stage: fromStage ?? null,
        to_stage: newStage,
        triggered_by: userId,
      });
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["post-cards", variables.workspaceId] });

      // Snapshot previous data
      const previousCards = queryClient.getQueryData<PostCard[]>(["post-cards", variables.workspaceId]);

      // Optimistically update the card's stage in cache
      if (previousCards) {
        queryClient.setQueryData<PostCard[]>(
          ["post-cards", variables.workspaceId],
          previousCards.map((card) =>
            card.id === variables.cardId
              ? { ...card, stage: variables.newStage }
              : card
          )
        );
      }

      return { previousCards };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousCards) {
        queryClient.setQueryData(["post-cards", variables.workspaceId], context.previousCards);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-cards", variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["post-card", variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ["stage-transitions", variables.cardId] });
    },
  });
}
