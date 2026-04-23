import { useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import { useComments } from "./hooks/useComments";
import { CommentInput } from "./CommentInput";
import type { Comment } from "@/types/comments";
import { Button } from "@/components/ui/button";

interface ImagePinOverlayProps {
  imageUrl: string;
  assetVersionId: string;
}

export function ImagePinOverlay({ imageUrl, assetVersionId }: ImagePinOverlayProps) {
  const { data: comments = [] } = useComments("asset_version", assetVersionId);
  const [newPin, setNewPin] = useState<{ x: number; y: number } | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const pinComments = comments.filter((c) => c.pin_x != null && c.pin_y != null && !c.parent_id);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (selectedPin) {
        setSelectedPin(null);
        return;
      }

      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setNewPin({ x, y });
    },
    [selectedPin],
  );

  return (
    <div className="relative select-none" ref={imgRef}>
      <img
        src={imageUrl}
        alt="Arte"
        className="w-full cursor-crosshair rounded-lg"
        draggable={false}
        onClick={handleImageClick}
      />

      {/* Pins existentes */}
      {pinComments.map((comment, i) => (
        <PinMarker
          key={comment.id}
          index={i + 1}
          x={comment.pin_x!}
          y={comment.pin_y!}
          comment={comment}
          isSelected={selectedPin === comment.id}
          onClick={() => setSelectedPin(selectedPin === comment.id ? null : comment.id)}
        />
      ))}

      {/* Novo pin sendo criado */}
      {newPin && (
        <div
          className="absolute z-20"
          style={{ left: `${newPin.x}%`, top: `${newPin.y}%`, transform: "translate(-50%, -100%)" }}
        >
          <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-lg">
            +
          </div>
          <div className="w-64 rounded-lg border bg-card p-2 shadow-lg">
            <div className="mb-1 flex justify-between">
              <span className="text-[10px] text-muted-foreground">Novo comentário</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={(e) => { e.stopPropagation(); setNewPin(null); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <CommentInput
              targetType="asset_version"
              targetId={assetVersionId}
              pinX={newPin.x}
              pinY={newPin.y}
              placeholder="Comentar neste ponto..."
              onSubmitted={() => setNewPin(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function PinMarker({
  index,
  x,
  y,
  comment,
  isSelected,
  onClick,
}: {
  index: number;
  x: number;
  y: number;
  comment: Comment;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="absolute z-10"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform ${
          comment.resolved
            ? "bg-green-500"
            : "bg-primary hover:scale-110"
        } ${isSelected ? "ring-2 ring-primary ring-offset-2 scale-110" : ""}`}
      >
        {index}
      </button>

      {isSelected && (
        <div className="absolute left-8 top-0 z-30 w-56 rounded-lg border bg-card p-2 shadow-lg">
          <p className="whitespace-pre-wrap text-xs">{comment.body}</p>
          <span className="text-[9px] text-muted-foreground">
            {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}
          </span>
        </div>
      )}
    </div>
  );
}
