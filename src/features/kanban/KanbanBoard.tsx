import { useState, useCallback } from "react";
import { DndContext, DragOverlay, closestCorners, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import type { PostCard } from "@/types";
import { POST_STAGES, type PostStage } from "@/lib/constants";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMoveCard } from "./hooks/useMoveCard";
import { KanbanColumn } from "./KanbanColumn";
import { Badge } from "@/components/ui/badge";

interface KanbanBoardProps {
  cards: PostCard[];
  workspaceId: string;
  onCardClick: (card: PostCard) => void;
}

export function KanbanBoard({ cards, workspaceId, onCardClick }: KanbanBoardProps) {
  const [activeCard, setActiveCard] = useState<PostCard | null>(null);
  const moveCard = useMoveCard();
  const { user } = useAuthStore();

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }, [cards]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCard(null);
      const { active, over } = event;
      if (!over) return;

      const cardId = active.id as string;
      const newStage = over.id as PostStage;
      const card = cards.find((c) => c.id === cardId);

      if (!card || card.stage === newStage || !user) return;

      moveCard.mutate({ cardId, fromStage: card.stage, newStage, workspaceId, userId: user.id });
    },
    [cards, moveCard, workspaceId],
  );

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto p-4" style={{ minHeight: "calc(100vh - 120px)" }}>
        {POST_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.value}
            stage={stage}
            cards={cards.filter((c) => c.stage === stage.value)}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-60 rounded-lg border bg-card p-3 shadow-lg">
            <p className="text-sm font-medium">{activeCard.title}</p>
            {activeCard.post_type && (
              <Badge variant="secondary" className="mt-1 text-[10px]">
                {activeCard.post_type}
              </Badge>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
