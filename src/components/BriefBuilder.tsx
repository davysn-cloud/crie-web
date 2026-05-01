import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText, Calendar, Target, Users, Megaphone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { briefSchema, type BriefInput } from "@/types/brief";
import { BRIEF_OBJECTIVES, IG_FORMAT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface BriefBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScheduledAt?: Date;
  /** Pre-fill data for duplication */
  prefill?: Partial<BriefInput>;
}

export function BriefBuilder({ open, onOpenChange, defaultScheduledAt, prefill }: BriefBuilderProps) {
  const { currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();

  const form = useForm<BriefInput>({
    resolver: zodResolver(briefSchema) as any,
    defaultValues: {
      workspace_id: currentWorkspaceId ?? "",
      title: prefill?.title ?? "",
      objective: prefill?.objective ?? "awareness",
      pillar_id: prefill?.pillar_id ?? null,
      post_type: prefill?.post_type ?? "feed_1_1",
      target_audience: prefill?.target_audience ?? "",
      key_message: prefill?.key_message ?? "",
      cta: prefill?.cta ?? "",
      references: prefill?.references ?? [],
      deadline: prefill?.deadline ?? new Date(Date.now() + 7 * 86400000),
      scheduled_at: defaultScheduledAt ?? prefill?.scheduled_at ?? null,
      campaign_id: prefill?.campaign_id ?? null,
      copywriter_id: prefill?.copywriter_id ?? null,
      designer_id: prefill?.designer_id ?? null,
      hashtag_set_id: null,
    },
  });

  const createBrief = useMutation({
    mutationFn: async (data: BriefInput) => {
      // Create the post card first
      const { data: postCard, error: cardError } = await supabase
        .from("post_cards")
        .insert({
          workspace_id: data.workspace_id,
          title: data.title,
          stage: "briefing",
          post_type: data.post_type === "carousel" ? "carrossel" : data.post_type.startsWith("feed") ? "feed" : data.post_type,
          scheduled_at: data.scheduled_at?.toISOString() ?? null,
        })
        .select("id")
        .single();

      if (cardError) throw cardError;

      // Create the brief
      const { error: briefError } = await supabase
        .from("briefs")
        .insert({
          workspace_id: data.workspace_id,
          post_card_id: postCard.id,
          title: data.title,
          objective: data.objective,
          pillar_id: data.pillar_id,
          post_type: data.post_type,
          target_audience: data.target_audience,
          key_message: data.key_message,
          cta: data.cta,
          references: data.references,
          deadline: data.deadline.toISOString(),
          scheduled_at: data.scheduled_at?.toISOString() ?? null,
          campaign_id: data.campaign_id,
          copywriter_id: data.copywriter_id,
          designer_id: data.designer_id,
          hashtag_set_id: data.hashtag_set_id,
        });

      if (briefError) throw briefError;

      return postCard;
    },
    onSuccess: () => {
      toast.success("Brief criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["post-cards", currentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["calendar", currentWorkspaceId] });
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(`Erro ao criar brief: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    },
  });

  function onSubmit(data: BriefInput) {
    createBrief.mutate(data);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Brief
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titulo do post</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Lancamento colecao verao" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Objective */}
            <FormField
              control={form.control}
              name="objective"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Target className="h-3 w-3" /> Objetivo
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o objetivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BRIEF_OBJECTIVES.map((obj) => (
                        <SelectItem key={obj.value} value={obj.value}>
                          {obj.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Format */}
            <FormField
              control={form.control}
              name="post_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato Instagram</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IG_FORMAT_TYPES.map((fmt) => (
                        <SelectItem key={fmt.value} value={fmt.value}>
                          {fmt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target audience */}
            <FormField
              control={form.control}
              name="target_audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> Publico-alvo
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Descreva o publico-alvo..." className="min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Key message */}
            <FormField
              control={form.control}
              name="key_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Megaphone className="h-3 w-3" /> Mensagem-chave
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Qual a mensagem principal?" className="min-h-[80px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CTA */}
            <FormField
              control={form.control}
              name="cta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CTA (Call to Action)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Saiba mais no link da bio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deadline */}
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Prazo
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* TODO P1: pillar_id, campaign_id, copywriter_id, designer_id selectors */}
            {/* TODO P1: references upload */}

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={createBrief.isPending}>
                {createBrief.isPending ? "Criando..." : "Criar brief"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
