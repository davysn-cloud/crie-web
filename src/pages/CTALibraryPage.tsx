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
type CtaKind = "comment_bait" | "save_bait" | "share_bait" | "dm" | "link_in_bio";

interface CTA {
  id: string;
  workspace_id: string;
  body: string;
  ig_format: string | null;
  pillar_id: string | null;
  performance: Performance;
  cta_kind: CtaKind;
  uses_count: number;
  created_by: string | null;
  created_at: string;
}

interface Pillar {
  id: string;
  name: string;
  color: string | null;
}

// ─── Meta maps ────────────────────────────────────────────────────────────────

const PERFORMANCE_META: Record<Performance, { label: string; icon: string; color: string; bg: string }> = {
  positive: { label: "Positivo", icon: "👍", color: "#15803D", bg: "#F0FDF4" },
  negative: { label: "Negativo", icon: "👎", color: "#B91C1C", bg: "#FEF2F2" },
  neutral:  { label: "Neutro",   icon: "😐", color: "#6B7280", bg: "#F9FAFB" },
};

const CTA_KIND_META: Record<CtaKind, { label: string; color: string; bg: string }> = {
  comment_bait: { label: "Comentario",  color: "#1D4ED8", bg: "#EFF6FF" },
  save_bait:    { label: "Salvar",      color: "#7C3AED", bg: "#F5F3FF" },
  share_bait:   { label: "Compartilhar", color: "#0891B2", bg: "#ECFEFF" },
  dm:           { label: "DM",          color: "#DB2777", bg: "#FDF2F8" },
  link_in_bio:  { label: "Link na bio", color: "#D97706", bg: "#FFFBEB" },
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

// ─── CTA card ─────────────────────────────────────────────────────────────────

function CTACard({ cta, pillars }: { cta: CTA; pillars: Pillar[] }) {
  const pillar = pillars.find((p) => p.id === cta.pillar_id);
  const pillarColor = pillar ? (pillar.color ?? PILLAR_COLORS[pillar.name] ?? CRIE.muted) : null;
  const kindMeta = CTA_KIND_META[cta.cta_kind];

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(cta.body);
      toast.success("CTA copiado!");
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
        {cta.body}
      </p>

      {/* Tags row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {/* CTA kind badge */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: kindMeta.color,
            background: kindMeta.bg,
            padding: "2px 8px",
            borderRadius: 999,
          }}
        >
          {kindMeta.label}
        </span>

        {cta.ig_format && (
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
            {IG_FORMAT_TYPES.find((f) => f.value === cta.ig_format)?.label ?? cta.ig_format}
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
          {cta.uses_count} {cta.uses_count === 1 ? "uso" : "usos"}
        </span>
        <Btn variant="secondary" size="sm" onClick={handleCopy}>
          Copiar
        </Btn>
      </div>
    </PCard>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateCTAModal({
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
  const [ctaKind, setCtaKind] = useState<CtaKind>("comment_bait");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ctas_library").insert({
        workspace_id: workspaceId,
        body: body.trim(),
        ig_format: igFormat || null,
        pillar_id: pillarId || null,
        performance,
        cta_kind: ctaKind,
        uses_count: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctas-library", workspaceId] });
      toast.success("CTA criado!");
      setBody("");
      setIgFormat("");
      setPillarId("");
      setPerformance("neutral");
      setCtaKind("comment_bait");
      onClose();
    },
    onError: () => {
      toast.error("Erro ao criar CTA.");
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
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(14,14,12,0.5)" }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo CTA"
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
            Novo CTA
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
            htmlFor="cta-body"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Texto do CTA *
          </label>
          <textarea
            id="cta-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Ex: Comenta aqui qual e o seu tipo favorito..."
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

        {/* CTA Kind */}
        <div>
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Tipo de CTA *
          </p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(Object.entries(CTA_KIND_META) as [CtaKind, typeof CTA_KIND_META[CtaKind]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCtaKind(key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1.5px solid ${ctaKind === key ? meta.color : CRIE.line}`,
                  background: ctaKind === key ? meta.bg : CRIE.paper,
                  color: ctaKind === key ? meta.color : CRIE.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "all .12s",
                }}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* IG Format */}
        <div>
          <label
            htmlFor="cta-ig-format"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Formato IG
          </label>
          <select
            id="cta-ig-format"
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
              htmlFor="cta-pillar"
              style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Pilar (opcional)
            </label>
            <select
              id="cta-pillar"
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
          {create.isPending ? "Salvando..." : "Criar CTA"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function CTALibraryPage() {
  const { currentWorkspaceId } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filterFormat, setFilterFormat] = useState("");
  const [filterPerformance, setFilterPerformance] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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

  const { data: ctas = [], isLoading } = useQuery<CTA[]>({
    queryKey: ["ctas-library", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("ctas_library")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CTA[];
    },
    enabled: !!currentWorkspaceId,
  });

  const filtered = ctas.filter((c) => {
    if (search && !c.body.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterFormat && c.ig_format !== filterFormat) return false;
    if (filterPerformance && c.performance !== filterPerformance) return false;
    if (filterKind && c.cta_kind !== filterKind) return false;
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
        title="Biblioteca de CTAs"
        action={
          <Btn onClick={() => setModalOpen(true)}>
            + Novo CTA
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
            placeholder="Buscar CTA..."
            aria-label="Buscar CTA"
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
          label="Tipo de CTA"
          value={filterKind}
          onChange={setFilterKind}
          options={Object.entries(CTA_KIND_META).map(([k, m]) => ({ value: k, label: m.label }))}
        />

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

        {(search || filterFormat || filterPerformance || filterKind) && (
          <button
            onClick={() => { setSearch(""); setFilterFormat(""); setFilterPerformance(""); setFilterKind(""); }}
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
          Carregando CTAs...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🎯"
          title={ctas.length === 0 ? "Nenhum CTA ainda" : "Nenhum resultado"}
          body={
            ctas.length === 0
              ? "Crie CTAs reutilizaveis para engajar o seu publico."
              : "Tente mudar os filtros ou a busca."
          }
          cta={ctas.length === 0 ? "+ Novo CTA" : undefined}
          onCta={ctas.length === 0 ? () => setModalOpen(true) : undefined}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((cta) => (
            <CTACard key={cta.id} cta={cta} pillars={pillars} />
          ))}
        </div>
      )}

      <CreateCTAModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        workspaceId={currentWorkspaceId ?? ""}
        pillars={pillars}
      />
    </div>
  );
}
