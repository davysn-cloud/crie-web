import { useState } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { BrandColor, BrandFont } from "@/types";

interface BrandColorPickerProps {
  colors: BrandColor[];
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}

export function BrandColorPicker({ colors, value, onChange, className }: BrandColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: value }} />
          <span className="text-xs">{value}</span>
          <Lock className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" /> Cores do brand kit
          </div>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((color) => (
              <button
                key={color.hex}
                className={cn(
                  "relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                  value === color.hex ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                )}
                style={{ backgroundColor: color.hex }}
                onClick={() => onChange(color.hex)}
                title={color.name}
                aria-label={`Selecionar cor ${color.name} (${color.hex})`}
              >
                {value === color.hex && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
          {colors.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">
              Nenhuma cor cadastrada no brand kit
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface BrandFontPickerProps {
  fonts: BrandFont[];
  value: string;
  onChange: (family: string) => void;
  className?: string;
}

export function BrandFontPicker({ fonts, value, onChange, className }: BrandFontPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <span className="text-xs" style={{ fontFamily: value }}>{value || "Fonte"}</span>
          <Lock className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" /> Fontes do brand kit
          </div>
          <div className="space-y-1">
            {fonts.map((font) => (
              <button
                key={font.family}
                className={cn(
                  "w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                  value === font.family ? "bg-primary/10 text-primary font-medium" : ""
                )}
                style={{ fontFamily: font.family }}
                onClick={() => { onChange(font.family); setOpen(false); }}
              >
                {font.family}
                {font.usage && (
                  <span className="block text-[10px] text-muted-foreground">{font.usage}</span>
                )}
              </button>
            ))}
            {fonts.length === 0 && (
              <p className="text-xs text-muted-foreground py-2 text-center">
                Nenhuma fonte cadastrada no brand kit
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
