import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface Pin {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  body: string;
  slideIndex?: number;
  authorName?: string;
  createdAt?: string;
}

interface CommentPinProps {
  pins: Pin[];
  onAddPin?: (x: number, y: number, body: string) => void;
  readOnly?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function CommentPin({ pins, onAddPin, readOnly = false, className, children }: CommentPinProps) {
  const [newPin, setNewPin] = useState<{ x: number; y: number } | null>(null);
  const [comment, setComment] = useState("");
  const [activePinId, setActivePinId] = useState<string | null>(null);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNewPin({ x, y });
    setComment("");
    setActivePinId(null);
  }

  function handleSubmit() {
    if (!newPin || !comment.trim() || !onAddPin) return;
    onAddPin(newPin.x, newPin.y, comment.trim());
    setNewPin(null);
    setComment("");
  }

  function handleCancel() {
    setNewPin(null);
    setComment("");
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative" onClick={handleImageClick}>
        {children}

        {/* Existing pins */}
        {pins.map((pin, i) => (
          <button
            key={pin.id}
            className={cn(
              "absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110",
              activePinId === pin.id ? "bg-primary ring-2 ring-primary/50 scale-125" : "bg-primary/80"
            )}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            onClick={(e) => {
              e.stopPropagation();
              setActivePinId(activePinId === pin.id ? null : pin.id);
              setNewPin(null);
            }}
            aria-label={`Comentario ${i + 1}: ${pin.body}`}
          >
            {i + 1}
          </button>
        ))}

        {/* New pin being placed */}
        {newPin && (
          <div
            className="absolute z-20 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-destructive text-white text-[10px] font-bold animate-pulse"
            style={{ left: `${newPin.x}%`, top: `${newPin.y}%` }}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Active pin tooltip */}
      {activePinId && (() => {
        const pin = pins.find((p) => p.id === activePinId);
        if (!pin) return null;
        return (
          <div
            className="absolute z-30 w-56 rounded-lg border bg-popover p-3 shadow-lg"
            style={{
              left: `${Math.min(pin.x, 70)}%`,
              top: `${pin.y + 4}%`,
            }}
          >
            {pin.authorName && (
              <p className="mb-1 text-xs font-semibold">{pin.authorName}</p>
            )}
            <p className="text-xs text-foreground">{pin.body}</p>
            <button
              className="absolute -right-1 -top-1 rounded-full bg-muted p-0.5"
              onClick={() => setActivePinId(null)}
              aria-label="Fechar comentario"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })()}

      {/* New pin comment input */}
      {newPin && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border bg-card p-3">
          <p className="text-xs font-medium">Novo comentario no ponto marcado</p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva seu comentario..."
            className="min-h-[60px] text-sm"
            maxLength={2000}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="mr-1 h-3 w-3" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!comment.trim()}>
              <Send className="mr-1 h-3 w-3" /> Enviar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
