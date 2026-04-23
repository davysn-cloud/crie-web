import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { PostStage } from "@/lib/constants";

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-cards", variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["post-card", variables.cardId] });
      queryClient.invalidateQueries({ queryKey: ["stage-transitions", variables.cardId] });
    },
  });
}
