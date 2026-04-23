import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { AgencyMember } from "@/types";

/**
 * Columns that are safe to select — avoids 400 if `role` column
 * hasn't been added via migration 00019 yet.
 */
const SAFE_COLUMNS = "id, agency_id, user_id, display_name, avatar_url, invited_email, accepted_at, created_at";

export function useTeam() {
  const { currentAgencyId } = useAuthStore();

  return useQuery({
    queryKey: ["team", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];

      // Try with role column first, fall back to safe columns
      let result = await supabase
        .from("agency_members")
        .select("*, role")
        .eq("agency_id", currentAgencyId)
        .order("created_at");

      if (result.error?.message?.includes("role")) {
        // role column doesn't exist yet — fetch without it
        result = await supabase
          .from("agency_members")
          .select(SAFE_COLUMNS)
          .eq("agency_id", currentAgencyId)
          .order("created_at");
      }

      if (result.error) throw result.error;
      return (result.data ?? []) as AgencyMember[];
    },
    enabled: !!currentAgencyId,
  });
}

/** Pending invites for the agency (from agency_invites table). */
export function useInvites() {
  const { currentAgencyId } = useAuthStore();

  return useQuery({
    queryKey: ["invites", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];
      const { data, error } = await supabase
        .from("agency_invites")
        .select("*")
        .eq("agency_id", currentAgencyId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet — return empty
        if (error.message?.includes("agency_invites")) return [];
        throw error;
      }
      return data ?? [];
    },
    enabled: !!currentAgencyId,
  });
}

export function useInviteMember() {
  const { currentAgencyId, user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; role: string; display_name: string }) => {
      if (!currentAgencyId) throw new Error("No agency");

      const { error } = await supabase.from("agency_invites").insert({
        agency_id: currentAgencyId,
        email: input.email,
        display_name: input.display_name,
        default_role: input.role,
        invited_by: user?.id ?? null,
      });

      if (error) throw error;

      // TODO: send invite email via Resend edge function
    },
    onSuccess: () => {
      toast.success("Convite enviado");
      queryClient.invalidateQueries({ queryKey: ["invites", currentAgencyId] });
      queryClient.invalidateQueries({ queryKey: ["team", currentAgencyId] });
    },
    onError: (err) => {
      toast.error(`Erro: ${err instanceof Error ? err.message : "Erro ao convidar"}`);
    },
  });
}

export function useRevokeInvite() {
  const { currentAgencyId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("agency_invites")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite revogado");
      queryClient.invalidateQueries({ queryKey: ["invites", currentAgencyId] });
    },
    onError: () => {
      toast.error("Erro ao revogar convite");
    },
  });
}

export function useRemoveMember() {
  const { currentAgencyId } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("agency_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido");
      queryClient.invalidateQueries({ queryKey: ["team", currentAgencyId] });
    },
    onError: () => {
      toast.error("Erro ao remover membro");
    },
  });
}
