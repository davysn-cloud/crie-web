import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { BrandProfile } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const colorSchema = z.object({
  hex: z.string().min(4),
  name: z.string().min(1),
});

const schema = z.object({
  brand_name: z.string().optional(),
  tone_of_voice: z.string().optional(),
  target_audience: z.string().optional(),
  do_not_say: z.string().optional(),
  keywords: z.string().optional(),
  extra_guidelines: z.string().optional(),
  instagram_handle: z.string().optional(),
  colors: z.array(colorSchema),
});

type FormData = z.infer<typeof schema>;

export function BrandProfilePage() {
  const { currentWorkspaceId } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand_name: "",
      tone_of_voice: "",
      target_audience: "",
      do_not_say: "",
      keywords: "",
      extra_guidelines: "",
      instagram_handle: "",
      colors: [],
    },
  });

  const { fields: colorFields, append: addColor, remove: removeColor } = useFieldArray({
    control: form.control,
    name: "colors",
  });

  useEffect(() => {
    if (!currentWorkspaceId) return;

    async function load() {
      const { data } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("workspace_id", currentWorkspaceId!)
        .single();

      if (data) {
        const bp = data as BrandProfile;
        setProfileId(bp.id);
        form.reset({
          brand_name: bp.brand_name ?? "",
          tone_of_voice: bp.tone_of_voice ?? "",
          target_audience: bp.target_audience ?? "",
          do_not_say: bp.do_not_say?.join(", ") ?? "",
          keywords: bp.keywords?.join(", ") ?? "",
          extra_guidelines: bp.extra_guidelines ?? "",
          instagram_handle: bp.instagram_handle ?? "",
          colors: bp.colors ?? [],
        });
      }
      setLoading(false);
    }

    load();
  }, [currentWorkspaceId, form]);

  async function onSubmit(data: FormData) {
    if (!currentWorkspaceId) return;

    const payload = {
      brand_name: data.brand_name || null,
      tone_of_voice: data.tone_of_voice || null,
      target_audience: data.target_audience || null,
      do_not_say: data.do_not_say ? data.do_not_say.split(",").map((s) => s.trim()).filter(Boolean) : [],
      keywords: data.keywords ? data.keywords.split(",").map((s) => s.trim()).filter(Boolean) : [],
      extra_guidelines: data.extra_guidelines || null,
      instagram_handle: data.instagram_handle || null,
      colors: data.colors,
    };

    const { error } = profileId
      ? await supabase.from("brand_profiles").update(payload).eq("id", profileId)
      : await supabase.from("brand_profiles").insert({ ...payload, workspace_id: currentWorkspaceId });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Perfil da marca salvo!");
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Perfil da Marca</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Identidade */}
          <Card>
            <CardHeader>
              <CardTitle>Identidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="brand_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da marca</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Padaria do João" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagram_handle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input placeholder="@padaria_do_joao" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Tom e público */}
          <Card>
            <CardHeader>
              <CardTitle>Tom e público</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tone_of_voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom de voz</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Descontraído, acolhedor, usa gírias cariocas"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="target_audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público-alvo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Mulheres 25-45, mães, classe B, zona sul do RJ"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="do_not_say"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavras proibidas</FormLabel>
                    <FormControl>
                      <Input placeholder="Separadas por vírgula: barato, promoção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Palavras-chave</FormLabel>
                    <FormControl>
                      <Input placeholder="Separadas por vírgula: artesanal, fresquinho" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Cores */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Paleta de cores</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addColor({ hex: "#6B21A8", name: "" })}
              >
                <Plus className="mr-1 h-3 w-3" />
                Cor
              </Button>
            </CardHeader>
            <CardContent>
              {colorFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma cor adicionada</p>
              )}
              <div className="space-y-2">
                {colorFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`colors.${index}.hex`}
                      render={({ field }) => (
                        <input
                          type="color"
                          className="h-8 w-8 cursor-pointer rounded border"
                          {...field}
                        />
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`colors.${index}.name`}
                      render={({ field }) => (
                        <Input placeholder="Nome da cor" className="flex-1" {...field} />
                      )}
                    />
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {form.watch(`colors.${index}.hex`)}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeColor(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Diretrizes */}
          <Card>
            <CardHeader>
              <CardTitle>Diretrizes visuais</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="extra_guidelines"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações adicionais</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Estilo fotográfico, composição, tipografia preferida..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar perfil da marca"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
