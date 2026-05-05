import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const schema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

interface InviteInfo {
  id: string;
  agency_id: string;
  display_name: string;
  email: string;
  default_role: string;
  agency_name: string;
}

export function MemberSignUpPage() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("invite");
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [invalidInvite, setInvalidInvite] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    async function loadInvite() {
      if (!inviteId) {
        setInvalidInvite(true);
        setLoadingInvite(false);
        return;
      }

      // RPC SECURITY DEFINER — acessível para anon, retorna nome da agência
      // sem abrir RLS em agencies para usuários não autenticados.
      const { data, error } = await supabase
        .rpc("get_invite_info", { p_invite_id: inviteId })
        .single<InviteInfo>();

      if (error || !data) {
        setInvalidInvite(true);
      } else {
        setInvite({
          id: data.id,
          agency_id: data.agency_id,
          display_name: data.display_name,
          email: data.email,
          default_role: data.default_role,
          agency_name: data.agency_name ?? "Agência",
        });
        form.setValue("email", data.email);
      }
      setLoadingInvite(false);
    }

    loadInvite();
  }, [inviteId, form]);

  async function onSubmit(data: FormData) {
    if (!invite) return;
    setError("");

    // 1. Create the auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          invite_id: invite.id,
          display_name: invite.display_name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      // Email confirmation required — user will complete after confirming
      setSuccess(true);
      return;
    }

    // 2. Add as agency_member (with role from invite)
    const { error: memberError } = await supabase.from("agency_members").insert({
      agency_id: invite.agency_id,
      user_id: userId,
      display_name: invite.display_name,
      role: invite.default_role,
      accepted_at: new Date().toISOString(),
    });

    if (memberError && !memberError.message.includes("duplicate")) {
      console.error("Failed to create agency member:", memberError);
    }

    // 3. Add to all agency workspaces as workspace_member with the same role
    const { data: agencyWorkspaces } = await supabase
      .from("workspaces")
      .select("id")
      .eq("agency_id", invite.agency_id)
      .eq("archived", false);

    if (agencyWorkspaces && agencyWorkspaces.length > 0) {
      const wsMembers = agencyWorkspaces.map((ws) => ({
        workspace_id: ws.id,
        user_id: userId,
        role: invite.default_role,
      }));

      const { error: wsError } = await supabase
        .from("workspace_members")
        .insert(wsMembers);

      if (wsError && !wsError.message.includes("duplicate")) {
        console.error("Failed to add to workspaces:", wsError);
      }
    }

    // 4. Mark invite as accepted
    await supabase
      .from("agency_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    setSuccess(true);
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (invalidInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Convite inválido</CardTitle>
            <CardDescription>
              Este link de convite é inválido ou já foi utilizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary">Conta criada!</CardTitle>
            <CardDescription>
              Verifique seu email para confirmar a conta, depois faça login para acessar <strong>{invite?.agency_name}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/login")}>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Crie!</CardTitle>
          <CardDescription>
            Você foi convidado para a agência <strong>{invite?.agency_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg bg-primary/5 p-3 text-sm">
            <p><strong>Nome:</strong> {invite?.display_name}</p>
            <p><strong>Email:</strong> {invite?.email}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Crie uma senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Criando conta..." : "Criar conta"}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta? <Link to="/login" className="hover:text-primary">Entrar</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
