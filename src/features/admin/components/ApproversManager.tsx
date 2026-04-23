import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Link2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Approver } from "@/types/approver";

const approverSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(2).max(80),
  email: z.string().email(),
});

type ApproverInput = z.infer<typeof approverSchema>;

export function ApproversManager() {
  const { currentAgencyId, workspaces } = useAuthStore();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: approvers = [], isLoading } = useQuery({
    queryKey: ["approvers", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];
      // Fetch approvers for all workspaces in this agency
      const wsIds = workspaces.map((w) => w.id);
      if (wsIds.length === 0) return [];

      const { data, error } = await supabase
        .from("approvers")
        .select("*")
        .in("workspace_id", wsIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Approver[];
    },
    enabled: !!currentAgencyId,
  });

  const createApprover = useMutation({
    mutationFn: async (input: ApproverInput) => {
      // Create approver
      const { data: approver, error: approverError } = await supabase
        .from("approvers")
        .insert({
          workspace_id: input.workspace_id,
          name: input.name,
          email: input.email,
        })
        .select("id")
        .single();

      if (approverError) throw approverError;

      // Generate magic link
      const { error: linkError } = await supabase.functions.invoke("magic-link", {
        body: {
          action: "create",
          agency_id: currentAgencyId,
          workspace_id: input.workspace_id,
          email: input.email,
          label: input.name,
          purpose: "approval",
          expires_in_hours: 168,
        },
      });

      if (linkError) {
        toast.warning("Aprovador criado, mas falha ao gerar magic link");
      }

      return approver;
    },
    onSuccess: () => {
      toast.success("Aprovador cadastrado e link enviado");
      queryClient.invalidateQueries({ queryKey: ["approvers", currentAgencyId] });
      setCreateOpen(false);
    },
    onError: (err) => {
      toast.error(`Erro: ${err instanceof Error ? err.message : "Erro"}`);
    },
  });

  const form = useForm<ApproverInput>({
    resolver: zodResolver(approverSchema),
    defaultValues: {
      workspace_id: workspaces[0]?.id ?? "",
      name: "",
      email: "",
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aprovadores ({approvers.length})</h2>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Cadastrar aprovador
        </Button>
      </div>

      {approvers.length === 0 ? (
        <div className="py-12 text-center">
          <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Nenhum aprovador cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {approvers.map((approver) => {
            const ws = workspaces.find((w) => w.id === approver.workspace_id);
            return (
              <div key={approver.id} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">{approver.name}</p>
                  <p className="text-xs text-muted-foreground">{approver.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {ws && <Badge variant="secondary" className="text-[10px]">{ws.name}</Badge>}
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <Link2 className="h-3 w-3" /> Re-emitir link
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar aprovador</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createApprover.mutate(d))} className="space-y-4">
            <div>
              <Label>Marca</Label>
              <Select
                value={form.watch("workspace_id")}
                onValueChange={(v) => form.setValue("workspace_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>{ws.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome</Label>
              <Input {...form.register("name")} placeholder="Nome do aprovador" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input {...form.register("email")} type="email" placeholder="email@cliente.com" />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={createApprover.isPending}>
                {createApprover.isPending ? "Criando..." : "Cadastrar e enviar link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
