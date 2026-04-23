import { useRef, useState, useCallback } from "react";
import { Upload, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IG_FORMATS, IG_SAFE_ZONES } from "@/lib/instagram";
import { useCanvasStore } from "@/stores/useCanvasStore";

interface MultiFormatCanvasProps {
  imageUrl?: string;
  onImageUpload?: (file: File) => void;
  onCropChange?: (crop: { x: number; y: number; width: number; height: number }) => void;
  className?: string;
}

export function MultiFormatCanvas({
  imageUrl,
  onImageUpload,
  className,
}: MultiFormatCanvasProps) {
  const { activeFormat, zoom, showSafeZones, setZoom } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const formatConfig = IG_FORMATS[activeFormat];
  const scale = zoom / 100;

  // Max preview size
  const maxWidth = 600;
  const baseScale = maxWidth / formatConfig.width;
  const displayWidth = formatConfig.width * baseScale * scale;
  const displayHeight = formatConfig.height * baseScale * scale;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageUrl) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  }, [imageUrl, dragOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset({
      x: dragStart.current.offsetX + (e.clientX - dragStart.current.x),
      y: dragStart.current.offsetY + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Safe zones
  const safeZone = activeFormat === "story"
    ? IG_SAFE_ZONES.story
    : activeFormat === "reel"
    ? IG_SAFE_ZONES.reel
    : null;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Canvas area */}
      <div
        className="relative overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30"
        style={{ width: displayWidth, height: displayHeight }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Canvas image"
            className="absolute h-full w-full object-cover"
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            draggable={false}
          />
        ) : (
          <button
            className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload de imagem"
          >
            <Upload className="h-10 w-10" />
            <span className="text-sm font-medium">Clique para fazer upload</span>
            <span className="text-xs">{formatConfig.width} x {formatConfig.height}px</span>
          </button>
        )}

        {/* Safe zones overlay */}
        {showSafeZones && safeZone && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 bg-red-500/15 border-b border-dashed border-red-400"
              style={{ height: safeZone.top * baseScale * scale }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-red-500/15 border-t border-dashed border-red-400"
              style={{ height: safeZone.bottom * baseScale * scale }}
            />
          </>
        )}

        {/* Format label */}
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
          {formatConfig.label} ({formatConfig.width}x{formatConfig.height})
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(zoom - 25)}
          disabled={zoom <= 25}
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-sm font-medium">{zoom}%</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setZoom(zoom + 25)}
          disabled={zoom >= 400}
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => { setZoom(100); setDragOffset({ x: 0, y: 0 }); }}
          aria-label="Ajustar ao tamanho"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        {imageUrl && (
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1 h-3 w-3" /> Trocar imagem
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
