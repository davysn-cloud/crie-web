import { useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IG_LIMITS } from "@/lib/instagram";

export interface CarouselSlide {
  id: string;
  index: number;
  imageUrl: string | null;
  file?: File;
}

interface CarouselSlideBuilderProps {
  slides: CarouselSlide[];
  onSlidesChange: (slides: CarouselSlide[]) => void;
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
}

export function CarouselSlideBuilder({
  slides,
  onSlidesChange,
  selectedIndex,
  onSelectSlide,
}: CarouselSlideBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = slides.findIndex((s) => s.id === active.id);
    const newIndex = slides.findIndex((s) => s.id === over.id);
    const newSlides = arrayMove(slides, oldIndex, newIndex).map((s, i) => ({ ...s, index: i + 1 }));
    onSlidesChange(newSlides);
  }

  function addSlide() {
    if (slides.length >= IG_LIMITS.MAX_CAROUSEL_SLIDES) return;
    const newSlide: CarouselSlide = {
      id: `slide-${Date.now()}`,
      index: slides.length + 1,
      imageUrl: null,
    };
    onSlidesChange([...slides, newSlide]);
    onSelectSlide(slides.length);
  }

  function removeSlide(id: string) {
    if (slides.length <= IG_LIMITS.MIN_CAROUSEL_SLIDES) return;
    const newSlides = slides.filter((s) => s.id !== id).map((s, i) => ({ ...s, index: i + 1 }));
    onSlidesChange(newSlides);
    if (selectedIndex >= newSlides.length) {
      onSelectSlide(newSlides.length - 1);
    }
  }

  function handleImageUpload(slideId: string, file: File) {
    const url = URL.createObjectURL(file);
    onSlidesChange(
      slides.map((s) => (s.id === slideId ? { ...s, imageUrl: url, file } : s))
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Slides ({slides.length}/{IG_LIMITS.MAX_CAROUSEL_SLIDES})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={addSlide}
          disabled={slides.length >= IG_LIMITS.MAX_CAROUSEL_SLIDES}
        >
          <Plus className="mr-1 h-3 w-3" /> Adicionar slide
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-5 gap-2">
            {slides.map((slide, i) => (
              <SortableSlide
                key={slide.id}
                slide={slide}
                isSelected={i === selectedIndex}
                canDelete={slides.length > IG_LIMITS.MIN_CAROUSEL_SLIDES}
                onSelect={() => onSelectSlide(i)}
                onRemove={() => removeSlide(slide.id)}
                onImageUpload={(file) => handleImageUpload(slide.id, file)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableSlide({
  slide,
  isSelected,
  canDelete,
  onSelect,
  onRemove,
  onImageUpload,
}: {
  slide: CarouselSlide;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onImageUpload: (file: File) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-square cursor-pointer rounded-lg border-2 overflow-hidden transition-all",
        isSelected ? "border-primary ring-2 ring-primary/30" : "border-border",
        isDragging ? "opacity-50 z-50" : ""
      )}
      onClick={onSelect}
    >
      {slide.imageUrl ? (
        <img src={slide.imageUrl} alt={`Slide ${slide.index}`} className="h-full w-full object-cover" />
      ) : (
        <button
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          aria-label={`Upload slide ${slide.index}`}
        >
          <Upload className="h-5 w-5" />
          <span className="text-[10px]">{slide.index}</span>
        </button>
      )}

      {/* Drag handle */}
      <button
        className="absolute left-0.5 top-0.5 rounded bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        {...attributes}
        {...listeners}
        aria-label={`Arrastar slide ${slide.index}`}
      >
        <GripVertical className="h-3 w-3 text-white" />
      </button>

      {/* Remove button */}
      {canDelete && (
        <button
          className="absolute right-0.5 top-0.5 rounded bg-destructive/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remover slide ${slide.index}`}
        >
          <Trash2 className="h-3 w-3 text-white" />
        </button>
      )}

      {/* Index label */}
      <div className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[9px] font-bold text-white">
        {slide.index}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImageUpload(file);
        }}
      />
    </div>
  );
}
