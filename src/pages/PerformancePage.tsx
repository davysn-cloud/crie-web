import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, SectionHeader, EmptyState } from "@/components/crie";
import { NavIco } from "@/components/crie/NavIco";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Insight {
  id: string;
  workspace_id: string;
  post_card_id: string | null;
  ig_media_id: string | null;
  fetched_at: string;
  impressions: number | null;
  reach: number | null;
  engagement: number | null;
  saves: number | null;
  shares: number | null;
  comments_count: number | null;
  likes_count: number | null;
  video_views: number | null;
}

interface PostCard {
  id: string;
  title: string;
  post_type: string | null;
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  icon: string;
  accent: string;
}

function KpiCard({ label, value, icon, accent }: KpiCardProps) {
  return (
    <PCard style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <NavIco d={icon} sz={22} color={accent} />
      </div>
      <div>
        <div style={{ fontSize: 11.5, color: CRIE.muted, fontWeight: 600, marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: CRIE.ink, letterSpacing: -0.5 }}>
          {value}
        </div>
      </div>
    </PCard>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

interface MonthlyData {
  label: string;
  engagement: number;
}

function BarChart({ data }: { data: MonthlyData[] }) {
  const max = Math.max(...data.map((d) => d.engagement), 1);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 12,
        height: 160,
        paddingTop: 16,
      }}
      role="img"
      aria-label="Grafico de engajamento por mes"
    >
      {data.map((d, i) => {
        const heightPct = (d.engagement / max) * 100;
        const isLatest = i === data.length - 1;
        return (
          <div
            key={d.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              height: "100%",
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isLatest ? CRIE.butterInk : CRIE.muted,
              }}
            >
              {d.engagement > 0 ? formatNumber(d.engagement) : "—"}
            </div>
            <div
              style={{
                width: "100%",
                maxWidth: 52,
                height: `${Math.max(heightPct, d.engagement > 0 ? 4 : 0)}%`,
                borderRadius: "8px 8px 0 0",
                background: isLatest ? CRIE.butterDeep : CRIE.line,
                transition: "height .4s ease",
                minHeight: d.engagement > 0 ? 4 : 0,
              }}
              title={`${d.label}: ${d.engagement}`}
            />
            <div style={{ fontSize: 11.5, color: CRIE.muted, whiteSpace: "nowrap" }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function sum(arr: (number | null)[]): number {
  return arr.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

const FORMAT_LABELS: Record<string, string> = {
  feed: "Feed",
  story: "Story",
  reels: "Reels",
  carrossel: "Carrossel",
  feed_1_1: "Feed 1:1",
  feed_4_5: "Feed 4:5",
  reel: "Reel",
  carousel: "Carrossel",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export function PerformancePage() {
  const { currentWorkspaceId } = useAuthStore();
  const now = new Date();

  // Fetch all insights for this workspace
  const { data: insights = [], isLoading: insightsLoading } = useQuery<Insight[]>({
    queryKey: ["insights", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("insights")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .order("fetched_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 120_000,
  });

  // Fetch post cards for the top 10 posts table
  const postCardIds = useMemo(
    () => [...new Set(insights.map((i) => i.post_card_id).filter(Boolean) as string[])],
    [insights]
  );

  const { data: postCards = [] } = useQuery<PostCard[]>({
    queryKey: ["post-cards-for-insights", postCardIds],
    queryFn: async () => {
      if (postCardIds.length === 0) return [];
      const { data, error } = await supabase
        .from("post_cards")
        .select("id, title, post_type")
        .in("id", postCardIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: postCardIds.length > 0,
    staleTime: 120_000,
  });

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const totalReach = sum(insights.map((i) => i.reach));
  const totalEngagement = sum(insights.map((i) => i.engagement));
  const totalSaves = sum(insights.map((i) => i.saves));

  const avgEngagementRate = useMemo(() => {
    const withReach = insights.filter((i) => (i.reach ?? 0) > 0);
    if (withReach.length === 0) return 0;
    const rates = withReach.map((i) => ((i.engagement ?? 0) / (i.reach ?? 1)) * 100);
    return rates.reduce((a, b) => a + b, 0) / rates.length;
  }, [insights]);

  // ── Monthly engagement chart (last 6 months) ─────────────────────────────

  const monthlyData: MonthlyData[] = useMemo(() => {
    const months: MonthlyData[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const label = format(date, "MMM", { locale: ptBR });

      const monthInsights = insights.filter((insight) => {
        const fetched = parseISO(insight.fetched_at);
        return fetched >= start && fetched <= end;
      });

      const engagement = sum(monthInsights.map((ins) => ins.engagement));
      months.push({ label, engagement });
    }
    return months;
  }, [insights]);

  // ── Top 10 posts by engagement ────────────────────────────────────────────

  const top10 = useMemo(() => {
    const postMap = new Map(postCards.map((pc) => [pc.id, pc]));

    return [...insights]
      .sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))
      .slice(0, 10)
      .map((insight) => ({
        insight,
        postCard: insight.post_card_id ? postMap.get(insight.post_card_id) : undefined,
      }));
  }, [insights, postCards]);

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (!insightsLoading && insights.length === 0) {
    return (
      <div style={{ padding: 24, background: CRIE.bg, minHeight: "100%" }}>
        <SectionHeader title="Performance" />
        <EmptyState
          icon="📊"
          title="Sem dados de performance ainda"
          body="Conecte o Instagram e publique posts para ver metricas aqui."
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: CRIE.bg, minHeight: "100%" }}>
      <SectionHeader title="Performance" />

      {insightsLoading ? (
        <div style={{ fontSize: 13, color: CRIE.muted }}>Carregando...</div>
      ) : (
        <>
          {/* KPI grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <KpiCard
              label="Alcance Total"
              value={formatNumber(totalReach)}
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              accent={CRIE.sky}
            />
            <KpiCard
              label="Engajamento Total"
              value={formatNumber(totalEngagement)}
              icon="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              accent={CRIE.rose}
            />
            <KpiCard
              label="Taxa de Eng. Media"
              value={`${avgEngagementRate.toFixed(2)}%`}
              icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              accent={CRIE.emerald}
            />
            <KpiCard
              label="Saves Totais"
              value={formatNumber(totalSaves)}
              icon="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              accent={CRIE.violet}
            />
          </div>

          {/* Bar chart */}
          <PCard style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: CRIE.muted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 16,
              }}
            >
              Engajamento por mes (ultimos 6 meses)
            </div>
            <BarChart data={monthlyData} />
          </PCard>

          {/* Top 10 posts table */}
          <PCard>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: CRIE.muted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 16,
              }}
            >
              Top 10 posts por engajamento
            </div>

            {top10.length === 0 ? (
              <div style={{ fontSize: 13, color: CRIE.muted }}>Nenhum dado disponivel.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                    color: CRIE.inkSoft,
                  }}
                >
                  <thead>
                    <tr>
                      {["Post", "Formato", "Alcance", "Engajamento", "Saves", "Compartilhamentos"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "8px 12px",
                            fontSize: 11,
                            fontWeight: 700,
                            color: CRIE.muted,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                            borderBottom: `1px solid ${CRIE.line}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {top10.map(({ insight, postCard }, idx) => (
                      <tr
                        key={insight.id}
                        style={{
                          background: idx % 2 === 0 ? "transparent" : CRIE.bg,
                          transition: "background .1s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = CRIE.butterWash;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background =
                            idx % 2 === 0 ? "transparent" : CRIE.bg;
                        }}
                      >
                        <td style={{ padding: "10px 12px", maxWidth: 200 }}>
                          {postCard ? (
                            <a
                              href={`/app/board`}
                              style={{
                                color: CRIE.ink,
                                fontWeight: 600,
                                textDecoration: "none",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={postCard.title}
                            >
                              {postCard.title}
                            </a>
                          ) : (
                            <span style={{ color: CRIE.muted, fontSize: 12 }}>
                              {insight.ig_media_id ?? "Post desconhecido"}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {postCard?.post_type ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 9px",
                                borderRadius: 999,
                                background: CRIE.lineSoft,
                                color: CRIE.inkSoft,
                                fontSize: 11.5,
                                fontWeight: 600,
                              }}
                            >
                              {FORMAT_LABELS[postCard.post_type] ?? postCard.post_type}
                            </span>
                          ) : (
                            <span style={{ color: CRIE.muted }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                          {insight.reach != null ? formatNumber(insight.reach) : "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            color: CRIE.rose,
                          }}
                        >
                          {insight.engagement != null ? formatNumber(insight.engagement) : "—"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {insight.saves != null ? formatNumber(insight.saves) : "—"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          {insight.shares != null ? formatNumber(insight.shares) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PCard>
        </>
      )}
    </div>
  );
}
