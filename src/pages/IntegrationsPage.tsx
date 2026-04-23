import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgencyIntegration {
  id: string;
  agency_id: string;
  workspace_id: string | null;
  provider: string;
  provider_account_id: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  metadata_json: Record<string, unknown> | null;
  status: "active" | "expired" | "revoked" | "error";
  created_at: string;
  updated_at: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useIntegrations() {
  const { currentAgencyId } = useAuthStore();
  return useQuery({
    queryKey: ["integrations", currentAgencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agency_integrations")
        .select("*")
        .eq("agency_id", currentAgencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AgencyIntegration[];
    },
    enabled: !!currentAgencyId,
  });
}

function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agency_integrations")
        .update({ status: "revoked" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integracao desconectada");
    },
    onError: () => {
      toast.error("Erro ao desconectar");
    },
  });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

type ConnStatus = "connected" | "expiring" | "disconnected";

function getConnStatus(integration: AgencyIntegration | undefined): ConnStatus {
  if (!integration || integration.status === "revoked" || integration.status === "error") {
    return "disconnected";
  }
  if (integration.token_expires_at) {
    const expires = new Date(integration.token_expires_at);
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    if (expires < new Date()) return "disconnected";
    if (expires < threeDays) return "expiring";
  }
  return "connected";
}

const CONN_STYLE: Record<ConnStatus, { label: string; color: string; bg: string; dot: string }> = {
  connected:    { label: "Conectado",      color: CRIE.emerald, bg: "#F0FDF4", dot: CRIE.emerald },
  expiring:     { label: "Expirando",      color: CRIE.amber,   bg: "#FFFBEB", dot: CRIE.amber },
  disconnected: { label: "Nao conectado",  color: CRIE.muted,   bg: CRIE.lineSoft, dot: CRIE.mutedSoft },
};

function StatusBadge({ status }: { status: ConnStatus }) {
  const s = CONN_STYLE[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: s.color, background: s.bg, padding: "3px 10px", borderRadius: 999 }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot, flexShrink: 0 }} aria-hidden="true" />
      {s.label}
    </span>
  );
}

// ─── Provider Logo (SVG placeholders) ─────────────────────────────────────────

function ProviderLogo({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    instagram: "#E1306C",
    stripe:    "#635BFF",
    resend:    "#000000",
    slack:     "#4A154B",
    discord:   "#5865F2",
  };
  const initials: Record<string, string> = {
    instagram: "IG",
    stripe:    "ST",
    resend:    "RS",
    slack:     "SL",
    discord:   "DS",
  };
  const color = colors[provider] ?? CRIE.muted;
  const label = initials[provider] ?? provider.slice(0, 2).toUpperCase();

  return (
    <div
      style={{ width: 48, height: 48, borderRadius: 14, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", flexShrink: 0, letterSpacing: -0.5 }}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

// ─── Integration Card ─────────────────────────────────────────────────────────

interface IntegrationCardProps {
  provider: string;
  title: string;
  description: string;
  integration?: AgencyIntegration;
  workspaceName?: string;
  comingSoon?: boolean;
  onConnect?: () => void;
  onDisconnect?: (id: string) => void;
  externalLink?: string;
}

function IntegrationCard({
  provider,
  title,
  description,
  integration,
  workspaceName,
  comingSoon,
  onConnect,
  onDisconnect,
  externalLink,
}: IntegrationCardProps) {
  const status = getConnStatus(integration);

  function formatExpiry(iso: string | null) {
    if (!iso) return null;
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso));
  }

  return (
    <PCard>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <ProviderLogo provider={provider} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink }}>{title}</span>
            {comingSoon && (
              <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: CRIE.lineSoft, color: CRIE.muted }}>
                Em breve
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: CRIE.muted, marginBottom: 10, lineHeight: 1.5 }}>{description}</div>

          {workspaceName && status === "connected" && (
            <div style={{ fontSize: 12, color: CRIE.inkSoft, marginBottom: 8 }}>
              Marca: <strong>{workspaceName}</strong>
            </div>
          )}

          {integration?.token_expires_at && status !== "disconnected" && (
            <div style={{ fontSize: 11, color: status === "expiring" ? CRIE.amber : CRIE.muted, marginBottom: 8 }}>
              Token expira em: {formatExpiry(integration.token_expires_at)}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {!comingSoon && <StatusBadge status={status} />}

            {!comingSoon && status === "disconnected" && onConnect && (
              <Btn variant="butter" size="sm" onClick={onConnect}>
                Conectar
              </Btn>
            )}

            {!comingSoon && status !== "disconnected" && integration && (
              <>
                {externalLink && (
                  <a
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: CRIE.sky, textDecoration: "none" }}
                  >
                    Abrir dashboard
                  </a>
                )}
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => onDisconnect?.(integration.id)}
                  style={{ color: CRIE.rose }}
                >
                  Desconectar
                </Btn>
              </>
            )}
          </div>
        </div>
      </div>
    </PCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function IntegrationsPage() {
  const { data: integrations = [], isLoading } = useIntegrations();
  const { workspaces, agencies, currentAgencyId } = useAuthStore();
  const disconnect = useDisconnectIntegration();

  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  const agency = (membership as any)?.agency;
  const stripeCustomerId = agency?.stripe_customer_id;

  // Find integrations by provider
  function findIntegration(provider: string, workspaceId?: string) {
    return integrations.find((i) =>
      i.provider === provider &&
      (workspaceId ? i.workspace_id === workspaceId : true) &&
      i.status !== "revoked"
    );
  }

  function handleMetaConnect(workspaceId: string) {
    toast.info("Conexao com Meta (Instagram) em implementacao. Aguarde a proxima atualizacao.");
  }

  function handleResendConnect() {
    toast.info("Configure a chave de API Resend nas variaveis de ambiente do servidor.");
  }

  return (
    <div style={{ background: CRIE.bg, fontFamily: "Inter, sans-serif", padding: 32 }}>
      <SectionHeader title="Integracoes" />

      {isLoading ? (
        <PCard>
          <div style={{ padding: "48px 0", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
            Carregando integracoes...
          </div>
        </PCard>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>

          {/* Instagram per workspace */}
          {workspaces.length > 0 ? (
            workspaces.map((ws) => {
              const integration = findIntegration("instagram", ws.id);
              return (
                <IntegrationCard
                  key={ws.id}
                  provider="instagram"
                  title={`Instagram — ${ws.name}`}
                  description="Publique diretamente no Instagram Business via Meta Graph API. Requer conta Business ou Creator."
                  integration={integration}
                  workspaceName={ws.name}
                  onConnect={() => handleMetaConnect(ws.id)}
                  onDisconnect={(id) => disconnect.mutate(id)}
                />
              );
            })
          ) : (
            <IntegrationCard
              provider="instagram"
              title="Instagram (Meta)"
              description="Publique diretamente no Instagram Business via Meta Graph API. Requer conta Business ou Creator."
              onConnect={() => handleMetaConnect("")}
              onDisconnect={(id) => disconnect.mutate(id)}
            />
          )}

          {/* Stripe — agency-level */}
          <IntegrationCard
            provider="stripe"
            title="Stripe"
            description="Gerenciamento de assinaturas e cobrancas. Conectado automaticamente ao criar sua conta."
            integration={
              stripeCustomerId
                ? { id: "stripe-agency", agency_id: currentAgencyId!, workspace_id: null, provider: "stripe", provider_account_id: stripeCustomerId, token_expires_at: null, scopes: null, metadata_json: null, status: "active", created_at: "", updated_at: "" }
                : undefined
            }
            externalLink="https://dashboard.stripe.com"
          />

          {/* Resend */}
          <IntegrationCard
            provider="resend"
            title="Resend"
            description="Servico de envio de e-mails transacionais (convites, notificacoes de aprovacao). Configurado via chave de API."
            integration={findIntegration("resend")}
            onConnect={handleResendConnect}
            onDisconnect={(id) => disconnect.mutate(id)}
            externalLink="https://resend.com/emails"
          />

          {/* Slack — coming soon */}
          <IntegrationCard
            provider="slack"
            title="Slack"
            description="Receba notificacoes de aprovacao e comentarios diretamente em canais do Slack."
            comingSoon
          />

          {/* Discord — coming soon */}
          <IntegrationCard
            provider="discord"
            title="Discord"
            description="Alertas de conteudo pendente, aprovacoes e publicacoes no seu servidor Discord."
            comingSoon
          />
        </div>
      )}
    </div>
  );
}
