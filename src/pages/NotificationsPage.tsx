import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CRIE } from "@/lib/crie-tokens";
import { Btn } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  icon: string;
  text: string;
  time: string;
  created_at: string;
  read: boolean;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

function useNotifications() {
  const { workspaces } = useAuthStore();
  const workspaceIds = workspaces.map((w) => w.id);

  return useQuery({
    queryKey: ["notifications", workspaceIds],
    queryFn: async () => {
      if (workspaceIds.length === 0) return [] as Notification[];

      const results: Notification[] = [];

      // 1. Fetch post_card IDs for these workspaces first
      const { data: cardRows } = await supabase
        .from("post_cards")
        .select("id")
        .in("workspace_id", workspaceIds)
        .eq("archived", false)
        .limit(200);

      const cardIds = (cardRows ?? []).map((c: { id: string }) => c.id);

      // 1b. Recent stage transitions
      const { data: transitions } = cardIds.length > 0
        ? await supabase
            .from("stage_transitions")
            .select("id, post_card_id, to_stage, triggered_by, note, created_at, post_cards(title)")
            .in("post_card_id", cardIds)
            .order("created_at", { ascending: false })
            .limit(10)
        : { data: [] };

      for (const t of transitions ?? []) {
        const postTitle = (t.post_cards as any)?.title ?? "Post";
        const stageLabel =
          t.to_stage === "aprovacao_copy"
            ? "Aprovação de Copy"
            : t.to_stage === "aprovacao_arte"
            ? "Aprovação de Arte"
            : t.to_stage === "publicado"
            ? "Publicado"
            : t.to_stage === "agendado"
            ? "Agendado"
            : t.to_stage;

        const icon =
          t.to_stage === "publicado"
            ? "✅"
            : t.to_stage === "agendado"
            ? "📅"
            : t.to_stage?.includes("aprovacao")
            ? "⏳"
            : "📋";

        results.push({
          id: `st-${t.id}`,
          icon,
          text: `Post "${postTitle}" movido para ${stageLabel}.`,
          time: formatRelativeTime(t.created_at),
          created_at: t.created_at,
          read: false,
        });
      }

      // 2. Recent comments on cards in these workspaces
      const { data: comments } = await supabase
        .from("comments")
        .select("id, body, created_at, target_id")
        .eq("target_type", "card")
        .order("created_at", { ascending: false })
        .limit(10);

      for (const c of comments ?? []) {
        // Only include if the card belongs to our workspaces
        // (we do a best-effort — comments query is scoped by RLS anyway)
        const excerpt = c.body.length > 60 ? c.body.slice(0, 60) + "…" : c.body;
        results.push({
          id: `cm-${c.id}`,
          icon: "💬",
          text: `Novo comentário: "${excerpt}"`,
          time: formatRelativeTime(c.created_at),
          created_at: c.created_at,
          read: false,
        });
      }

      // Sort by created_at descending and take first 20
      results.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return results.slice(0, 20);
    },
    enabled: workspaceIds.length > 0,
    staleTime: 60_000,
  });
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "agora mesmo";
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

// ─── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onRead(notification.id)}
      aria-label={notification.read ? notification.text : `Nova: ${notification.text}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        width: "100%",
        padding: "16px 20px",
        background: CRIE.card,
        border: "none",
        borderLeft: `3px solid ${notification.read ? CRIE.line : CRIE.butterDeep}`,
        borderRadius: 0,
        cursor: notification.read ? "default" : "pointer",
        textAlign: "left",
        fontFamily: "Inter, sans-serif",
        opacity: notification.read ? 0.7 : 1,
        transition: "opacity .15s, background .12s",
        borderBottom: `1px solid ${CRIE.lineSoft}`,
      }}
      onMouseEnter={(e) => {
        if (!notification.read) e.currentTarget.style.background = CRIE.butterWash;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = CRIE.card;
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{
          fontSize: 20,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {notification.icon}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 13.5,
            color: CRIE.ink,
            fontWeight: notification.read ? 400 : 500,
            lineHeight: 1.5,
          }}
        >
          {notification.text}
        </p>
        <span style={{ fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>
          {notification.time}
        </span>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: CRIE.butterDeep,
            flexShrink: 0,
            marginTop: 6,
          }}
        />
      )}
    </button>
  );
}

// ─── Notifications Page ───────────────────────────────────────────────────────

export function NotificationsPage() {
  // readIds lives locally since there's no notifications_read table yet
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const { data: rawNotifications = [], isLoading } = useNotifications();

  // Merge read state from local set
  const notifications = rawNotifications.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setReadIds((prev) => new Set([...prev, id]));
  }

  function markAllAsRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        padding: "32px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: -0.4, color: CRIE.ink }}>
            Notificacoes
          </h1>
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} nao lidas`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 22,
                height: 22,
                padding: "0 7px",
                borderRadius: 999,
                background: CRIE.butterDeep,
                color: CRIE.ink,
                fontSize: 11.5,
                fontWeight: 700,
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Btn variant="ghost" size="sm" onClick={markAllAsRead}>
            Marcar todas como lidas
          </Btn>
        )}
      </div>

      {/* Notifications list */}
      <div
        style={{
          background: CRIE.card,
          border: `1px solid ${CRIE.line}`,
          borderRadius: 22,
          overflow: "hidden",
        }}
        role="list"
        aria-label="Lista de notificacoes"
      >
        {isLoading ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: CRIE.muted,
              fontSize: 14,
            }}
          >
            Carregando notificações…
          </div>
        ) : notifications.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: CRIE.muted,
              fontSize: 14,
            }}
          >
            Nenhuma notificacao.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} role="listitem">
              <NotificationItem notification={n} onRead={markAsRead} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
