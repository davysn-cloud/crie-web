import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, CrieBadge } from "@/components/crie";
import { useCalendar } from "@/features/strategist/hooks/useCalendar";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import type { PostCard } from "@/types";

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

// ─── Helpers ────────────────────────────────────────────────────────────────

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function isoDay(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMonthLabel(month: Date): string {
  return format(month, "MMMM yyyy", { locale: ptBR })
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PostChipEl({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        borderRadius: 6,
        background: color + "18",
        fontSize: 10.5,
        fontWeight: 500,
        color: CRIE.inkSoft,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function DayCell({
  day,
  year: _year,
  month: _month,
  isToday,
  isSelected,
  onClick,
  posts,
}: {
  day: number | null;
  year: number;
  month: number;
  isToday: boolean;
  isSelected: boolean;
  onClick: (day: number) => void;
  posts: PostCard[];
}) {
  if (day === null) {
    return (
      <div
        style={{
          borderRight: `1px solid ${CRIE.line}`,
          borderBottom: `1px solid ${CRIE.line}`,
          minHeight: 90,
          background: CRIE.lineSoft,
        }}
      />
    );
  }

  const visible = posts.slice(0, 2);
  const overflow = posts.length - 2;

  return (
    <div
      onClick={() => onClick(day)}
      style={{
        borderRight: `1px solid ${CRIE.line}`,
        borderBottom: `1px solid ${CRIE.line}`,
        minHeight: 90,
        padding: "6px 7px",
        cursor: "pointer",
        background: isSelected ? CRIE.butterWash : CRIE.card,
        transition: "background .12s",
      }}
    >
      {/* Day number */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: "50%",
          marginBottom: 4,
          fontSize: 12,
          fontWeight: isToday ? 700 : 500,
          background: isToday ? CRIE.ink : "transparent",
          color: isToday ? "#fff" : CRIE.inkSoft,
          flexShrink: 0,
        }}
      >
        {day}
      </div>

      {/* Post chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {visible.map((post) => (
          <PostChipEl
            key={post.id}
            title={post.title}
            color={CRIE.violet}
          />
        ))}
        {overflow > 0 && (
          <span style={{ fontSize: 10, color: CRIE.muted, marginLeft: 4 }}>
            +{overflow} mais
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SidebarPillarBars({
  pillars,
  isLoading,
}: {
  pillars: Pillar[];
  posts: PostCard[];
  isLoading: boolean;
}) {
  return (
    <PCard pad={16} style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: CRIE.muted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 12,
        }}
      >
        Pilares do mes
      </div>
      {isLoading ? (
        <div style={{ fontSize: 12, color: CRIE.muted }}>Carregando...</div>
      ) : pillars.length === 0 ? (
        <div style={{ fontSize: 12, color: CRIE.muted }}>Nenhum pilar cadastrado.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pillars.map((pillar) => {
            return (
              <div key={pillar.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: CRIE.inkSoft, fontWeight: 500 }}>
                    {pillar.name}
                  </span>
                  <span style={{ color: CRIE.muted }}>{pillar.target_percent}% meta</span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: CRIE.lineSoft,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pillar.target_percent}%`,
                      height: "100%",
                      borderRadius: 99,
                      background: pillar.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PCard>
  );
}

function SidebarDayDetail({
  day,
  year,
  month,
  posts,
}: {
  day: number;
  year: number;
  month: number;
  posts: PostCard[];
}) {
  const monthName = format(new Date(year, month, 1), "MMMM", { locale: ptBR });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <PCard pad={16} style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: CRIE.muted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 12,
        }}
      >
        {day} de {capitalizedMonth}
      </div>
      {posts.length === 0 ? (
        <p style={{ fontSize: 12, color: CRIE.muted }}>Nenhum post neste dia.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((post) => (
            <div
              key={post.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 10,
                background: CRIE.lineSoft,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: CRIE.violet,
                  marginTop: 3,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: CRIE.ink }}>
                  {post.title}
                </div>
                <div style={{ fontSize: 11, color: CRIE.muted, marginTop: 2 }}>
                  {post.post_type ?? post.stage}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PCard>
  );
}

function SidebarDeadlines({ upcomingPosts }: { upcomingPosts: PostCard[] }) {
  return (
    <PCard pad={16}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: CRIE.muted,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 12,
        }}
      >
        Proximos prazos
      </div>
      {upcomingPosts.length === 0 ? (
        <div style={{ fontSize: 12, color: CRIE.muted }}>Nenhum prazo proximo.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {upcomingPosts.map((post) => {
            const dateLabel = post.scheduled_at
              ? format(new Date(post.scheduled_at), "dd MMM", { locale: ptBR })
              : "-";
            return (
              <div
                key={post.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: CRIE.violet,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12.5, color: CRIE.inkSoft, fontWeight: 500 }}>
                    {post.title}
                  </span>
                </div>
                <CrieBadge label={dateLabel} color={CRIE.muted} />
              </div>
            );
          })}
        </div>
      )}
    </PCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CalendarPage() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { currentWorkspaceId } = useAuthStore();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-based

  const grid = buildMonthGrid(year, month);

  // Fetch posts for the current month
  const { data: posts = [], isLoading: isPostsLoading } = useCalendar({
    month: currentMonth,
  });

  // Fetch pillars for the current workspace
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

  // Group posts by day string "YYYY-MM-DD"
  const postsByDay = useMemo(() => {
    const map: Record<string, PostCard[]> = {};
    for (const post of posts) {
      if (!post.scheduled_at) continue;
      const key = format(new Date(post.scheduled_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(post);
    }
    return map;
  }, [posts]);

  // Next 3 upcoming posts with scheduled_at > now
  const upcomingPosts = useMemo(() => {
    const now = startOfDay(new Date());
    return posts
      .filter((p) => p.scheduled_at && new Date(p.scheduled_at) > now)
      .slice(0, 3);
  }, [posts]);

  // Today's day number (only relevant if viewing current month)
  const today = new Date();
  const todayDay =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : null;

  function handleDayClick(day: number) {
    setSelectedDay((prev) => (prev === day ? null : day));
  }

  function goToPrevMonth() {
    setSelectedDay(null);
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setSelectedDay(null);
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  // Posts for the selected day
  const selectedDayPosts = useMemo(() => {
    if (selectedDay === null) return [];
    const key = isoDay(year, month, selectedDay);
    return postsByDay[key] ?? [];
  }, [selectedDay, year, month, postsByDay]);

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: CRIE.bg,
        overflow: "hidden",
      }}
    >
      {/* ── Main area ── */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              aria-label="Mes anterior"
              onClick={goToPrevMonth}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${CRIE.line}`,
                background: CRIE.card,
                cursor: "pointer",
                color: CRIE.inkSoft,
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.5,
                color: CRIE.ink,
              }}
            >
              {formatMonthLabel(currentMonth)}
            </h1>
            <button
              aria-label="Proximo mes"
              onClick={goToNextMonth}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                border: `1px solid ${CRIE.line}`,
                background: CRIE.card,
                cursor: "pointer",
                color: CRIE.inkSoft,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" size="sm">
              Semana
            </Btn>
            <Btn variant="secondary" size="sm">
              Mes
            </Btn>
            <Btn variant="butter" size="sm">
              + Novo brief
            </Btn>
          </div>
        </div>

        {/* Calendar grid */}
        <PCard pad={0} style={{ overflow: "hidden" }}>
          {/* Week header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              background: CRIE.lineSoft,
              borderBottom: `1px solid ${CRIE.line}`,
            }}
          >
            {WEEK_LABELS.map((label) => (
              <div
                key={label}
                style={{
                  padding: "8px 0",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: CRIE.muted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Loading overlay */}
          {isPostsLoading && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                fontSize: 13,
                color: CRIE.muted,
              }}
            >
              Carregando...
            </div>
          )}

          {/* Day cells */}
          {!isPostsLoading && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
              }}
            >
              {grid.map((day, idx) => {
                const key = day !== null ? isoDay(year, month, day) : null;
                const dayPosts = key ? (postsByDay[key] ?? []) : [];
                return (
                  <DayCell
                    key={idx}
                    day={day}
                    year={year}
                    month={month}
                    isToday={day !== null && day === todayDay}
                    isSelected={day !== null && day === selectedDay}
                    onClick={handleDayClick}
                    posts={dayPosts}
                  />
                );
              })}
            </div>
          )}
        </PCard>
      </div>

      {/* ── Sidebar (240px) ── */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          padding: "24px 16px 24px 0",
          overflow: "auto",
        }}
      >
        <SidebarPillarBars
          pillars={pillars}
          posts={posts}
          isLoading={isPillarsLoading}
        />
        {selectedDay !== null && (
          <SidebarDayDetail
            day={selectedDay}
            year={year}
            month={month}
            posts={selectedDayPosts}
          />
        )}
        <SidebarDeadlines upcomingPosts={upcomingPosts} />
      </aside>
    </div>
  );
}
