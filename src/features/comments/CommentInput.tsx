import { useState } from "react";
import { Send } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAddComment } from "./hooks/useComments";
import type { Comment } from "@/types/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CommentInputProps {
  targetType: Comment["target_type"];
  targetId: string;
  parentId?: string;
  pinX?: number;
  pinY?: number;
  placeholder?: string;
  onSubmitted?: () => void;
}

export function CommentInput({
  targetType,
  targetId,
  parentId,
  pinX,
  pinY,
  placeholder = "Escreva um comentário...",
  onSubmitted,
}: CommentInputProps) {
  const [body, setBody] = useState("");
  const { user } = useAuthStore();
  const addComment = useAddComment();

  async function handleSubmit() {
    if (!body.trim() || !user) return;

    try {
      await addComment.mutateAsync({
        targetType,
        targetId,
        body: body.trim(),
        parentId,
        pinX,
        pinY,
        authorId: user.id,
      });
      setBody("");
      onSubmitted?.();
    } catch {
      toast.error("Erro ao enviar comentário");
    }
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="min-h-0 resize-none text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        size="icon"
        variant="ghost"
        className="shrink-0 self-end"
        onClick={handleSubmit}
        disabled={!body.trim() || addComment.isPending}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
