import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import type { PostCard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CopywriterInbox() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId, user } = useAuthStore();
  const { data: allCards = [] } = usePostCards(currentWorkspaceId);

  const { myCards, awaitingApproval } = useMemo(() => {
    // Cards em estágio de copy atribuídos ao usuário (ou sem assignee)
    const copyCards = allCards.filter(
      (c) => (c.stage === "briefing" || c.stage === "copy") &&
        (c.assigned_to === user?.id || !c.assigned_to),
    );
    // Cards em aprovação de copy
    const approval = allCards.filter((c) => c.stage === "aprovacao_copy");

    return { myCards: copyCards, awaitingApproval: approval };
  }, [allCards, user?.id]);

  function goToCard(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Inbox do Copywriter</h2>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Para escrever</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{myCards.length}</p>
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
            <CardTitle className="text-sm text-muted-foreground">Total no pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{myCards.length + awaitingApproval.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards para escrever */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Para escrever ({myCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myCards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum card aguardando copy
            </p>
          ) : (
            <div className="space-y-2">
              {myCards.map((card) => (
                <div
                  key={card.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  onClick={() => goToCard(card)}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{card.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {card.post_type && (
                        <Badge variant="secondary" className="text-[10px]">{card.post_type}</Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[10px] border-0 ${
                          card.stage === "briefing"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {card.stage === "briefing" ? "Briefing" : "Copy"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {card.copy_versions?.length ?? 0} versões
                      </span>
                    </div>
                  </div>
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              ))}
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
              Nenhum card em aprovação
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
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-0 text-[10px]">
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
