import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Circle, MessageSquare } from "lucide-react";
import { useComments, useResolveComment } from "./hooks/useComments";
import { CommentInput } from "./CommentInput";
import type { Comment } from "@/types/comments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentThreadProps {
  targetType: Comment["target_type"];
  targetId: string;
}

export function CommentThread({ targetType, targetId }: CommentThreadProps) {
  const { data: comments = [] } = useComments(targetType, targetId);
  const resolveComment = useResolveComment();

  // Separar root comments e replies
  const rootComments = comments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, Comment[]>();
  for (const c of comments) {
    if (c.parent_id) {
      const existing = repliesMap.get(c.parent_id) ?? [];
      existing.push(c);
      repliesMap.set(c.parent_id, existing);
    }
  }

  return (
    <div className="space-y-4">
      <CommentInput targetType={targetType} targetId={targetId} />

      <ScrollArea className="max-h-96">
        <div className="space-y-3">
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesMap.get(comment.id) ?? []}
              targetType={targetType}
              targetId={targetId}
              onResolve={(resolved) =>
                resolveComment.mutate({ commentId: comment.id, resolved })
              }
            />
          ))}
          {rootComments.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhum comentário ainda
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  targetType,
  targetId,
  onResolve,
}: {
  comment: Comment;
  replies: Comment[];
  targetType: Comment["target_type"];
  targetId: string;
  onResolve: (resolved: boolean) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const initials = (comment.author_id ?? "??").slice(0, 2).toUpperCase();
  const isPinComment = comment.pin_x != null && comment.pin_y != null;

  return (
    <div className={`rounded-lg border p-3 ${comment.resolved ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2">
        <Avatar className="mt-0.5 h-6 w-6">
          <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isPinComment && (
              <span className="rounded bg-accent/20 px-1 py-0.5 text-[9px] font-medium text-accent-foreground">
                Pin
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap text-sm">{comment.body}</p>

          <div className="mt-1 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-[10px] text-muted-foreground"
              onClick={() => setShowReply(!showReply)}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              Responder {replies.length > 0 && `(${replies.length})`}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1 text-[10px] text-muted-foreground"
              onClick={() => onResolve(!comment.resolved)}
            >
              {comment.resolved ? (
                <><CheckCircle2 className="mr-1 h-3 w-3 text-green-600" /> Resolvido</>
              ) : (
                <><Circle className="mr-1 h-3 w-3" /> Resolver</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-muted pl-3">
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2">
              <Avatar className="mt-0.5 h-5 w-5">
                <AvatarFallback className="text-[8px]">
                  {(reply.author_id ?? "??").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(reply.created_at), "dd/MM HH:mm", { locale: ptBR })}
                </span>
                <p className="whitespace-pre-wrap text-xs">{reply.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showReply && (
        <div className="ml-8 mt-2">
          <CommentInput
            targetType={targetType}
            targetId={targetId}
            parentId={comment.id}
            placeholder="Responder..."
            onSubmitted={() => setShowReply(false)}
          />
        </div>
      )}
    </div>
  );
}
