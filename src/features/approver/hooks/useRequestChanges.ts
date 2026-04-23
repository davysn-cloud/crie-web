import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useApproverStore } from "@/stores/useApproverStore";
import type { RequestChangesInput } from "@/types/approver";

export function useRequestChanges() {
  const queryClient = useQueryClient();
  const session = useApproverStore((s) => s.session);

  return useMutation({
    mutationFn: async (input: Omit<RequestChangesInput, "magic_link_id">) => {
      if (!session) throw new Error("Sessao invalida");

      const { data, error } = await supabase.functions.invoke("magic-link", {
        body: {
          action: "request_changes",
          magic_link_id: session.magic_link_id,
          post_card_id: input.post_card_id,
          reason: input.reason,
          note: input.note,
        },
      });

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["approval-queue", session?.magic_link_id] });
      const prev = queryClient.getQueryData(["approval-queue", session?.magic_link_id]);
      queryClient.setQueryData(
        ["approval-queue", session?.magic_link_id],
        (old: unknown) => ((old as unknown[] | undefined) ?? []).filter((c: any) => c.id !== input.post_card_id)
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["approval-queue", session?.magic_link_id], context.prev);
      }
      toast.error("Falha ao solicitar ajuste. Tente novamente.");
    },
    onSuccess: () => {
      toast.success("Ajuste solicitado com sucesso");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-queue", session?.magic_link_id] });
    },
  });
}
