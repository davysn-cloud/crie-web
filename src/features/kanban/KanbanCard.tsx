import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, Image } from "lucide-react";
import type { PostCard } from "@/types";
import { POST_TYPES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface KanbanCardProps {
  card: PostCard;
  onClick: () => void;
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const postTypeLabel = POST_TYPES.find((t) => t.value === card.post_type)?.label;
  const copyCount = card.copy_versions?.length ?? 0;
  const assetCount = card.asset_versions?.length ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium leading-tight">{card.title}</p>
      <div className="mt-2 flex items-center gap-2">
        {postTypeLabel && (
          <Badge variant="secondary" className="text-[10px]">
            {postTypeLabel}
          </Badge>
        )}
        {copyCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <FileText className="h-3 w-3" />
            {copyCount}
          </span>
        )}
        {assetCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Image className="h-3 w-3" />
            {assetCount}
          </span>
        )}
      </div>
    </div>
  );
}
