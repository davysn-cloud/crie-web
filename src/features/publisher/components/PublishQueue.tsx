import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PUBLISH_STATUSES } from "@/lib/constants";
import { schedulePostSchema, type SchedulePostInput, type PublishQueueItem } from "@/types/publisher";
import { usePublishQueue, useSchedulePost, useRetryPublish } from "../hooks/usePublishQueue";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PostCard } from "@/types";

export function PublishQueue() {
  const { currentWorkspaceId } = useAuthStore();
  const { data: queue = [], isLoading } = usePublishQueue();
  const { data: allCards = [] } = usePostCards(currentWorkspaceId);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PostCard | null>(null);

  // Cards ready to schedule (approved but not yet in queue)
  const readyToSchedule = useMemo(
    () => allCards.filter(
      (c) => (c.stage === "agendado" || c.stage === "aprovacao_arte") &&
        !queue.some((q) => q.post_card_id === c.id)
    ),
    [allCards, queue]
  );

  // Group queue by day
  const groupedQueue = useMemo(() => {
    const groups = new Map<string, PublishQueueItem[]>();
    for (const item of queue) {
      const key = format(new Date(item.scheduled_at), "yyyy-MM-dd");
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [queue]);

  const failedCount = queue.filter((q) => q.status === "failed").length;

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Fila de Publicacao</h2>
        <Button
          onClick={() => {
            setSelectedCard(readyToSchedule[0] ?? null);
            setScheduleDialogOpen(true);
          }}
          disabled={readyToSchedule.length === 0}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" /> Agendar post
        </Button>
      </div>

      {/* Failed alert */}
      {failedCount > 0 && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">
              {failedCount} publicacao(oes) falharam — acao necessaria
            </span>
          </CardContent>
        </Card>
      )}

      {/* Ready to schedule */}
      {readyToSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Prontos para agendar ({readyToSchedule.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {readyToSchedule.slice(0, 5).map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{card.title}</p>
                  {card.post_type && <Badge variant="secondary" className="mt-1 text-[10px]">{card.post_type}</Badge>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedCard(card); setScheduleDialogOpen(true); }}
                >
                  <Clock className="mr-1 h-3 w-3" /> Agendar
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Queue by day */}
      {groupedQueue.length === 0 && readyToSchedule.length === 0 ? (
        <div className="py-20 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Nenhum post na fila</p>
        </div>
      ) : (
        groupedQueue.map(([dayKey, items]) => (
          <div key={dayKey} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {format(new Date(dayKey), "EEEE, dd/MM", { locale: ptBR })}
            </h3>
            {items.map((item) => (
              <QueueItemRow key={item.id} item={item} />
            ))}
          </div>
        ))
      )}

      {/* Schedule dialog */}
      <ScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        postCard={selectedCard}
      />
    </div>
  );
}

function QueueItemRow({ item }: { item: PublishQueueItem }) {
  const retry = useRetryPublish();
  const statusConfig = PUBLISH_STATUSES.find((s) => s.value === item.status);

  const StatusIcon = item.status === "published" ? CheckCircle
    : item.status === "failed" ? AlertTriangle
    : item.status === "publishing" ? Loader2
    : Clock;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="text-xs font-medium w-12 text-center">
        {format(new Date(item.scheduled_at), "HH:mm")}
      </div>
      <StatusIcon className={`h-4 w-4 shrink-0 ${
        item.status === "published" ? "text-blue-500"
        : item.status === "failed" ? "text-destructive"
        : item.status === "publishing" ? "text-purple-500 animate-spin"
        : "text-muted-foreground"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.post_card?.title ?? "Post"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {statusConfig && (
            <Badge variant="outline" className={`${statusConfig.color} border-0 text-[10px]`}>
              {statusConfig.label}
            </Badge>
          )}
          {item.first_comment && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MessageSquare className="h-2.5 w-2.5" /> 1o comentario
            </span>
          )}
        </div>
        {item.error_message && (
          <p className="mt-1 text-[10px] text-destructive">{item.error_message}</p>
        )}
      </div>
      {item.status === "failed" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => retry.mutate(item.id)}
          disabled={retry.isPending}
          className="gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </Button>
      )}
    </div>
  );
}

function ScheduleDialog({
  open,
  onOpenChange,
  postCard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postCard: PostCard | null;
}) {
  const schedulePost = useSchedulePost();
  const form = useForm<SchedulePostInput>({
    resolver: zodResolver(schedulePostSchema) as any,
    defaultValues: {
      post_card_id: postCard?.id ?? "",
      first_comment: "",
      cross_post_fb: false,
      cross_post_story: false,
    },
  });

  function onSubmit(data: SchedulePostInput) {
    schedulePost.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  }

  if (!postCard) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar: {postCard.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("post_card_id")} value={postCard.id} />

          <div>
            <Label>Data e horario</Label>
            <Input
              type="datetime-local"
              {...form.register("scheduled_at", { valueAsDate: true })}
              min={new Date(Date.now() + 15 * 60000).toISOString().slice(0, 16)}
            />
            {form.formState.errors.scheduled_at && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.scheduled_at.message}</p>
            )}
          </div>

          <div>
            <Label>Primeiro comentario (opcional)</Label>
            <Textarea
              {...form.register("first_comment")}
              placeholder="#hashtag1 #hashtag2 ..."
              className="min-h-[60px]"
            />
          </div>

          {/* TODO P2: Cross-post toggles */}

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-1" disabled={schedulePost.isPending}>
              <Send className="h-4 w-4" />
              {schedulePost.isPending ? "Agendando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
