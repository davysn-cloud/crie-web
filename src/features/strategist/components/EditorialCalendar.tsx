import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BriefBuilder } from "@/components/BriefBuilder";
import { useCalendar } from "../hooks/useCalendar";
import { useCalendarStore } from "@/stores/useCalendarStore";
import { POST_STAGES } from "@/lib/constants";
import type { PostCard } from "@/types";

export function EditorialCalendar() {
  const { agencySlug, workspaceSlug } = useParams();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefDate, setBriefDate] = useState<Date | undefined>();
  const { filterPillarId, filterStatus, filterFormat } = useCalendarStore();

  const { data: cards = [], isLoading } = useCalendar({
    month: currentMonth,
    pillarId: filterPillarId,
    status: filterStatus,
    formatFilter: filterFormat,
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const cardsByDay = useMemo(() => {
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

  function handleDayClick(day: Date) {
    setBriefDate(day);
    setBriefOpen(true);
  }

  function handleCardClick(card: PostCard) {
    navigate(`/app/${agencySlug}/w/${workspaceSlug}/card/${card.id}`);
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-44 text-center text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => { setBriefDate(undefined); setBriefOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo brief
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayCards = cardsByDay.get(key) ?? [];
            const isCurrentMonth_ = isSameMonth(day, currentMonth);
            const isToday_ = isSameDay(day, new Date());

            return (
              <div
                key={key}
                className={`group min-h-[100px] cursor-pointer rounded-md border p-1.5 transition-colors hover:bg-muted/50 ${
                  !isCurrentMonth_ ? "bg-muted/20 text-muted-foreground" : "bg-card"
                } ${isToday_ ? "ring-1 ring-primary" : ""}`}
                onClick={() => handleDayClick(day)}
                role="gridcell"
                aria-label={`${format(day, "dd/MM")} - ${dayCards.length} posts`}
              >
                <div className={`mb-1 text-xs font-medium ${isToday_ ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayCards.slice(0, 3).map((card) => {
                    const stage = POST_STAGES.find((s) => s.value === card.stage);
                    const thumb = card.asset_versions?.[0]?.thumbnail_url;
                    return (
                      <button
                        key={card.id}
                        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] transition-colors hover:bg-muted"
                        onClick={(e) => { e.stopPropagation(); handleCardClick(card); }}
                      >
                        {thumb ? (
                          <img src={thumb} alt="" className="h-4 w-4 rounded-sm object-cover" />
                        ) : (
                          <div className="h-4 w-4 rounded-sm bg-muted" />
                        )}
                        <span className="flex-1 truncate">{card.title}</span>
                        {stage && (
                          <Badge variant="outline" className={`${stage.color} border-0 text-[8px] px-1 py-0`}>
                            {card.post_type ?? ""}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                  {dayCards.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{dayCards.length - 3} mais</span>
                  )}
                </div>
                {/* Add button on hover */}
                <div className="mt-1 hidden group-hover:block">
                  <Plus className="mx-auto h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brief builder drawer */}
      <BriefBuilder
        open={briefOpen}
        onOpenChange={setBriefOpen}
        defaultScheduledAt={briefDate}
      />
    </div>
  );
}
