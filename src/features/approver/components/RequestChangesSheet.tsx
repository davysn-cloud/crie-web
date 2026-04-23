import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRequestChanges } from "../hooks/useRequestChanges";

const schema = z.object({
  reason: z.enum(["copy", "art", "timing", "other"], { error: "Selecione um motivo" }),
  note: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const REASONS = [
  { value: "copy" as const, label: "Texto / legenda", emoji: "📝" },
  { value: "art" as const, label: "Arte / imagem", emoji: "🎨" },
  { value: "timing" as const, label: "Horario / data", emoji: "🕐" },
  { value: "other" as const, label: "Outro", emoji: "💬" },
];

interface RequestChangesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postCardId: string;
}

export function RequestChangesSheet({ open, onOpenChange, postCardId }: RequestChangesSheetProps) {
  const requestChanges = useRequestChanges();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormData) {
    requestChanges.mutate(
      { post_card_id: postCardId, reason: data.reason, note: data.note },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  }

  const selectedReason = form.watch("reason");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Pedir ajuste</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <Label className="text-sm font-medium">O que precisa mudar?</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-3 text-left text-sm transition-colors ${
                    selectedReason === r.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                  onClick={() => form.setValue("reason", r.value)}
                  aria-label={r.label}
                >
                  <span className="text-lg">{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            {form.formState.errors.reason && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="note" className="text-sm font-medium">
              Detalhes (opcional)
            </Label>
            <Textarea
              id="note"
              {...form.register("note")}
              placeholder="Descreva o que precisa ser alterado..."
              className="mt-1 min-h-[80px]"
              maxLength={500}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base gap-2"
            disabled={requestChanges.isPending}
          >
            <Send className="h-4 w-4" />
            {requestChanges.isPending ? "Enviando..." : "Enviar pedido de ajuste"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
