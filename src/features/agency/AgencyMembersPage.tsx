import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { WORKSPACE_ROLES } from "@/lib/constants";
import type { AgencyMember } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const inviteSchema = z.object({
  email: z.email("Email inválido"),
  display_name: z.string().min(2, "Mínimo 2 caracteres"),
  default_role: z.string().min(1, "Selecione um papel"),
});

type InviteData = z.infer<typeof inviteSchema>;

interface Invite {
  id: string;
  agency_id: string;
  email: string;
  display_name: string;
  default_role: string;
  accepted_at: string | null;
  created_at: string;
}

export function AgencyMembersPage() {
  const { currentAgencyId, user } = useAuthStore();
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  const form = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", display_name: "", default_role: "copywriter" },
  });

  async function loadData() {
    if (!currentAgencyId) return;

    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("agency_members")
        .select("*")
        .eq("agency_id", currentAgencyId)
        .order("created_at"),
      supabase
        .from("agency_invites")
        .select("*")
        .eq("agency_id", currentAgencyId)
        .is("accepted_at", null)
        .order("created_at"),
    ]);

    if (membersRes.data) setMembers(membersRes.data);
    if (invitesRes.data) setInvites(invitesRes.data);
  }

  useEffect(() => {
    loadData();
  }, [currentAgencyId]);

  async function onInvite(data: InviteData) {
    if (!currentAgencyId || !user) return;

    const { error } = await supabase.from("agency_invites").insert({
      agency_id: currentAgencyId,
      email: data.email,
      display_name: data.display_name,
      default_role: data.default_role,
      invited_by: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Este email já foi convidado");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success(`Convite enviado para ${data.email}`);
      form.reset();
      await loadData();
    }
  }

  async function cancelInvite(inviteId: string) {
    const { error } = await supabase
      .from("agency_invites")
      .delete()
      .eq("id", inviteId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Convite cancelado");
      await loadData();
    }
  }

  const roleLabel = (role: string) =>
    WORKSPACE_ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold">Membros da Agência</h2>

      {/* Formulario de convite */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Convidar membro</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
              <div className="flex gap-3">
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do membro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-end gap-3">
                <FormField
                  control={form.control}
                  name="default_role"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Papel padrão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o papel" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WORKSPACE_ROLES.filter((r) => r.value !== "owner").map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Enviando..." : "Convidar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                O convidado receberá acesso ao criar uma conta com este email.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Membros ativos */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Membros ativos ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {m.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.display_name}</p>
                </div>
                {m.user_id === user?.id && (
                  <Badge variant="outline" className="text-[10px]">Você</Badge>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nenhum membro ainda.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Convites pendentes */}
      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Convites pendentes ({invites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {inv.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{inv.display_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.email}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {roleLabel(inv.default_role)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    title="Copiar link de convite"
                    onClick={() => {
                      const link = `${window.location.origin}/signup/member?invite=${inv.id}`;
                      navigator.clipboard.writeText(link);
                      toast.success("Link copiado!");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Cancelar convite"
                    onClick={() => cancelInvite(inv.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
