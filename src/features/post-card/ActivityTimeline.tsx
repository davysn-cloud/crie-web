import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { POST_STAGES } from "@/lib/constants";
import type { StageTransition } from "@/types/comments";
import { Badge } from "@/components/ui/badge";

interface ActivityTimelineProps {
  postCardId: string;
}

export function ActivityTimeline({ postCardId }: ActivityTimelineProps) {
  const { data: transitions = [] } = useQuery({
    queryKey: ["stage-transitions", postCardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_transitions")
        .select("*")
        .eq("post_card_id", postCardId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as StageTransition[];
    },
  });

  const stageLabel = (value: string) =>
    POST_STAGES.find((s) => s.value === value)?.label ?? value;

  const stageColor = (value: string) =>
    POST_STAGES.find((s) => s.value === value)?.color ?? "bg-muted text-muted-foreground";

  if (transitions.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        Nenhuma transição registrada ainda
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {transitions.map((t) => (
        <div key={t.id} className="flex items-start gap-3 rounded-lg border p-3">
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {t.from_stage && (
                <>
                  <Badge variant="outline" className={`${stageColor(t.from_stage)} border-0 text-[10px]`}>
                    {stageLabel(t.from_stage)}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              )}
              <Badge variant="outline" className={`${stageColor(t.to_stage)} border-0 text-[10px]`}>
                {stageLabel(t.to_stage)}
              </Badge>
            </div>
            {t.note && <p className="mt-1 text-xs text-muted-foreground">{t.note}</p>}
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(t.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
