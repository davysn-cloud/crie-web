import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { POST_STAGES } from "@/lib/constants";
import type { PostCard } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StrategistDashboard() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuthStore();
  const { data: cards = [] } = usePostCards(currentWorkspaceId);

  const stats = useMemo(() => {
    const byStage = new Map<string, PostCard[]>();
    for (const stage of POST_STAGES) {
      byStage.set(stage.value, []);
    }
    for (const card of cards) {
      const list = byStage.get(card.stage);
      if (list) list.push(card);
    }

    // Gargalos: estágios com mais de 3 cards parados
    const bottlenecks = POST_STAGES
      .map((s) => ({ stage: s, count: byStage.get(s.value)?.length ?? 0 }))
      .filter((b) => b.count >= 3)
      .sort((a, b) => b.count - a.count);

    // Cards sem movimentação há mais de 3 dias
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const stale = cards.filter((c) => new Date(c.updated_at) < threeDaysAgo && c.stage !== "publicado");

    return { byStage, bottlenecks, stale, total: cards.length };
  }, [cards]);

  function goToCard(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Dashboard do Estrategista</h2>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Publicados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {stats.byStage.get("publicado")?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Agendados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-cyan-600">
              {stats.byStage.get("agendado")?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Parados +3 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{stats.stale.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto">
            {POST_STAGES.map((stage) => {
              const count = stats.byStage.get(stage.value)?.length ?? 0;
              return (
                <div key={stage.value} className="flex-1 min-w-[80px]">
                  <div className="mb-1 text-center">
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${stage.color} w-full justify-center border-0 text-[9px]`}
                  >
                    {stage.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gargalos */}
      {stats.bottlenecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Gargalos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.bottlenecks.map((b) => (
                <div key={b.stage.value} className="flex items-center justify-between rounded-lg border p-3">
                  <Badge variant="outline" className={`${b.stage.color} border-0`}>
                    {b.stage.label}
                  </Badge>
                  <span className="text-sm font-bold">{b.count} cards</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards parados */}
      {stats.stale.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              Parados há +3 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.stale.map((card) => {
                const stage = POST_STAGES.find((s) => s.value === card.stage);
                return (
                  <div
                    key={card.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                    onClick={() => goToCard(card)}
                  >
                    <div>
                      <p className="text-sm font-medium">{card.title}</p>
                      <Badge variant="outline" className={`${stage?.color ?? ""} mt-1 border-0 text-[10px]`}>
                        {stage?.label ?? card.stage}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - new Date(card.updated_at).getTime()) / 86400000)}d
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
