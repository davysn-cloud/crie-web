import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { WORKSPACE_ROLES } from "@/lib/constants";
import type { WorkspaceMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export function WorkspaceMembersPage() {
  const { currentWorkspaceId } = useAuthStore();
  const [members, setMembers] = useState<(WorkspaceMember & { display_name?: string })[]>([]);

  async function loadMembers() {
    if (!currentWorkspaceId) return;
    const { data } = await supabase
      .from("workspace_members")
      .select("*, agency_member:agency_members!workspace_members_user_id_fkey(display_name)")
      .eq("workspace_id", currentWorkspaceId);

    // Fallback: load display_name from agency_members
    if (data) {
      const enriched = await Promise.all(
        data.map(async (m) => {
          const { data: am } = await supabase
            .from("agency_members")
            .select("display_name")
            .eq("user_id", m.user_id)
            .single();
          return { ...m, display_name: am?.display_name ?? "Membro" };
        }),
      );
      setMembers(enriched);
    }
  }

  useEffect(() => {
    loadMembers();
  }, [currentWorkspaceId]);

  async function updateRole(memberId: string, role: string) {
    const { error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("id", memberId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Papel atualizado");
      await loadMembers();
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Membros do Workspace</h2>
      <Card>
        <CardHeader>
          <CardTitle>Membros ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(m.display_name ?? "MB").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.display_name}</p>
                </div>
                <Select value={m.role} onValueChange={(val) => updateRole(m.id, val)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            {members.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum membro neste workspace.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
