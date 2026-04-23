import { useState, useCallback } from "react";
import { Download, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MultiFormatCanvas } from "@/components/MultiFormatCanvas";
import { CarouselSlideBuilder, type CarouselSlide } from "@/components/CarouselSlideBuilder";
import { BrandColorPicker } from "@/components/BrandKitLockedPicker";
import { useCanvasStore } from "@/stores/useCanvasStore";
import { useAssetUpload } from "../hooks/useAssetUpload";
import { IG_FORMATS, type IGFormat } from "@/lib/instagram";
import { IG_FORMAT_TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { PostCard } from "@/types";

interface CanvasEditorProps {
  postCard: PostCard;
}

export function CanvasEditor({ postCard }: CanvasEditorProps) {
  const { activeFormat, setActiveFormat, showSafeZones, toggleSafeZones } = useCanvasStore();
  const assetUpload = useAssetUpload();
  const [imageUrl, setImageUrl] = useState<string | null>(
    postCard.asset_versions?.[0]?.file_url ?? null
  );
  const [slides, setSlides] = useState<CarouselSlide[]>([
    { id: "slide-1", index: 1, imageUrl: null },
    { id: "slide-2", index: 2, imageUrl: null },
  ]);
  const [selectedSlide, setSelectedSlide] = useState(0);

  const handleImageUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    // Upload to storage
    assetUpload.mutate({
      postCardId: postCard.id,
      file,
      format: activeFormat,
    });
  }, [postCard.id, activeFormat, assetUpload]);

  async function handleRequestApproval() {
    const { error } = await supabase
      .from("post_cards")
      .update({ stage: "aprovacao_arte" })
      .eq("id", postCard.id);

    if (error) {
      toast.error("Erro ao solicitar aprovacao");
    } else {
      toast.success("Aprovacao de arte solicitada");
    }
  }

  async function handleExport() {
    // For MVP: download the current image
    if (!imageUrl) {
      toast.error("Nenhuma imagem para exportar");
      return;
    }

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${postCard.title.replace(/[^a-z0-9]/gi, "_")}_${activeFormat}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download iniciado");
    } catch {
      toast.error("Erro ao exportar");
    }
  }

  const isCarousel = activeFormat === "carousel";

  return (
    <div className="space-y-4">
      {/* Format selector bar */}
      <div className="flex flex-wrap gap-1">
        {IG_FORMAT_TYPES.map((fmt) => (
          <Button
            key={fmt.value}
            variant={activeFormat === fmt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFormat(fmt.value as IGFormat)}
            className="text-xs"
          >
            {fmt.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col items-center gap-4">
          {isCarousel ? (
            <>
              <CarouselSlideBuilder
                slides={slides}
                onSlidesChange={setSlides}
                selectedIndex={selectedSlide}
                onSelectSlide={setSelectedSlide}
              />
              <MultiFormatCanvas
                imageUrl={slides[selectedSlide]?.imageUrl ?? undefined}
                onImageUpload={(file) => {
                  const url = URL.createObjectURL(file);
                  setSlides(
                    slides.map((s, i) =>
                      i === selectedSlide ? { ...s, imageUrl: url, file } : s
                    )
                  );
                }}
              />
            </>
          ) : (
            <MultiFormatCanvas
              imageUrl={imageUrl ?? undefined}
              onImageUpload={handleImageUpload}
            />
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Brand kit */}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Brand Kit</h4>
            {/* TODO: load brand kit from workspace brand_profiles */}
            <BrandColorPicker
              colors={[
                { hex: "#6366f1", name: "Primary" },
                { hex: "#f59e0b", name: "Accent" },
                { hex: "#10b981", name: "Success" },
              ]}
              value="#6366f1"
              onChange={(hex) => { /* TODO: apply to canvas */ console.log("Color:", hex); }}
            />
          </div>

          <Separator />

          {/* Format info */}
          <div>
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">Formato</h4>
            <div className="space-y-1 text-xs">
              <p>{IG_FORMATS[activeFormat].label}</p>
              <p className="text-muted-foreground">
                {IG_FORMATS[activeFormat].width} x {IG_FORMATS[activeFormat].height}px
              </p>
            </div>
          </div>

          <Separator />

          {/* Controls */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 text-xs"
              onClick={toggleSafeZones}
            >
              <Shield className="h-3 w-3" />
              Safe zones: {showSafeZones ? "ON" : "OFF"}
            </Button>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleExport}>
              <Download className="h-3 w-3" /> Exportar
            </Button>
            <Button size="sm" className="w-full gap-1" onClick={handleRequestApproval}>
              <Send className="h-3 w-3" /> Pedir aprovacao
            </Button>
          </div>

          {/* Upload progress */}
          {assetUpload.isPending && (
            <Badge variant="secondary" className="w-full justify-center">
              Enviando imagem...
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
