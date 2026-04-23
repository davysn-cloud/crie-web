import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import type { PostCard } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function useScheduleCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { cardId: string; scheduledAt: string | null; workspaceId: string }) => {
      const { error } = await supabase
        .from("post_cards")
        .update({
          scheduled_at: params.scheduledAt,
          stage: params.scheduledAt ? "agendado" : "aprovacao_arte",
        })
        .eq("id", params.cardId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-cards", variables.workspaceId] });
    },
  });
}

export function SocialMediaCalendar() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuthStore();
  const { data: cards = [] } = usePostCards(currentWorkspaceId);
  const scheduleCard = useScheduleCard();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeCard, setActiveCard] = useState<PostCard | null>(null);

  // Cards prontos para agendar (aprovacao_arte já aprovada ou agendados)
  const availableCards = useMemo(
    () => cards.filter(
      (c) => (c.stage === "aprovacao_arte" || c.stage === "agendado") && !c.scheduled_at,
    ),
    [cards],
  );

  // Cards já agendados (por data)
  const scheduledByDay = useMemo(() => {
    const map = new Map<string, PostCard[]>();
    for (const card of cards) {
      if (card.scheduled_at) {
        const key = format(new Date(card.scheduled_at), "yyyy-MM-dd");
        const list = map.get(key) ?? [];
        list.push(card);
        map.set(key, list);
      }
    }
    return map;
  }, [cards]);

  // Dias do mês atual (incluindo dias da semana anterior/posterior para grid completo)
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  function handleDragStart(event: DragStartEvent) {
    const cardId = event.active.id as string;
    const card = cards.find((c) => c.id === cardId);
    setActiveCard(card ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over || !currentWorkspaceId) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    if (overId === "unscheduled") {
      // Remover agendamento
      scheduleCard.mutate({ cardId, scheduledAt: null, workspaceId: currentWorkspaceId });
    } else if (overId.startsWith("day-")) {
      const dayKey = overId.replace("day-", "");
      const [year, month, day] = dayKey.split("-").map(Number);
      if (!year || !month || !day) return;
      const date = new Date(year, month - 1, day, 12, 0, 0);
      scheduleCard.mutate({
        cardId,
        scheduledAt: date.toISOString(),
        workspaceId: currentWorkspaceId,
      });
    }
  }

  function goToCard(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 p-6">
        {/* Calendário */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Calendário</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-40 text-center font-medium capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Header dias da semana */}
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayCards = scheduledByDay.get(key) ?? [];
              return (
                <CalendarDay
                  key={key}
                  day={day}
                  cards={dayCards}
                  isCurrentMonth={isSameMonth(day, currentMonth)}
                  isToday={isSameDay(day, new Date())}
                  onCardClick={goToCard}
                />
              );
            })}
          </div>
        </div>

        {/* Sidebar: cards prontos para agendar */}
        <UnscheduledBucket cards={availableCards} onCardClick={goToCard} />

        <DragOverlay>
          {activeCard && (
            <div className="w-40 rounded-md border bg-card p-2 shadow-lg">
              <p className="truncate text-xs font-medium">{activeCard.title}</p>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

function CalendarDay({
  day,
  cards,
  isCurrentMonth,
  isToday,
  onCardClick,
}: {
  day: Date;
  cards: PostCard[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onCardClick: (card: PostCard) => void;
}) {
  const dayKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: `day-${dayKey}` });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[90px] rounded-md border p-1 transition-colors ${
        !isCurrentMonth ? "bg-muted/30 text-muted-foreground" : "bg-card"
      } ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <div className={`mb-1 text-xs font-medium ${isToday ? "text-primary" : ""}`}>
        {format(day, "d")}
      </div>
      <div className="space-y-1">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onClick={() => onCardClick(card)} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ card, onClick }: { card: PostCard; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });

  const firstAsset = card.asset_versions?.find((a) => a.is_approved);
  const bgImage = firstAsset?.thumbnail_url ?? firstAsset?.file_url;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded text-[10px] transition-opacity ${
        isDragging ? "opacity-40" : ""
      } ${
        bgImage
          ? "bg-cover bg-center text-white aspect-square"
          : "bg-primary/10 p-1 text-primary"
      }`}
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
    >
      {!bgImage && <p className="line-clamp-2 font-medium">{card.title}</p>}
    </div>
  );
}

function UnscheduledBucket({
  cards,
  onCardClick,
}: {
  cards: PostCard[];
  onCardClick: (card: PostCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unscheduled" });

  return (
    <Card
      ref={setNodeRef}
      className={`w-64 shrink-0 ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <h3 className="text-sm font-medium">Prontos para agendar</h3>
        </div>
        <div className="space-y-2">
          {cards.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Arraste posts agendados aqui para desagendar
            </p>
          )}
          {cards.map((card) => (
            <DraggableUnscheduledCard key={card.id} card={card} onClick={() => onCardClick(card)} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DraggableUnscheduledCard({
  card,
  onClick,
}: {
  card: PostCard;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border bg-card p-2 transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <p className="text-xs font-medium">{card.title}</p>
      {card.post_type && (
        <Badge variant="secondary" className="mt-1 text-[10px]">{card.post_type}</Badge>
      )}
    </div>
  );
}
