import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, SectionHeader, Btn } from "@/components/crie";
import { NavIco } from "@/components/crie";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePostCards } from "@/features/kanban/hooks/usePostCards";
import type { PostCard } from "@/types";

// ─── Icon paths ───────────────────────────────────────────────────────────────
const ICO_CHECK = "M5 13l4 4L19 7";
const ICO_CLOCK = "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z";
const ICO_PLUS = "M12 4v16m8-8H4";
const ICO_WARNING = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
const ICO_ARROW_RIGHT = "M13 7l5 5m0 0l-5 5m5-5H6";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type PostKind = "published" | "scheduled" | "draft";

function getPostKind(card: PostCard): PostKind {
  if (card.stage === "publicado") return "published";
  if (card.stage === "agendado") return "scheduled";
  return "draft";
}

/** Generate a deterministic pastel colour from a card id so visual style is stable. */
function cardColor(card: PostCard): string {
  const COLORS = [
    "#EEF0A8", "#D0E8D8", "#D0D8E8", "#E8D0E0",
    "#E8E8D0", "#D8E8E8", "#F0ECD0", "#D0ECE8",
    "#ECD0E8", "#F5F5F0",
  ];
  // Use thumbnail dominant_color if available via AssetVersion
  const thumb = card.asset_versions?.[0];
  if (thumb && "dominant_color" in (thumb as unknown as Record<string, unknown>)) {
    return (thumb as unknown as { dominant_color?: string }).dominant_color ?? COLORS[card.id.charCodeAt(0) % COLORS.length]!;
  }
  return COLORS[card.id.charCodeAt(0) % COLORS.length]!;
}

function formatScheduledTime(isoString: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (d.toDateString() === today.toDateString()) return `Hoje ${time}`;
  if (d.toDateString() === tomorrow.toDateString()) return `Amanha ${time}`;

  const day = d.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${day.charAt(0).toUpperCase() + day.slice(1)} ${time}`;
}

// ─── Grid cell ────────────────────────────────────────────────────────────────
function GridCell({ card }: { card: PostCard | null }) {
  // null = empty slot (draft placeholder)
  const kind: PostKind = card ? getPostKind(card) : "draft";
  const col = card ? cardColor(card) : "#F5F5F0";
  const thumbnailUrl = card?.asset_versions?.[0]?.thumbnail_url ?? null;

  const isDraft = kind === "draft";
  const isScheduled = kind === "scheduled";
  const isPublished = kind === "published";

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 10,
        background: col,
        border: isScheduled
          ? `2px dashed ${CRIE.butterDeep}`
          : isDraft
          ? `2px dashed ${CRIE.line}`
          : "none",
        opacity: isDraft ? 0.5 : 1,
        overflow: "hidden",
        cursor: isDraft ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Real thumbnail */}
      {thumbnailUrl && !isDraft && (
        <img
          src={thumbnailUrl}
          alt={card?.title ?? ""}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      {/* Draft: show + icon */}
      {isDraft && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(0,0,0,.10)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <NavIco d={ICO_PLUS} sz={16} color={CRIE.muted} />
        </div>
      )}

      {/* Published: green checkmark badge */}
      {isPublished && (
        <div
          aria-label="Publicado"
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: CRIE.emerald,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,.2)",
            zIndex: 2,
          }}
        >
          <NavIco d={ICO_CHECK} sz={11} color="#fff" />
        </div>
      )}

      {/* Scheduled: cyan clock badge */}
      {isScheduled && (
        <div
          aria-label="Agendado"
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: CRIE.sky,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,.2)",
            zIndex: 2,
          }}
        >
          <NavIco d={ICO_CLOCK} sz={11} color="#fff" />
        </div>
      )}
    </div>
  );
}

// ─── IG gradient ring ─────────────────────────────────────────────────────────
function IGRingAvatar({ initials, logoUrl }: { initials: string; logoUrl?: string | null }) {
  return (
    <div
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        padding: 2.5,
        background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: CRIE.butter,
          border: "2px solid #fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 800,
          color: CRIE.butterInk,
          overflow: "hidden",
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          initials
        )}
      </div>
    </div>
  );
}

// ─── Upcoming item row ────────────────────────────────────────────────────────
function UpcomingRow({ card, last }: { card: PostCard; last: boolean }) {
  const col = cardColor(card);
  const thumbnailUrl = card.asset_versions?.[0]?.thumbnail_url ?? null;
  const timeLabel = formatScheduledTime(card.scheduled_at);
  const format = card.post_type ?? "—";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${CRIE.lineSoft}`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: col,
          flexShrink: 0,
          border: `1px solid ${CRIE.line}`,
          overflow: "hidden",
        }}
      >
        {thumbnailUrl && (
          <img src={thumbnailUrl} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 600,
            color: CRIE.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {card.title}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 11, color: CRIE.muted }}>
          {timeLabel} &middot; {format}
        </p>
      </div>
    </div>
  );
}

// ─── Harmony alert ────────────────────────────────────────────────────────────
function HarmonyAlert() {
  return (
    <PCard style={{ borderColor: "#F59E0B", background: "#FFFBEB" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <NavIco d={ICO_WARNING} sz={18} color="#B45309" />
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#92400E" }}>
            Alerta de harmonia
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
            3 posts consecutivos do pilar{" "}
            <strong>Educativo</strong> detectados. Considere variar com Bastidores ou Inspiração.
          </p>
        </div>
      </div>
    </PCard>
  );
}

// ─── Legend item ──────────────────────────────────────────────────────────────
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 11, color: CRIE.muted }}>{label}</span>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function GridSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 4,
        marginBottom: 14,
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            aspectRatio: "1 / 1",
            borderRadius: 10,
            background: CRIE.lineSoft,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function GridPlannerPage() {
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuthStore();

  // Fetch post cards
  const { data: allCards = [], isLoading: loadingCards } = usePostCards(currentWorkspaceId);

  // Fetch brand profile for header
  const { data: brandProfile } = useQuery({
    queryKey: ["brand-profile", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return null;
      const { data } = await supabase
        .from("brand_profiles")
        .select("brand_name, instagram_handle, logo_url")
        .eq("workspace_id", currentWorkspaceId)
        .maybeSingle();
      return data as { brand_name: string | null; instagram_handle: string | null; logo_url: string | null } | null;
    },
    enabled: !!currentWorkspaceId,
    staleTime: 120_000,
  });

  // Derive grid posts — sort published (by published_at desc), then scheduled (by scheduled_at), then drafts
  const gridCards = useMemo(() => {
    const published = allCards
      .filter((c) => c.stage === "publicado")
      .sort((a, b) => {
        const da = a.published_at ? new Date(a.published_at).getTime() : 0;
        const db = b.published_at ? new Date(b.published_at).getTime() : 0;
        return db - da; // newest first
      });

    const scheduled = allCards
      .filter((c) => c.stage === "agendado")
      .sort((a, b) => {
        const da = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const db = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
        return da - db; // soonest first
      });

    const drafts = allCards.filter((c) => c.stage !== "publicado" && c.stage !== "agendado");

    const ordered = [...published, ...scheduled, ...drafts];

    // Take latest 12, pad with null if fewer than 12
    const top12 = ordered.slice(0, 12);
    while (top12.length < 12) top12.push(null as unknown as PostCard);
    return top12;
  }, [allCards]);

  // Upcoming publications (agendado stage)
  const upcomingCards = useMemo(() => {
    return allCards
      .filter((c) => c.stage === "agendado" && c.scheduled_at)
      .sort((a, b) => {
        const da = new Date(a.scheduled_at!).getTime();
        const db = new Date(b.scheduled_at!).getTime();
        return da - db;
      })
      .slice(0, 5);
  }, [allCards]);

  // Profile display values
  const igHandle = brandProfile?.instagram_handle
    ? brandProfile.instagram_handle.startsWith("@")
      ? brandProfile.instagram_handle
      : `@${brandProfile.instagram_handle}`
    : "@suamarca";

  const brandName = brandProfile?.brand_name ?? "Sua Marca";

  const initials = brandName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        gap: 20,
        alignItems: "flex-start",
        fontFamily: "Inter, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {/* ── Left: grid ── */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 540 }}>
        {/* Profile header */}
        <PCard style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <IGRingAvatar initials={initials} logoUrl={brandProfile?.logo_url} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: CRIE.ink }}>
                {igHandle}
              </p>
              <p style={{ margin: "2px 0 8px", fontSize: 12, color: CRIE.muted }}>
                {brandName}
              </p>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { label: "posts", val: allCards.filter((c) => c.stage === "publicado").length.toString() },
                  { label: "agendados", val: allCards.filter((c) => c.stage === "agendado").length.toString() },
                  { label: "rascunhos", val: allCards.filter((c) => c.stage !== "publicado" && c.stage !== "agendado").length.toString() },
                ].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: CRIE.ink }}>{s.val}</p>
                    <p style={{ margin: 0, fontSize: 10.5, color: CRIE.muted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PCard>

        {/* Grid */}
        {loadingCards ? (
          <GridSkeleton />
        ) : (
          <div
            role="grid"
            aria-label="Grid planner do Instagram"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              marginBottom: 14,
            }}
          >
            {gridCards.map((card, i) => (
              <GridCell key={card?.id ?? `empty-${i}`} card={card} />
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <LegendItem color={CRIE.emerald} label="Publicado" />
          <LegendItem color={CRIE.sky} label="Agendado" />
          <LegendItem color={CRIE.mutedSoft} label="Rascunho" />
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          position: "sticky",
          top: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Upcoming */}
        <PCard>
          <SectionHeader title="Proximas publicacoes" />
          {upcomingCards.length === 0 ? (
            <p style={{ fontSize: 12, color: CRIE.muted, margin: "8px 0 0" }}>
              Nenhuma publicação agendada.
            </p>
          ) : (
            upcomingCards.map((card, i) => (
              <UpcomingRow key={card.id} card={card} last={i === upcomingCards.length - 1} />
            ))
          )}
        </PCard>

        {/* Harmony alert */}
        <HarmonyAlert />

        {/* CTA */}
        <Btn
          variant="secondary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => navigate("/app/queue")}
        >
          Ver fila completa
          <NavIco d={ICO_ARROW_RIGHT} sz={14} color={CRIE.ink} />
        </Btn>
      </div>
    </div>
  );
}
