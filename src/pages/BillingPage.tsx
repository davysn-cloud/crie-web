import { useQuery } from "@tanstack/react-query";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader, CrieBadge } from "@/components/crie";
import { useTeam } from "@/features/admin/hooks/useTeam";
import { useBrands } from "@/features/admin/hooks/useBrands";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import type { Agency } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function derivePlanName(seatLimit: number): string {
  if (seatLimit <= 3) return "Basico";
  if (seatLimit <= 10) return "Profissional";
  return "Enterprise";
}

function derivePlanPrice(seatLimit: number): string {
  if (seatLimit <= 3) return "R$97/mês";
  if (seatLimit <= 10) return "R$297/mês";
  return "Sob consulta";
}

// ─── Posts this month count ───────────────────────────────────────────────────

function usePostsThisMonthCount(workspaceIds: string[]) {
  return useQuery({
    queryKey: ["posts-this-month", workspaceIds],
    queryFn: async () => {
      if (workspaceIds.length === 0) return 0;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count, error } = await supabase
        .from("post_cards")
        .select("*", { count: "exact", head: true })
        .in("workspace_id", workspaceIds)
        .gte("created_at", startOfMonth);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: workspaceIds.length > 0,
  });
}

// ─── Usage Meter ──────────────────────────────────────────────────────────────

function UsageMeter({
  label,
  used,
  total,
  unlimited = false,
}: {
  label: string;
  used: number;
  total: number;
  unlimited?: boolean;
}) {
  const pct = unlimited ? 100 : Math.round((used / total) * 100);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: CRIE.inkSoft }}>{label}</span>
        <span style={{ fontSize: 12, color: CRIE.muted }}>
          {unlimited ? "Ilimitado" : `${used} / ${total}`}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: CRIE.lineSoft,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 999,
            width: unlimited ? "100%" : `${pct}%`,
            background: unlimited
              ? `linear-gradient(90deg, ${CRIE.butterDeep}, ${CRIE.emerald})`
              : pct >= 80
              ? CRIE.amber
              : CRIE.butterDeep,
            transition: "width .5s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  name,
  price,
  isCurrent,
}: {
  name: string;
  price: string;
  isCurrent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 16,
        border: `1.5px solid ${isCurrent ? CRIE.butterDeep : CRIE.line}`,
        background: isCurrent ? CRIE.butterWash : CRIE.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: CRIE.ink,
            marginBottom: 2,
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 13, color: CRIE.muted, fontWeight: 500 }}>{price}</div>
      </div>

      {isCurrent ? (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: CRIE.butterInk,
            whiteSpace: "nowrap",
          }}
        >
          Plano atual
        </span>
      ) : (
        <Btn variant="secondary" size="sm">
          Mudar para este
        </Btn>
      )}
    </div>
  );
}

// ─── Billing Page ─────────────────────────────────────────────────────────────

export function BillingPage() {
  const { agencies, workspaces } = useAuthStore();
  const { data: members = [], isLoading: loadingMembers } = useTeam();
  const { data: brands = [], isLoading: loadingBrands } = useBrands();
  const workspaceIds = workspaces.map((w) => w.id);
  const { data: postsCount = 0 } = usePostsThisMonthCount(workspaceIds);

  // Get current agency from auth store
  const currentAgencyMember = agencies[0];
  const agency: Agency | undefined = currentAgencyMember?.agency;

  const seatLimit = agency?.seat_limit ?? 10;
  const subscriptionStatus = agency?.subscription_status ?? "active";
  const activeBrandsCount = brands.filter((b) => !b.archived).length;
  const membersCount = members.length;

  const planName = derivePlanName(seatLimit);
  const planPrice = derivePlanPrice(seatLimit);

  const isLoading = loadingMembers || loadingBrands;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        padding: "32px",
      }}
    >
      <SectionHeader title="Cobrança" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Plan card */}
          <PCard pad={24}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: CRIE.ink }}>
                  {isLoading ? "…" : planName}
                </h2>
                <div style={{ fontSize: 28, fontWeight: 800, color: CRIE.ink, letterSpacing: -0.5 }}>
                  {isLoading ? "…" : planPrice.replace("/mês", "")}
                  <span style={{ fontSize: 14, fontWeight: 500, color: CRIE.muted }}>
                    {!isLoading && planName !== "Enterprise" ? "/mês" : ""}
                  </span>
                </div>
              </div>
              <CrieBadge
                label={subscriptionStatus === "active" ? "Ativo" : subscriptionStatus}
                color={subscriptionStatus === "active" ? CRIE.emerald : CRIE.amber}
                bg={subscriptionStatus === "active" ? "#F0FDF4" : "#FFFBEB"}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              {isLoading ? (
                <div style={{ fontSize: 13, color: CRIE.muted }}>Carregando uso…</div>
              ) : (
                <>
                  <UsageMeter label="Membros" used={membersCount} total={seatLimit} />
                  <UsageMeter label="Marcas" used={activeBrandsCount} total={seatLimit < 10 ? 5 : 15} />
                  <UsageMeter label="Posts/mês" used={postsCount} total={0} unlimited />
                </>
              )}
            </div>

            <Btn
              variant="secondary"
              onClick={() => {
                if (agency?.stripe_customer_id) {
                  window.open("https://billing.stripe.com/p/login/test_placeholder", "_blank");
                }
              }}
            >
              Gerenciar no Stripe
            </Btn>
          </PCard>

          {/* Invoices card */}
          <PCard pad={0} style={{ overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${CRIE.line}` }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: CRIE.ink }}>
                Faturas
              </h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: CRIE.lineSoft }}>
                  {["Data", "Valor", "Status", ""].map((col) => (
                    <th
                      key={col}
                      scope="col"
                      style={{
                        padding: "10px 20px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: CRIE.muted,
                        textTransform: "uppercase",
                        letterSpacing: 0.3,
                        borderBottom: `1px solid ${CRIE.line}`,
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "24px 20px",
                      textAlign: "center",
                      fontSize: 13,
                      color: CRIE.muted,
                    }}
                  >
                    Faturas disponíveis no portal do Stripe.{" "}
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 13,
                        color: CRIE.butterInk,
                        fontWeight: 600,
                        fontFamily: "Inter, sans-serif",
                        padding: 0,
                      }}
                      onClick={() =>
                        window.open("https://billing.stripe.com/p/login/test_placeholder", "_blank")
                      }
                    >
                      Abrir portal →
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </PCard>
        </div>

        {/* ── Right column ── */}
        <PCard pad={20}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: CRIE.ink }}>
            Comparar planos
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <PlanCard name="Basico" price="R$97/mes" isCurrent={planName === "Basico"} />
            <PlanCard name="Profissional" price="R$297/mes" isCurrent={planName === "Profissional"} />
            <PlanCard name="Enterprise" price="Sob consulta" isCurrent={planName === "Enterprise"} />
          </div>
        </PCard>
      </div>
    </div>
  );
}
