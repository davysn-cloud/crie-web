import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, SectionHeader, CrieBadge } from "@/components/crie";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Pillar {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  target_percent: number;
  description: string | null;
  sort_order: number;
}

interface Brief {
  id: string;
  post_card_id: string;
  pillar_id: string | null;
}

interface HashtagSet {
  id: string;
  pillar_id: string | null;
}

interface PillarData {
  name: string;
  color: string;
  meta: number;
  atual: number;
  postCount: number;
  hashtagCount: number;
}

// ─── Donut helpers ───────────────────────────────────────────────────────────

const DONUT_R = 60;
const DONUT_CX = 80;
const DONUT_CY = 80;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

function buildArcs(pillars: PillarData[], total: number) {
  let offset = 0;
  return pillars.map((p) => {
    const fraction = total > 0 ? p.postCount / total : 0;
    const dash = fraction * DONUT_CIRCUMFERENCE;
    const arc = { color: p.color, dash, offset: -offset * DONUT_CIRCUMFERENCE };
    offset += fraction;
    return arc;
  });
}

function DonutChart({ pillars, total }: { pillars: PillarData[]; total: number }) {
  const arcs = buildArcs(pillars, total);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
      {/* SVG */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={160} height={160} viewBox="0 0 160 160" aria-label="Distribuicao de pilares">
          {/* Track */}
          <circle
            cx={DONUT_CX}
            cy={DONUT_CY}
            r={DONUT_R}
            fill="none"
            stroke={CRIE.lineSoft}
            strokeWidth={22}
          />
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={DONUT_CX}
              cy={DONUT_CY}
              r={DONUT_R}
              fill="none"
              stroke={arc.color}
              strokeWidth={22}
              strokeDasharray={`${arc.dash} ${DONUT_CIRCUMFERENCE - arc.dash}`}
              strokeDashoffset={arc.offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "80px 80px" }}
            />
          ))}
        </svg>
        {/* Center label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 700, color: CRIE.ink }}>{total}</span>
          <span style={{ fontSize: 10.5, color: CRIE.muted, marginTop: 1 }}>posts</span>
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 20px",
          alignContent: "center",
        }}
      >
        {pillars.map((p) => {
          const pct = total > 0 ? Math.round((p.postCount / total) * 100) : 0;
          return (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: p.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 12.5, color: CRIE.inkSoft }}>
                {p.name}
              </span>
              <span style={{ fontSize: 12, color: CRIE.muted, marginLeft: "auto" }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Pillar card ─────────────────────────────────────────────────────────────

function PillarCard({ pillar }: { pillar: PillarData }) {
  const progress = Math.min((pillar.atual / Math.max(pillar.meta, 1)) * 100, 100);
  const overMeta = pillar.atual > pillar.meta;

  return (
    <PCard>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: pillar.color,
            }}
          />
          <span
            style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink }}
          >
            {pillar.name}
          </span>
        </div>
        <button
          aria-label={`Opcoes para ${pillar.name}`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: CRIE.muted,
            fontSize: 16,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          ···
        </button>
      </div>

      {/* Meta vs Atual */}
      <div
        style={{
          display: "flex",
          gap: 20,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: CRIE.muted, marginBottom: 2 }}>Meta</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: CRIE.inkSoft }}>
            {pillar.meta}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: CRIE.muted, marginBottom: 2 }}>Atual</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: overMeta ? pillar.color : CRIE.ink,
            }}
          >
            {pillar.atual}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: CRIE.lineSoft,
          overflow: "hidden",
          marginBottom: 14,
        }}
        role="progressbar"
        aria-valuenow={pillar.atual}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pillar.name}: ${pillar.atual}% de ${pillar.meta}% meta`}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            borderRadius: 99,
            background: pillar.color,
            transition: "width .3s ease",
          }}
        />
      </div>

      {/* Footer stats */}
      <div style={{ display: "flex", gap: 8 }}>
        <CrieBadge
          label={`${pillar.postCount} posts`}
          color={pillar.color}
        />
        <CrieBadge
          label={`${pillar.hashtagCount} hashtags`}
          color={CRIE.muted}
        />
      </div>
    </PCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PillarsPage() {
  const { currentWorkspaceId } = useAuthStore();

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  // Fetch pillars
  const { data: pillars = [], isLoading: isPillarsLoading } = useQuery({
    queryKey: ["pillars", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("pillars")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Pillar[];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 120_000,
  });

  // Fetch briefs for this workspace this month (to count posts per pillar)
  const { data: briefs = [], isLoading: isBriefsLoading } = useQuery({
    queryKey: ["briefs-month", currentWorkspaceId, format(now, "yyyy-MM")],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("briefs")
        .select("id, post_card_id, pillar_id")
        .eq("workspace_id", currentWorkspaceId)
        .gte("created_at", monthStart)
        .lte("created_at", monthEnd);
      if (error) throw error;
      return (data ?? []) as Brief[];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  // Fetch hashtag sets per pillar
  const { data: hashtagSets = [], isLoading: isHashtagsLoading } = useQuery({
    queryKey: ["hashtag-sets", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("hashtag_sets")
        .select("id, pillar_id")
        .eq("workspace_id", currentWorkspaceId);
      if (error) throw error;
      return (data ?? []) as HashtagSet[];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 120_000,
  });

  const isLoading = isPillarsLoading || isBriefsLoading || isHashtagsLoading;

  // Build pillar data with real counts
  const pillarData: PillarData[] = useMemo(() => {
    const totalBriefs = briefs.length || 1;
    return pillars.map((pillar) => {
      const pillarBriefs = briefs.filter((b) => b.pillar_id === pillar.id);
      const postCount = pillarBriefs.length;
      const hashtagCount = hashtagSets.filter((h) => h.pillar_id === pillar.id).length;
      const atualPct = Math.round((postCount / totalBriefs) * 100);
      return {
        name: pillar.name,
        color: pillar.color,
        meta: pillar.target_percent,
        atual: atualPct,
        postCount,
        hashtagCount,
      };
    });
  }, [pillars, briefs, hashtagSets]);

  const total = briefs.length;

  if (isLoading) {
    return (
      <div
        style={{
          padding: 24,
          background: CRIE.bg,
          minHeight: "100%",
          overflow: "auto",
        }}
      >
        <SectionHeader title="Pilares de Conteudo" />
        <div style={{ fontSize: 13, color: CRIE.muted }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 24,
        background: CRIE.bg,
        minHeight: "100%",
        overflow: "auto",
      }}
    >
      <SectionHeader title="Pilares de Conteudo" />

      {/* Distribution donut */}
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
          Distribuicao do mes
        </div>
        {pillarData.length === 0 ? (
          <div style={{ fontSize: 13, color: CRIE.muted }}>
            Nenhum pilar cadastrado para este workspace.
          </div>
        ) : (
          <DonutChart pillars={pillarData} total={total} />
        )}
      </PCard>

      {/* 3-column pillar cards grid */}
      {pillarData.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {pillarData.map((p) => (
            <PillarCard key={p.name} pillar={p} />
          ))}
        </div>
      )}
    </div>
  );
}
