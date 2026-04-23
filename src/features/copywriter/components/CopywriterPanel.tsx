import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FileText, Clock, CheckCircle2, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { CaptionEditor } from "./CaptionEditor";
import type { PostCard } from "@/types";

export function CopywriterPanel() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId, user } = useAuthStore();
  const { data: allCards = [], isLoading } = usePostCards(currentWorkspaceId);
  const [editingCard, setEditingCard] = useState<PostCard | null>(null);

  const { toWrite, inApproval, approved } = useMemo(() => {
    const toWrite = allCards.filter(
      (c) => (c.stage === "briefing" || c.stage === "copy") &&
        (c.assigned_to === user?.id || !c.assigned_to)
    );
    const inApproval = allCards.filter((c) => c.stage === "aprovacao_copy");
    const approved = allCards.filter(
      (c) => (c.stage === "design" || c.stage === "aprovacao_arte" || c.stage === "agendado" || c.stage === "publicado") &&
        c.copy_versions && c.copy_versions.length > 0
    );
    return { toWrite, inApproval, approved };
  }, [allCards, user?.id]);

  function goToCard(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Painel do Copywriter</h2>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Para escrever</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{toWrite.length}</p>
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

      {/* Columns layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* To write */}
        <InboxColumn
          title="Para escrever"
          icon={<FileText className="h-4 w-4" />}
          cards={toWrite}
          onCardClick={goToCard}
          onEditClick={setEditingCard}
          emptyText="Nenhum card aguardando copy"
        />

        {/* In approval */}
        <InboxColumn
          title="Em aprovacao"
          icon={<Clock className="h-4 w-4" />}
          cards={inApproval}
          onCardClick={goToCard}
          emptyText="Nenhum card em aprovacao"
        />

        {/* Approved */}
        <InboxColumn
          title="Aprovados"
          icon={<CheckCircle2 className="h-4 w-4" />}
          cards={approved.slice(0, 10)}
          onCardClick={goToCard}
          emptyText="Nenhum card aprovado"
        />
      </div>

      {/* Inline editor sheet */}
      <Sheet open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Editor de legenda</SheetTitle>
          </SheetHeader>
          {editingCard && (
            <div className="mt-4">
              <CaptionEditor
                postCardId={editingCard.id}
                postTitle={editingCard.title}
                postType={editingCard.post_type}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InboxColumn({
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
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => onCardClick(card)}
                >
                  <p className="text-sm font-medium">{card.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {card.post_type && (
                      <Badge variant="secondary" className="text-[10px]">{card.post_type}</Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {card.copy_versions?.length ?? 0} versoes
                    </span>
                  </div>
                </button>
                {onEditClick && (
                  <Button variant="ghost" size="icon" onClick={() => onEditClick(card)} aria-label="Editar legenda">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
