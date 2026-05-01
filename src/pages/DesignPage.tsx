import { useState, useCallback, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, CrieBadge } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { useAssetUpload } from "@/features/designer/hooks/useAssetUpload";
import { IG_FORMATS, type IGFormat } from "@/lib/instagram";
import { IG_FORMAT_TYPES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { PostCard, BrandProfile } from "@/types";

// ─── Icon paths ───────────────────────────────────────────────────────────────
const ICO_GRID =
  "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z";
const ICO_PAINTBRUSH =
  "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 1.5 2.25 2.25 0 002.14 2.91c1.074.22 2.1-.18 2.75-1.04a3 3 0 001.13-2.34l.34-2.16zm0 0l6.97-6.97m0 0l2.12-2.12a1.5 1.5 0 00-2.12-2.12l-2.12 2.12m4.24 0l-4.24 4.24";
const ICO_CLOSE = "M6 18L18 6M6 6l12 12";
const ICO_UPLOAD = "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12";
const ICO_DOWNLOAD = "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4";
const ICO_SEND = "M12 19l9 2-9-18-9 18 9-2zm0 0v-8";
const ICO_SHIELD = "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";
const ICO_CHECK = "M5 13l4 4L19 7";
const ICO_CLOCK = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";

// ─── Post type label helpers ──────────────────────────────────────────────────
const POST_TYPE_LABELS: Record<string, string> = {
  feed: "Feed",
  story: "Story",
  reels: "Reels",
  carrossel: "Carrossel",
};

const POST_TYPE_COLORS: Record<string, string> = {
  feed: CRIE.sky,
  story: CRIE.violet,
  reels: CRIE.rose,
  carrossel: CRIE.amber,
};

function postTypeLabel(pt: string | null): string {
  return pt ? (POST_TYPE_LABELS[pt] ?? pt) : "-";
}

function postTypeColor(pt: string | null): string {
  return pt ? (POST_TYPE_COLORS[pt] ?? CRIE.muted) : CRIE.muted;
}

// ─── Inline SVG icon helper ───────────────────────────────────────────────────
function Ico({ d, size = 16, color = CRIE.ink }: { d: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  );
}

// ─── Thumbnail striped placeholder ───────────────────────────────────────────
function ThumbPlaceholder({ size = 56 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: `repeating-linear-gradient(
          45deg,
          ${CRIE.lineSoft},
          ${CRIE.lineSoft} 4px,
          ${CRIE.line} 4px,
          ${CRIE.line} 8px
        )`,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  count,
  color,
  icon,
}: {
  label: string;
  count: number;
  color: string;
  icon: string;
}) {
  return (
    <PCard>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Ico d={icon} size={18} color={color} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: CRIE.muted, fontWeight: 500, marginBottom: 2 }}>
            {label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: CRIE.ink, lineHeight: 1 }}>
            {count}
          </div>
        </div>
      </div>
    </PCard>
  );
}

// ─── Design card ─────────────────────────────────────────────────────────────
function DesignCard({
  card,
  showOpenCanvas,
  onOpenCanvas,
}: {
  card: PostCard;
  showOpenCanvas: boolean;
  onOpenCanvas: (card: PostCard) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const thumb = card.asset_versions?.[0]?.thumbnail_url ?? null;

  return (
    <div
      style={{
        background: CRIE.card,
        border: `1px solid ${hovered ? CRIE.butterDeep : CRIE.line}`,
        borderRadius: 14,
        padding: 12,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        transition: "border-color .12s, box-shadow .12s",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.07)" : "none",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <ThumbPlaceholder />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title — 2-line clamp */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: CRIE.ink,
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: 6,
          }}
        >
          {card.title}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
          {card.post_type && (
            <CrieBadge
              label={postTypeLabel(card.post_type)}
              color={postTypeColor(card.post_type)}
            />
          )}
          {card.asset_versions && card.asset_versions.length > 0 && (
            <span style={{ fontSize: 11, color: CRIE.muted }}>
              {card.asset_versions.length} vers{card.asset_versions.length === 1 ? "ao" : "oes"}
            </span>
          )}
        </div>

        {showOpenCanvas && (
          <button
            onClick={() => onOpenCanvas(card)}
            style={{
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 12px",
              borderRadius: 999,
              border: `1px solid ${CRIE.butterDeep}`,
              background: CRIE.butter,
              color: CRIE.butterInk,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "opacity .12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            aria-label={`Abrir canvas: ${card.title}`}
          >
            <Ico d={ICO_PAINTBRUSH} size={12} color={CRIE.butterInk} />
            Abrir canvas
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────
interface ColumnConf {
  label: string;
  dotColor: string;
  bg: string;
}

function DesignColumn({
  conf,
  cards,
  showOpenCanvas,
  onOpenCanvas,
}: {
  conf: ColumnConf;
  cards: PostCard[];
  showOpenCanvas: boolean;
  onOpenCanvas: (card: PostCard) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: `${conf.dotColor}0D`,
        borderRadius: 18,
        padding: 14,
        minHeight: 320,
      }}
    >
      {/* Header */}
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
            background: conf.dotColor,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13.5, fontWeight: 700, color: CRIE.ink }}>
          {conf.label}
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
        {cards.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "24px 0",
              fontSize: 12,
              color: CRIE.mutedSoft,
            }}
          >
            Nenhum card aqui
          </div>
        ) : (
          cards.map((card) => (
            <DesignCard
              key={card.id}
              card={card}
              showOpenCanvas={showOpenCanvas}
              onOpenCanvas={onOpenCanvas}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Canvas slide-over ────────────────────────────────────────────────────────
function CanvasSlideOver({
  card,
  onClose,
}: {
  card: PostCard;
  onClose: () => void;
}) {
  const [activeFormat, setActiveFormat] = useState<IGFormat>("feed_1_1");
  const [imageUrl, setImageUrl] = useState<string | null>(
    card.asset_versions?.[0]?.file_url ?? null
  );
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assetUpload = useAssetUpload();

  const fmt = IG_FORMATS[activeFormat];

  // Compute canvas display size preserving ratio, max 480px wide
  const MAX_W = 480;
  const ratio = fmt.width / fmt.height;
  const canvasW = Math.min(MAX_W, fmt.width);
  const canvasH = Math.round(canvasW / ratio);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  }

  const processFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      assetUpload.mutate({ postCardId: card.id, file, format: activeFormat });
    },
    [card.id, activeFormat, assetUpload]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) processFile(file);
  }

  async function handleRequestApproval() {
    const { error } = await supabase
      .from("post_cards")
      .update({ stage: "aprovacao_arte" })
      .eq("id", card.id);

    if (error) {
      toast.error("Erro ao solicitar aprovacao");
    } else {
      toast.success("Aprovacao de arte solicitada!");
      onClose();
    }
  }

  async function handleExport() {
    if (!imageUrl) {
      toast.error("Nenhuma imagem para exportar");
      return;
    }
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${card.title.replace(/[^a-z0-9]/gi, "_")}_${activeFormat}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download iniciado");
    } catch {
      toast.error("Erro ao exportar");
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(14,14,12,0.45)",
          zIndex: 200,
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Canvas: ${card.title}`}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "60%",
          minWidth: 480,
          maxWidth: 900,
          background: CRIE.paper,
          borderLeft: `1px solid ${CRIE.line}`,
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 20px",
            borderBottom: `1px solid ${CRIE.line}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: CRIE.butterWash,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ico d={ICO_PAINTBRUSH} size={16} color={CRIE.butterInk} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: CRIE.ink, lineHeight: 1.2 }}>
              Canvas
            </div>
            <div
              style={{
                fontSize: 12,
                color: CRIE.muted,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {card.title}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar canvas"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.card,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ico d={ICO_CLOSE} size={15} color={CRIE.muted} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* Format selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Formato
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {IG_FORMAT_TYPES.map((f) => {
                const isActive = activeFormat === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setActiveFormat(f.value as IGFormat)}
                    style={{
                      padding: "5px 13px",
                      borderRadius: 999,
                      border: `1.5px solid ${isActive ? CRIE.butterDeep : CRIE.line}`,
                      background: isActive ? CRIE.butter : CRIE.card,
                      color: isActive ? CRIE.butterInk : CRIE.inkSoft,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                      transition: "all .1s",
                    }}
                    aria-pressed={isActive}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main area: canvas + controls */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Canvas area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {/* Canvas frame */}
              <div
                style={{
                  position: "relative",
                  width: canvasW,
                  height: canvasH,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `2px solid ${CRIE.line}`,
                  background: CRIE.bg,
                  flexShrink: 0,
                }}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Canvas preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  /* Drop zone */
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    aria-label="Soltar imagem ou clique para selecionar"
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      cursor: "pointer",
                      background: isDragOver ? CRIE.butterWash : "transparent",
                      transition: "background .12s",
                    }}
                  >
                    <Ico d={ICO_UPLOAD} size={32} color={isDragOver ? CRIE.butterInk : CRIE.mutedSoft} />
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft }}>
                        Solte uma imagem
                      </div>
                      <div style={{ fontSize: 11, color: CRIE.muted, marginTop: 3 }}>
                        ou clique para selecionar
                      </div>
                    </div>
                  </div>
                )}

                {/* Safe zones overlay */}
                {showSafeZones && (
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      border: `${Math.round(canvasH * 0.13)}px solid rgba(0,0,0,0.18)`,
                      pointerEvents: "none",
                      borderRadius: 14,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>

              {/* Replace image button when imageUrl is set */}
              {imageUrl && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 14px",
                    borderRadius: 999,
                    border: `1px solid ${CRIE.line}`,
                    background: CRIE.card,
                    color: CRIE.inkSoft,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <Ico d={ICO_UPLOAD} size={13} color={CRIE.muted} />
                  Trocar imagem
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
                aria-hidden="true"
              />
            </div>

            {/* Right controls */}
            <div
              style={{
                width: 200,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Format info */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: CRIE.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Info do formato
                </div>
                <div
                  style={{
                    background: CRIE.card,
                    border: `1px solid ${CRIE.line}`,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: CRIE.ink, marginBottom: 3 }}>
                    {fmt.label}
                  </div>
                  <div style={{ fontSize: 11, color: CRIE.muted }}>
                    {fmt.width} × {fmt.height} px
                  </div>
                  <div style={{ fontSize: 11, color: CRIE.muted, marginTop: 2 }}>
                    Razao {fmt.ratio}
                  </div>
                </div>
              </div>

              {/* Safe zones toggle */}
              <button
                onClick={() => setShowSafeZones((v) => !v)}
                aria-pressed={showSafeZones}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${showSafeZones ? CRIE.butterDeep : CRIE.line}`,
                  background: showSafeZones ? CRIE.butterWash : CRIE.card,
                  color: showSafeZones ? CRIE.butterInk : CRIE.inkSoft,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                <Ico d={ICO_SHIELD} size={14} color={showSafeZones ? CRIE.butterInk : CRIE.muted} />
                Safe zones: {showSafeZones ? "ON" : "OFF"}
              </button>

              {/* Export */}
              <button
                onClick={handleExport}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${CRIE.line}`,
                  background: CRIE.card,
                  color: CRIE.inkSoft,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  width: "100%",
                }}
              >
                <Ico d={ICO_DOWNLOAD} size={14} color={CRIE.inkSoft} />
                Exportar
              </button>

              {/* Send for approval */}
              <button
                onClick={handleRequestApproval}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: CRIE.ink,
                  color: "#fff",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  width: "100%",
                }}
              >
                <Ico d={ICO_SEND} size={14} color="#fff" />
                Enviar para aprovacao
              </button>

              {/* Upload progress */}
              {assetUpload.isPending && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: CRIE.butterWash,
                    border: `1px solid ${CRIE.butterDeep}`,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: `2px solid ${CRIE.butterInk}`,
                      borderTopColor: "transparent",
                      animation: "spin 0.8s linear infinite",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: CRIE.butterInk, fontWeight: 600 }}>
                    Enviando imagem...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Grid Preview (3x3) ───────────────────────────────────────────────────────
function GridPreviewOverlay({
  posts,
  onClose,
}: {
  posts: PostCard[];
  onClose: () => void;
}) {
  const latest9 = posts.slice(0, 9);

  // Pad to 9
  const cells = [
    ...latest9,
    ...Array.from({ length: Math.max(0, 9 - latest9.length) }).map(() => null),
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(14,14,12,0.55)",
          zIndex: 300,
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Preview do Grid IG"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 301,
          background: CRIE.card,
          borderRadius: 22,
          border: `1px solid ${CRIE.line}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          padding: 20,
          width: 380,
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: CRIE.ink }}>Preview do Grid IG</div>
            <div style={{ fontSize: 11, color: CRIE.muted }}>Ultimos 9 posts com assets</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar grid"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.paper,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ico d={ICO_CLOSE} size={14} color={CRIE.muted} />
          </button>
        </div>

        {/* 3x3 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 3,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {cells.map((card, i) => (
            <div
              key={card ? card.id : `empty-${i}`}
              style={{
                aspectRatio: "1",
                background: CRIE.bg,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {card ? (
                card.asset_versions?.[0]?.thumbnail_url ? (
                  <img
                    src={card.asset_versions[0].thumbnail_url}
                    alt={card.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: `repeating-linear-gradient(
                        45deg,
                        ${CRIE.lineSoft},
                        ${CRIE.lineSoft} 3px,
                        ${CRIE.line} 3px,
                        ${CRIE.line} 6px
                      )`,
                    }}
                    aria-hidden="true"
                  />
                )
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: CRIE.lineSoft,
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Brand query ──────────────────────────────────────────────────────────────
function useBrandProfile(workspaceId: string | null) {
  return useQuery({
    queryKey: ["brand-profile", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const { data } = await supabase
        .from("brand_profiles")
        .select("brand_name, colors")
        .eq("workspace_id", workspaceId)
        .limit(1)
        .single();
      return data as Pick<BrandProfile, "brand_name" | "colors"> | null;
    },
    enabled: !!workspaceId,
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function DesignPage() {
  const { currentWorkspaceId, user } = useAuthStore();
  const { data: allCards = [], isLoading } = usePostCards(currentWorkspaceId);
  const { data: brand } = useBrandProfile(currentWorkspaceId);
  const [canvasCard, setCanvasCard] = useState<PostCard | null>(null);
  const [showGrid, setShowGrid] = useState(false);

  // ── Kanban buckets ──
  const { toCreate, inApproval, approved, withAssets } = useMemo(() => {
    const toCreate = allCards.filter(
      (c) =>
        c.stage === "design" && (c.assigned_to === user?.id || !c.assigned_to)
    );
    const inApproval = allCards.filter((c) => c.stage === "aprovacao_arte");
    const approved = allCards.filter(
      (c) =>
        (c.stage === "agendado" || c.stage === "publicado") &&
        c.asset_versions &&
        c.asset_versions.length > 0
    );
    const withAssets = allCards
      .filter((c) => c.asset_versions && c.asset_versions.length > 0)
      .sort((a, b) => {
        const at = a.scheduled_at ?? a.created_at;
        const bt = b.scheduled_at ?? b.created_at;
        return new Date(bt).getTime() - new Date(at).getTime();
      });
    return { toCreate, inApproval, approved, withAssets };
  }, [allCards, user?.id]);

  const COLUMNS = [
    {
      label: "Para criar",
      dotColor: CRIE.stageCreate,
      bg: CRIE.stageCreate,
      cards: toCreate,
      showOpen: true,
    },
    {
      label: "Em aprovacao",
      dotColor: CRIE.stageApp,
      bg: CRIE.stageApp,
      cards: inApproval,
      showOpen: false,
    },
    {
      label: "Prontos",
      dotColor: CRIE.stagePub,
      bg: CRIE.stagePub,
      cards: approved.slice(0, 10),
      showOpen: false,
    },
  ] as const;

  return (
    <div
      style={{
        padding: 24,
        background: CRIE.bg,
        minHeight: "100%",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: CRIE.ink,
              lineHeight: 1.2,
            }}
          >
            Painel do Designer
          </h1>
          {brand?.brand_name && (
            <div style={{ fontSize: 12, color: CRIE.muted, marginTop: 3 }}>
              Marca: {brand.brand_name}
            </div>
          )}
        </div>

        {/* Grid IG toggle */}
        <Btn
          variant="secondary"
          size="sm"
          onClick={() => setShowGrid(true)}
        >
          <Ico d={ICO_GRID} size={14} color={CRIE.inkSoft} />
          Grid IG
        </Btn>
      </div>

      {/* ── Stats row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Para criar"
          count={isLoading ? 0 : toCreate.length}
          color={CRIE.stageCreate}
          icon={ICO_PAINTBRUSH}
        />
        <StatCard
          label="Em aprovacao"
          count={isLoading ? 0 : inApproval.length}
          color={CRIE.stageApp}
          icon={ICO_CLOCK}
        />
        <StatCard
          label="Aprovados"
          count={isLoading ? 0 : approved.length}
          color={CRIE.stagePub}
          icon={ICO_CHECK}
        />
      </div>

      {/* ── Kanban ── */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                borderRadius: 18,
                background: CRIE.lineSoft,
                height: 300,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            alignItems: "start",
          }}
        >
          {COLUMNS.map((col) => (
            <DesignColumn
              key={col.label}
              conf={{ label: col.label, dotColor: col.dotColor, bg: col.bg }}
              cards={col.cards as PostCard[]}
              showOpenCanvas={col.showOpen}
              onOpenCanvas={setCanvasCard}
            />
          ))}
        </div>
      )}

      {/* ── Canvas slide-over ── */}
      {canvasCard && (
        <CanvasSlideOver
          card={canvasCard}
          onClose={() => setCanvasCard(null)}
        />
      )}

      {/* ── Grid preview overlay ── */}
      {showGrid && (
        <GridPreviewOverlay
          posts={withAssets}
          onClose={() => setShowGrid(false)}
        />
      )}

      {/* Pulse animation for skeleton */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
