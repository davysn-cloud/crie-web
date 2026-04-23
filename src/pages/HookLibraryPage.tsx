import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE, PILLAR_COLORS } from "@/lib/crie-tokens";
import { SectionHeader, EmptyState, PCard, Btn } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import { IG_FORMAT_TYPES } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type Performance = "positive" | "negative" | "neutral";

interface Hook {
  id: string;
  workspace_id: string;
  body: string;
  ig_format: string | null;
  pillar_id: string | null;
  performance: Performance;
  uses_count: number;
  created_by: string | null;
  created_at: string;
}

interface Pillar {
  id: string;
  name: string;
  color: string | null;
}

// ─── Performance meta ──────────────────────────────────────────────────────────

const PERFORMANCE_META: Record<Performance, { label: string; icon: string; color: string; bg: string }> = {
  positive: { label: "Positivo", icon: "👍", color: "#15803D", bg: "#F0FDF4" },
  negative: { label: "Negativo", icon: "👎", color: "#B91C1C", bg: "#FEF2F2" },
  neutral:  { label: "Neutro",   icon: "😐", color: "#6B7280", bg: "#F9FAFB" },
};

// ─── Filter select ─────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 10px",
        borderRadius: 8,
        border: `1px solid ${CRIE.line}`,
        background: CRIE.card,
        fontSize: 13,
        color: CRIE.ink,
        outline: "none",
        fontFamily: "Inter, sans-serif",
        cursor: "pointer",
      }}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Hook card ────────────────────────────────────────────────────────────────

function HookCard({ hook, pillars }: { hook: Hook; pillars: Pillar[] }) {
  const perf = PERFORMANCE_META[hook.performance];
  const pillar = pillars.find((p) => p.id === hook.pillar_id);
  const pillarColor = pillar ? (pillar.color ?? PILLAR_COLORS[pillar.name] ?? CRIE.muted) : null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(hook.body);
      toast.success("Hook copiado!");
    } catch {
      toast.error("Nao foi possivel copiar.");
    }
  }

  return (
    <PCard pad={14} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Body text */}
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: CRIE.ink,
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {hook.body}
      </p>

      {/* Tags row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {hook.ig_format && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: CRIE.muted,
              background: CRIE.lineSoft,
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {IG_FORMAT_TYPES.find((f) => f.value === hook.ig_format)?.label ?? hook.ig_format}
          </span>
        )}
        {pillar && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: pillarColor ?? CRIE.muted,
              background: (pillarColor ?? CRIE.muted) + "22",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {pillar.name}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: perf.color,
            background: perf.bg,
            padding: "2px 8px",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          {perf.icon} {perf.label}
        </span>
      </div>

      {/* Footer row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          borderTop: `1px solid ${CRIE.lineSoft}`,
          paddingTop: 10,
        }}
      >
        <span style={{ fontSize: 12, color: CRIE.muted }}>
          {hook.uses_count} {hook.uses_count === 1 ? "uso" : "usos"}
        </span>
        <Btn variant="secondary" size="sm" onClick={handleCopy}>
          Copiar
        </Btn>
      </div>
    </PCard>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateHookModal({
  open,
  onClose,
  workspaceId,
  pillars,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  pillars: Pillar[];
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [igFormat, setIgFormat] = useState("");
  const [pillarId, setPillarId] = useState("");
  const [performance, setPerformance] = useState<Performance>("neutral");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("hooks_library").insert({
        workspace_id: workspaceId,
        body: body.trim(),
        ig_format: igFormat || null,
        pillar_id: pillarId || null,
        performance,
        uses_count: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hooks-library", workspaceId] });
      toast.success("Hook criado!");
      setBody("");
      setIgFormat("");
      setPillarId("");
      setPerformance("neutral");
      onClose();
    },
    onError: () => {
      toast.error("Erro ao criar hook.");
    },
  });

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(14,14,12,0.5)",
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo hook"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 520,
          background: CRIE.card,
          borderRadius: 20,
          padding: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: CRIE.ink }}>
            Novo hook
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${CRIE.line}`,
              background: CRIE.paper,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: CRIE.muted,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div>
          <label
            htmlFor="hook-body"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Texto do hook *
          </label>
          <textarea
            id="hook-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Digite o hook aqui..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${CRIE.line}`,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              resize: "vertical",
              outline: "none",
              color: CRIE.ink,
              background: CRIE.paper,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* IG Format */}
        <div>
          <label
            htmlFor="hook-ig-format"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Formato IG
          </label>
          <select
            id="hook-ig-format"
            value={igFormat}
            onChange={(e) => setIgFormat(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: `1.5px solid ${CRIE.line}`,
              fontSize: 13,
              color: CRIE.ink,
              background: CRIE.paper,
              outline: "none",
              fontFamily: "Inter, sans-serif",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            <option value="">Qualquer formato</option>
            {IG_FORMAT_TYPES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Pillar */}
        {pillars.length > 0 && (
          <div>
            <label
              htmlFor="hook-pillar"
              style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Pilar (opcional)
            </label>
            <select
              id="hook-pillar"
              value={pillarId}
              onChange={(e) => setPillarId(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 10,
                border: `1.5px solid ${CRIE.line}`,
                fontSize: 13,
                color: CRIE.ink,
                background: CRIE.paper,
                outline: "none",
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Sem pilar</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Performance */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Performance
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {(Object.entries(PERFORMANCE_META) as [Performance, typeof PERFORMANCE_META[Performance]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setPerformance(key)}
                style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 10,
                  border: `1.5px solid ${performance === key ? meta.color : CRIE.line}`,
                  background: performance === key ? meta.bg : CRIE.paper,
                  color: performance === key ? meta.color : CRIE.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all .12s",
                }}
              >
                {meta.icon} {meta.label}
              </button>
            ))}
          </div>
        </div>

        <Btn
          variant="primary"
          onClick={() => create.mutate()}
          disabled={!body.trim() || create.isPending}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {create.isPending ? "Salvando..." : "Criar hook"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function HookLibraryPage() {
  const { currentWorkspaceId } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterPerformance, setFilterPerformance] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch pillars for the current workspace
  const { data: pillars = [] } = useQuery<Pillar[]>({
    queryKey: ["pillars-list", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("pillars")
        .select("id, name, color")
        .eq("workspace_id", currentWorkspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Pillar[];
    },
    enabled: !!currentWorkspaceId,
  });

  // Fetch hooks
  const { data: hooks = [], isLoading } = useQuery<Hook[]>({
    queryKey: ["hooks-library", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("hooks_library")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Hook[];
    },
    enabled: !!currentWorkspaceId,
  });

  // Client-side filter
  const filtered = hooks.filter((h) => {
    if (search && !h.body.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterFormat && h.ig_format !== filterFormat) return false;
    if (filterPerformance && h.performance !== filterPerformance) return false;
    return true;
  });

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <SectionHeader
        title="Biblioteca de Hooks"
        action={
          <Btn onClick={() => setModalOpen(true)}>
            + Novo hook
          </Btn>
        }
      />

      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar hook..."
            aria-label="Buscar hook"
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: 8,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.card,
              fontSize: 13,
              color: CRIE.ink,
              outline: "none",
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
            }}
          />
          <svg
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke={CRIE.muted} strokeWidth={2} aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <FilterSelect
          label="Formato IG"
          value={filterFormat}
          onChange={setFilterFormat}
          options={IG_FORMAT_TYPES.map((f) => ({ value: f.value, label: f.label }))}
        />

        <FilterSelect
          label="Performance"
          value={filterPerformance}
          onChange={setFilterPerformance}
          options={[
            { value: "positive", label: "Positivo" },
            { value: "negative", label: "Negativo" },
            { value: "neutral", label: "Neutro" },
          ]}
        />

        {(search || filterFormat || filterPerformance) && (
          <button
            onClick={() => { setSearch(""); setFilterFormat(""); setFilterPerformance(""); }}
            style={{
              padding: "7px 12px",
              borderRadius: 8,
              border: `1px solid ${CRIE.line}`,
              background: "transparent",
              fontSize: 12,
              color: CRIE.muted,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
          Carregando hooks...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="⚡"
          title={hooks.length === 0 ? "Nenhum hook ainda" : "Nenhum resultado"}
          body={
            hooks.length === 0
              ? "Crie hooks reutilizaveis para acelerar a producao de copy."
              : "Tente mudar os filtros ou a busca."
          }
          cta={hooks.length === 0 ? "+ Novo hook" : undefined}
          onCta={hooks.length === 0 ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((hook) => (
            <HookCard key={hook.id} hook={hook} pillars={pillars} />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CreateHookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        workspaceId={currentWorkspaceId ?? ""}
        pillars={pillars}
      />
    </div>
  );
}
