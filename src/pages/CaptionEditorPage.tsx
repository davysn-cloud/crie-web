import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRIE } from "@/lib/crie-tokens";
import { Btn, CrieBadge, PCard } from "@/components/crie";
import { useCopyDraft } from "@/features/copywriter/hooks/useCopyDraft";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import type { CopyVersion } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_CAPTION = 2200;
const WARN_AT = 1800;
const DANGER_AT = 2100;

type PreviewTab = "Feed" | "Grid" | "Story";

// ─── Char counter helper ──────────────────────────────────────────────────────

function charColor(len: number): string {
  if (len >= DANGER_AT) return CRIE.rose;
  if (len >= WARN_AT) return CRIE.amber;
  return CRIE.muted;
}

// ─── IG Preview ───────────────────────────────────────────────────────────────

function IGPreview({
  caption,
  activeSlide,
  totalSlides,
}: {
  caption: string;
  activeSlide: number;
  totalSlides: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE_AT = 125;
  const isTruncatable = caption.length > TRUNCATE_AT && !expanded;
  const displayCaption = isTruncatable
    ? caption.slice(0, TRUNCATE_AT).trim()
    : caption;

  return (
    <div
      style={{
        background: CRIE.card,
        borderRadius: 14,
        border: `1px solid ${CRIE.line}`,
        overflow: "hidden",
        maxWidth: 340,
        margin: "0 auto",
        fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      }}
      aria-label="Preview do Instagram"
    >
      {/* Profile header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderBottom: `1px solid ${CRIE.lineSoft}`,
        }}
      >
        {/* Avatar with IG gradient ring */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            padding: 2,
            background:
              "linear-gradient(135deg, #f9ce34, #ee2a7b, #6228d7)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: CRIE.butter,
              border: `2px solid ${CRIE.card}`,
            }}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: CRIE.ink }}>
            @workspace
          </div>
          <div style={{ fontSize: 11, color: CRIE.muted }}>Preview</div>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 20,
            color: CRIE.muted,
            lineHeight: 1,
          }}
        >
          ···
        </span>
      </div>

      {/* 4:5 image area */}
      <div
        style={{
          position: "relative",
          paddingBottom: "125%",
          background: CRIE.lineSoft,
          overflow: "hidden",
        }}
        aria-label="Area da imagem do post"
      >
        {/* Striped placeholder */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `repeating-linear-gradient(
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
          <span style={{ fontSize: 13, color: CRIE.muted, fontWeight: 500 }}>
            Slide {activeSlide}/{totalSlides}
          </span>
        </div>

        {/* Carousel dots */}
        {totalSlides > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 5,
            }}
            role="tablist"
            aria-label="Slides do carrossel"
          >
            {Array.from({ length: totalSlides }).map((_, i) => (
              <div
                key={i}
                role="tab"
                aria-selected={i + 1 === activeSlide}
                style={{
                  width: i + 1 === activeSlide ? 14 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: i + 1 === activeSlide ? CRIE.card : CRIE.mutedSoft,
                  transition: "width .2s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action icons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 12px 6px",
        }}
      >
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth={2} aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth={2} aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth={2} aria-hidden="true">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth={2} style={{ marginLeft: "auto" }} aria-hidden="true">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Caption */}
      <div style={{ padding: "0 12px 12px", fontSize: 12.5, color: CRIE.ink, lineHeight: 1.5 }}>
        <span style={{ whiteSpace: "pre-wrap" }}>{displayCaption}</span>
        {isTruncatable && (
          <>
            {"... "}
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: CRIE.muted,
                fontSize: 12.5,
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              mais
            </button>
          </>
        )}
      </div>

      {/* Timestamp */}
      <div
        style={{
          padding: "0 12px 10px",
          fontSize: 10.5,
          color: CRIE.muted,
          textTransform: "uppercase",
          letterSpacing: 0.3,
        }}
      >
        Preview ao vivo
      </div>
    </div>
  );
}

// ─── Version history list ─────────────────────────────────────────────────────

function VersionHistory({
  postCardId,
  currentVersionId,
}: {
  postCardId: string | null;
  currentVersionId: string | undefined;
}) {
  const { data: versions = [] } = useQuery({
    queryKey: ["copy-versions-all", postCardId],
    queryFn: async () => {
      if (!postCardId) return [];
      const { data, error } = await supabase
        .from("copy_versions")
        .select("*")
        .eq("post_card_id", postCardId)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CopyVersion[];
    },
    enabled: !!postCardId,
  });

  if (versions.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: CRIE.muted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 10,
        }}
      >
        Historico de versoes
      </div>
      <PCard pad={12}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {versions.map((ver, i) => {
            const isActive = ver.id === currentVersionId;
            const timeLabel = format(new Date(ver.created_at), "dd MMM, HH:mm", { locale: ptBR });
            return (
              <div
                key={ver.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom:
                    i < versions.length - 1
                      ? `1px solid ${CRIE.lineSoft}`
                      : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? CRIE.ink : CRIE.inkSoft,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    v{ver.version}
                    {isActive && (
                      <CrieBadge
                        label="atual"
                        color={CRIE.emerald}
                        bg={CRIE.emerald + "22"}
                      />
                    )}
                    {ver.is_approved && (
                      <CrieBadge
                        label="aprovado"
                        color={CRIE.emerald}
                        bg={CRIE.emerald + "22"}
                      />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: CRIE.muted, marginTop: 2 }}>
                    {timeLabel}
                  </div>
                </div>
                {!isActive && (
                  <Btn variant="secondary" size="sm">
                    Restaurar
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
      </PCard>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CaptionEditorPage() {
  const [searchParams] = useSearchParams();
  const { currentWorkspaceId } = useAuthStore();

  // Read card ID from URL query param
  const cardIdFromUrl = searchParams.get("card");

  // Fetch all cards for fallback (if no card param, use first in "copy" stage)
  const { data: allCards = [], isLoading: isCardsLoading } = usePostCards(currentWorkspaceId);

  // Resolve which card to show
  const resolvedCardId = useMemo(() => {
    if (cardIdFromUrl) return cardIdFromUrl;
    // Fallback: first card in "copy" stage
    const firstCopy = allCards.find((c) => c.stage === "copy");
    return firstCopy?.id ?? null;
  }, [cardIdFromUrl, allCards]);

  // Get card details from already-fetched list
  const card = useMemo(() => {
    return allCards.find((c) => c.id === resolvedCardId) ?? null;
  }, [allCards, resolvedCardId]);

  // Copy draft hook
  const { latestVersion, save, autoSave, isSaving, requestApproval, isRequestingApproval } =
    useCopyDraft(resolvedCardId);

  // Local editor state — initialized from latestVersion
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [firstComment, setFirstComment] = useState("");
  const [activeSlide, setActiveSlide] = useState(1);
  const [previewTab, setPreviewTab] = useState<PreviewTab>("Feed");

  // Sync editor state when latestVersion loads
  useEffect(() => {
    if (latestVersion) {
      setCaption(latestVersion.caption ?? latestVersion.body ?? "");
      setHashtags((latestVersion.hashtags ?? []).join(" "));
    }
  }, [latestVersion?.id]);

  // Trigger auto-save on caption/hashtags change
  useEffect(() => {
    if (!resolvedCardId || !latestVersion) return;
    autoSave({
      body: latestVersion.body ?? caption,
      caption,
      hashtags: hashtags.split(/\s+/).filter(Boolean),
      firstComment,
    });
  }, [caption, hashtags]);

  const captionLen = caption.length;
  const cColor = charColor(captionLen);

  // Determine total slides from asset_versions (or default to 1)
  const TOTAL_SLIDES = Math.max(card?.asset_versions?.length ?? 1, 1);

  function handleSave() {
    save({
      body: caption,
      caption,
      hashtags: hashtags.split(/\s+/).filter(Boolean),
      firstComment,
    });
  }

  function handleRequestApproval() {
    requestApproval(undefined);
  }

  if (isCardsLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          background: CRIE.bg,
          fontSize: 14,
          color: CRIE.muted,
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!card) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          background: CRIE.bg,
          fontSize: 14,
          color: CRIE.muted,
        }}
      >
        Nenhum post encontrado para editar.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: CRIE.bg,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Left panel (55%) ── */}
      <div
        style={{
          flex: "0 0 55%",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${CRIE.line}`,
          overflow: "auto",
        }}
      >
        {/* Post header */}
        <div
          style={{
            padding: "16px 20px",
            background: CRIE.paper,
            borderBottom: `1px solid ${CRIE.line}`,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: CRIE.ink,
              marginBottom: 8,
            }}
          >
            {card.title}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {card.post_type && (
              <CrieBadge label={card.post_type} color={CRIE.muted} />
            )}
          </div>
        </div>

        {/* Editor body */}
        <div style={{ flex: 1, padding: "16px 20px", overflow: "auto" }}>
          {/* Slide selector (only for carousel) */}
          {TOTAL_SLIDES > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: CRIE.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                  marginBottom: 8,
                }}
              >
                Slide
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: TOTAL_SLIDES }).map((_, i) => {
                  const n = i + 1;
                  const isActive = n === activeSlide;
                  return (
                    <button
                      key={n}
                      onClick={() => setActiveSlide(n)}
                      aria-label={`Slide ${n}`}
                      aria-pressed={isActive}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: `1px solid ${isActive ? CRIE.ink : CRIE.line}`,
                        background: isActive ? CRIE.ink : CRIE.card,
                        color: isActive ? "#fff" : CRIE.inkSoft,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all .12s",
                        fontFamily: "inherit",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legenda */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="caption-textarea"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: CRIE.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Legenda
              </label>
              <span style={{ fontSize: 11, color: cColor, fontWeight: 500 }}>
                {captionLen}/{MAX_CAPTION}
              </span>
            </div>
            <textarea
              id="caption-textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={10}
              maxLength={MAX_CAPTION}
              style={{
                width: "100%",
                resize: "vertical",
                border: `1px solid ${CRIE.line}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                lineHeight: 1.55,
                color: CRIE.ink,
                background: CRIE.card,
                outline: "none",
                boxSizing: "border-box",
              }}
              aria-label="Legenda do post"
            />
          </div>

          {/* Hashtags */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="hashtags-textarea"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: CRIE.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                Hashtags
              </label>
              <Btn variant="butter" size="sm">
                Sugerir hashtags
              </Btn>
            </div>
            <textarea
              id="hashtags-textarea"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
                border: `1px solid ${CRIE.line}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "ui-monospace, SFMono-Regular, monospace",
                lineHeight: 1.55,
                color: "#0E7490",
                background: CRIE.card,
                outline: "none",
                boxSizing: "border-box",
              }}
              aria-label="Hashtags do post"
            />
          </div>

          {/* First comment */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="first-comment-textarea"
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: CRIE.muted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 6,
              }}
            >
              Primeiro comentario{" "}
              <span style={{ fontWeight: 400, textTransform: "none", fontSize: 11 }}>
                (opcional)
              </span>
            </label>
            <textarea
              id="first-comment-textarea"
              value={firstComment}
              onChange={(e) => setFirstComment(e.target.value)}
              rows={3}
              placeholder="Adicione um comentario automatico apos publicacao..."
              style={{
                width: "100%",
                resize: "vertical",
                border: `1px solid ${CRIE.line}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                lineHeight: 1.55,
                color: CRIE.ink,
                background: CRIE.card,
                outline: "none",
                boxSizing: "border-box",
              }}
              aria-label="Primeiro comentario (opcional)"
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 20px",
            background: CRIE.paper,
            borderTop: `1px solid ${CRIE.line}`,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Btn variant="butter">Gerar com IA</Btn>
          <Btn
            variant="secondary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar rascunho"}
          </Btn>
          <div style={{ marginLeft: "auto" }}>
            <Btn
              variant="primary"
              onClick={handleRequestApproval}
              disabled={isRequestingApproval}
            >
              {isRequestingApproval ? "Enviando..." : "Enviar para aprovacao"}
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Right panel (45%) ── */}
      <div
        style={{
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          padding: "0 0 24px",
        }}
      >
        {/* Preview header + tabs */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: `1px solid ${CRIE.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, color: CRIE.ink }}>
            Preview do Instagram
          </span>
          <div
            style={{
              display: "flex",
              gap: 4,
              background: CRIE.lineSoft,
              borderRadius: 99,
              padding: 3,
            }}
            role="tablist"
            aria-label="Tipo de preview"
          >
            {(["Feed", "Grid", "Story"] as PreviewTab[]).map((tab) => {
              const isActive = tab === previewTab;
              return (
                <button
                  key={tab}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setPreviewTab(tab)}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 99,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    background: isActive ? CRIE.card : "transparent",
                    color: isActive ? CRIE.ink : CRIE.muted,
                    boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    transition: "all .12s",
                    fontFamily: "inherit",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* IG preview */}
        <div style={{ padding: "20px", overflowY: "auto" }}>
          <IGPreview
            caption={caption + (hashtags ? "\n\n" + hashtags : "")}
            activeSlide={activeSlide}
            totalSlides={TOTAL_SLIDES}
          />

          {/* Version history */}
          <VersionHistory
            postCardId={resolvedCardId}
            currentVersionId={latestVersion?.id}
          />
        </div>
      </div>
    </div>
  );
}
