import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CRIE, STAGE_COLORS } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader, DotMatrix, CrieBadge } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useDashboardData } from "@/hooks/useDashboardData";
import { WORKSPACE_ROLES } from "@/lib/constants";
import type { WorkspaceRole } from "@/lib/constants";
import type { TopCreator, UpcomingPost } from "@/hooks/useDashboardData";

// ─── Helper ──────────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatMonthLabel(isoMonth: string): string {
  const m = parseInt(isoMonth.split("-")[1]!, 10);
  return MONTH_SHORT[m - 1] ?? isoMonth;
}

function pctChange(current: number, previous: number): { text: string; color: string } {
  if (previous === 0) return { text: "sem dados anteriores", color: CRIE.muted };
  const diff = Math.round(((current - previous) / previous) * 100);
  if (diff > 0) return { text: `↑${diff}% vs mes anterior`, color: CRIE.emerald };
  if (diff < 0) return { text: `↓${Math.abs(diff)}% vs mes anterior`, color: CRIE.rose };
  return { text: "sem variacao", color: CRIE.muted };
}

function formatDaysUntil(isoDate: string): string {
  const diff = Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "Hoje!";
  return `${diff} dia${diff > 1 ? "s" : ""}`;
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

// Map DB stage values to our display STAGE_COLORS keys
const STAGE_MAP: Record<string, keyof typeof STAGE_COLORS> = {
  ideia: "ideacao",
  briefing: "ideacao",
  copy: "criacao",
  aprovacao_copy: "aprovacao",
  design: "criacao",
  aprovacao_arte: "aprovacao",
  agendado: "agendado",
  publicado: "publicado",
};

// ─── Hero decorative SVG ─────────────────────────────────────────────────────

function HeroDome() {
  return (
    <svg
      viewBox="0 0 700 220"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      style={{ position: "absolute", right: 0, bottom: 0, width: "65%", height: "100%" }}
    >
      <defs>
        <linearGradient id="dome2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4F7370" />
          <stop offset="1" stopColor="#2B4A4A" />
        </linearGradient>
      </defs>
      <ellipse cx="520" cy="30" rx="180" ry="20" fill="#F0F3E3" opacity="0.5" />
      <path d="M350 220 Q440 80 560 80 T750 220 Z" fill="url(#dome2)" opacity="0.8" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          key={i}
          d={`M360 ${200 - i * 9} Q560 ${100 - i * 7} 750 ${200 - i * 9}`}
          stroke="#8BB0A8"
          strokeWidth="0.5"
          fill="none"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

// ─── Glass stat card (inside hero) ───────────────────────────────────────────

function HeroStatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.5)",
        borderRadius: 16,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11.5, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1, color: CRIE.ink }}>{value}</div>
        <div style={{ width: 24, height: 24, borderRadius: 999, background: "rgba(0,0,0,0.07)", display: "grid", placeItems: "center", fontSize: 12 }}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Butter invite card (inside hero) ────────────────────────────────────────

function HeroInviteCard() {
  return (
    <div style={{ background: CRIE.butter, border: `1px solid ${CRIE.butterDeep}`, borderRadius: 16, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Convidar equipe</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button style={{ flex: 1, padding: "7px 0", background: "rgba(255,255,255,0.7)", border: `1px solid ${CRIE.butterDeep}`, borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>+ Copy</button>
        <button style={{ flex: 1, padding: "7px 0", background: "rgba(255,255,255,0.7)", border: `1px solid ${CRIE.butterDeep}`, borderRadius: 999, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>+ Designer</button>
      </div>
    </div>
  );
}

// ─── Stats row card ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }: { label: string; value: string | number; sub: string; subColor?: string }) {
  return (
    <PCard pad={20}>
      <div style={{ fontSize: 12, color: CRIE.muted, fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 38, fontWeight: 800, color: CRIE.ink, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: subColor ?? CRIE.muted, fontWeight: 500 }}>{sub}</div>
    </PCard>
  );
}

// ─── Ring chart (SVG donut) ──────────────────────────────────────────────────

function RingChart({ pct }: { pct: number }) {
  const r = 68;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <PCard pad={24} style={{ textAlign: "center" }}>
      <SectionHeader title="Taxa de aprovacao" />
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width="186" height="186" viewBox="0 0 186 186">
          <circle cx="93" cy="93" r={r} stroke={CRIE.line} strokeWidth="14" fill="none" strokeDasharray="2 6" strokeLinecap="round" />
          <circle
            cx="93" cy="93" r={r} stroke={CRIE.butter} strokeWidth="14" fill="none"
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            transform="rotate(-90 93 93)"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: CRIE.butterInk, letterSpacing: -1 }}>{pct}%</span>
          <span style={{ fontSize: 11, color: CRIE.muted }}>aprovados</span>
        </div>
      </div>
    </PCard>
  );
}

// ─── Countdown widget ────────────────────────────────────────────────────────

function CountdownWidget({ campaign }: { campaign: { name: string; endsAt: string; workspaceName: string } | null }) {
  if (!campaign) {
    return (
      <PCard pad={20}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CRIE.ink, marginBottom: 4 }}>Proximo lancamento</div>
        <div style={{ fontSize: 12, color: CRIE.muted }}>Nenhuma campanha agendada.</div>
      </PCard>
    );
  }

  const daysText = formatDaysUntil(campaign.endsAt);
  const totalDays = Math.max(1, Math.ceil((new Date(campaign.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const filled = Math.max(0.05, Math.min(1, 1 - totalDays / 30));

  return (
    <PCard pad={20}>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.1, marginBottom: 8 }}>
        {daysText}<br />para lancar
      </div>
      <div style={{ fontSize: 12.5, color: CRIE.muted, marginBottom: 14 }}>
        {campaign.name} — {campaign.workspaceName}
      </div>
      <DotMatrix rows={3} cols={12} filled={filled} />
    </PCard>
  );
}

// ─── Bar chart (12 months) ───────────────────────────────────────────────────

function BarChart({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <PCard pad={20}>
      <SectionHeader title="Publicacoes por mes" />
      <div style={{ display: "flex", alignItems: "flex-end", height: 160, gap: 6, borderBottom: `1px dashed ${CRIE.line}`, paddingBottom: 6 }}>
        {data.map((d) => {
          const isPeak = d.count === max && d.count > 0;
          return (
            <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <div
                title={`${formatMonthLabel(d.month)}: ${d.count}`}
                style={{
                  width: "100%",
                  height: `${(d.count / max) * 148}px`,
                  borderRadius: "8px 8px 3px 3px",
                  background: isPeak ? CRIE.butterDeep : CRIE.butter,
                  transition: "height .4s ease",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        {data.map((d) => (
          <div key={d.month} style={{ flex: 1, textAlign: "center", fontSize: 10, color: CRIE.muted }}>
            {formatMonthLabel(d.month)}
          </div>
        ))}
      </div>
    </PCard>
  );
}

// ─── Top creators ────────────────────────────────────────────────────────────

type CreatorsToggle = "mes" | "ano";

function TopCreatorsCard({ creators }: { creators: TopCreator[] }) {
  const [mode, setMode] = useState<CreatorsToggle>("ano");

  const rows = creators.length > 0
    ? creators
    : [{ userId: "-", name: "Nenhum membro", role: "—", avatarUrl: null, avatarColor: CRIE.muted, postsCount: 0 }];

  return (
    <div style={{ background: CRIE.ink, borderRadius: 22, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Top criadores</div>
        <div style={{ display: "flex", background: "#1C1C1A", borderRadius: 999, padding: 3 }}>
          {(["mes", "ano"] as CreatorsToggle[]).map((v) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              style={{
                padding: "4px 10px", fontSize: 11, borderRadius: 999, border: "none", cursor: "pointer",
                background: mode === v ? CRIE.butter : "transparent",
                color: mode === v ? CRIE.ink : "#A5A59B",
                fontWeight: mode === v ? 600 : 400,
              }}
            >
              {v === "mes" ? "Mes" : "Ano"}
            </button>
          ))}
        </div>
      </div>
      {rows.map((c) => (
        <div key={c.userId} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 999, background: c.avatarColor,
            display: "grid", placeItems: "center", color: "#fff", fontWeight: 600, fontSize: 12,
          }}>
            {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "#fff" }}>{c.name}</div>
            <div style={{ fontSize: 11, color: "#A5A59B" }}>{c.role}</div>
          </div>
          <div style={{
            width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.1)",
            display: "grid", placeItems: "center",
          }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M4 10L10 4M10 4H5M10 4V9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Upcoming list ───────────────────────────────────────────────────────────

function UpcomingList({ posts }: { posts: UpcomingPost[] }) {
  const navigate = useNavigate();

  return (
    <PCard style={{ display: "flex", flexDirection: "column", gridRow: "span 2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Proximas entregas</div>
        <Btn size="sm" onClick={() => navigate("/app/calendar")}>Ver tudo</Btn>
      </div>
      <div style={{ fontSize: 12, color: CRIE.muted, marginBottom: 12 }}>Briefs, aprovacoes e publicacoes previstas.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {posts.length === 0 && (
          <div style={{ padding: "24px 0", textAlign: "center", color: CRIE.muted, fontSize: 12.5 }}>Nenhum post agendado.</div>
        )}
        {posts.map((it) => {
          const stageKey = STAGE_MAP[it.stage] ?? "ideacao";
          const stage = STAGE_COLORS[stageKey];
          return (
            <div
              key={it.id}
              style={{
                border: `1px solid ${CRIE.line}`, borderRadius: 14, padding: "10px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = CRIE.lineSoft)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <div>
                <div style={{ fontSize: 10.5, color: CRIE.muted, marginBottom: 2 }}>{formatShortDate(it.scheduledAt)}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.title}</div>
                <div style={{ fontSize: 11, color: CRIE.muted }}>{it.workspaceName}</div>
              </div>
              <CrieBadge label={stage.label} color={stage.dot} />
            </div>
          );
        })}
      </div>
    </PCard>
  );
}

// ─── Role quick-action definitions ──────────────────────────────────────────

interface QuickAction {
  label: string;
  path: string;
}

const ROLE_QUICK_ACTIONS: Record<WorkspaceRole, QuickAction[]> = {
  owner: [
    { label: "Equipe", path: "/app/team" },
    { label: "Marcas", path: "/app/brands" },
    { label: "Plano & Cobrança", path: "/app/billing" },
    { label: "Board de Conteúdo", path: "/app/board" },
  ],
  strategist: [
    { label: "Novo brief", path: "/app/board" },
    { label: "Ver calendário", path: "/app/calendar" },
    { label: "Pilares", path: "/app/pillars" },
  ],
  copywriter: [
    { label: "Caixa de copy", path: "/app/copy" },
    { label: "Editor", path: "/app/copy-write" },
    { label: "Ir para o board", path: "/app/board" },
  ],
  designer: [
    { label: "Assets", path: "/app/assets" },
    { label: "Brand kit", path: "/app/brandkit" },
    { label: "Ir para o board", path: "/app/board" },
  ],
  social_media: [
    { label: "Fila de publicação", path: "/app/queue" },
    { label: "Grid planner", path: "/app/grid" },
    { label: "Calendário", path: "/app/calendar" },
  ],
};

function getRoleLabel(role: WorkspaceRole): string {
  return WORKSPACE_ROLES.find((r) => r.value === role)?.label ?? role;
}

// ─── Quick-actions widget ────────────────────────────────────────────────────

function QuickActionsSection() {
  const navigate = useNavigate();
  const { data: workspaceRole, isLoading } = useWorkspaceRole();
  const { agencies, currentAgencyId, user } = useAuthStore();

  // Workspace role is the source of truth for UI (it's the role within the brand context).
  // Agency role is only used to determine admin access (owner/admin can see everything).
  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  const agency = (membership as any)?.agency;
  const isRealOwner = agency?.owner_id === user?.id;

  // Only the actual agency owner (by owner_id) or someone with agency_role = admin is admin
  const isAgencyAdmin = isRealOwner || membership?.role === "admin";

  // Effective role for UI: workspace role first (most specific), then agency role, then fallback
  const effectiveRole: WorkspaceRole = isAgencyAdmin
    ? "owner"
    : (workspaceRole ?? (membership?.role as WorkspaceRole) ?? "designer");

  if (isLoading) return null;

  const actions = ROLE_QUICK_ACTIONS[effectiveRole] ?? [];
  const roleLabel = getRoleLabel(effectiveRole);
  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "Usuário";

  return (
    <PCard pad={20}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink, marginBottom: 2 }}>
          Olá, {displayName}!
        </div>
        <div style={{ fontSize: 12.5, color: CRIE.muted }}>
          Aqui estão seus atalhos como{" "}
          <span style={{ fontWeight: 600, color: CRIE.butterInk }}>{roleLabel}</span>.
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            style={{
              padding: "7px 16px",
              borderRadius: 999,
              border: `1.5px solid ${CRIE.butterDeep}`,
              background: CRIE.butterWash,
              color: CRIE.butterInk,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background .12s, border-color .12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = CRIE.butter;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = CRIE.butterWash;
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </PCard>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export function DashboardPage() {
  const agencyId = useAuthStore((s) => s.currentAgencyId);
  const dash = useDashboardData(agencyId);

  const postChange = pctChange(dash.postsThisMonth, dash.postsLastMonth);
  const approvalPct = dash.approvalRatePct;
  const avgTime = dash.avgApprovalTimeHours > 0 ? `${dash.avgApprovalTimeHours}h` : "—";

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Hero band ── */}
      <section
        style={{
          position: "relative",
          borderRadius: 24,
          overflow: "hidden",
          height: 220,
          background: "linear-gradient(135deg, #B7CDA5 0%, #92AE87 55%, #6A9068 100%)",
        }}
      >
        <HeroDome />
        <div style={{ position: "absolute", inset: 0, padding: "22px 26px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{dash.agencyName || "Carregando..."}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.3fr", gap: 12 }}>
            <HeroStatCard label="Marcas" value={dash.workspaceCount} icon="🏢" />
            <HeroStatCard label="Posts este mes" value={dash.postsThisMonth} icon="📄" />
            <HeroStatCard label="Aprovados de 1a" value={approvalPct > 0 ? `${approvalPct}%` : "—"} icon="✅" />
            <HeroInviteCard />
          </div>
        </div>
      </section>

      {/* Atalhos rápidos — role-aware */}
      <QuickActionsSection />

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatCard
          label="Posts este mes"
          value={dash.postsThisMonth}
          sub={postChange.text}
          subColor={postChange.color}
        />
        <StatCard
          label="Aprovados de 1a"
          value={approvalPct > 0 ? `${approvalPct}%` : "—"}
          sub="Meta: 85%"
        />
        <StatCard
          label="Tempo medio aprox."
          value={avgTime}
          sub={dash.avgApprovalTimeHours > 0 ? "desde envio ate decisao" : "sem dados ainda"}
          subColor={dash.avgApprovalTimeHours > 0 ? CRIE.emerald : CRIE.muted}
        />
        <StatCard
          label="Backlog pendente"
          value={dash.backlogCount}
          sub={dash.urgentBacklogCount > 0 ? `${dash.urgentBacklogCount} urgente${dash.urgentBacklogCount > 1 ? "s" : ""} (<24h)` : "nenhum urgente"}
          subColor={dash.urgentBacklogCount > 0 ? CRIE.amber : CRIE.muted}
        />
      </div>

      {/* Main 3-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 1.2fr", gap: 14, alignItems: "start" }}>
        {/* Column 1: Ring + Countdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <RingChart pct={approvalPct} />
          <CountdownWidget campaign={dash.nextCampaign} />
        </div>

        {/* Column 2: Bar chart + Top Creators */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <BarChart data={dash.monthlyPostCounts} />
          <TopCreatorsCard creators={dash.topCreators} />
        </div>

        {/* Column 3: Upcoming list (spans 2 rows) */}
        <UpcomingList posts={dash.upcomingPosts} />
      </div>
    </div>
  );
}
