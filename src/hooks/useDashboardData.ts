/**
 * useDashboardData
 *
 * Fetches all data needed for the agency dashboard in parallel via multiple
 * useQuery calls. Each query is independently cached and re-fetched. The hook
 * combines them into a single DashboardData object with safe fallback values so
 * the UI can render immediately with zeros while the network resolves.
 *
 * Stages that count as "backlog" (not yet published / scheduled):
 *   ideia | briefing | copy | aprovacao_copy | design | aprovacao_arte
 *
 * Approval tables: approval_requests (id, post_card_id, workspace_id,
 *   status: 'approved'|'changes_requested'|'pending', created_at)
 * Campaign table:  campaigns (id, name, ends_at, workspace_id)
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Public return type
// ---------------------------------------------------------------------------

export interface MonthlyPostCount {
  /** ISO month string, e.g. "2026-03" */
  month: string;
  count: number;
}

export interface TopCreator {
  userId: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  /** Deterministic colour derived from userId for avatar placeholders */
  avatarColor: string;
  postsCount: number;
}

export interface UpcomingPost {
  id: string;
  title: string;
  stage: string;
  scheduledAt: string;
  workspaceName: string;
}

export interface NextCampaign {
  name: string;
  endsAt: string;
  workspaceName: string;
}

export interface DashboardData {
  agencyName: string;
  agencyLogo: string | null;
  workspaceCount: number;
  postsThisMonth: number;
  postsLastMonth: number;
  /** 0–100 percentage of posts approved without a prior change request */
  approvalRatePct: number;
  /** Average hours from approval request creation to approval (0 if unavailable) */
  avgApprovalTimeHours: number;
  backlogCount: number;
  urgentBacklogCount: number;
  monthlyPostCounts: MonthlyPostCount[];
  topCreators: TopCreator[];
  upcomingPosts: UpcomingPost[];
  nextCampaign: NextCampaign | null;
  /** true if ANY sub-query is still fetching for the first time */
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Stages that represent work in-progress (not yet published or scheduled). */
const BACKLOG_STAGES = [
  "ideia",
  "briefing",
  "copy",
  "aprovacao_copy",
  "design",
  "aprovacao_arte",
] as const;

/** Derive a stable Tailwind-compatible hex colour from a userId string. */
function deriveAvatarColor(userId: string): string {
  const PALETTE = [
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#f97316", // orange-500
    "#14b8a6", // teal-500
    "#3b82f6", // blue-500
    "#a855f7", // purple-500
    "#22c55e", // green-500
    "#eab308", // yellow-500
    "#ef4444", // red-500
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length]!;
}

/** Return an ISO string for the start of the current month (UTC). */
function startOfCurrentMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Return an ISO string for the start of the previous month (UTC). */
function startOfPreviousMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString();
}

/** Return an ISO string for 12 months ago from today (UTC). */
function twelveMonthsAgo(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1)).toISOString();
}

/** Return an ISO string 24 hours from now. */
function in24Hours(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// Sub-query hooks (not exported — consumed only by useDashboardData)
// ---------------------------------------------------------------------------

/** Agency name + logo */
function useAgencyInfo(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "agency-info", agencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("name, logo_url")
        .eq("id", agencyId!)
        .single();
      if (error) throw error;
      return data as { name: string; logo_url: string | null };
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Count of active (non-archived) workspaces for the agency */
function useWorkspaceCount(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "workspace-count", agencyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("agency_id", agencyId!)
        .eq("archived", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agencyId,
    staleTime: 60 * 1000,
  });
}

/** Posts created this calendar month (non-archived) */
function usePostsThisMonth(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "posts-this-month", agencyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_cards")
        .select("*, workspaces!inner(agency_id)", { count: "exact", head: true })
        .eq("workspaces.agency_id", agencyId!)
        .gte("created_at", startOfCurrentMonth())
        .eq("archived", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agencyId,
    staleTime: 60 * 1000,
  });
}

/** Posts created last calendar month (non-archived) */
function usePostsLastMonth(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "posts-last-month", agencyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_cards")
        .select("*, workspaces!inner(agency_id)", { count: "exact", head: true })
        .eq("workspaces.agency_id", agencyId!)
        .gte("created_at", startOfPreviousMonth())
        .lt("created_at", startOfCurrentMonth())
        .eq("archived", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agencyId,
    staleTime: 60 * 1000,
  });
}

/** Posts in backlog stages (not yet published or scheduled) */
function useBacklogCount(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "backlog-count", agencyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_cards")
        .select("*, workspaces!inner(agency_id)", { count: "exact", head: true })
        .eq("workspaces.agency_id", agencyId!)
        .in("stage", BACKLOG_STAGES)
        .eq("archived", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agencyId,
    staleTime: 30 * 1000,
  });
}

/** Backlog posts with a scheduled_at deadline within 24 hours */
function useUrgentBacklogCount(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "urgent-backlog-count", agencyId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_cards")
        .select("*, workspaces!inner(agency_id)", { count: "exact", head: true })
        .eq("workspaces.agency_id", agencyId!)
        .in("stage", BACKLOG_STAGES)
        .not("scheduled_at", "is", null)
        .lte("scheduled_at", in24Hours())
        .eq("archived", false);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!agencyId,
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------

interface ApprovalRequest {
  id: string;
  post_card_id: string;
  status: "approved" | "changes_requested" | "pending";
  created_at: string;
  updated_at: string | null;
}

interface ApprovalStats {
  approvalRatePct: number;
  avgApprovalTimeHours: number;
}

/**
 * Fetches this month's approval_requests and computes:
 *   - Approval rate (posts approved without any prior 'changes_requested')
 *   - Average hours from created_at to updated_at for approved requests
 */
function useApprovalStats(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "approval-stats", agencyId],
    queryFn: async (): Promise<ApprovalStats> => {
      const { data, error } = await supabase
        .from("approval_requests")
        .select("id, post_card_id, status, created_at, updated_at, workspaces!inner(agency_id)")
        .eq("workspaces.agency_id", agencyId!)
        .gte("created_at", startOfCurrentMonth())
        .in("status", ["approved", "changes_requested"]);

      if (error) throw error;

      const rows = (data ?? []) as unknown as (ApprovalRequest & { workspaces: { agency_id: string } })[];

      if (rows.length === 0) {
        return { approvalRatePct: 0, avgApprovalTimeHours: 0 };
      }

      // Group by post_card_id to determine first-try approvals
      const byCard = new Map<string, ApprovalRequest[]>();
      for (const row of rows) {
        const list = byCard.get(row.post_card_id) ?? [];
        list.push(row);
        byCard.set(row.post_card_id, list);
      }

      let firstTryApproved = 0;
      let totalApproved = 0;
      const approvalHours: number[] = [];

      for (const requests of byCard.values()) {
        const hasChangesRequested = requests.some((r) => r.status === "changes_requested");
        const approvedReq = requests.find((r) => r.status === "approved");

        if (approvedReq) {
          totalApproved++;
          if (!hasChangesRequested) firstTryApproved++;

          // Compute approval time if updated_at is available
          if (approvedReq.updated_at) {
            const diffMs =
              new Date(approvedReq.updated_at).getTime() -
              new Date(approvedReq.created_at).getTime();
            if (diffMs > 0) {
              approvalHours.push(diffMs / (1000 * 60 * 60));
            }
          }
        }
      }

      const approvalRatePct =
        totalApproved > 0 ? Math.round((firstTryApproved / totalApproved) * 100) : 0;

      const avgApprovalTimeHours =
        approvalHours.length > 0
          ? Math.round(
              (approvalHours.reduce((sum, h) => sum + h, 0) / approvalHours.length) * 10,
            ) / 10
          : 0;

      return { approvalRatePct, avgApprovalTimeHours };
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------

/**
 * Fetches post_cards created in the last 12 months with just created_at,
 * then groups client-side into monthly buckets.
 */
function useMonthlyPostCounts(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "monthly-post-counts", agencyId],
    queryFn: async (): Promise<MonthlyPostCount[]> => {
      const { data, error } = await supabase
        .from("post_cards")
        .select("created_at, workspaces!inner(agency_id)")
        .eq("workspaces.agency_id", agencyId!)
        .gte("created_at", twelveMonthsAgo())
        .eq("archived", false);

      if (error) throw error;

      // Build a map of month -> count
      const countByMonth = new Map<string, number>();

      // Pre-fill all 12 months with 0 so the chart always has 12 data points
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        countByMonth.set(key, 0);
      }

      for (const row of data ?? []) {
        const d = new Date(row.created_at as string);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        if (countByMonth.has(key)) {
          countByMonth.set(key, (countByMonth.get(key) ?? 0) + 1);
        }
      }

      return Array.from(countByMonth.entries()).map(([month, count]) => ({ month, count }));
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------

interface AgencyMemberRow {
  user_id: string;
  display_name: string;
  role?: string;
  avatar_url: string | null;
}

interface PostCardCreatedBy {
  created_by: string;
  workspaces: { agency_id: string };
}

/**
 * Fetches agency members + post_cards created_by counts, merges client-side,
 * returns top 5 sorted by post count descending.
 */
function useTopCreators(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "top-creators", agencyId],
    queryFn: async (): Promise<TopCreator[]> => {
      // Try with role column; fall back without it if migration 00019 hasn't run
      let membersQuery = supabase
        .from("agency_members")
        .select("user_id, display_name, role, avatar_url")
        .eq("agency_id", agencyId!)
        .not("accepted_at", "is", null);

      const [membersResult, postsResult] = await Promise.all([
        membersQuery.then(async (res) => {
          if (res.error?.message?.includes("role")) {
            return supabase
              .from("agency_members")
              .select("user_id, display_name, avatar_url")
              .eq("agency_id", agencyId!)
              .not("accepted_at", "is", null);
          }
          return res;
        }),

        supabase
          .from("post_cards")
          .select("created_by, workspaces!inner(agency_id)")
          .eq("workspaces.agency_id", agencyId!)
          .eq("archived", false),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (postsResult.error) throw postsResult.error;

      const members = (membersResult.data ?? []) as AgencyMemberRow[];
      const posts = (postsResult.data ?? []) as unknown as PostCardCreatedBy[];

      // Count posts per user
      const countByUser = new Map<string, number>();
      for (const post of posts) {
        countByUser.set(post.created_by, (countByUser.get(post.created_by) ?? 0) + 1);
      }

      return members
        .map((m) => ({
          userId: m.user_id,
          name: m.display_name,
          role: m.role ?? "membro",
          avatarUrl: m.avatar_url,
          avatarColor: deriveAvatarColor(m.user_id),
          postsCount: countByUser.get(m.user_id) ?? 0,
        }))
        .sort((a, b) => b.postsCount - a.postsCount)
        .slice(0, 5);
    },
    enabled: !!agencyId,
    staleTime: 2 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------

interface UpcomingPostRow {
  id: string;
  title: string;
  stage: string;
  scheduled_at: string;
  workspaces: { name: string; agency_id: string };
}

/** Next 6 scheduled posts (scheduled_at >= now, non-archived, ordered ascending). */
function useUpcomingPosts(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "upcoming-posts", agencyId],
    queryFn: async (): Promise<UpcomingPost[]> => {
      const { data, error } = await supabase
        .from("post_cards")
        .select("id, title, stage, scheduled_at, workspaces!inner(agency_id, name)")
        .eq("workspaces.agency_id", agencyId!)
        .eq("archived", false)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(6);

      if (error) throw error;

      return (data ?? []).map((row) => {
        const r = row as unknown as UpcomingPostRow;
        return {
          id: r.id,
          title: r.title,
          stage: r.stage,
          scheduledAt: r.scheduled_at,
          workspaceName: r.workspaces.name,
        };
      });
    },
    enabled: !!agencyId,
    staleTime: 60 * 1000,
  });
}

// ---------------------------------------------------------------------------

interface CampaignRow {
  name: string;
  ends_at: string;
  workspaces: { name: string; agency_id: string };
}

/** The nearest upcoming campaign deadline for the agency. */
function useNextCampaign(agencyId: string | null) {
  return useQuery({
    queryKey: ["dashboard", "next-campaign", agencyId],
    queryFn: async (): Promise<NextCampaign | null> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("name, ends_at, workspaces!inner(agency_id, name)")
        .eq("workspaces.agency_id", agencyId!)
        .gte("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const row = data[0] as unknown as CampaignRow;
      return {
        name: row.name,
        endsAt: row.ends_at,
        workspaceName: row.workspaces.name,
      };
    },
    enabled: !!agencyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Default fallback values
// ---------------------------------------------------------------------------

const DEFAULT_DASHBOARD_DATA: Omit<DashboardData, "isLoading"> = {
  agencyName: "",
  agencyLogo: null,
  workspaceCount: 0,
  postsThisMonth: 0,
  postsLastMonth: 0,
  approvalRatePct: 0,
  avgApprovalTimeHours: 0,
  backlogCount: 0,
  urgentBacklogCount: 0,
  monthlyPostCounts: [],
  topCreators: [],
  upcomingPosts: [],
  nextCampaign: null,
};

// ---------------------------------------------------------------------------
// Public hook
// ---------------------------------------------------------------------------

/**
 * Fetches all dashboard data for the given agency in parallel.
 *
 * Pass `agencyId` from `useAuthStore((s) => s.currentAgencyId)`.
 * All sub-queries are disabled when `agencyId` is null, so it is safe to
 * call this hook unconditionally at the top of your dashboard component.
 *
 * @example
 * const { agencyName, postsThisMonth, isLoading } = useDashboardData(agencyId);
 */
export function useDashboardData(agencyId: string | null): DashboardData {
  const agencyInfo = useAgencyInfo(agencyId);
  const workspaceCount = useWorkspaceCount(agencyId);
  const postsThisMonth = usePostsThisMonth(agencyId);
  const postsLastMonth = usePostsLastMonth(agencyId);
  const backlogCount = useBacklogCount(agencyId);
  const urgentBacklogCount = useUrgentBacklogCount(agencyId);
  const approvalStats = useApprovalStats(agencyId);
  const monthlyPostCounts = useMonthlyPostCounts(agencyId);
  const topCreators = useTopCreators(agencyId);
  const upcomingPosts = useUpcomingPosts(agencyId);
  const nextCampaign = useNextCampaign(agencyId);

  const isLoading =
    agencyInfo.isLoading ||
    workspaceCount.isLoading ||
    postsThisMonth.isLoading ||
    postsLastMonth.isLoading ||
    backlogCount.isLoading ||
    urgentBacklogCount.isLoading ||
    approvalStats.isLoading ||
    monthlyPostCounts.isLoading ||
    topCreators.isLoading ||
    upcomingPosts.isLoading ||
    nextCampaign.isLoading;

  if (!agencyId) {
    return { ...DEFAULT_DASHBOARD_DATA, isLoading: false };
  }

  return {
    agencyName: agencyInfo.data?.name ?? DEFAULT_DASHBOARD_DATA.agencyName,
    agencyLogo: agencyInfo.data?.logo_url ?? DEFAULT_DASHBOARD_DATA.agencyLogo,
    workspaceCount: workspaceCount.data ?? DEFAULT_DASHBOARD_DATA.workspaceCount,
    postsThisMonth: postsThisMonth.data ?? DEFAULT_DASHBOARD_DATA.postsThisMonth,
    postsLastMonth: postsLastMonth.data ?? DEFAULT_DASHBOARD_DATA.postsLastMonth,
    approvalRatePct:
      approvalStats.data?.approvalRatePct ?? DEFAULT_DASHBOARD_DATA.approvalRatePct,
    avgApprovalTimeHours:
      approvalStats.data?.avgApprovalTimeHours ?? DEFAULT_DASHBOARD_DATA.avgApprovalTimeHours,
    backlogCount: backlogCount.data ?? DEFAULT_DASHBOARD_DATA.backlogCount,
    urgentBacklogCount: urgentBacklogCount.data ?? DEFAULT_DASHBOARD_DATA.urgentBacklogCount,
    monthlyPostCounts: monthlyPostCounts.data ?? DEFAULT_DASHBOARD_DATA.monthlyPostCounts,
    topCreators: topCreators.data ?? DEFAULT_DASHBOARD_DATA.topCreators,
    upcomingPosts: upcomingPosts.data ?? DEFAULT_DASHBOARD_DATA.upcomingPosts,
    nextCampaign: nextCampaign.data ?? DEFAULT_DASHBOARD_DATA.nextCampaign,
    isLoading,
  };
}
