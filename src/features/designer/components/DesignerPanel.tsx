import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Paintbrush, Clock, CheckCircle2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { GridPreview } from "@/components/GridPreview";
import { CanvasEditor } from "./CanvasEditor";
import type { PostCard } from "@/types";

export function DesignerPanel() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId, user } = useAuthStore();
  const { data: allCards = [], isLoading } = usePostCards(currentWorkspaceId);
  const [editingCard, setEditingCard] = useState<PostCard | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  const { toDesign, inApproval, approved } = useMemo(() => {
    const toDesign = allCards.filter(
      (c) => c.stage === "design" && (c.assigned_to === user?.id || !c.assigned_to)
    );
    const inApproval = allCards.filter((c) => c.stage === "aprovacao_arte");
    const approved = allCards.filter(
      (c) => (c.stage === "agendado" || c.stage === "publicado") &&
        c.asset_versions && c.asset_versions.length > 0
    );
    return { toDesign, inApproval, approved };
  }, [allCards, user?.id]);

  // Grid preview data
  const gridPosts = useMemo(() => {
    const withAssets = allCards
      .filter((c) => c.asset_versions && c.asset_versions.length > 0)
      .sort((a, b) => {
        const aTime = a.scheduled_at ?? a.created_at;
        const bTime = b.scheduled_at ?? b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(0, 12);

    return withAssets.map((c) => ({
      id: c.id,
      thumbnailUrl: c.asset_versions?.[0]?.thumbnail_url ?? c.asset_versions?.[0]?.file_url ?? null,
      title: c.title,
      isHighlighted: editingCard?.id === c.id,
    }));
  }, [allCards, editingCard]);

  function goToCard(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Painel do Designer</h2>
        <Button variant="outline" size="sm" onClick={() => setShowGrid(true)} className="gap-1">
          <Eye className="h-3 w-3" /> Grid IG
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Para criar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{toDesign.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Em aprovacao</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{inApproval.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{approved.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Card columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DesignColumn
          title="Para criar"
          icon={<Paintbrush className="h-4 w-4" />}
          cards={toDesign}
          onCardClick={goToCard}
          onEditClick={setEditingCard}
          emptyText="Nenhum card para design"
        />
        <DesignColumn
          title="Em aprovacao"
          icon={<Clock className="h-4 w-4" />}
          cards={inApproval}
          onCardClick={goToCard}
          emptyText="Nenhum card em aprovacao"
        />
        <DesignColumn
          title="Aprovados"
          icon={<CheckCircle2 className="h-4 w-4" />}
          cards={approved.slice(0, 10)}
          onCardClick={goToCard}
          emptyText="Nenhum card aprovado"
        />
      </div>

      {/* Canvas editor dialog */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="max-w-5xl h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Canvas — {editingCard?.title}</DialogTitle>
          </DialogHeader>
          {editingCard && <CanvasEditor postCard={editingCard} />}
        </DialogContent>
      </Dialog>

      {/* Grid preview dialog */}
      <Dialog open={showGrid} onOpenChange={setShowGrid}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview do Grid IG</DialogTitle>
          </DialogHeader>
          <GridPreview
            posts={gridPosts}
            onPostClick={(id) => {
              const card = allCards.find((c) => c.id === id);
              if (card) goToCard(card);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DesignColumn({
  title,
  icon,
  cards,
  onCardClick,
  onEditClick,
  emptyText,
}: {
  title: string;
  icon: React.ReactNode;
  cards: PostCard[];
  onCardClick: (card: PostCard) => void;
  onEditClick?: (card: PostCard) => void;
  emptyText: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title} ({cards.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cards.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => {
              const thumb = card.asset_versions?.[0]?.thumbnail_url;
              return (
                <div
                  key={card.id}
                  className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => (onEditClick ? onEditClick(card) : onCardClick(card))}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{card.title}</p>
                    <div className="flex gap-1 mt-0.5">
                      {card.post_type && (
                        <Badge variant="secondary" className="text-[10px]">{card.post_type}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {card.asset_versions?.length ?? 0} versoes
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
