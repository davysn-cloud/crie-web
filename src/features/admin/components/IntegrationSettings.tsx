import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

export function IntegrationSettings() {
  const { currentAgencyId, workspaces } = useAuthStore();
  // Check Meta connection status per workspace
  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["meta-connections", currentAgencyId],
    queryFn: async () => {
      const wsIds = workspaces.map((w) => w.id);
      if (wsIds.length === 0) return [];

      const { data, error } = await supabase
        .from("agency_integrations")
        .select("*")
        .in("workspace_id", wsIds)
        .eq("provider", "meta");

      if (error) {
        // Table may not exist yet
        console.warn("agency_integrations table not available:", error.message);
        return [];
      }
      return data ?? [];
    },
    enabled: !!currentAgencyId,
  });

  const connectMeta = useMutation({
    mutationFn: async (workspaceId: string) => {
      // Redirect to Meta OAuth
      // In production, this would call an edge function that generates the OAuth URL
      const { data, error } = await supabase.functions.invoke("magic-link", {
        body: {
          action: "initiate_meta_oauth",
          workspace_id: workspaceId,
          agency_id: currentAgencyId,
        },
      });

      if (error) throw error;

      // Redirect to OAuth URL
      if (data?.oauth_url) {
        window.open(data.oauth_url, "_blank");
      } else {
        toast.info("OAuth Meta ainda nao configurado. Configure as credenciais Meta App primeiro.");
      }
    },
    onError: () => {
      toast.error("Erro ao iniciar conexao com Instagram");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Integracoes</h2>

      {/* Meta/Instagram connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Camera className="h-4 w-4" />
            Instagram Business
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Conecte a conta Instagram Business de cada marca para publicacao automatica via Meta Graph API.
          </p>

          {workspaces.map((ws) => {
            const connection = connections.find((c: { workspace_id: string }) => c.workspace_id === ws.id);
            const isConnected = !!connection;
            const isExpiring = connection && new Date(connection.expires_at) < new Date(Date.now() + 14 * 86400000);

            return (
              <div key={ws.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {ws.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ws.name}</p>
                    {isConnected ? (
                      <div className="flex items-center gap-1 text-xs">
                        {isExpiring ? (
                          <>
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-600">Token expirando</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-green-600">Conectado</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Nao conectado</p>
                    )}
                  </div>
                </div>
                <Button
                  variant={isConnected ? "outline" : "default"}
                  size="sm"
                  onClick={() => connectMeta.mutate(ws.id)}
                  className="gap-1"
                >
                  {isConnected ? (
                    <>
                      <RefreshCw className="h-3 w-3" /> Reconectar
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-3 w-3" /> Conectar
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* TODO P1: API keys management (Resend, Stripe, LLM) */}
      {/* TODO P1: Webhook settings (Slack/Discord) */}
      {/* TODO P2: White-label settings */}
    </div>
  );
}
