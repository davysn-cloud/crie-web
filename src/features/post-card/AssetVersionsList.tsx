import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Image } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import type { AssetVersion } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AssetVersionsListProps {
  versions: AssetVersion[];
  postCardId: string;
}

export function AssetVersionsList({ versions, postCardId }: AssetVersionsListProps) {
  const { user, currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  async function handleApprove(versionId: string) {
    if (!user) return;
    const { error } = await supabase
      .from("asset_versions")
      .update({ is_approved: true, approved_by: user.id })
      .eq("id", versionId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Arte aprovada!");
      queryClient.invalidateQueries({ queryKey: ["post-card", postCardId] });
      queryClient.invalidateQueries({ queryKey: ["post-cards", currentWorkspaceId] });
    }
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <Image className="h-8 w-8" />
        <p className="text-sm">Nenhuma versão de arte ainda</p>
      </div>
    );
  }

  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <div className="grid grid-cols-2 gap-3">
      {sorted.map((v) => (
        <div key={v.id} className="overflow-hidden rounded-lg border">
          {v.file_type.startsWith("image/") ? (
            <img
              src={v.file_url}
              alt={`Versão ${v.version}`}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-muted">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[10px]">v{v.version}</Badge>
                {v.is_approved && (
                  <Badge className="bg-green-100 text-green-800 text-[10px]">Aprovada</Badge>
                )}
              </div>
              <span className="text-[9px] text-muted-foreground">
                {format(new Date(v.created_at), "dd/MM", { locale: ptBR })}
              </span>
            </div>
            {!v.is_approved && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => handleApprove(v.id)}
              >
                <Check className="mr-1 h-3 w-3" />
                Aprovar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
