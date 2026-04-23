import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

interface CopyDraftState {
  body: string;
  caption: string | null;
  hashtags: string[];
  firstComment: string;
}

export function useCopyDraft(postCardId: string | null) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch latest copy version
  const { data: latestVersion } = useQuery({
    queryKey: ["copy-version-latest", postCardId],
    queryFn: async () => {
      if (!postCardId) return null;
      const { data, error } = await supabase
        .from("copy_versions")
        .select("*")
        .eq("post_card_id", postCardId)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!postCardId,
  });

  // Save new version mutation
  const saveMutation = useMutation({
    mutationFn: async (draft: CopyDraftState) => {
      if (!postCardId || !user) throw new Error("Missing context");

      const nextVersion = (latestVersion?.version ?? 0) + 1;

      const { error } = await supabase.from("copy_versions").insert({
        post_card_id: postCardId,
        version: nextVersion,
        body: draft.body,
        caption: draft.caption,
        hashtags: draft.hashtags,
        is_approved: false,
        created_by: user.id,
        ai_generated: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["copy-version-latest", postCardId] });
      queryClient.invalidateQueries({ queryKey: ["post-cards"] });
    },
    onError: () => {
      toast.error("Erro ao salvar. Tente novamente.");
    },
  });

  // Auto-save with debounce
  const autoSave = useCallback(
    (draft: CopyDraftState) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveMutation.mutate(draft);
      }, 2000);
    },
    [saveMutation]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Request approval mutation
  const requestApproval = useMutation({
    mutationFn: async () => {
      if (!postCardId) throw new Error("No post card");

      const { error } = await supabase
        .from("post_cards")
        .update({ stage: "aprovacao_copy" })
        .eq("id", postCardId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aprovacao solicitada");
      queryClient.invalidateQueries({ queryKey: ["post-cards"] });
    },
    onError: () => {
      toast.error("Erro ao solicitar aprovacao");
    },
  });

  return {
    latestVersion,
    save: saveMutation.mutate,
    autoSave,
    isSaving: saveMutation.isPending,
    requestApproval: requestApproval.mutate,
    isRequestingApproval: requestApproval.isPending,
  };
}
