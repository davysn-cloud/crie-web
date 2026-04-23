import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Archive, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrands, useCreateBrand, useArchiveBrand } from "../hooks/useBrands";

const createBrandSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/, "Apenas letras minusculas, numeros e hifens"),
  colors: z.string().optional(), // comma-separated hex, simplified for MVP
  logo_url: z.string().url().optional().or(z.literal("")),
});

type CreateBrandInput = z.infer<typeof createBrandSchema>;

export function BrandsManager() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const archiveBrand = useArchiveBrand();
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<CreateBrandInput>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: { name: "", slug: "", colors: "", logo_url: "" },
  });

  function onSubmit(data: CreateBrandInput) {
    const colors = data.colors
      ? data.colors.split(",").map((hex, i) => ({ hex: hex.trim(), name: `Cor ${i + 1}` }))
      : [];

    createBrand.mutate(
      { name: data.name, slug: data.slug, colors, logo_url: data.logo_url || undefined },
      {
        onSuccess: () => {
          setCreateOpen(false);
          form.reset();
        },
      }
    );
  }

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    form.setValue("name", name);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    form.setValue("slug", slug);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const activeBrands = brands.filter((b) => !b.archived);
  const archivedBrands = brands.filter((b) => b.archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Marcas ({activeBrands.length})</h2>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nova marca
        </Button>
      </div>

      {activeBrands.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma marca cadastrada</p>
            <Button onClick={() => setCreateOpen(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Criar primeira marca
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activeBrands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {brand.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{brand.name}</p>
                  <p className="text-xs text-muted-foreground">/{brand.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">Ativa</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveBrand.mutate(brand.id)}
                  aria-label={`Arquivar ${brand.name}`}
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {archivedBrands.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Arquivadas ({archivedBrands.length})</h3>
          {archivedBrands.map((brand) => (
            <div key={brand.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3 opacity-60">
              <p className="text-sm">{brand.name}</p>
              <Badge variant="outline" className="text-[10px]">Arquivada</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova marca</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                {...form.register("name")}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nome da marca"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label>Slug</Label>
              <Input {...form.register("slug")} placeholder="nome-da-marca" />
              {form.formState.errors.slug && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
            <div>
              <Label>Cores do brand kit (hex separados por virgula)</Label>
              <Input {...form.register("colors")} placeholder="#6366f1, #f59e0b, #10b981" />
            </div>
            <div>
              <Label>URL do logo (opcional)</Label>
              <Input {...form.register("logo_url")} placeholder="https://..." />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={createBrand.isPending}>
                {createBrand.isPending ? "Criando..." : "Criar marca"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
