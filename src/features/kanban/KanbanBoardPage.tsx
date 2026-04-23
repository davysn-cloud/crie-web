import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "./hooks/usePostCards";
import { KanbanBoard } from "./KanbanBoard";
import { CreateCardDialog } from "./CreateCardDialog";
import type { PostCard } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function KanbanBoardPage() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuthStore();
  const { data: cards, isLoading } = usePostCards(currentWorkspaceId);
  const [showCreate, setShowCreate] = useState(false);

  function handleCardClick(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-64 shrink-0 space-y-2 rounded-lg bg-muted/50 p-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm text-muted-foreground">
          {cards?.length ?? 0} postagens
        </span>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nova Postagem
        </Button>
      </div>

      {currentWorkspaceId && (
        <KanbanBoard
          cards={cards ?? []}
          workspaceId={currentWorkspaceId}
          onCardClick={handleCardClick}
        />
      )}

      <CreateCardDialog open={showCreate} onOpenChange={setShowCreate} />
    </>
  );
}
