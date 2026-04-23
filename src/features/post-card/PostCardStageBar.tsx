import { POST_STAGES, type PostStage } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PostCardStageBarProps {
  currentStage: PostStage;
}

export function PostCardStageBar({ currentStage }: PostCardStageBarProps) {
  const currentIndex = POST_STAGES.findIndex((s) => s.value === currentStage);

  return (
    <div className="flex gap-1">
      {POST_STAGES.map((stage, i) => (
        <div
          key={stage.value}
          className={cn(
            "flex-1 rounded-full py-0.5 text-center text-[9px] font-medium transition-colors",
            i <= currentIndex
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
          title={stage.label}
        >
          {i === currentIndex ? stage.label : ""}
        </div>
      ))}
    </div>
  );
}
