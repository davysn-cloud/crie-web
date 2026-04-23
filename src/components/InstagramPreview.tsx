import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { IG_FORMATS, truncateCaption, type IGFormat } from "@/lib/instagram";

interface InstagramPreviewProps {
  format: IGFormat;
  imageUrls: string[];
  caption?: string;
  handle?: string;
  profilePicUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onImageClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const SIZE_SCALES: Record<string, number> = {
  sm: 0.28,
  md: 0.45,
  lg: 0.6,
};

export function InstagramPreview({
  format,
  imageUrls,
  caption = "",
  handle = "marca",
  profilePicUrl,
  size = "md",
  className,
  onImageClick,
}: InstagramPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const formatConfig = IG_FORMATS[format] ?? IG_FORMATS.feed_1x1;
  const scale = SIZE_SCALES[size] ?? 0.45;
  const previewWidth = formatConfig.width * scale;
  const previewHeight = formatConfig.height * scale;
  const isCarousel = format === "carousel" && imageUrls.length > 1;
  const isStoryOrReel = format === "story" || format === "reel";

  const { text: truncatedCaption, truncated } = truncateCaption(caption);

  const currentImage = imageUrls[currentSlide] ?? "";

  return (
    <div className={cn("inline-flex flex-col bg-white rounded-lg shadow-sm border overflow-hidden", className)} style={{ width: previewWidth }}>
      {/* Header */}
      {!isStoryOrReel && (
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
            <div className="h-full w-full rounded-full bg-white p-[1px]">
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="h-full w-full rounded-full bg-muted" />
              )}
            </div>
          </div>
          <span className="text-xs font-semibold text-gray-900">@{handle}</span>
          <MoreHorizontal className="ml-auto h-4 w-4 text-gray-900" />
        </div>
      )}

      {/* Image area */}
      <div
        className="relative bg-gray-100 cursor-pointer"
        style={{
          width: previewWidth,
          height: isStoryOrReel ? previewHeight : previewWidth * (formatConfig.height / formatConfig.width),
        }}
        onClick={onImageClick}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt="Post preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}

        {/* Story/Reel chrome overlay */}
        {isStoryOrReel && (
          <>
            <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-3 pt-3">
              <div className="h-8 w-8 rounded-full border-2 border-white bg-muted" />
              <span className="text-xs font-semibold text-white drop-shadow">@{handle}</span>
            </div>
            {format === "story" && (
              <div className="absolute inset-x-0 top-0 flex gap-0.5 px-2 pt-1">
                {imageUrls.map((_, i) => (
                  <div key={i} className={cn("h-0.5 flex-1 rounded-full", i <= currentSlide ? "bg-white" : "bg-white/40")} />
                ))}
              </div>
            )}
            {format === "reel" && (
              <div className="absolute bottom-4 right-3 flex flex-col items-center gap-3">
                <Heart className="h-6 w-6 text-white drop-shadow" />
                <MessageCircle className="h-6 w-6 text-white drop-shadow" />
                <Send className="h-6 w-6 text-white drop-shadow" />
              </div>
            )}
          </>
        )}

        {/* Carousel indicators */}
        {isCarousel && (
          <>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
              {imageUrls.map((_, i) => (
                <button
                  key={i}
                  className={cn("h-1.5 w-1.5 rounded-full", i === currentSlide ? "bg-primary" : "bg-white/60")}
                  onClick={(e) => { e.stopPropagation(); setCurrentSlide(i); }}
                  aria-label={`Slide ${i + 1} de ${imageUrls.length}`}
                />
              ))}
            </div>
            {currentSlide > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs"
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(currentSlide - 1); }}
                aria-label="Slide anterior"
              >
                &#8249;
              </button>
            )}
            {currentSlide < imageUrls.length - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-black/30 text-white flex items-center justify-center text-xs"
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(currentSlide + 1); }}
                aria-label="Proximo slide"
              >
                &#8250;
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions + caption (feed only) */}
      {!isStoryOrReel && (
        <>
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-gray-900" />
              <MessageCircle className="h-5 w-5 text-gray-900" />
              <Send className="h-5 w-5 text-gray-900" />
            </div>
            <Bookmark className="h-5 w-5 text-gray-900" />
          </div>
          {caption && (
            <div className="px-3 pb-3">
              <p className="text-xs leading-relaxed text-gray-900">
                <span className="font-semibold">@{handle}</span>{" "}
                {truncated ? (
                  <>
                    {truncatedCaption}
                    <span className="text-muted-foreground"> ver mais</span>
                  </>
                ) : (
                  caption
                )}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
