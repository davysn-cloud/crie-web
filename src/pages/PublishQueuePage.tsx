import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CRIE, STATUS_META } from "@/lib/crie-tokens";
import { PCard, SectionHeader, Btn } from "@/components/crie";
import { NavIco } from "@/components/crie";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePublishQueue, useRetryPublish } from "@/features/publisher/hooks/usePublishQueue";
import type { PublishQueueItem } from "@/types/publisher";
import type { PublishStatus } from "@/lib/constants";

// ─── Icon paths ───────────────────────────────────────────────────────────────
const ICO_WARNING = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
const ICO_X = "M6 18L18 6M6 6l12 12";
const ICO_EXTERNAL = "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14";
const ICO_EDIT = "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
const ICO_RETRY = "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15";

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Map Supabase publish statuses to STATUS_META keys used by existing UI. */
function toUiStatus(status: PublishStatus): keyof typeof STATUS_META {
  if (status === "published") return "publicado";
  if (status === "failed") return "falhou";
  // queued, scheduled, publishing → agendado
  return "agendado";
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Returns "Hoje", "Amanha", day-of-week name, or full date */
function getDayLabel(isoString: string): string {
  const d = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return "Hoje";
  if (d.toDateString() === tomorrow.toDateString()) return "Amanha";

  // Within next 7 days: show weekday name
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff > 0 && diff < 7) {
    return d.toLocaleDateString("pt-BR", { weekday: "long" })
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Group items by their day label, in chronological order. */
function groupByDay(items: PublishQueueItem[]): { label: string; items: PublishQueueItem[] }[] {
  const map = new Map<string, PublishQueueItem[]>();
  for (const item of items) {
    const label = getDayLabel(item.scheduled_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Thumbnail strip pattern ──────────────────────────────────────────────────
function StripedThumb({ thumbnailUrl, color }: { thumbnailUrl?: string | null; color: string }) {
  if (thumbnailUrl) {
    return (
      <img
        src={thumbnailUrl}
        alt=""
        aria-hidden="true"
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          objectFit: "cover",
          flexShrink: 0,
          border: `1px solid ${CRIE.line}`,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: color,
        flexShrink: 0,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${CRIE.line}`,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: i * 12 - 4,
            left: -8,
            width: 80,
            height: 5,
            background: "rgba(255,255,255,.25)",
            transform: "rotate(-30deg)",
          }}
        />
      ))}
    </div>
  );
}

// ─── Queue item row ───────────────────────────────────────────────────────────
function QueueRow({ item, last }: { item: PublishQueueItem; last: boolean }) {
  const retryMutation = useRetryPublish();
  const uiStatus = toUiStatus(item.status);
  const meta = STATUS_META[uiStatus];
  const thumbnailUrl = item.post_card?.asset_versions?.[0]?.thumbnail_url ?? null;
  const title = item.post_card?.title ?? "Sem título";
  const format = item.post_card?.post_type ?? "—";

  // Generate fallback color from item id
  const FALLBACK_COLORS = ["#EEF0A8", "#C6D3A3", "#F0C9CC", "#B8C0E0", "#D0E8D8", "#D8E0F0"];
  const fallbackColor = FALLBACK_COLORS[item.id.charCodeAt(0) % FALLBACK_COLORS.length]!;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: last ? "none" : `1px solid ${CRIE.lineSoft}`,
      }}
    >
      {/* Time */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: CRIE.inkSoft,
          minWidth: 42,
          flexShrink: 0,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(item.scheduled_at)}
      </span>

      {/* Thumbnail */}
      <StripedThumb thumbnailUrl={thumbnailUrl} color={fallbackColor} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 600,
            color: CRIE.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: CRIE.muted }}>
          {format}
        </p>
      </div>

      {/* Status badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 600,
          background: meta.bg,
          color: meta.color,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: meta.color,
            flexShrink: 0,
          }}
        />
        {meta.label}
      </span>

      {/* Action */}
      <div style={{ flexShrink: 0 }}>
        {item.status === "published" && item.published_url && (
          <a
            href={item.published_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Btn variant="secondary" size="sm">
              <NavIco d={ICO_EXTERNAL} sz={13} color={CRIE.ink} />
              Ver no IG
            </Btn>
          </a>
        )}
        {item.status === "published" && !item.published_url && (
          <Btn variant="secondary" size="sm" disabled>
            <NavIco d={ICO_EXTERNAL} sz={13} color={CRIE.ink} />
            Ver no IG
          </Btn>
        )}
        {(item.status === "scheduled" || item.status === "queued") && (
          <Btn variant="ghost" size="sm" style={{ color: CRIE.muted }}>
            <NavIco d={ICO_EDIT} sz={13} color={CRIE.muted} />
            Editar
          </Btn>
        )}
        {item.status === "failed" && (
          <Btn
            variant="primary"
            size="sm"
            style={{ background: CRIE.rose, color: "#fff" }}
            onClick={() => retryMutation.mutate(item.id)}
            disabled={retryMutation.isPending}
          >
            <NavIco d={ICO_RETRY} sz={13} color="#fff" />
            {retryMutation.isPending ? "..." : "Tentar novamente"}
          </Btn>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function QueueSection({ label, items }: { label: string; items: PublishQueueItem[] }) {
  return (
    <div>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          fontWeight: 700,
          color: CRIE.muted,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <PCard pad={0} style={{ overflow: "hidden" }}>
        {items.map((item, i) => (
          <QueueRow key={item.id} item={item} last={i === items.length - 1} />
        ))}
      </PCard>
    </div>
  );
}

// ─── Token warning banner ─────────────────────────────────────────────────────
function TokenWarningBanner({
  onDismiss,
  handle,
  daysLeft,
}: {
  onDismiss: () => void;
  handle: string;
  daysLeft: number;
}) {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderRadius: 14,
        background: "#FEF3C7",
        border: "1px solid #F59E0B",
        marginBottom: 24,
      }}
    >
      <NavIco d={ICO_WARNING} sz={18} color="#B45309" />
      <p style={{ margin: 0, flex: 1, fontSize: 13, color: "#92400E", fontWeight: 500 }}>
        O token de acesso de{" "}
        <strong>{handle}</strong> expira em{" "}
        <strong>{daysLeft} dias</strong>.{" "}
        <button
          style={{
            background: "none",
            border: "none",
            color: "#B45309",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
            textDecoration: "underline",
          }}
        >
          Renovar agora
        </button>
      </p>
      <button
        onClick={onDismiss}
        aria-label="Fechar aviso"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NavIco d={ICO_X} sz={15} color="#B45309" />
      </button>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function QueueSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 76,
            background: CRIE.lineSoft,
            borderRadius: 12,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function PublishQueuePage() {
  const { currentWorkspaceId } = useAuthStore();
  const [bannerVisible, setBannerVisible] = useState(true);

  // Use existing hook
  const { data: queueItems = [], isLoading } = usePublishQueue();

  // Fetch agency_integrations to check token expiry
  const { data: integration } = useQuery({
    queryKey: ["agency-integration", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return null;
      const { data } = await supabase
        .from("agency_integrations")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .maybeSingle();
      return data as { expires_at?: string; ig_handle?: string; status?: string } | null;
    },
    enabled: !!currentWorkspaceId,
    staleTime: 300_000,
  });

  // Determine token warning
  const tokenWarning = useMemo(() => {
    if (!integration?.expires_at) return null;
    const expiresAt = new Date(integration.expires_at);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000);
    if (daysLeft > 0 && daysLeft <= 14) {
      return { handle: integration.ig_handle ?? "sua conta", daysLeft };
    }
    // Also check recent failures containing "token" in error_message
    return null;
  }, [integration]);

  // Also check for token-related failures in queue items
  const hasTokenFailure = useMemo(() => {
    return queueItems.some(
      (item) => item.status === "failed" && item.error_message?.toLowerCase().includes("token")
    );
  }, [queueItems]);

  // Group items by day
  const groups = useMemo(() => groupByDay(queueItems), [queueItems]);

  const showBanner = bannerVisible && (tokenWarning !== null || hasTokenFailure);

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 820,
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <SectionHeader title="Fila de Publicação" />

      {showBanner && (
        <TokenWarningBanner
          onDismiss={() => setBannerVisible(false)}
          handle={tokenWarning?.handle ?? "sua conta"}
          daysLeft={tokenWarning?.daysLeft ?? 0}
        />
      )}

      {isLoading ? (
        <QueueSkeleton />
      ) : groups.length === 0 ? (
        <PCard>
          <p style={{ textAlign: "center", color: CRIE.muted, fontSize: 13, padding: "24px 0" }}>
            Nenhum post na fila de publicação.
          </p>
        </PCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {groups.map(({ label, items }) => (
            <QueueSection key={label} label={label} items={items} />
          ))}
        </div>
      )}
    </div>
  );
}
