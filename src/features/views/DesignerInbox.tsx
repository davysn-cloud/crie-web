import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Paintbrush, CheckCircle2, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import type { PostCard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DesignerInbox() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId, user } = useAuthStore();
  const { data: allCards = [] } = usePostCards(currentWorkspaceId);

  const { designCards, awaitingApproval } = useMemo(() => {
    const design = allCards.filter(
      (c) => c.stage === "design" &&
        (c.assigned_to === user?.id || !c.assigned_to),
    );
    const approval = allCards.filter((c) => c.stage === "aprovacao_arte");
    return { designCards: design, awaitingApproval: approval };
  }, [allCards, user?.id]);

  function goToCard(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Inbox do Designer</h2>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Para criar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{designCards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Em aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{awaitingApproval.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{designCards.length + awaitingApproval.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards para criar arte */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Paintbrush className="h-4 w-4" />
            Para criar ({designCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {designCards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum card aguardando design
            </p>
          ) : (
            <div className="space-y-2">
              {designCards.map((card) => {
                const approvedCopy = card.copy_versions?.find((c) => c.is_approved);
                return (
                  <div
                    key={card.id}
                    className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    onClick={() => goToCard(card)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{card.title}</p>
                      <div className="flex items-center gap-1">
                        {card.post_type && (
                          <Badge variant="secondary" className="text-[10px]">{card.post_type}</Badge>
                        )}
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {/* Preview da copy aprovada */}
                    {approvedCopy && (
                      <div className="mt-2 rounded bg-muted/50 p-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          Copy aprovada
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs">{approvedCopy.body}</p>
                      </div>
                    )}
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {card.asset_versions?.length ?? 0} versões de arte
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Em aprovação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Aguardando aprovação ({awaitingApproval.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {awaitingApproval.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum card em aprovação de arte
            </p>
          ) : (
            <div className="space-y-2">
              {awaitingApproval.map((card) => (
                <div
                  key={card.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  onClick={() => goToCard(card)}
                >
                  <div>
                    <p className="text-sm font-medium">{card.title}</p>
                    <span className="text-[10px] text-muted-foreground">
                      Enviado em {format(new Date(card.updated_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-0 text-[10px]">
                    Aprovação
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
