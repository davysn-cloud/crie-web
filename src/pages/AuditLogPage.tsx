import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader, CrieBadge } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActorType = "user" | "magic_link" | "system" | "worker";

interface AuditLog {
  id: string;
  agency_id: string;
  workspace_id: string | null;
  actor_type: ActorType;
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  diff_json: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

const PAGE_SIZE = 50;

// ─── Filters ─────────────────────────────────────────────────────────────────

interface Filters {
  dateFrom: string;
  dateTo: string;
  actorType: ActorType | "";
  actionSearch: string;
  workspaceId: string;
}

const EMPTY_FILTERS: Filters = {
  dateFrom: "",
  dateTo: "",
  actorType: "",
  actionSearch: "",
  workspaceId: "",
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAuditLog(filters: Filters, page: number) {
  const { currentAgencyId } = useAuthStore();

  return useQuery({
    queryKey: ["audit-log", currentAgencyId, filters, page],
    queryFn: async () => {
      let query = supabase
        .from("audit_log")
        .select("*", { count: "exact" })
        .eq("agency_id", currentAgencyId!)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filters.dateFrom) {
        query = query.gte("created_at", new Date(filters.dateFrom).toISOString());
      }
      if (filters.dateTo) {
        const end = new Date(filters.dateTo);
        end.setDate(end.getDate() + 1);
        query = query.lt("created_at", end.toISOString());
      }
      if (filters.actorType) {
        query = query.eq("actor_type", filters.actorType);
      }
      if (filters.actionSearch.trim()) {
        query = query.ilike("action", `%${filters.actionSearch.trim()}%`);
      }
      if (filters.workspaceId) {
        query = query.eq("workspace_id", filters.workspaceId);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: (data ?? []) as AuditLog[], total: count ?? 0 };
    },
    enabled: !!currentAgencyId,
  });
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(rows: AuditLog[]) {
  const headers = ["Data/hora", "Ator", "Tipo ator", "Acao", "Entidade", "IP"];
  const lines = rows.map((r) => [
    new Date(r.created_at).toLocaleString("pt-BR"),
    r.actor_label ?? r.actor_id ?? "—",
    r.actor_type,
    r.action,
    r.entity_type && r.entity_id ? `${r.entity_type}:${r.entity_id}` : "—",
    r.ip ?? "—",
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exportado!");
}

// ─── Actor type badge ─────────────────────────────────────────────────────────

const ACTOR_TYPE_META: Record<ActorType, { label: string; color: string; bg: string }> = {
  user:       { label: "Usuario",    color: CRIE.sky,     bg: "#F0F9FF" },
  magic_link: { label: "Link",       color: CRIE.violet,  bg: "#F5F3FF" },
  system:     { label: "Sistema",    color: CRIE.muted,   bg: CRIE.lineSoft },
  worker:     { label: "Worker",     color: CRIE.amber,   bg: "#FFFBEB" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

// ─── Expandable Row ───────────────────────────────────────────────────────────

function AuditRow({ row }: { row: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const actorMeta = ACTOR_TYPE_META[row.actor_type];

  return (
    <>
      <tr
        onClick={() => row.diff_json && setExpanded((x) => !x)}
        style={{ cursor: row.diff_json ? "pointer" : "default", transition: "background .1s" }}
        onMouseEnter={(e) => { if (row.diff_json) (e.currentTarget as HTMLTableRowElement).style.background = CRIE.lineSoft; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ""; }}
        aria-expanded={row.diff_json ? expanded : undefined}
      >
        {/* Timestamp */}
        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${CRIE.lineSoft}`, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 12.5, fontFamily: "monospace", color: CRIE.inkSoft }}>{formatTs(row.created_at)}</span>
        </td>

        {/* Actor */}
        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <CrieBadge label={actorMeta.label} color={actorMeta.color} bg={actorMeta.bg} />
            <span style={{ fontSize: 12.5, color: CRIE.inkSoft }}>{row.actor_label ?? row.actor_id ?? "—"}</span>
          </div>
        </td>

        {/* Action */}
        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
          <code style={{ fontSize: 12, fontFamily: "monospace", color: CRIE.ink, background: CRIE.lineSoft, padding: "2px 6px", borderRadius: 4 }}>
            {row.action}
          </code>
        </td>

        {/* Entity */}
        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
          {row.entity_type ? (
            <span style={{ fontSize: 12, color: CRIE.muted, fontFamily: "monospace" }}>
              {row.entity_type}
              {row.entity_id ? `:${row.entity_id.slice(0, 8)}…` : ""}
            </span>
          ) : (
            <span style={{ color: CRIE.mutedSoft, fontSize: 12 }}>—</span>
          )}
        </td>

        {/* IP */}
        <td style={{ padding: "12px 16px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
          <span style={{ fontSize: 12, fontFamily: "monospace", color: CRIE.muted }}>{row.ip ?? "—"}</span>
          {row.diff_json && (
            <span style={{ marginLeft: 8, fontSize: 11, color: CRIE.muted }}>
              {expanded ? "▲" : "▼"}
            </span>
          )}
        </td>
      </tr>

      {/* Expanded diff */}
      {expanded && row.diff_json && (
        <tr>
          <td colSpan={5} style={{ padding: "0 16px 12px", borderBottom: `1px solid ${CRIE.lineSoft}`, background: CRIE.lineSoft }}>
            <pre
              style={{ margin: "8px 0 0", fontSize: 11, fontFamily: "monospace", color: CRIE.inkSoft, background: CRIE.paper, border: `1px solid ${CRIE.line}`, borderRadius: 8, padding: 12, overflowX: "auto", maxHeight: 240 }}
            >
              {JSON.stringify(row.diff_json, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AuditLogPage() {
  const { workspaces } = useAuthStore();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [allRows, setAllRows] = useState<AuditLog[]>([]);

  const { data, isLoading, isFetching } = useAuditLog(appliedFilters, page);

  // Accumulate rows for "load more"
  const rows = (() => {
    if (!data) return allRows;
    if (page === 0) return data.rows;
    return allRows;
  })();

  // When data arrives for a new page, append
  const prevPage = (() => {
    let prev = 0;
    return { get: () => prev, set: (v: number) => { prev = v; } };
  })();

  function applyFilters() {
    setAppliedFilters({ ...filters });
    setPage(0);
    setAllRows([]);
  }

  function handleLoadMore() {
    if (data?.rows) {
      setAllRows((prev) => [...prev, ...data.rows]);
    }
    setPage((p) => p + 1);
  }

  // Reset accumulated rows when filters change
  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(0);
    setAllRows([]);
  }

  function handleExport() {
    if (rows.length === 0) {
      toast.error("Nenhuma entrada para exportar");
      return;
    }
    exportCSV(rows);
  }

  const displayRows = page === 0 ? (data?.rows ?? []) : rows;
  const total = data?.total ?? 0;
  const hasMore = displayRows.length < total;

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${CRIE.line}`,
    background: CRIE.paper,
    fontSize: 13,
    color: CRIE.ink,
    outline: "none",
    fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={{ background: CRIE.bg, fontFamily: "Inter, sans-serif", padding: 32 }}>
      <SectionHeader
        title="Log de Auditoria"
        action={
          <Btn variant="secondary" onClick={handleExport}>
            Exportar CSV
          </Btn>
        }
      />

      {/* Filter bar */}
      <PCard style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Date from */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4 }}>
              De
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              style={inputStyle}
              aria-label="Data inicial"
            />
          </div>

          {/* Date to */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4 }}>
              Ate
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              style={inputStyle}
              aria-label="Data final"
            />
          </div>

          {/* Actor type */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4 }}>
              Tipo de ator
            </label>
            <select
              value={filters.actorType}
              onChange={(e) => setFilters((f) => ({ ...f, actorType: e.target.value as ActorType | "" }))}
              style={{ ...inputStyle, cursor: "pointer" }}
              aria-label="Filtrar por tipo de ator"
            >
              <option value="">Todos</option>
              <option value="user">Usuario</option>
              <option value="magic_link">Link magico</option>
              <option value="system">Sistema</option>
              <option value="worker">Worker</option>
            </select>
          </div>

          {/* Action search */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4 }}>
              Buscar acao
            </label>
            <input
              type="search"
              value={filters.actionSearch}
              onChange={(e) => setFilters((f) => ({ ...f, actionSearch: e.target.value }))}
              placeholder="Ex: post.created"
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
              aria-label="Buscar por acao"
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>

          {/* Workspace */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4 }}>
              Marca
            </label>
            <select
              value={filters.workspaceId}
              onChange={(e) => setFilters((f) => ({ ...f, workspaceId: e.target.value }))}
              style={{ ...inputStyle, cursor: "pointer" }}
              aria-label="Filtrar por marca"
            >
              <option value="">Todas</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>{ws.name}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="butter" size="sm" onClick={applyFilters}>
              Filtrar
            </Btn>
            <Btn variant="ghost" size="sm" onClick={resetFilters}>
              Limpar
            </Btn>
          </div>
        </div>
      </PCard>

      {/* Table */}
      <PCard pad={0} style={{ overflow: "hidden" }}>
        {/* Result count */}
        {!isLoading && (
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${CRIE.line}`, fontSize: 12, color: CRIE.muted }}>
            {total === 0 ? "Nenhuma entrada encontrada" : `${total} entradas no total`}
          </div>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: CRIE.lineSoft }}>
              {["Data/hora", "Ator", "Acao", "Entidade", "IP"].map((h) => (
                <th
                  key={h}
                  style={{ padding: "11px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase", borderBottom: `1px solid ${CRIE.line}` }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
                  Carregando log...
                </td>
              </tr>
            ) : displayRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px 16px", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
                  Nenhuma entrada no periodo selecionado.
                </td>
              </tr>
            ) : (
              displayRows.map((row) => <AuditRow key={row.id} row={row} />)
            )}
          </tbody>
        </table>

        {/* Load more */}
        {hasMore && !isLoading && (
          <div style={{ padding: 16, display: "flex", justifyContent: "center", borderTop: `1px solid ${CRIE.line}` }}>
            <Btn
              variant="secondary"
              onClick={handleLoadMore}
              disabled={isFetching}
            >
              {isFetching ? "Carregando..." : `Carregar mais (${total - displayRows.length} restantes)`}
            </Btn>
          </div>
        )}
      </PCard>
    </div>
  );
}
