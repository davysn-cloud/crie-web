import { useState, useRef, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CrieMark, NavIco } from "@/components/crie";
import { CRIE } from "@/lib/crie-tokens";
import { supabase } from "@/lib/supabase";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBriefDrawer } from "@/components/BriefBuilderDrawer";
import type { WorkspaceRole } from "@/lib/constants";

// ─── Icon paths ──────────────────────────────────────────────────────────────
const ICONS = {
  dashboard:
    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z",
  board:
    "M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 0a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2",
  calendar:
    "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  pillars:
    "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  copy:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  design:
    "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 1.5 2.25 2.25 0 002.14 2.91c1.074.22 2.1-.18 2.75-1.04a3 3 0 001.13-2.34l.34-2.16zm0 0l6.97-6.97m0 0l2.12-2.12a1.5 1.5 0 00-2.12-2.12l-2.12 2.12m4.24 0l-4.24 4.24",
  assets:
    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  brandkit:
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  queue:
    "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
  grid:
    "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  team:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  billing:
    "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  bell:
    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  search:
    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  chevronDown:
    "M19 9l-7 7-7-7",
  campaigns:
    "M13 10V3L4 14h7v7l9-11h-7z",
  performance:
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  plus:
    "M12 4v16m-8-8h16",
  approvers:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  "white-label":
    "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  integrations:
    "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  audit:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  hooks:
    "M13 10V3L4 14h7v7l9-11h-7z",
  ctas:
    "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5",
  hashtags:
    "M7 20l4-16m2 16l4-16M6 9h14M4 15h14",
} as const;

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  dashboard: "Início",
  board: "Board de Conteúdo",
  calendar: "Calendário Editorial",
  pillars: "Pilares de Conteúdo",
  copy: "Caixa de Copy",
  "copy-write": "Editor de Legenda",
  design: "Painel do Designer",
  assets: "Biblioteca de Assets",
  brandkit: "Brand Kit",
  queue: "Fila de Publicação",
  grid: "Grid Planner",
  team: "Equipe",
  brands: "Marcas",
  billing: "Plano & Cobrança",
  notifications: "Notificações",
  settings: "Configurações",
  campaigns: "Campanhas",
  performance: "Performance",
  approvers: "Aprovadores",
  "white-label": "White-label",
  integrations: "Integracoes",
  audit: "Auditoria",
  hooks: "Biblioteca de Hooks",
  ctas: "Biblioteca de CTAs",
  hashtags: "Conjuntos de Hashtags",
};

// ─── Nav item component ───────────────────────────────────────────────────────
interface NavItemProps {
  iconKey: keyof typeof ICONS;
  label: string;
  path: string;
  active: boolean;
  onNavigate: (path: string) => void;
}

function NavItem({ iconKey, label, path, active, onNavigate }: NavItemProps) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  function handleMouseEnter() {
    setHovered(true);
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setTooltipPos({ top: rect.top + rect.height / 2 });
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={() => onNavigate(path)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        aria-label={label}
        title={label}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: active ? CRIE.butter : hovered ? CRIE.lineSoft : "transparent",
          transition: "background .12s",
        }}
      >
        <NavIco
          d={ICONS[iconKey]}
          sz={20}
          color={active ? CRIE.butterInk : CRIE.inkSoft}
        />
      </button>

      {/* Tooltip */}
      {hovered && (
        <div
          style={{
            position: "fixed",
            left: 70,
            top: tooltipPos.top,
            transform: "translateY(-50%)",
            background: CRIE.ink,
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            padding: "5px 10px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return (
    <div
      style={{
        width: 28,
        height: 1,
        background: CRIE.line,
        margin: "4px auto",
      }}
    />
  );
}

// ─── Notification bell (real unread count) ───────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuthStore();

  // Count recent stage_transitions + comments in the last 24h as "unread" proxy
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notif-unread-count", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return 0;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("stage_transitions")
        .select("*", { count: "exact", head: true })
        .gte("created_at", since);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={() => navigate("/app/notifications")}
      aria-label={`Notificacoes${hasUnread ? ` (${unreadCount} novas)` : ""}`}
      style={{
        position: "relative", width: 36, height: 36, borderRadius: 10,
        border: `1px solid ${CRIE.line}`, background: CRIE.paper,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background .12s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = CRIE.lineSoft; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = CRIE.paper; }}
    >
      <NavIco d={ICONS.bell} sz={17} color={CRIE.inkSoft} />
      {hasUnread && (
        <span aria-hidden="true" style={{
          position: "absolute", top: 6, right: 6, width: 8, height: 8,
          borderRadius: "50%", background: CRIE.rose, border: `1.5px solid ${CRIE.paper}`,
        }} />
      )}
    </button>
  );
}

// ─── User avatar (real data) ─────────────────────────────────────────────────
function UserAvatar() {
  const navigate = useNavigate();
  const { user, agencies, currentAgencyId } = useAuthStore();

  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  const displayName = membership?.display_name ?? user?.user_metadata?.display_name ?? user?.email ?? "U";
  const avatarUrl = membership?.avatar_url;
  const initials = displayName.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <button
      onClick={() => navigate("/app/settings")}
      aria-label="Configuracoes da conta"
      style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `2px solid ${CRIE.butterDeep}`,
        background: avatarUrl ? "transparent" : CRIE.butter,
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: 13, fontWeight: 700, color: CRIE.butterInk,
        overflow: "hidden", transition: "opacity .12s", padding: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        initials
      )}
    </button>
  );
}

// ─── Brand selector dropdown (real workspaces from auth store) ───────────────
function BrandSelector() {
  const { workspaces, currentWorkspaceId, setCurrentWorkspace } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const current = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (workspaces.length === 0) return null;

  function deriveWsColor(name: string): string {
    const PALETTE = ["#EEF0A8", "#C6D3A3", "#B8C0E0", "#F0C9CC", "#D0E8E8", "#E8D0D0"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length]!;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 12px", borderRadius: 999,
          border: `1px solid ${CRIE.line}`, background: CRIE.paper,
          cursor: "pointer", fontSize: 13, fontWeight: 500, color: CRIE.ink,
        }}
      >
        <span style={{ width: 22, height: 22, borderRadius: 7, background: deriveWsColor(current?.name ?? ""), border: `1.5px solid ${CRIE.line}`, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700 }}>
          {(current?.name ?? "?")[0]}
        </span>
        <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.name ?? "Selecionar marca"}
        </span>
        <NavIco d={ICONS.chevronDown} sz={14} color={CRIE.muted} />
      </button>

      {open && (
        <div role="listbox" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 220,
          background: CRIE.card, border: `1px solid ${CRIE.line}`, borderRadius: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,.10)", overflow: "hidden", zIndex: 1000,
        }}>
          {workspaces.filter((w) => !w.archived).map((ws) => (
            <button
              key={ws.id} role="option" aria-selected={ws.id === currentWorkspaceId}
              onClick={() => { setCurrentWorkspace(ws.id); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 14px", border: "none",
                background: ws.id === currentWorkspaceId ? CRIE.butterWash : "transparent",
                cursor: "pointer", fontSize: 13, fontWeight: ws.id === currentWorkspaceId ? 600 : 400,
                color: CRIE.ink, textAlign: "left",
              }}
            >
              <span style={{ width: 20, height: 20, borderRadius: 6, background: deriveWsColor(ws.name), border: `1.5px solid ${CRIE.line}`, display: "grid", placeItems: "center", fontSize: 8, fontWeight: 700 }}>
                {ws.name[0]}
              </span>
              <span>
                <span style={{ display: "block", lineHeight: 1.3 }}>{ws.name}</span>
                <span style={{ display: "block", fontSize: 11, color: CRIE.muted }}>@{ws.slug}</span>
              </span>
            </button>
          ))}
          <div style={{ borderTop: `1px solid ${CRIE.line}`, padding: "8px 14px" }}>
            <button onClick={() => { navigate("/app/brands"); setOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11.5, color: CRIE.muted, fontFamily: "Inter,sans-serif" }}>+ Gerenciar marcas</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role-based nav visibility ────────────────────────────────────────────────

const NAV_VISIBILITY: Record<string, WorkspaceRole[]> = {
  dashboard:   ["owner", "strategist", "copywriter", "designer", "social_media"],
  board:       ["owner", "strategist", "copywriter", "designer", "social_media"],
  calendar:    ["owner", "strategist", "social_media"],
  pillars:     ["owner", "strategist"],
  campaigns:   ["owner", "strategist"],
  performance: ["owner", "strategist", "social_media"],
  copy:        ["owner", "copywriter", "strategist"],
  "copy-write": ["owner", "copywriter", "strategist"],
  design:      ["owner", "designer"],
  assets:      ["owner", "strategist", "copywriter", "designer", "social_media"],
  brandkit:    ["owner", "strategist", "designer"],
  queue:       ["owner", "social_media"],
  grid:        ["owner", "social_media"],
  team:           ["owner"],
  brands:         ["owner"],
  billing:        ["owner"],
  approvers:      ["owner"],
  "white-label":  ["owner"],
  integrations:   ["owner"],
  audit:          ["owner"],
  hooks:          ["owner", "copywriter", "strategist"],
  ctas:           ["owner", "copywriter", "strategist"],
  hashtags:       ["owner", "copywriter", "strategist"],
  settings:       ["owner", "strategist", "copywriter", "designer", "social_media"],
};

function useNavAccess() {
  const { data: workspaceRole, isLoading } = useWorkspaceRole();
  const { agencies, currentAgencyId } = useAuthStore();

  const user = useAuthStore((s) => s.user);
  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  const agency = (membership as any)?.agency;

  // Only real owner (by owner_id) or explicit admin
  const isAgencyAdmin = (agency?.owner_id === user?.id) || (membership?.role === "admin");

  // Workspace role is the source of truth; agency role is fallback
  const effectiveRole = workspaceRole ?? membership?.role ?? null;

  function canSee(navKey: string): boolean {
    // While loading: show everything to avoid flash
    if (isLoading) return true;
    // Agency admin: see everything
    if (isAgencyAdmin) return true;
    // No role at all: show only dashboard + settings
    if (!effectiveRole) return navKey === "dashboard" || navKey === "board" || navKey === "settings";
    const allowed = NAV_VISIBILITY[navKey];
    if (!allowed) return true;
    return allowed.includes(effectiveRole as any);
  }

  return { canSee };
}

// ─── Main layout ──────────────────────────────────────────────────────────────
export function CrieLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const { canSee } = useNavAccess();
  const { open: openBriefDrawer, BriefDrawerComponent } = useBriefDrawer();

  // Extract the current segment after /app/
  const segments = location.pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? "dashboard";
  const pageTitle = PAGE_TITLES[currentSegment] ?? "Crie!";

  function isActive(segment: string) {
    return currentSegment === segment;
  }

  function go(segment: string) {
    navigate(`/app/${segment}`);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 62,
          flexShrink: 0,
          background: CRIE.paper,
          borderRight: `1px solid ${CRIE.line}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
          zIndex: 10,
        }}
        aria-label="Navegação principal"
      >
        {/* Logo */}
        <Link
          to="/app"
          aria-label="Ir para o início"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 62,
            height: 62,
            flexShrink: 0,
            textDecoration: "none",
          }}
        >
          <CrieMark size={28} />
        </Link>

        {/* Nav items (scrollable zone) */}
        <div
          style={{
            flex: 1,
            width: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            paddingTop: 4,
            paddingBottom: 4,
            scrollbarWidth: "none",
          }}
        >
          {/* Group 1 — always visible to all roles */}
          <NavItem iconKey="dashboard" label="Início" path="dashboard" active={isActive("dashboard")} onNavigate={go} />
          <NavItem iconKey="board" label="Board de Conteúdo" path="board" active={isActive("board")} onNavigate={go} />

          {/* Group 2: Estratégia */}
          {(canSee("calendar") || canSee("pillars") || canSee("campaigns") || canSee("performance")) && <Divider />}
          {canSee("calendar") && (
            <NavItem iconKey="calendar" label="Calendário Editorial" path="calendar" active={isActive("calendar")} onNavigate={go} />
          )}
          {canSee("pillars") && (
            <NavItem iconKey="pillars" label="Pilares de Conteúdo" path="pillars" active={isActive("pillars")} onNavigate={go} />
          )}
          {canSee("campaigns") && (
            <NavItem iconKey="campaigns" label="Campanhas" path="campaigns" active={isActive("campaigns")} onNavigate={go} />
          )}
          {canSee("performance") && (
            <NavItem iconKey="performance" label="Performance" path="performance" active={isActive("performance")} onNavigate={go} />
          )}

          {/* Group 3: Criação */}
          {(canSee("copy") || canSee("design") || canSee("assets") || canSee("brandkit") || canSee("hooks") || canSee("ctas") || canSee("hashtags")) && <Divider />}
          {canSee("copy") && (
            <NavItem iconKey="copy" label="Caixa de Copy" path="copy" active={isActive("copy") || isActive("copy-write")} onNavigate={go} />
          )}
          {canSee("hooks") && (
            <NavItem iconKey="hooks" label="Hooks" path="hooks" active={isActive("hooks")} onNavigate={go} />
          )}
          {canSee("ctas") && (
            <NavItem iconKey="ctas" label="CTAs" path="ctas" active={isActive("ctas")} onNavigate={go} />
          )}
          {canSee("hashtags") && (
            <NavItem iconKey="hashtags" label="Hashtags" path="hashtags" active={isActive("hashtags")} onNavigate={go} />
          )}
          {canSee("design") && (
            <NavItem iconKey="design" label="Painel do Designer" path="design" active={isActive("design")} onNavigate={go} />
          )}
          {canSee("assets") && (
            <NavItem iconKey="assets" label="Biblioteca de Assets" path="assets" active={isActive("assets")} onNavigate={go} />
          )}
          {canSee("brandkit") && (
            <NavItem iconKey="brandkit" label="Brand Kit" path="brandkit" active={isActive("brandkit")} onNavigate={go} />
          )}

          {/* Group 4: Publicação */}
          {(canSee("queue") || canSee("grid")) && <Divider />}
          {canSee("queue") && (
            <NavItem iconKey="queue" label="Fila de Publicação" path="queue" active={isActive("queue")} onNavigate={go} />
          )}
          {canSee("grid") && (
            <NavItem iconKey="grid" label="Grid Planner" path="grid" active={isActive("grid")} onNavigate={go} />
          )}
        </div>

        {/* Bottom group */}
        <div
          style={{
            width: "100%",
            borderTop: `1px solid ${CRIE.line}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            padding: "8px 0",
            flexShrink: 0,
          }}
        >
          {canSee("team") && (
            <NavItem iconKey="team" label="Equipe" path="team" active={isActive("team")} onNavigate={go} />
          )}
          {canSee("billing") && (
            <NavItem iconKey="billing" label="Plano & Cobrança" path="billing" active={isActive("billing")} onNavigate={go} />
          )}
          {canSee("approvers") && (
            <NavItem iconKey="approvers" label="Aprovadores" path="approvers" active={isActive("approvers")} onNavigate={go} />
          )}
          {canSee("white-label") && (
            <NavItem iconKey="white-label" label="White-label" path="white-label" active={isActive("white-label")} onNavigate={go} />
          )}
          {canSee("integrations") && (
            <NavItem iconKey="integrations" label="Integracoes" path="integrations" active={isActive("integrations")} onNavigate={go} />
          )}
          {canSee("audit") && (
            <NavItem iconKey="audit" label="Auditoria" path="audit" active={isActive("audit")} onNavigate={go} />
          )}
          {canSee("settings") && (
            <NavItem iconKey="settings" label="Configurações" path="settings" active={isActive("settings")} onNavigate={go} />
          )}
        </div>
      </aside>

      {/* ── Right column: topbar + content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: 58,
            flexShrink: 0,
            background: CRIE.paper,
            borderBottom: `1px solid ${CRIE.line}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 16,
            gap: 12,
          }}
        >
          {/* Page title */}
          <h1
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: CRIE.ink,
              margin: 0,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {pageTitle}
          </h1>

          {/* Brand selector */}
          <div style={{ flexShrink: 0 }}>
            <BrandSelector />
          </div>

          {/* Search bar (centered, grows) */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 380,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <NavIco d={ICONS.search} sz={15} color={CRIE.muted} />
              </span>
              <input
                type="search"
                placeholder="Buscar..."
                aria-label="Buscar"
                style={{
                  width: "100%",
                  paddingLeft: 36,
                  paddingRight: 14,
                  paddingTop: 7,
                  paddingBottom: 7,
                  borderRadius: 999,
                  border: `1px solid ${CRIE.line}`,
                  background: CRIE.bg,
                  fontSize: 13,
                  color: CRIE.ink,
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  transition: "border-color .12s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = CRIE.butterDeep; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = CRIE.line; }}
              />
            </div>
          </div>

          {/* Notification bell — shows dot only when there are recent unread events */}
          <NotificationBell />

          {/* User avatar — real initials or photo */}
          <UserAvatar />
        </header>

        {/* Content area */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            background: CRIE.bg,
            position: "relative",
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Floating brief button — visible to owner & strategist */}
      {(canSee("pillars")) && (
        <button
          onClick={openBriefDrawer}
          aria-label="Criar novo brief"
          title="Criar novo brief"
          style={{
            position: "fixed",
            bottom: 28,
            right: 28,
            width: 50,
            height: 50,
            borderRadius: "50%",
            border: "none",
            background: CRIE.ink,
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,.24)",
            zIndex: 100,
            transition: "transform .12s, box-shadow .12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.08)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.30)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.24)";
          }}
        >
          <NavIco d={ICONS.plus} sz={22} color="#fff" />
        </button>
      )}

      {/* Brief builder drawer — global */}
      <BriefDrawerComponent />
    </div>
  );
}
