import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CRIE } from "@/lib/crie-tokens";
import { Btn } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { useMoveCard } from "@/features/kanban/hooks/useMoveCard";
import { useComments, useAddComment } from "@/features/comments/hooks/useComments";
import type { PostCard, AgencyMember } from "@/types";
import type { PostStage } from "@/lib/constants";
import type { Comment } from "@/types/comments";

// ─── Stage mapping ───────────────────────────────────────────────────────────
// DB stages → display columns. We group the 8 DB stages into 5 visual columns.

interface DisplayStage {
  key: string;
  label: string;
  dot: string;
  bg: string;
  dbStages: PostStage[];
}

// Each column maps 1:1 to a DB stage (except ideia+briefing grouped)
const DISPLAY_STAGES: DisplayStage[] = [
  { key: "ideia",          label: "Ideia",          dot: "#94A3B8", bg: "#F1F5F9", dbStages: ["ideia", "briefing"] },
  { key: "copy",           label: "Copy",           dot: "#3B82F6", bg: "#EFF6FF", dbStages: ["copy"] },
  { key: "aprovacao_copy", label: "Aprov. Copy",    dot: "#F59E0B", bg: "#FFFBEB", dbStages: ["aprovacao_copy"] },
  { key: "design",         label: "Design",         dot: "#A855F7", bg: "#FAF5FF", dbStages: ["design"] },
  { key: "aprovacao_arte", label: "Aprov. Arte",    dot: "#F59E0B", bg: "#FFFBEB", dbStages: ["aprovacao_arte"] },
  { key: "agendado",       label: "Agendado",       dot: "#06B6D4", bg: "#ECFEFF", dbStages: ["agendado"] },
  { key: "publicado",      label: "Publicado",      dot: "#22C55E", bg: "#F0FDF4", dbStages: ["publicado"] },
];

// DB stage to move INTO when dragging to a column
const FIRST_DB_STAGE: Record<string, PostStage> = {
  ideia: "ideia",
  copy: "copy",
  aprovacao_copy: "aprovacao_copy",
  design: "design",
  aprovacao_arte: "aprovacao_arte",
  agendado: "agendado",
  publicado: "publicado",
};

// Next-step action label for each stage (shown as button on card)
const NEXT_STEP: Record<string, { label: string; nextStage: PostStage } | null> = {
  ideia: { label: "Enviar p/ Copy", nextStage: "copy" },
  briefing: { label: "Enviar p/ Copy", nextStage: "copy" },
  copy: { label: "Enviar p/ Aprov. Copy", nextStage: "aprovacao_copy" },
  aprovacao_copy: { label: "Enviar p/ Design", nextStage: "design" },
  design: { label: "Enviar p/ Aprov. Arte", nextStage: "aprovacao_arte" },
  aprovacao_arte: { label: "Agendar", nextStage: "agendado" },
  agendado: null,
  publicado: null,
};

function displayStageFor(dbStage: string): string {
  for (const ds of DISPLAY_STAGES) {
    if ((ds.dbStages as string[]).includes(dbStage)) return ds.key;
  }
  return "ideia";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const POST_TYPE_LABELS: Record<string, string> = {
  feed: "Feed",
  story: "Story",
  reels: "Reels",
  carrossel: "Carrossel",
};

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function deriveColor(id: string): string {
  const PALETTE = ["#EFC79A", "#C6D3A3", "#B8C0E0", "#F0C9CC", "#D0E8E8", "#E8D0D0", "#D8E8D0"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length]!;
}

// ─── Striped thumbnail ───────────────────────────────────────────────────────

function StripedThumb({ color, height = 80 }: { color: string; height?: number }) {
  return (
    <div
      style={{
        height, borderRadius: 10, overflow: "hidden",
        background: `repeating-linear-gradient(135deg, ${color}33 0 10px, ${color}11 10px 20px)`,
      }}
      aria-hidden="true"
    />
  );
}

// ─── Kanban card ─────────────────────────────────────────────────────────────

function KanbanCardItem({ card, onClick, onAdvance }: { card: PostCard; onClick: () => void; onAdvance?: (cardId: string, nextStage: PostStage) => void }) {
  const [hovered, setHovered] = useState(false);
  const formatLabel = POST_TYPE_LABELS[card.post_type ?? ""] ?? card.post_type ?? "Post";
  const thumbColor = deriveColor(card.workspace_id);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block", width: "100%", background: CRIE.card,
        border: `1px solid ${CRIE.line}`, borderRadius: 16, padding: 14,
        cursor: "pointer", textAlign: "left", transition: "box-shadow .15s, transform .15s",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.09)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
      }}
    >
      <div style={{ position: "relative", marginBottom: 10 }}>
        <StripedThumb color={thumbColor} height={80} />
        <span style={{
          position: "absolute", bottom: 6, left: 8,
          fontFamily: "ui-monospace, monospace", fontSize: 9.5,
          color: CRIE.muted, background: "rgba(255,255,255,0.7)",
          padding: "2px 6px", borderRadius: 4, textTransform: "uppercase",
        }}>{formatLabel}</span>
      </div>
      <div style={{
        fontSize: 13.5, fontWeight: 500, lineHeight: 1.4, marginBottom: 8, color: CRIE.ink,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{card.title}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: CRIE.muted, alignItems: "center" }}>
          {/* Overlapping avatar stack: assigned_to + brief copywriter + brief designer */}
          {(() => {
            const brief = card.briefs?.[0];
            const ids = [
              card.assigned_to,
              brief?.assignee_copy ?? null,
              brief?.assignee_design ?? null,
            ].filter((id): id is string => !!id);
            const unique = [...new Set(ids)].slice(0, 3);
            if (unique.length === 0) return null;
            return (
              <div style={{ display: "flex", alignItems: "center" }}>
                {unique.map((uid, i) => (
                  <div
                    key={uid}
                    style={{
                      width: 22, height: 22, borderRadius: 999,
                      background: deriveColor(uid),
                      display: "grid", placeItems: "center",
                      fontSize: 9, fontWeight: 700, color: CRIE.ink,
                      border: "2px solid #fff",
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: unique.length - i,
                      position: "relative",
                      flexShrink: 0,
                    }}
                  >
                    {uid.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            );
          })()}
          <span>{formatShortDate(card.scheduled_at ?? card.created_at)}</span>
        </div>
      </div>
      {/* Next-step action button */}
      {onAdvance && NEXT_STEP[card.stage] && (
        <div
          onClick={(e) => { e.stopPropagation(); onAdvance(card.id, NEXT_STEP[card.stage]!.nextStage); }}
          style={{
            marginTop: 8, padding: "5px 0", borderTop: `1px solid ${CRIE.lineSoft}`,
            fontSize: 11, fontWeight: 600, color: CRIE.butterInk, textAlign: "center",
            cursor: "pointer", borderRadius: 6, transition: "background .12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = CRIE.butterWash)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {NEXT_STEP[card.stage]!.label} →
        </div>
      )}
    </button>
  );
}

// ─── Kanban column ───────────────────────────────────────────────────────────

function KanbanColumnUI({
  stage,
  cards,
  onCardClick,
  onAdvance,
}: {
  stage: DisplayStage;
  cards: PostCard[];
  onCardClick: (card: PostCard) => void;
  onAdvance: (cardId: string, nextStage: PostStage) => void;
}) {
  return (
    <div style={{
      width: 240, minWidth: 240, flexShrink: 0, background: stage.bg, borderRadius: 20, padding: 12,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: stage.dot }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{stage.label}</span>
          <span style={{
            fontSize: 11, color: CRIE.muted, background: "rgba(0,0,0,0.06)",
            padding: "1px 6px", borderRadius: 999,
          }}>{cards.length}</span>
        </div>
        <button style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 16, color: CRIE.muted,
        }}>+</button>
      </div>
      {cards.map((card) => (
        <KanbanCardItem key={card.id} card={card} onClick={() => onCardClick(card)} onAdvance={onAdvance} />
      ))}
      {cards.length === 0 && (
        <div style={{ padding: "24px 0", textAlign: "center", color: CRIE.muted, fontSize: 12.5 }}>
          Nenhum post aqui
        </div>
      )}
    </div>
  );
}

// ─── Card detail panel ───────────────────────────────────────────────────────

function CardDetailPanel({
  card,
  onClose,
  onStageChange,
}: {
  card: PostCard;
  onClose: () => void;
  onStageChange: (cardId: string, newDbStage: PostStage) => void;
}) {
  const latestCopy = card.copy_versions?.sort((a, b) => b.version - a.version)[0];
  const [caption, setCaption] = useState(latestCopy?.caption ?? latestCopy?.body ?? "");
  const [newComment, setNewComment] = useState("");
  const currentDisplayStage = displayStageFor(card.stage);
  const maxChars = 2200;
  const formatLabel = POST_TYPE_LABELS[card.post_type ?? ""] ?? card.post_type ?? "Post";

  const { data: comments } = useComments("card", card.id);
  const addComment = useAddComment();
  const user = useAuthStore((s) => s.user);
  const currentAgencyId = useAuthStore((s) => s.currentAgencyId);
  const queryClient = useQueryClient();

  // Fetch all members of the current agency for the assignee dropdown
  const { data: agencyMembers } = useQuery<AgencyMember[]>({
    queryKey: ["agency-members", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];
      const { data, error } = await supabase
        .from("agency_members")
        .select("id, agency_id, user_id, display_name, avatar_url, invited_email, accepted_at, created_at")
        .eq("agency_id", currentAgencyId)
        .not("accepted_at", "is", null);
      if (error) throw error;
      return (data ?? []) as AgencyMember[];
    },
    enabled: !!currentAgencyId,
  });

  const [assigneeLoading, setAssigneeLoading] = useState(false);

  async function handleAssign(userId: string | null) {
    setAssigneeLoading(true);
    try {
      await supabase
        .from("post_cards")
        .update({ assigned_to: userId })
        .eq("id", card.id);
      queryClient.invalidateQueries({ queryKey: ["post-cards"] });
    } finally {
      setAssigneeLoading(false);
    }
  }

  const assignedMember = agencyMembers?.find((m) => m.user_id === card.assigned_to);

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    addComment.mutate({
      targetType: "card",
      targetId: card.id,
      body: newComment.trim(),
      authorId: user.id,
    });
    setNewComment("");
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200,
      }} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, width: 440,
        background: "#fff", borderLeft: `1px solid ${CRIE.line}`, zIndex: 200,
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        animation: "slideIn .2s ease",
      }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${CRIE.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Detalhe do post</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 999, border: `1px solid ${CRIE.line}`,
            background: "#fff", cursor: "pointer", display: "grid", placeItems: "center",
            fontSize: 18, color: CRIE.muted,
          }}>x</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Thumb */}
          <div style={{ marginBottom: 16 }}>
            {card.asset_versions?.[0]?.thumbnail_url ? (
              <img src={card.asset_versions[0].thumbnail_url} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 14 }} />
            ) : (
              <StripedThumb color={deriveColor(card.workspace_id)} height={200} />
            )}
            <span style={{
              display: "inline-block", marginTop: 8,
              fontFamily: "ui-monospace, monospace", fontSize: 10, color: CRIE.muted,
              background: CRIE.lineSoft, padding: "3px 8px", borderRadius: 6, textTransform: "uppercase",
            }}>{formatLabel}</span>
          </div>

          {/* Title */}
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.4, marginBottom: 10 }}>{card.title}</div>

          {/* Stage stepper */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: CRIE.muted, marginBottom: 8 }}>Etapa</div>
            <div style={{ display: "flex", gap: 4 }}>
              {DISPLAY_STAGES.map((ds) => (
                <button
                  key={ds.key}
                  onClick={() => onStageChange(card.id, FIRST_DB_STAGE[ds.key]!)}
                  style={{
                    flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    background: currentDisplayStage === ds.key ? ds.dot : CRIE.lineSoft,
                    color: currentDisplayStage === ds.key ? "#fff" : CRIE.muted,
                    fontSize: 10, fontWeight: 500, transition: "all .15s",
                  }}
                >{ds.label.split(" ").pop()}</button>
              ))}
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              ["Formato", formatLabel],
              ["Data", formatShortDate(card.scheduled_at ?? card.created_at)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: CRIE.lineSoft, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 10.5, color: CRIE.muted, marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Assignee */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: CRIE.muted, marginBottom: 8 }}>Atribuído a</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {assignedMember ? (
                <>
                  <div style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: deriveColor(assignedMember.user_id),
                    display: "grid", placeItems: "center",
                    fontSize: 10, fontWeight: 700, color: CRIE.ink, flexShrink: 0,
                  }}>
                    {assignedMember.display_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: CRIE.ink, flex: 1 }}>
                    {assignedMember.display_name}
                  </span>
                  <button
                    aria-label="Remover atribuição"
                    onClick={() => handleAssign(null)}
                    disabled={assigneeLoading}
                    style={{
                      width: 22, height: 22, borderRadius: 999,
                      border: `1px solid ${CRIE.line}`, background: "#fff",
                      cursor: "pointer", display: "grid", placeItems: "center",
                      fontSize: 13, color: CRIE.muted, lineHeight: 1,
                    }}
                  >×</button>
                </>
              ) : (
                <span style={{ fontSize: 12.5, color: CRIE.mutedSoft }}>Ninguém atribuído</span>
              )}
            </div>
            <select
              aria-label="Selecionar responsável"
              value={card.assigned_to ?? ""}
              onChange={(e) => handleAssign(e.target.value || null)}
              disabled={assigneeLoading}
              style={{
                marginTop: 8, width: "100%", padding: "8px 10px",
                borderRadius: 10, border: `1.5px solid ${CRIE.line}`,
                fontSize: 13, color: CRIE.ink, background: "#fff",
                outline: "none", cursor: "pointer", appearance: "auto",
              }}
              onFocus={(e) => (e.target.style.borderColor = CRIE.butterDeep)}
              onBlur={(e) => (e.target.style.borderColor = CRIE.line)}
            >
              <option value="">— Selecionar membro —</option>
              {(agencyMembers ?? []).map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: CRIE.muted, marginBottom: 8 }}>Legenda</div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: `1.5px solid ${CRIE.line}`, fontSize: 13,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
                resize: "none", outline: "none", boxSizing: "border-box", color: CRIE.ink,
              }}
              onFocus={(e) => (e.target.style.borderColor = CRIE.butterDeep)}
              onBlur={(e) => (e.target.style.borderColor = CRIE.line)}
            />
            <div style={{ fontSize: 11, color: CRIE.muted, textAlign: "right", marginTop: 4 }}>
              {caption.length}/{maxChars} chars
            </div>
          </div>

          {/* Comments */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: CRIE.muted, marginBottom: 8 }}>
              Comentarios ({comments?.length ?? 0})
            </div>
            {comments && comments.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                {comments.map((c: Comment) => (
                  <div key={c.id} style={{ display: "flex", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 999,
                      background: deriveColor(c.author_id), display: "grid",
                      placeItems: "center", fontSize: 10, fontWeight: 700, flex: "none",
                    }}>
                      {c.author_name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "??"}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{c.author_name ?? "Membro"}</span>
                        <span style={{ fontSize: 11, color: CRIE.muted }}>{formatShortDate(c.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: CRIE.inkSoft }}>{c.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: CRIE.mutedSoft, marginBottom: 12 }}>Nenhum comentario ainda.</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Adicionar comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                style={{
                  flex: 1, padding: "9px 12px", borderRadius: 10,
                  border: `1.5px solid ${CRIE.line}`, fontSize: 13,
                  fontFamily: "Inter, sans-serif", outline: "none", boxSizing: "border-box",
                }}
              />
              <Btn size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>Enviar</Btn>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${CRIE.line}`, display: "flex", gap: 8 }}>
          <Btn variant="secondary" style={{ flex: 1 }} onClick={onClose}>Fechar</Btn>
          {NEXT_STEP[card.stage] && (
            <Btn
              variant="butter"
              style={{ flex: 2 }}
              onClick={() => onStageChange(card.id, NEXT_STEP[card.stage]!.nextStage)}
            >
              {NEXT_STEP[card.stage]!.label} →
            </Btn>
          )}
        </div>
      </div>
    </>
  );
}

// ─── KanbanBoardPage ─────────────────────────────────────────────────────────

export function KanbanBoardPage() {
  const currentWorkspaceId = useAuthStore((s) => s.currentWorkspaceId);
  const workspaces = useAuthStore((s) => s.workspaces);
  const user = useAuthStore((s) => s.user);

  const { data: postCards, isLoading } = usePostCards(currentWorkspaceId);
  const moveCard = useMoveCard();

  const [brandFilter, setBrandFilter] = useState<string>("todos");
  const [selectedCard, setSelectedCard] = useState<PostCard | null>(null);

  // Build workspace filter options from actual workspaces
  const filterOptions = useMemo(() => {
    const options = [{ id: "todos", label: "Todos" }];
    for (const ws of workspaces) {
      options.push({ id: ws.id, label: ws.name });
    }
    return options;
  }, [workspaces]);

  // Filter cards by workspace
  const filteredCards = useMemo(() => {
    if (!postCards) return [];
    if (brandFilter === "todos") return postCards;
    return postCards.filter((c) => c.workspace_id === brandFilter);
  }, [postCards, brandFilter]);

  function handleStageChange(cardId: string, newDbStage: PostStage) {
    if (!currentWorkspaceId || !user) return;
    const card = postCards?.find((c) => c.id === cardId);
    moveCard.mutate({
      cardId,
      fromStage: card?.stage,
      newStage: newDbStage,
      workspaceId: currentWorkspaceId,
      userId: user.id,
    });
    // Optimistic update for selectedCard
    if (selectedCard?.id === cardId) {
      setSelectedCard({ ...selectedCard, stage: newDbStage });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Filter bar */}
      <div style={{
        padding: "16px 24px 12px", borderBottom: `1px solid ${CRIE.line}`,
        display: "flex", gap: 10, alignItems: "center", flexShrink: 0, background: CRIE.bg,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {filterOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setBrandFilter(f.id)}
              style={{
                padding: "6px 14px", borderRadius: 999,
                border: `1.5px solid ${brandFilter === f.id ? CRIE.ink : CRIE.line}`,
                background: brandFilter === f.id ? CRIE.ink : "#fff",
                color: brandFilter === f.id ? "#fff" : CRIE.ink,
                fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >{f.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <Btn variant="butter">+ Novo post</Btn>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center", color: CRIE.muted }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>...</div>
            <div style={{ fontSize: 13 }}>Carregando posts...</div>
          </div>
        </div>
      )}

      {/* Board */}
      {!isLoading && (
        <div style={{
          flex: 1, overflowX: "auto", display: "flex", gap: 14,
          padding: "16px 24px", alignItems: "flex-start", minHeight: 0,
        }}>
          {DISPLAY_STAGES.map((stage) => {
            const stageCards = filteredCards.filter((c) =>
              (stage.dbStages as string[]).includes(c.stage)
            );
            return (
              <KanbanColumnUI
                key={stage.key}
                stage={stage}
                cards={stageCards}
                onCardClick={setSelectedCard}
                onAdvance={handleStageChange}
              />
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onStageChange={handleStageChange}
        />
      )}
    </div>
  );
}
