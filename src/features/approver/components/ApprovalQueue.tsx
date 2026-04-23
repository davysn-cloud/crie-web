import { useState } from "react";
import { Check, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InstagramPreview } from "@/components/InstagramPreview";
import { CommentPin, type Pin } from "@/components/CommentPin";
import { useApprovalQueue } from "../hooks/useApprovalQueue";
import { useApprove } from "../hooks/useApprove";
import { RequestChangesSheet } from "./RequestChangesSheet";
import { useApproverStore } from "@/stores/useApproverStore";
import type { PostCard } from "@/types";
import { truncateCaption } from "@/lib/instagram";

export function ApprovalQueue() {
  const { data: queue = [], isLoading } = useApprovalQueue();
  const { currentIndex, setCurrentIndex } = useApproverStore();
  const approve = useApprove();
  const [showChangesSheet, setShowChangesSheet] = useState(false);
  const [pins] = useState<Pin[]>([]); // TODO: fetch pins from approval_pins

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-xl" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-lg font-bold">Tudo aprovado!</h2>
        <p className="text-sm text-muted-foreground">
          Nao ha posts pendentes no momento.
        </p>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, queue.length - 1);
  const card: PostCard = queue[safeIndex]!;
  const latestCopy = card.copy_versions?.sort((a, b) => b.version - a.version)[0];
  const latestAsset = card.asset_versions?.sort((a, b) => b.version - a.version)[0];
  const imageUrls = card.asset_versions
    ?.filter((a) => a.is_approved || a.version === (latestAsset?.version ?? 0))
    .map((a) => a.file_url) ?? [];

  const igFormat = card.post_type === "carrossel" ? "carousel"
    : card.post_type === "story" ? "story"
    : card.post_type === "reels" ? "reel"
    : "feed_1x1";

  const caption = latestCopy?.body ?? latestCopy?.caption ?? "";
  const { text: truncated } = truncateCaption(caption);

  function handleApprove() {
    approve.mutate({ postCardId: card.id });
  }

  function goNext() {
    if (safeIndex < queue.length - 1) setCurrentIndex(safeIndex + 1);
  }

  function goPrev() {
    if (safeIndex > 0) setCurrentIndex(safeIndex - 1);
  }

  function handleAddPin(x: number, y: number, body: string) {
    // TODO: mutation to save pin to approval_pins table
    console.log("Pin added:", { x, y, body, postCardId: card.id });
  }

  return (
    <div className="space-y-4">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">{queue.length}</span> post{queue.length > 1 ? "s" : ""} pendente{queue.length > 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goPrev} disabled={safeIndex === 0} aria-label="Post anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium">{safeIndex + 1}/{queue.length}</span>
          <Button variant="ghost" size="icon" onClick={goNext} disabled={safeIndex >= queue.length - 1} aria-label="Proximo post">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview with pin support */}
      <CommentPin pins={pins} onAddPin={handleAddPin}>
        <InstagramPreview
          format={igFormat as "feed_1x1"}
          imageUrls={imageUrls.length > 0 ? imageUrls : [""]}
          caption={caption}
          size="lg"
          className="w-full"
        />
      </CommentPin>

      {/* Card info */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{card.title}</h3>
        {card.scheduled_at && (
          <p className="text-xs text-muted-foreground">
            Prazo: {format(new Date(card.scheduled_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
          </p>
        )}
        {caption && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
            {truncated}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-4 flex gap-3 pt-4">
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2"
          onClick={handleApprove}
          disabled={approve.isPending}
          aria-label={`Aprovar post ${card.title}`}
        >
          <Check className="h-5 w-5" />
          {approve.isPending ? "Aprovando..." : "Aprovar"}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1 h-14 text-base gap-2"
          onClick={() => setShowChangesSheet(true)}
          aria-label={`Pedir ajuste no post ${card.title}`}
        >
          <MessageSquare className="h-5 w-5" />
          Pedir ajuste
        </Button>
      </div>

      {/* Dots indicator */}
      {queue.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {queue.map((_, i) => (
            <button
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${i === safeIndex ? "bg-primary" : "bg-muted-foreground/30"}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Ir para post ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Request changes bottom sheet */}
      <RequestChangesSheet
        open={showChangesSheet}
        onOpenChange={setShowChangesSheet}
        postCardId={card.id}
      />
    </div>
  );
}
