import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { CRIE } from "@/lib/crie-tokens";
import { CrieMark, PCard } from "@/components/crie";
import { useApproverStore } from "@/stores/useApproverStore";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type HistoryStatus = "pending" | "approved" | "changes_requested" | "expired";

interface HistoryItem {
  id: string;
  post_card_id: string;
  status: HistoryStatus;
  created_at: string;
  decided_at: string | null;
  note: string | null;
  post_card: {
    title: string;
    post_type: string | null;
  } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusMeta(status: HistoryStatus): { label: string; bg: string; color: string } {
  switch (status) {
    case "approved":
      return { label: "Aprovado", bg: "#F0FDF4", color: "#15803D" };
    case "changes_requested":
      return { label: "Ajuste solicitado", bg: "#FFFBEB", color: "#92400E" };
    case "pending":
      return { label: "Pendente", bg: "#EFF6FF", color: "#1D4ED8" };
    case "expired":
    default:
      return { label: "Expirado", bg: "#F9FAFB", color: "#6B7280" };
  }
}

// ─── Page tab nav (top, below banner) ─────────────────────────────────────────

function ApproverPageTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const base = location.pathname.replace(/\/(history|settings)$/, "");

  const tabs = [
    { label: "Fila", path: base },
    { label: "Historico", path: `${base}/history` },
    { label: "Config", path: `${base}/settings` },
  ];

  function isActive(path: string) {
    if (path === base) {
      return location.pathname === base || location.pathname === `${base}/`;
    }
    return location.pathname.startsWith(path);
  }

  return (
    <nav
      aria-label="Navegacao do portal do aprovador"
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: CRIE.paper,
        borderBottom: `1px solid ${CRIE.line}`,
        display: "flex",
        width: "100%",
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              padding: "9px 0",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              color: active ? CRIE.ink : CRIE.muted,
              fontFamily: "Inter, sans-serif",
              borderBottom: `2px solid ${active ? CRIE.butterDeep : "transparent"}`,
              transition: "all .12s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Shared header ─────────────────────────────────────────────────────────────

function ApproverHeader({ session }: { session: ReturnType<typeof useApproverStore.getState>["session"] }) {
  const navigate = useNavigate();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: CRIE.card,
        borderBottom: `1px solid ${CRIE.line}`,
        maxWidth: 480,
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: CRIE.butter,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CrieMark size={22} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: CRIE.ink, lineHeight: 1.2 }}>
              {session?.agency_name ?? "Agencia"}
            </div>
            <div style={{ fontSize: 11, color: CRIE.muted, lineHeight: 1.2 }}>
              revisando como {session?.approver_name ?? "Aprovador"}
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/login")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: CRIE.muted,
            fontFamily: "Inter, sans-serif",
            padding: "4px 8px",
            borderRadius: 8,
            whiteSpace: "nowrap",
          }}
          aria-label="Sair"
        >
          Sair →
        </button>
      </div>
    </header>
  );
}

// ─── History item ──────────────────────────────────────────────────────────────

function HistoryRow({ item }: { item: HistoryItem }) {
  const meta = statusMeta(item.status);
  const postTitle = item.post_card?.title ?? "Post sem titulo";
  const postType = item.post_card?.post_type ?? null;

  return (
    <PCard pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Title + type row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: CRIE.ink,
            lineHeight: 1.35,
            flex: 1,
          }}
        >
          {postTitle}
        </p>
        {postType && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: CRIE.muted,
              background: CRIE.lineSoft,
              padding: "2px 8px",
              borderRadius: 999,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {postType}
          </span>
        )}
      </div>

      {/* Status badge */}
      <span
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          background: meta.bg,
          color: meta.color,
          width: "fit-content",
        }}
      >
        {meta.label}
      </span>

      {/* Timestamps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <p style={{ margin: 0, fontSize: 12, color: CRIE.muted }}>
          Enviado em{" "}
          <span style={{ color: CRIE.inkSoft, fontWeight: 500 }}>{formatDate(item.created_at)}</span>
        </p>
        {item.decided_at && (
          <p style={{ margin: 0, fontSize: 12, color: CRIE.muted }}>
            Decidido em{" "}
            <span style={{ color: CRIE.inkSoft, fontWeight: 500 }}>{formatDate(item.decided_at)}</span>
          </p>
        )}
      </div>

      {/* Decision note */}
      {item.note && (
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: CRIE.inkSoft,
            background: CRIE.lineSoft,
            borderRadius: 8,
            padding: "8px 10px",
            lineHeight: 1.45,
            fontStyle: "italic",
          }}
        >
          "{item.note}"
        </p>
      )}
    </PCard>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ApproverHistoryPage() {
  const session = useApproverStore((s) => s.session);

  const { data: history = [], isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["approver-history", session?.magic_link_id],
    queryFn: async () => {
      if (!session) return [];

      const workspaceIds = session.workspaces.map((w) => w.id);

      // First fetch post_card ids in these workspaces
      const { data: postCards } = await supabase
        .from("post_cards")
        .select("id")
        .in("workspace_id", workspaceIds);

      const postCardIds = (postCards ?? []).map((r: { id: string }) => r.id);

      if (postCardIds.length === 0) return [];

      const { data, error } = await supabase
        .from("approval_requests")
        .select(
          `id, post_card_id, status, created_at,
           post_card:post_cards(title, post_type)`
        )
        .in("post_card_id", postCardIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        post_card_id: row.post_card_id,
        status: row.status as HistoryStatus,
        created_at: row.created_at,
        decided_at: row.decided_at ?? null,
        note: row.note ?? null,
        post_card: Array.isArray(row.post_card) ? (row.post_card[0] ?? null) : (row.post_card ?? null),
      }));
    },
    enabled: !!session,
    staleTime: 30_000,
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <ApproverHeader session={session} />

      {/* Magic link banner */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: CRIE.butterWash,
          borderBottom: `1px solid ${CRIE.butterDeep}`,
          padding: "9px 16px",
          fontSize: 12.5,
          color: CRIE.butterInk,
          textAlign: "center",
        }}
      >
        Voce esta revisando via link magico
      </div>

      {/* Page tabs */}
      <ApproverPageTabs />

      {/* Content */}
      <main
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "20px 16px 40px",
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 20,
            fontWeight: 700,
            color: CRIE.ink,
            letterSpacing: -0.4,
          }}
        >
          Historico de aprovacoes
        </h2>

        {isLoading ? (
          <div
            style={{
              padding: "40px 0",
              textAlign: "center",
              color: CRIE.muted,
              fontSize: 14,
            }}
          >
            Carregando historico…
          </div>
        ) : history.length === 0 ? (
          <div
            style={{
              padding: "48px 0",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 40 }}>📋</span>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: CRIE.ink }}>
              Nenhum historico ainda.
            </p>
            <p style={{ margin: 0, fontSize: 13, color: CRIE.muted }}>
              Suas decisoes de aprovacao aparecerao aqui.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((item) => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
