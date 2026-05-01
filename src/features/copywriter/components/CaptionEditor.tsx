import { useState, useEffect } from "react";
import { Save, Send, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InstagramPreview } from "@/components/InstagramPreview";
import { IG_LIMITS, countVisibleChars, countEmojis, extractHashtags, truncateCaption } from "@/lib/instagram";
import { useCopyDraft } from "../hooks/useCopyDraft";

interface CaptionEditorProps {
  postCardId: string;
  postTitle: string;
  postType?: string | null;
}

export function CaptionEditor({ postCardId, postTitle, postType }: CaptionEditorProps) {
  const { latestVersion, autoSave, save, isSaving, requestApproval, isRequestingApproval } = useCopyDraft(postCardId);
  const [body, setBody] = useState("");
  const [firstComment, setFirstComment] = useState("");

  // Initialize from latest version
  useEffect(() => {
    if (latestVersion) {
      setBody(latestVersion.body ?? "");
    }
  }, [latestVersion]);

  const charCount = countVisibleChars(body);
  const emojiCount = countEmojis(body);
  const hashtags = extractHashtags(body);
  const { truncated } = truncateCaption(body);

  const isOverCharLimit = charCount > IG_LIMITS.CAPTION_MAX;
  const isOverHashtagLimit = hashtags.length > IG_LIMITS.MAX_HASHTAGS;

  function handleChange(newBody: string) {
    setBody(newBody);
    autoSave({ body: newBody, caption: null, hashtags: extractHashtags(newBody), firstComment });
  }

  function handleSave() {
    save({ body, caption: null, hashtags: extractHashtags(body), firstComment });
  }

  const igFormat = postType === "carrossel" ? "carousel"
    : postType === "story" ? "story"
    : postType === "reels" ? "reel"
    : "feed_1_1";

  return (
    <div className="flex gap-6">
      {/* Editor area */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{postTitle}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1">
              <Save className="h-3 w-3" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button size="sm" onClick={() => requestApproval()} disabled={isRequestingApproval || isOverCharLimit} className="gap-1">
              <Send className="h-3 w-3" />
              Solicitar aprovacao
            </Button>
          </div>
        </div>

        {/* Main textarea */}
        <Textarea
          value={body}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Escreva a legenda do post..."
          className="min-h-[250px] font-mono text-sm leading-relaxed"
          style={{ fontFamily: "var(--font-mono)" }}
          aria-label={`Legenda do post ${postTitle}`}
        />

        {/* Constraints bar */}
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
          <ConstraintBadge
            label="Caracteres"
            value={charCount}
            max={IG_LIMITS.CAPTION_MAX}
            isOver={isOverCharLimit}
          />
          <ConstraintBadge
            label="...ver mais"
            value={truncated ? "sim" : "nao"}
            isWarning={truncated}
          />
          <ConstraintBadge
            label="Emojis"
            value={emojiCount}
            max={IG_LIMITS.MAX_EMOJIS_SAFE}
            isWarning={emojiCount > IG_LIMITS.MAX_EMOJIS_SAFE}
          />
          <ConstraintBadge
            label="Hashtags"
            value={hashtags.length}
            max={IG_LIMITS.MAX_HASHTAGS}
            isOver={isOverHashtagLimit}
          />
        </div>

        {/* First comment field */}
        <div>
          <label className="mb-1 block text-sm font-medium">Primeiro comentario (hashtags)</label>
          <Textarea
            value={firstComment}
            onChange={(e) => setFirstComment(e.target.value)}
            placeholder="#hashtag1 #hashtag2 ..."
            className="min-h-[60px] text-sm"
            maxLength={IG_LIMITS.CAPTION_MAX}
          />
        </div>

        {/* TODO P1: Carousel script sheet mode */}
        {/* TODO P1: Hook library sidebar */}
        {/* TODO P1: CTA library sidebar */}
        {/* TODO P1: Brand voice card + checklist */}
        {/* TODO P1: Copy diff view between versions */}
      </div>

      {/* Live preview */}
      <div className="hidden shrink-0 xl:block">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Preview ao vivo</p>
        <InstagramPreview
          format={igFormat as "feed_1_1"}
          imageUrls={[""]}
          caption={body}
          size="sm"
        />
      </div>
    </div>
  );
}

function ConstraintBadge({
  label,
  value,
  max,
  isOver,
  isWarning,
}: {
  label: string;
  value: number | string;
  max?: number;
  isOver?: boolean;
  isWarning?: boolean;
}) {
  const Icon = isOver ? AlertCircle : isWarning ? AlertCircle : CheckCircle;
  const color = isOver
    ? "text-destructive"
    : isWarning
    ? "text-amber-600"
    : "text-green-600";

  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${color}`}>
      <Icon className="h-3 w-3" />
      {label}: {value}{max ? `/${max}` : ""}
    </Badge>
  );
}
