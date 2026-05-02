import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Workspace } from "@/types";

export function useBrands() {
  const { currentAgencyId } = useAuthStore();

  return useQuery({
    queryKey: ["brands", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];

      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("agency_id", currentAgencyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Workspace[];
    },
    enabled: !!currentAgencyId,
  });
}

export function useCreateBrand() {
  const { currentAgencyId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; slug: string; colors?: { hex: string; name: string }[]; logo_url?: string }) => {
      if (!currentAgencyId) throw new Error("No agency");

      // Create workspace (brand)
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          agency_id: currentAgencyId,
          name: input.name,
          slug: input.slug,
        })
        .select("id")
        .single();

      if (wsError) throw wsError;

      // Create brand profile
      if (input.colors || input.logo_url) {
        await supabase.from("brand_profiles").insert({
          workspace_id: workspace.id,
          brand_name: input.name,
          colors: input.colors ?? [],
          fonts: [],
          moodboard_urls: [],
          do_not_say: [],
          keywords: [],
          logo_url: input.logo_url ?? null,
        });
      }

      return workspace;
    },
    onSuccess: () => {
      toast.success("Marca criada");
      queryClient.invalidateQueries({ queryKey: ["brands", currentAgencyId] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      // Atualiza o dropdown de marcas no header
      if (currentAgencyId) {
        useAuthStore.getState().fetchWorkspaces(currentAgencyId).catch(() => {});
      }
    },
    onError: (err) => {
      toast.error(`Erro: ${err instanceof Error ? err.message : "Erro ao criar marca"}`);
    },
  });
}

export function useArchiveBrand() {
  const { currentAgencyId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const { error } = await supabase
        .from("workspaces")
        .update({ archived: true })
        .eq("id", workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marca arquivada");
      queryClient.invalidateQueries({ queryKey: ["brands", currentAgencyId] });
    },
    onError: () => {
      toast.error("Erro ao arquivar marca");
    },
  });
}
