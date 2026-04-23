import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { PostCard } from "@/types";
import { KanbanCard } from "./KanbanCard";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  stage: { value: string; label: string; color: string };
  cards: PostCard[];
  onCardClick: (card: PostCard) => void;
}

export function KanbanColumn({ stage, cards, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.value });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-lg bg-muted/50 ${
        isOver ? "ring-2 ring-primary/30" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Badge variant="outline" className={`${stage.color} border-0 text-[10px]`}>
          {stage.label}
        </Badge>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>
      <ScrollArea className="flex-1 px-2 pb-2">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((card) => (
              <KanbanCard key={card.id} card={card} onClick={() => onCardClick(card)} />
            ))}
          </div>
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            Arraste aqui
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
