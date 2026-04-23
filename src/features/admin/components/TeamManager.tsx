import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeam, useInviteMember, useRemoveMember } from "../hooks/useTeam";
import { WORKSPACE_ROLES } from "@/lib/constants";

const inviteSchema = z.object({
  email: z.string().email("E-mail invalido"),
  display_name: z.string().min(2).max(80),
  role: z.enum(["strategist", "copywriter", "designer", "social_media", "admin"]),
});

type InviteInput = z.infer<typeof inviteSchema>;

export function TeamManager() {
  const { data: members = [], isLoading } = useTeam();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();
  const [inviteOpen, setInviteOpen] = useState(false);

  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", display_name: "", role: "copywriter" },
  });

  function onSubmit(data: InviteInput) {
    inviteMember.mutate(data, {
      onSuccess: () => {
        setInviteOpen(false);
        form.reset();
      },
    });
  }

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
        <h2 className="text-xl font-bold">Time ({members.length})</h2>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Convidar
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((member) => {
          const roleConfig = WORKSPACE_ROLES.find((r) => r.value === (member as { role?: string }).role);
          const isPending = !member.accepted_at;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url ?? undefined} />
                  <AvatarFallback>{member.display_name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.display_name}</p>
                  {member.invited_email && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {member.invited_email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {roleConfig && (
                  <Badge variant="secondary" className="text-[10px]">{roleConfig.label}</Badge>
                )}
                {isPending && (
                  <Badge variant="outline" className="text-[10px] text-amber-600">Pendente</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember.mutate(member.id)}
                  aria-label={`Remover ${member.display_name}`}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input {...form.register("display_name")} placeholder="Nome completo" />
              {form.formState.errors.display_name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.display_name.message}</p>
              )}
            </div>
            <div>
              <Label>E-mail</Label>
              <Input {...form.register("email")} type="email" placeholder="email@exemplo.com" />
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label>Funcao</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as InviteInput["role"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strategist">Estrategista</SelectItem>
                  <SelectItem value="copywriter">Copywriter</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Enviando..." : "Enviar convite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
