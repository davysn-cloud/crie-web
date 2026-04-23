import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import type { CopyVersion } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CopyVersionsListProps {
  versions: CopyVersion[];
  postCardId: string;
}

export function CopyVersionsList({ versions, postCardId }: CopyVersionsListProps) {
  const { user, currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  async function handleApprove(versionId: string) {
    if (!user) return;
    const { error } = await supabase
      .from("copy_versions")
      .update({ is_approved: true, approved_by: user.id })
      .eq("id", versionId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Copy aprovada!");
      queryClient.invalidateQueries({ queryKey: ["post-card", postCardId] });
      queryClient.invalidateQueries({ queryKey: ["post-cards", currentWorkspaceId] });
    }
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <FileText className="h-8 w-8" />
        <p className="text-sm">Nenhuma versão de copy ainda</p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="space-y-3">
      {sorted.map((v) => (
        <div key={v.id} className="rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                v{v.version}
              </Badge>
              {v.is_approved && (
                <Badge className="bg-green-100 text-green-800 text-[10px]">Aprovada</Badge>
              )}
              {v.ai_generated && (
                <Badge variant="secondary" className="text-[10px]">IA</Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(v.created_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm">{v.body}</p>
          {v.caption && (
            <p className="mt-2 text-xs text-muted-foreground">Legenda: {v.caption}</p>
          )}
          {!v.is_approved && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => handleApprove(v.id)}
            >
              <Check className="mr-1 h-3 w-3" />
              Aprovar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
