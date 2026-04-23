import { cn } from "@/lib/utils";

interface GridPost {
  id: string;
  thumbnailUrl: string | null;
  title: string;
  isHighlighted?: boolean;
}

interface GridPreviewProps {
  posts: GridPost[];
  columns?: number;
  onPostClick?: (postId: string) => void;
  className?: string;
}

/**
 * Instagram-style grid preview (3 columns, square crops).
 * Shows the latest posts as they appear on an IG profile page.
 */
export function GridPreview({
  posts,
  columns = 3,
  onPostClick,
  className,
}: GridPreviewProps) {
  // Pad to fill last row
  const padded = [...posts];
  while (padded.length % columns !== 0 && padded.length < columns * 4) {
    padded.push({ id: `empty-${padded.length}`, thumbnailUrl: null, title: "", isHighlighted: false });
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Profile header mock */}
      <div className="mb-3 flex items-center gap-3 px-2">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="flex gap-6 text-center text-xs">
            <div><span className="block font-bold">{posts.filter(p => p.thumbnailUrl).length}</span>publicacoes</div>
            <div><span className="block font-bold">--</span>seguidores</div>
            <div><span className="block font-bold">--</span>seguindo</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {padded.map((post) => (
          <button
            key={post.id}
            className={cn(
              "relative aspect-square overflow-hidden bg-muted",
              post.isHighlighted && "ring-2 ring-primary ring-offset-1",
              post.thumbnailUrl && onPostClick ? "cursor-pointer" : "cursor-default"
            )}
            onClick={() => post.thumbnailUrl && onPostClick?.(post.id)}
            aria-label={post.title || "Post vazio"}
            disabled={!post.thumbnailUrl}
          >
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt={post.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="h-full w-full bg-muted/50" />
            )}

            {post.isHighlighted && (
              <div className="absolute inset-0 border-2 border-primary bg-primary/10" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
