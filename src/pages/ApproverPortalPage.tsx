import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CRIE } from "@/lib/crie-tokens";
import { CrieMark, Pill, PCard, CrieBadge } from "@/components/crie";
import { useApprovalQueue } from "@/features/approver/hooks/useApprovalQueue";
import { useApprove } from "@/features/approver/hooks/useApprove";
import { useRequestChanges } from "@/features/approver/hooks/useRequestChanges";
import { useComments, useAddComment } from "@/features/comments/hooks/useComments";
import { useApproverStore } from "@/stores/useApproverStore";
import type { PostCard } from "@/types";
import type { Comment } from "@/types/comments";

// ─── Bottom nav (shared across approver sub-pages) ────────────────────────────

export function ApproverBottomNav() {
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
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: CRIE.card,
        borderTop: `1px solid ${CRIE.line}`,
        display: "flex",
        zIndex: 50,
        boxSizing: "border-box",
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
              padding: "10px 0 12px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              color: active ? CRIE.ink : CRIE.muted,
              fontFamily: "Inter, sans-serif",
              borderTop: `2px solid ${active ? CRIE.butterDeep : "transparent"}`,
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

// ─── Inline tab nav (used inside CardView to avoid conflicting with action bar) ─

function ApproverBottomNavInline() {
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
    <>
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
    </>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

const ADJUST_CATEGORIES = ["copy", "art", "timing", "other"] as const;
const ADJUST_LABELS: Record<string, string> = {
  copy: "Copy",
  art: "Arte",
  timing: "Timing",
  other: "Outro",
};
type AdjustCategory = (typeof ADJUST_CATEGORIES)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAspectRatio(postType: string | null | undefined): string {
  if (postType === "story") return "9 / 16";
  if (postType === "feed") return "4 / 5";
  return "1 / 1";
}

function getBrandInitialColor(workspaceId: string): string {
  // Deterministic color from workspace id
  const colors = [CRIE.butter, "#C6D3A3", "#B8C0E0", "#F0C9CC", "#D4B8E0"];
  let hash = 0;
  for (let i = 0; i < workspaceId.length; i++) {
    hash = workspaceId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "em breve";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "expirado";
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "menos de 1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

// ─── Post thumbnail / image area ──────────────────────────────────────────────

interface ImageAreaProps {
  card: PostCard;
  currentSlide: number;
  pins: Comment[];
  onPlacePin: (x: number, y: number) => void;
}

function ImageArea({ card, currentSlide, pins, onPlacePin }: ImageAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const ratio = getAspectRatio(card.post_type);

  // Latest asset version thumbnail
  const latestAsset = card.asset_versions
    ?.slice()
    .sort((a, b) => b.version - a.version)[0];
  const thumbnailUrl = latestAsset?.thumbnail_url ?? latestAsset?.file_url ?? null;

  const slidePins = pins.filter((p) => p.pin_x !== null && p.pin_y !== null);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlacePin(x, y);
  }

  const slideCount = card.asset_versions?.length ?? 1;

  return (
    <div
      ref={areaRef}
      onClick={handleClick}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratio,
        maxHeight: 400,
        overflow: "hidden",
        cursor: "crosshair",
        background: thumbnailUrl
          ? undefined
          : `repeating-linear-gradient(
              45deg,
              ${CRIE.lineSoft},
              ${CRIE.lineSoft} 10px,
              ${CRIE.line} 10px,
              ${CRIE.line} 20px
            )`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={card.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontSize: 40, opacity: 0.18 }}>🖼</span>
      )}

      {/* Slide counter badge */}
      {slideCount > 1 && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(14,14,12,0.75)",
            color: "#fff",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: "blur(4px)",
          }}
        >
          {currentSlide}/{slideCount}
        </div>
      )}

      {/* Tap to comment label */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          background: "rgba(14,14,12,0.55)",
          color: "#fff",
          borderRadius: 999,
          padding: "3px 10px",
          fontSize: 11,
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
        }}
      >
        toque para comentar
      </div>

      {/* Placed pins */}
      {slidePins.map((pin, idx) => (
        <div
          key={pin.id}
          style={{
            position: "absolute",
            left: `${pin.pin_x}%`,
            top: `${pin.pin_y}%`,
            transform: "translate(-50%, -50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: CRIE.butter,
            border: "2px solid #fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: CRIE.ink,
            pointerEvents: "none",
          }}
        >
          {idx + 1}
        </div>
      ))}
    </div>
  );
}

// ─── Ajuste Drawer ────────────────────────────────────────────────────────────

interface AjusteDrawerProps {
  open: boolean;
  onClose: () => void;
  onSend: (category: AdjustCategory, note: string) => void;
  isPending?: boolean;
}

function AjusteDrawer({ open, onClose, onSend, isPending }: AjusteDrawerProps) {
  const [category, setCategory] = useState<AdjustCategory>("copy");
  const [note, setNote] = useState("");

  function handleSend() {
    onSend(category, note);
    setNote("");
    setCategory("copy");
    onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(14,14,12,0.45)",
        }}
        aria-hidden="true"
      />

      {/* Drawer card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          background: CRIE.card,
          borderRadius: "24px 24px 0 0",
          padding: "12px 20px 32px",
          zIndex: 1,
          animation: "slideUp .22s ease",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 999,
            background: CRIE.line,
            margin: "0 auto 20px",
          }}
        />

        <h3
          style={{
            margin: "0 0 16px",
            fontSize: 17,
            fontWeight: 700,
            color: CRIE.ink,
          }}
        >
          Pedir ajuste
        </h3>

        {/* Category pills */}
        <p style={{ margin: "0 0 8px", fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>
          Categoria
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {ADJUST_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "7px 16px",
                borderRadius: 999,
                border: `1px solid ${category === cat ? CRIE.ink : CRIE.line}`,
                background: category === cat ? CRIE.ink : "#fff",
                color: category === cat ? "#fff" : CRIE.ink,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all .12s",
              }}
            >
              {ADJUST_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Note textarea */}
        <p style={{ margin: "0 0 8px", fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>
          Observação <span style={{ color: CRIE.mutedSoft }}>(opcional)</span>
        </p>
        <textarea
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Descreva o que precisa ser ajustado…"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: `1.5px solid ${CRIE.line}`,
            fontSize: 14,
            fontFamily: "Inter, sans-serif",
            resize: "none",
            outline: "none",
            color: CRIE.ink,
            background: CRIE.paper,
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={handleSend}
          disabled={isPending}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "13px",
            borderRadius: 999,
            border: "none",
            background: isPending ? CRIE.line : CRIE.ink,
            color: isPending ? CRIE.muted : "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: isPending ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {isPending ? "Enviando…" : "Enviar solicitação"}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Loading / Error states ────────────────────────────────────────────────────

function EmptyQueue() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        padding: 32,
        paddingBottom: 80,
      }}
    >
      <span style={{ fontSize: 48 }}>✅</span>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: CRIE.ink, textAlign: "center" }}>
        Tudo aprovado!
      </p>
      <p style={{ margin: 0, fontSize: 14, color: CRIE.muted, textAlign: "center" }}>
        Não há posts pendentes de aprovação no momento.
      </p>
      <ApproverBottomNav />
    </div>
  );
}

// ─── Single card view ─────────────────────────────────────────────────────────

interface CardViewProps {
  card: PostCard;
  totalCards: number;
  currentIdx: number;
  approvedIds: Set<string>;
  onNavigate: (idx: number) => void;
  onApprove: (cardId: string) => void;
  onRequestChanges: (category: AdjustCategory, note: string, cardId: string) => void;
  isApprovePending: boolean;
  isRequestChangesPending: boolean;
  session: ReturnType<typeof useApproverStore.getState>["session"];
}

function CardView({
  card,
  totalCards,
  currentIdx,
  approvedIds,
  onNavigate,
  onApprove,
  onRequestChanges,
  isApprovePending,
  isRequestChangesPending,
  session,
}: CardViewProps) {
  const navigate = useNavigate();

  const [currentSlide, setCurrentSlide] = useState(1);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [pinComment, setPinComment] = useState("");
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [approveConfirming, setApproveConfirming] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: savedComments = [] } = useComments("card", card.id);
  const addComment = useAddComment();

  const isApproved = approvedIds.has(card.id);
  const remainingCount = totalCards - approvedIds.size;

  // Latest copy version caption
  const latestCopy = card.copy_versions
    ?.slice()
    .sort((a, b) => b.version - a.version)[0];
  const captionText = latestCopy?.caption ?? latestCopy?.body ?? "";

  // Slide count from asset_versions
  const slideCount = card.asset_versions?.length ?? 1;

  const CAPTION_LIMIT = 200;
  const captionTruncated =
    captionText.length > CAPTION_LIMIT
      ? captionText.slice(0, CAPTION_LIMIT) + "…"
      : captionText;

  const MAX_SLIDE_BTNS = 6;
  const slideNums = Array.from({ length: slideCount }, (_, i) => i + 1);
  const visibleSlides = slideNums.slice(0, MAX_SLIDE_BTNS);
  const hasMoreSlides = slideCount > MAX_SLIDE_BTNS;

  const handlePlacePin = useCallback((x: number, y: number) => {
    setPendingPin({ x, y });
    setPinComment("");
  }, []);

  async function handleSendPin() {
    if (!pendingPin || !pinComment.trim()) return;
    await addComment.mutateAsync({
      targetType: "card",
      targetId: card.id,
      body: pinComment.trim(),
      pinX: pendingPin.x,
      pinY: pendingPin.y,
      authorId: session?.approver_email ?? "approver",
    });
    setPendingPin(null);
    setPinComment("");
  }

  function handleCancelPin() {
    setPendingPin(null);
    setPinComment("");
  }

  function handleApproveConfirm() {
    onApprove(card.id);
    setApproveConfirming(false);
    // Auto-advance to next unapproved post
    // (parent handles the data update, we just signal the navigation intent)
  }

  function handleAdjustSend(category: AdjustCategory, note: string) {
    onRequestChanges(category, note, card.id);
  }

  const brandColor = getBrandInitialColor(card.workspace_id);
  const formatLabel = card.post_type
    ? { feed: "Feed 4:5", story: "Story", reels: "Reel", carrossel: "Carrossel" }[card.post_type] ?? card.post_type
    : "Post";

  // Session expiry
  const expiryText = session ? formatExpiry(null) : "47h"; // will improve when expiry is surfaced

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Header ── */}
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
          {/* Left */}
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
                {session?.agency_name ?? "Agência"}
              </div>
              <div style={{ fontSize: 11, color: CRIE.muted, lineHeight: 1.2 }}>
                revisando como {session?.approver_name ?? "Aprovador"}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pill dark={false} small style={{ background: brandColor }}>
              ws
            </Pill>
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
        </div>
      </header>

      {/* ── Magic link banner ── */}
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
        Você está revisando via link mágico · Expira em{" "}
        <strong>{expiryText}</strong>
      </div>

      {/* ── Page tabs ── */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: CRIE.paper,
          borderBottom: `1px solid ${CRIE.line}`,
          display: "flex",
        }}
      >
        <ApproverBottomNavInline />
      </div>

      {/* ── Content area ── */}
      <main
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "16px 16px 100px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ── Progress ── */}
        <div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 13,
              color: CRIE.muted,
              fontWeight: 500,
            }}
          >
            {remainingCount > 0
              ? `${remainingCount} post${remainingCount > 1 ? "s" : ""} pendente${remainingCount > 1 ? "s" : ""}`
              : "Todos os posts revisados!"}
          </p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {Array.from({ length: totalCards }, (_, i) => {
              // We'd need the full list to know which are approved — passed via index
              const isApprovedPost = i < currentIdx && approvedIds.size > 0; // approximate
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => onNavigate(i)}
                  aria-label={`Post ${i + 1}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: isCurrent ? `2px solid ${CRIE.ink}` : `1.5px solid ${CRIE.line}`,
                    background: isApprovedPost
                      ? CRIE.butter
                      : isCurrent
                      ? CRIE.ink
                      : "#fff",
                    color: isApprovedPost ? CRIE.ink : isCurrent ? "#fff" : CRIE.muted,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all .15s",
                    flexShrink: 0,
                  }}
                >
                  {isApprovedPost ? "✓" : i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Post card ── */}
        <PCard pad={0} style={{ overflow: "hidden", borderRadius: 20 }}>
          {/* Card header */}
          <div
            style={{
              padding: "12px 14px 10px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: CRIE.ink,
                  lineHeight: 1.3,
                }}
              >
                {card.title}
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <CrieBadge label={formatLabel} color={CRIE.muted} />
              </div>
            </div>
          </div>

          {/* Image area */}
          <ImageArea
            card={card}
            currentSlide={currentSlide}
            pins={savedComments}
            onPlacePin={handlePlacePin}
          />

          {/* Slide navigation */}
          {slideCount > 1 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "10px 14px",
                borderTop: `1px solid ${CRIE.lineSoft}`,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {visibleSlides.map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentSlide(n)}
                  aria-label={`Slide ${n}`}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: `1.5px solid ${currentSlide === n ? CRIE.ink : CRIE.line}`,
                    background: currentSlide === n ? CRIE.ink : "#fff",
                    color: currentSlide === n ? "#fff" : CRIE.ink,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {n}
                </button>
              ))}
              {hasMoreSlides && (
                <span style={{ fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>…</span>
              )}
            </div>
          )}

          {/* Caption */}
          <div
            style={{
              padding: "10px 14px 14px",
              borderTop: `1px solid ${CRIE.lineSoft}`,
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 11,
                fontWeight: 600,
                color: CRIE.muted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Legenda
            </p>
            {captionText ? (
              <>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: CRIE.inkSoft,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {captionExpanded ? captionText : captionTruncated}
                </p>
                {captionText.length > CAPTION_LIMIT && (
                  <button
                    onClick={() => setCaptionExpanded((v) => !v)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      color: CRIE.butterInk,
                      fontWeight: 600,
                      padding: "4px 0 0",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {captionExpanded ? "ver menos" : "ver mais"}
                  </button>
                )}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: CRIE.mutedSoft, fontStyle: "italic" }}>
                Sem legenda ainda.
              </p>
            )}
          </div>
        </PCard>

        {/* ── Pin comment input ── */}
        {pendingPin && (
          <PCard
            pad={14}
            style={{
              border: `1.5px solid ${CRIE.butterDeep}`,
              background: CRIE.butterWash,
            }}
          >
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 700,
                color: CRIE.butterInk,
              }}
            >
              Pin #{savedComments.length + 1} — Slide {currentSlide}
            </p>
            <textarea
              rows={3}
              value={pinComment}
              onChange={(e) => setPinComment(e.target.value)}
              placeholder="Descreva o ajuste neste ponto…"
              autoFocus
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: `1.5px solid ${CRIE.butterDeep}`,
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                resize: "none",
                outline: "none",
                color: CRIE.ink,
                background: "#fff",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={handleCancelPin}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: `1px solid ${CRIE.line}`,
                  background: "#fff",
                  color: CRIE.muted,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendPin}
                disabled={!pinComment.trim() || addComment.isPending}
                style={{
                  flex: 1,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "none",
                  background: pinComment.trim() ? CRIE.ink : CRIE.line,
                  color: pinComment.trim() ? "#fff" : CRIE.muted,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: pinComment.trim() ? "pointer" : "not-allowed",
                  fontFamily: "Inter, sans-serif",
                  transition: "all .12s",
                }}
              >
                {addComment.isPending ? "Enviando…" : "Enviar comentário"}
              </button>
            </div>
          </PCard>
        )}

        {/* ── Saved pin comments ── */}
        {savedComments.length > 0 && (
          <PCard pad={14}>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                fontWeight: 700,
                color: CRIE.muted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Comentários de pin ({savedComments.length})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {savedComments.map((pin, idx) => (
                <div
                  key={pin.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderBottom: `1px solid ${CRIE.lineSoft}`,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: CRIE.butter,
                      border: `1.5px solid ${CRIE.butterDeep}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 700,
                      color: CRIE.ink,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: CRIE.ink, lineHeight: 1.4 }}>
                      {pin.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </PCard>
        )}

        {/* ── Approved state card ── */}
        {isApproved && (
          <div
            style={{
              background: "#F0FDF4",
              border: "1.5px solid #86EFAC",
              borderRadius: 16,
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 28 }}>✅</span>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#15803D" }}>
              Aprovado!
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#166534" }}>
              Este post foi aprovado com sucesso.
            </p>
          </div>
        )}

        {/* ── Post navigation ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 0",
            gap: 8,
          }}
        >
          <button
            onClick={() => onNavigate(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${CRIE.line}`,
              background: "#fff",
              color: currentIdx === 0 ? CRIE.mutedSoft : CRIE.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: currentIdx === 0 ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Anterior
          </button>

          <span style={{ fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>
            Post {currentIdx + 1} de {totalCards}
          </span>

          <button
            onClick={() => onNavigate(Math.min(totalCards - 1, currentIdx + 1))}
            disabled={currentIdx === totalCards - 1}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${CRIE.line}`,
              background: "#fff",
              color: currentIdx === totalCards - 1 ? CRIE.mutedSoft : CRIE.ink,
              fontSize: 13,
              fontWeight: 600,
              cursor: currentIdx === totalCards - 1 ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Próximo →
          </button>
        </div>
      </main>

      {/* ── Bottom action bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: CRIE.card,
          borderTop: `1px solid ${CRIE.line}`,
          padding: "10px 14px",
          zIndex: 40,
          boxSizing: "border-box",
        }}
      >
        {approveConfirming ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, fontSize: 13, color: CRIE.muted, fontWeight: 500 }}>
              Deslize para confirmar →
            </span>
            <button
              onClick={handleApproveConfirm}
              disabled={isApprovePending}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background: isApprovePending ? CRIE.line : "#16A34A",
                color: isApprovePending ? CRIE.muted : "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: isApprovePending ? "not-allowed" : "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {isApprovePending ? "…" : "Confirmar ✓"}
            </button>
            <button
              onClick={() => setApproveConfirming(false)}
              aria-label="Cancelar aprovação"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `1px solid ${CRIE.line}`,
                background: "#fff",
                color: CRIE.muted,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Comment icon button */}
            <button
              onClick={() => handlePlacePin(50, 50)}
              aria-label="Adicionar comentário"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `1.5px solid ${CRIE.line}`,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              💬
            </button>

            {/* Approve button */}
            <button
              onClick={() => !isApproved && setApproveConfirming(true)}
              disabled={isApproved || isApprovePending}
              style={{
                flex: 1,
                padding: "13px",
                borderRadius: 999,
                border: `1.5px solid ${isApproved ? "#86EFAC" : CRIE.butterDeep}`,
                background: isApproved ? "#F0FDF4" : CRIE.butter,
                color: isApproved ? "#15803D" : CRIE.ink,
                fontSize: 14,
                fontWeight: 700,
                cursor: isApproved ? "default" : "pointer",
                fontFamily: "Inter, sans-serif",
                transition: "all .15s",
              }}
            >
              {isApproved ? "✅ Aprovado" : "✅ Aprovar"}
            </button>

            {/* Pedir ajuste */}
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                width: 120,
                padding: "13px 10px",
                borderRadius: 999,
                border: `1.5px solid ${CRIE.line}`,
                background: "#fff",
                color: CRIE.ink,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              Pedir ajuste ✏️
            </button>
          </div>
        )}
      </div>

      {/* ── Ajuste Drawer ── */}
      <AjusteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSend={handleAdjustSend}
        isPending={isRequestChangesPending}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function ApproverPortalPage() {
  const session = useApproverStore((s) => s.session);
  const { data: cards = [], isLoading } = useApprovalQueue();
  const approve = useApprove();
  const requestChanges = useRequestChanges();

  const [currentIdx, setCurrentIdx] = useState(0);
  // Track locally which cards have been approved in this session
  // (optimistic; the queue itself will shrink after server confirms)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: CRIE.bg,
          fontFamily: "Inter, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: CRIE.muted,
          fontSize: 14,
        }}
      >
        Carregando posts para aprovação…
      </div>
    );
  }

  if (cards.length === 0) {
    return <EmptyQueue />;
  }

  const card = cards[Math.min(currentIdx, cards.length - 1)];
  if (!card) return <EmptyQueue />;

  function handleApprove(cardId: string) {
    setApprovedIds((prev) => new Set([...prev, cardId]));
    approve.mutate({ postCardId: cardId });
    // Auto-advance to next unapproved card
    const nextIdx = cards.findIndex((c, i) => i > currentIdx && !approvedIds.has(c.id));
    if (nextIdx !== -1) {
      setTimeout(() => setCurrentIdx(nextIdx), 500);
    }
  }

  function handleRequestChanges(category: AdjustCategory, note: string, cardId: string) {
    requestChanges.mutate({
      post_card_id: cardId,
      reason: category,
      note: note || undefined,
    });
  }

  return (
    <CardView
      card={card}
      totalCards={cards.length}
      currentIdx={currentIdx}
      approvedIds={approvedIds}
      onNavigate={setCurrentIdx}
      onApprove={handleApprove}
      onRequestChanges={handleRequestChanges}
      isApprovePending={approve.isPending}
      isRequestChangesPending={requestChanges.isPending}
      session={session}
    />
  );
}
