import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useApproverStore } from "@/stores/useApproverStore";

interface ApproveParams {
  postCardId: string;
}

export function useApprove() {
  const queryClient = useQueryClient();
  const session = useApproverStore((s) => s.session);

  return useMutation({
    mutationFn: async ({ postCardId }: ApproveParams) => {
      if (!session) throw new Error("Sessao invalida");

      const { data, error } = await supabase.functions.invoke("magic-link", {
        body: {
          action: "approve",
          magic_link_id: session.magic_link_id,
          post_card_id: postCardId,
        },
      });

      if (error) throw error;
      return data;
    },
    onMutate: async ({ postCardId }) => {
      // Optimistic: remove from queue
      await queryClient.cancelQueries({ queryKey: ["approval-queue", session?.magic_link_id] });
      const prev = queryClient.getQueryData(["approval-queue", session?.magic_link_id]);
      queryClient.setQueryData(
        ["approval-queue", session?.magic_link_id],
        (old: unknown) => ((old as unknown[] | undefined) ?? []).filter((c: any) => c.id !== postCardId)
      );
      return { prev };
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["approval-queue", session?.magic_link_id], context.prev);
      }
      const isNetwork = err instanceof TypeError || (err as any)?.message?.includes("fetch");
      const isPermission = (err as any)?.status === 403 || (err as any)?.message?.includes("permiss");
      if (isPermission) {
        toast.error("Sem permissao para aprovar este post.");
      } else if (isNetwork) {
        toast.error("Erro de conexao. Verifique sua internet e tente novamente.");
      } else {
        toast.error("Falha ao aprovar. Tente novamente.");
      }
    },
    onSuccess: () => {
      toast.success("Post aprovado!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-queue", session?.magic_link_id] });
    },
  });
}
