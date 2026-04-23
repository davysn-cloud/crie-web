import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, SectionHeader, Btn, EmptyState } from "@/components/crie";
import { NavIco } from "@/components/crie/NavIco";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  workspace_id: string;
  name: string;
  goal: string | null;
  starts_at: string | null;
  ends_at: string | null;
  color: string;
  created_at: string;
}

interface BriefCount {
  campaign_id: string;
  count: number;
}

// ─── Color presets ────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  CRIE.violet,
  CRIE.sky,
  CRIE.emerald,
  CRIE.rose,
  CRIE.amber,
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function getCampaignStatus(campaign: Campaign): { label: string; color: string; bg: string } {
  const now = new Date();
  const start = campaign.starts_at ? parseISO(campaign.starts_at) : null;
  const end = campaign.ends_at ? parseISO(campaign.ends_at) : null;

  if (start && isBefore(now, start)) {
    return { label: "Em breve", color: CRIE.sky, bg: "#EFF9FF" };
  }
  if (end && isAfter(now, end)) {
    return { label: "Encerrada", color: CRIE.muted, bg: CRIE.lineSoft };
  }
  return { label: "Ativa", color: CRIE.emerald, bg: "#F0FDF4" };
}

function StatusBadge({ campaign }: { campaign: Campaign }) {
  const { label, color, bg } = getCampaignStatus(campaign);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {label}
    </span>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign, briefCount }: { campaign: Campaign; briefCount: number }) {
  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return format(parseISO(date), "dd MMM yyyy", { locale: ptBR });
  };

  // We don't have total briefs to compute ratio in a meaningful way
  // so we show count / estimated max (or just count with label)
  const progressPct = Math.min((briefCount / Math.max(briefCount, 10)) * 100, 100);

  return (
    <PCard style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex" }}>
        {/* Color bar */}
        <div
          style={{
            width: 5,
            background: campaign.color,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div style={{ flex: 1, padding: 20 }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: CRIE.ink,
                  marginBottom: 3,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {campaign.name}
              </div>
              {campaign.goal && (
                <div
                  style={{
                    fontSize: 12.5,
                    color: CRIE.muted,
                    lineHeight: 1.4,
                  }}
                >
                  {campaign.goal}
                </div>
              )}
            </div>
            <StatusBadge campaign={campaign} />
          </div>

          {/* Date range */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 14,
            }}
          >
            <NavIco
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              sz={13}
              color={CRIE.muted}
            />
            <span style={{ fontSize: 12, color: CRIE.muted }}>
              {formatDate(campaign.starts_at)} &rarr; {formatDate(campaign.ends_at)}
            </span>
          </div>

          {/* Briefs progress */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11.5, color: CRIE.muted, fontWeight: 600 }}>
                Briefs nesta campanha
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: CRIE.inkSoft,
                }}
              >
                {briefCount}
              </span>
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 99,
                background: CRIE.lineSoft,
                overflow: "hidden",
              }}
              role="progressbar"
              aria-valuenow={briefCount}
              aria-valuemin={0}
              aria-label={`${briefCount} briefs nesta campanha`}
            >
              <div
                style={{
                  width: briefCount > 0 ? `${Math.max(progressPct, 5)}%` : "0%",
                  height: "100%",
                  borderRadius: 99,
                  background: campaign.color,
                  transition: "width .4s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </PCard>
  );
}

// ─── Create campaign modal ────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  workspaceId: string;
}

function CreateCampaignModal({ onClose, workspaceId }: CreateModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]!);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 10,
    border: `1px solid ${CRIE.line}`,
    background: CRIE.bg,
    fontSize: 13,
    color: CRIE.ink,
    fontFamily: "Inter, sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("campaigns").insert({
        workspace_id: workspaceId,
        name: name.trim(),
        goal: goal.trim() || null,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Campanha criada!");
      queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceId] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(14,14,12,.4)",
          zIndex: 1000,
          backdropFilter: "blur(2px)",
        }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nova campanha"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 460,
          maxWidth: "calc(100vw - 32px)",
          background: CRIE.paper,
          borderRadius: 20,
          border: `1px solid ${CRIE.line}`,
          boxShadow: "0 20px 60px rgba(0,0,0,.18)",
          zIndex: 1001,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${CRIE.line}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: CRIE.ink }}>Nova Campanha</div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NavIco d="M6 18L18 6M6 6l12 12" sz={14} color={CRIE.inkSoft} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Nome *
            </div>
            <input
              style={inputStyle}
              placeholder="Ex: Lancamento verao 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Objetivo
            </div>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 64 }}
              placeholder="Qual o objetivo desta campanha?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Inicio
              </div>
              <input
                style={inputStyle}
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Fim
              </div>
              <input
                style={inputStyle}
                type="date"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Cor
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setColor(preset)}
                  aria-label={`Cor ${preset}`}
                  aria-pressed={color === preset}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: preset,
                    border: color === preset ? `3px solid ${CRIE.ink}` : `2px solid transparent`,
                    cursor: "pointer",
                    outline: color === preset ? `2px solid ${CRIE.paper}` : "none",
                    outlineOffset: -4,
                    transition: "border .1s",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${CRIE.line}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Btn variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            disabled={!name.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Criando..." : "Criar campanha"}
          </Btn>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CampaignsPage() {
  const { currentWorkspaceId } = useAuthStore();
  const [showModal, setShowModal] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  const { data: briefCounts = [] } = useQuery<BriefCount[]>({
    queryKey: ["briefs-by-campaign", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("briefs")
        .select("campaign_id")
        .eq("workspace_id", currentWorkspaceId)
        .not("campaign_id", "is", null);
      if (error) throw error;

      // Group by campaign_id
      const counts: Record<string, number> = {};
      for (const b of data ?? []) {
        if (b.campaign_id) {
          counts[b.campaign_id] = (counts[b.campaign_id] ?? 0) + 1;
        }
      }
      return Object.entries(counts).map(([campaign_id, count]) => ({ campaign_id, count }));
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  function getBriefCount(campaignId: string): number {
    return briefCounts.find((b) => b.campaign_id === campaignId)?.count ?? 0;
  }

  return (
    <div
      style={{
        padding: 24,
        background: CRIE.bg,
        minHeight: "100%",
      }}
    >
      <SectionHeader
        title="Campanhas"
        action={
          <Btn variant="primary" onClick={() => setShowModal(true)}>
            <NavIco d="M12 4v16m-8-8h16" sz={14} color="#fff" />
            Nova campanha
          </Btn>
        }
      />

      {isLoading ? (
        <div style={{ fontSize: 13, color: CRIE.muted, marginTop: 24 }}>Carregando...</div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon="📣"
          title="Nenhuma campanha ainda"
          body="Crie campanhas para organizar seus briefs e acompanhar objetivos de marketing."
          cta="+ Nova campanha"
          onCta={() => setShowModal(true)}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              briefCount={getBriefCount(campaign.id)}
            />
          ))}
        </div>
      )}

      {showModal && currentWorkspaceId && (
        <CreateCampaignModal
          onClose={() => setShowModal(false)}
          workspaceId={currentWorkspaceId}
        />
      )}
    </div>
  );
}
