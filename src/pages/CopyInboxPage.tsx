import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRIE } from "@/lib/crie-tokens";
import { CrieBadge } from "@/components/crie";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PostCard } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────

type KanbanStatus = "para_escrever" | "em_ajuste" | "aprovado";

interface DisplayCard {
  id: string;
  title: string;
  format: string;
  brief: string;
  deadline: string;
  status: KanbanStatus;
  post_type: string | null;
}

// ─── Column configuration ─────────────────────────────────────────────────────

interface ColumnConfig {
  key: KanbanStatus;
  label: string;
  dotColor: string;
  bg: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: "para_escrever",
    label: "Para escrever",
    dotColor: "#3B82F6",
    bg: "#3B82F60D",
  },
  {
    key: "em_ajuste",
    label: "Em ajuste",
    dotColor: "#F59E0B",
    bg: "#F59E0B0D",
  },
  {
    key: "aprovado",
    label: "Aprovado",
    dotColor: "#10B981",
    bg: "#10B9810D",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPostCardToDisplay(card: PostCard): DisplayCard {
  let status: KanbanStatus;

  // Cards in "copy" stage go to "para_escrever"
  if (card.stage === "copy") {
    status = "para_escrever";
  // Cards in "aprovacao_copy" go to "em_ajuste"
  } else if (card.stage === "aprovacao_copy") {
    status = "em_ajuste";
  // Cards whose latest copy_version is approved go to "aprovado"
  } else {
    const latestCopy = card.copy_versions
      ?.slice()
      .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
    if (latestCopy?.is_approved) {
      status = "aprovado";
    } else {
      // Default unmapped stages to "para_escrever"
      status = "para_escrever";
    }
  }

  const deadline = card.scheduled_at
    ? format(new Date(card.scheduled_at), "dd MMM", { locale: ptBR })
    : "-";

  return {
    id: card.id,
    title: card.title,
    format: card.post_type ?? "-",
    brief: "",
    deadline,
    status,
    post_type: card.post_type,
  };
}

// ─── Copy card component ──────────────────────────────────────────────────────

function CopyCardEl({
  card,
  onClick,
}: {
  card: DisplayCard;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: CRIE.card,
        border: `1px solid ${CRIE.line}`,
        borderRadius: 14,
        padding: 14,
        cursor: "pointer",
        transition: "box-shadow .12s, transform .12s",
        fontFamily: "Inter, sans-serif",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 4px 16px rgba(0,0,0,0.08)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
        (e.currentTarget as HTMLButtonElement).style.transform = "none";
      }}
      aria-label={`Editar: ${card.title}`}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: CRIE.ink,
          marginBottom: 8,
          lineHeight: 1.35,
        }}
      >
        {card.title}
      </div>

      {/* Badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
        {card.format && card.format !== "-" && (
          <CrieBadge label={card.format} color={CRIE.muted} />
        )}
      </div>

      {/* Deadline */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: CRIE.muted,
        }}
      >
        <span>Prazo:</span>
        <span style={{ fontWeight: 600, color: CRIE.inkSoft }}>{card.deadline}</span>
      </div>
    </button>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
  config,
  cards,
  onCardClick,
}: {
  config: ColumnConfig;
  cards: DisplayCard[];
  onCardClick: (card: DisplayCard) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: config.bg,
        borderRadius: 16,
        padding: 14,
        minHeight: 400,
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: config.dotColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: CRIE.ink,
          }}
        >
          {config.label}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 600,
            color: CRIE.muted,
            background: CRIE.card,
            border: `1px solid ${CRIE.line}`,
            borderRadius: 99,
            padding: "2px 8px",
          }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cards.map((card) => (
          <CopyCardEl
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CopyInboxPage() {
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuthStore();

  const { data: postCards = [], isLoading } = usePostCards(currentWorkspaceId);

  // Filter to copy-relevant stages and map to display cards
  const displayCards = useMemo(() => {
    const relevantStages = new Set(["copy", "aprovacao_copy"]);
    const relevant = postCards.filter((c) => {
      if (relevantStages.has(c.stage)) return true;
      // Also include if latest copy_version is approved
      const latestCopy = c.copy_versions
        ?.slice()
        .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
      return latestCopy?.is_approved === true;
    });
    return relevant.map(mapPostCardToDisplay);
  }, [postCards]);

  function handleCardClick(card: DisplayCard) {
    navigate(`/app/copy-write?card=${card.id}`);
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
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: CRIE.ink,
          }}
        >
          Inbox de Copy
        </h1>
        <span style={{ fontSize: 13, color: CRIE.muted }}>
          {isLoading ? "Carregando..." : `${displayCards.length} posts no total`}
        </span>
      </div>

      {/* 3-column kanban */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            config={col}
            cards={displayCards.filter((c) => c.status === col.key)}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}
