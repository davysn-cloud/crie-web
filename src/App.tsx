import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";

// Auth (eager — login is the first thing unauth users see; TTI > code split)
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoginPage } from "@/components/auth/LoginPage";

// Layout shells (eager — required by many authenticated routes)
import { CrieLayout } from "@/components/layout/CrieLayout";

// Route fallback (eager — must render instantly)
import { RouteFallback } from "@/components/ui/RouteFallback";

// ---- Lazy auth pages (less critical than LoginPage) ----
const SignUpPage = lazy(() =>
  import("@/components/auth/SignUpPage").then((m) => ({ default: m.SignUpPage }))
);
const ForgotPasswordPage = lazy(() =>
  import("@/components/auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  }))
);
const MemberSignUpPage = lazy(() =>
  import("@/components/auth/MemberSignUpPage").then((m) => ({
    default: m.MemberSignUpPage,
  }))
);

// ---- Lazy: Approver public portal (dedicated chunk, mobile critical path) ----
const ApproverPortalPage = lazy(
  () =>
    import(/* webpackChunkName: "approver" */ "@/pages/ApproverPortalPage").then(
      (m) => ({ default: m.ApproverPortalPage })
    )
);
const ApproverHistoryPage = lazy(
  () =>
    import(
      /* webpackChunkName: "approver" */ "@/pages/ApproverHistoryPage"
    ).then((m) => ({ default: m.ApproverHistoryPage }))
);
const ApproverSettingsPage = lazy(
  () =>
    import(
      /* webpackChunkName: "approver" */ "@/pages/ApproverSettingsPage"
    ).then((m) => ({ default: m.ApproverSettingsPage }))
);

// ---- Lazy: authenticated app pages ----
const OnboardingPage = lazy(() =>
  import("@/pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage }))
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
const KanbanBoardPage = lazy(() =>
  import("@/pages/KanbanBoardPage").then((m) => ({ default: m.KanbanBoardPage }))
);
const CalendarPage = lazy(() =>
  import("@/pages/CalendarPage").then((m) => ({ default: m.CalendarPage }))
);
const PillarsPage = lazy(() =>
  import("@/pages/PillarsPage").then((m) => ({ default: m.PillarsPage }))
);
const CopyInboxPage = lazy(() =>
  import("@/pages/CopyInboxPage").then((m) => ({ default: m.CopyInboxPage }))
);
const CaptionEditorPage = lazy(() =>
  import("@/pages/CaptionEditorPage").then((m) => ({
    default: m.CaptionEditorPage,
  }))
);
const AssetLibraryPage = lazy(() =>
  import("@/pages/AssetLibraryPage").then((m) => ({
    default: m.AssetLibraryPage,
  }))
);
const BrandKitPage = lazy(() =>
  import("@/pages/BrandKitPage").then((m) => ({ default: m.BrandKitPage }))
);
const PublishQueuePage = lazy(() =>
  import("@/pages/PublishQueuePage").then((m) => ({
    default: m.PublishQueuePage,
  }))
);
const GridPlannerPage = lazy(() =>
  import("@/pages/GridPlannerPage").then((m) => ({
    default: m.GridPlannerPage,
  }))
);
const TeamPage = lazy(() =>
  import("@/pages/TeamPage").then((m) => ({ default: m.TeamPage }))
);
const BrandsPage = lazy(() =>
  import("@/pages/BrandsPage").then((m) => ({ default: m.BrandsPage }))
);
const BillingPage = lazy(() =>
  import("@/pages/BillingPage").then((m) => ({ default: m.BillingPage }))
);
const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const HookLibraryPage = lazy(() =>
  import("@/pages/HookLibraryPage").then((m) => ({
    default: m.HookLibraryPage,
  }))
);
const CTALibraryPage = lazy(() =>
  import("@/pages/CTALibraryPage").then((m) => ({ default: m.CTALibraryPage }))
);
const HashtagSetsPage = lazy(() =>
  import("@/pages/HashtagSetsPage").then((m) => ({
    default: m.HashtagSetsPage,
  }))
);
const DesignPage = lazy(() =>
  import("@/pages/DesignPage").then((m) => ({ default: m.DesignPage }))
);
const CampaignsPage = lazy(() =>
  import("@/pages/CampaignsPage").then((m) => ({ default: m.CampaignsPage }))
);
const PerformancePage = lazy(() =>
  import("@/pages/PerformancePage").then((m) => ({
    default: m.PerformancePage,
  }))
);
const ApproversPage = lazy(() =>
  import("@/pages/ApproversPage").then((m) => ({ default: m.ApproversPage }))
);
const WhiteLabelPage = lazy(() =>
  import("@/pages/WhiteLabelPage").then((m) => ({ default: m.WhiteLabelPage }))
);
const IntegrationsPage = lazy(() =>
  import("@/pages/IntegrationsPage").then((m) => ({
    default: m.IntegrationsPage,
  }))
);
const AuditLogPage = lazy(() =>
  import("@/pages/AuditLogPage").then((m) => ({ default: m.AuditLogPage }))
);
const InstagramCallbackPage = lazy(() =>
  import("@/pages/InstagramCallbackPage").then((m) => ({ default: m.InstagramCallbackPage }))
);

import { queryClient } from "@/lib/queryClient";

function AppInit({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInit>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public — Auth */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/signup/member" element={<MemberSignUpPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />

              {/* Approver — public portal (magic link, no auth) */}
              <Route path="/a/:token" element={<ApproverShellRoute />}>
                <Route index element={<ApproverPortalPage />} />
                <Route path="history" element={<ApproverHistoryPage />} />
                <Route path="settings" element={<ApproverSettingsPage />} />
              </Route>

              {/* Authenticated — CrieLayout shell */}
              <Route path="/app" element={<AuthGuard />}>
                <Route element={<CrieLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  {/* Accessible by all roles */}
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="board" element={<KanbanBoardPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  {/* Role-restricted routes */}
                  <Route path="calendar" element={<RoleGuard allowed={["owner", "strategist", "social_media"]}><CalendarPage /></RoleGuard>} />
                  <Route path="pillars" element={<RoleGuard allowed={["owner", "strategist"]}><PillarsPage /></RoleGuard>} />
                  <Route path="design" element={<RoleGuard allowed={["owner", "designer"]}><DesignPage /></RoleGuard>} />
                  <Route path="copy" element={<RoleGuard allowed={["owner", "copywriter", "strategist"]}><CopyInboxPage /></RoleGuard>} />
                  <Route path="copy-write" element={<RoleGuard allowed={["owner", "copywriter", "strategist"]}><CaptionEditorPage /></RoleGuard>} />
                  <Route path="hooks" element={<RoleGuard allowed={["owner", "copywriter", "strategist"]}><HookLibraryPage /></RoleGuard>} />
                  <Route path="ctas" element={<RoleGuard allowed={["owner", "copywriter", "strategist"]}><CTALibraryPage /></RoleGuard>} />
                  <Route path="hashtags" element={<RoleGuard allowed={["owner", "copywriter", "strategist"]}><HashtagSetsPage /></RoleGuard>} />
                  <Route path="assets" element={<RoleGuard allowed={["owner", "strategist", "copywriter", "designer", "social_media"]}><AssetLibraryPage /></RoleGuard>} />
                  <Route path="brandkit" element={<RoleGuard allowed={["owner", "strategist", "designer"]}><BrandKitPage /></RoleGuard>} />
                  <Route path="queue" element={<RoleGuard allowed={["owner", "social_media"]}><PublishQueuePage /></RoleGuard>} />
                  <Route path="grid" element={<RoleGuard allowed={["owner", "social_media"]}><GridPlannerPage /></RoleGuard>} />
                  <Route path="team" element={<RoleGuard allowed={["owner"]}><TeamPage /></RoleGuard>} />
                  <Route path="brands" element={<RoleGuard allowed={["owner"]}><BrandsPage /></RoleGuard>} />
                  <Route path="billing" element={<RoleGuard allowed={["owner"]}><BillingPage /></RoleGuard>} />
                  <Route path="campaigns" element={<RoleGuard allowed={["owner", "strategist"]}><CampaignsPage /></RoleGuard>} />
                  <Route path="performance" element={<RoleGuard allowed={["owner", "strategist", "social_media"]}><PerformancePage /></RoleGuard>} />
                  {/* Admin-only routes */}
                  <Route path="approvers" element={<RoleGuard allowed={["owner"]}><ApproversPage /></RoleGuard>} />
                  <Route path="white-label" element={<RoleGuard allowed={["owner"]}><WhiteLabelPage /></RoleGuard>} />
                  <Route path="integrations" element={<RoleGuard allowed={["owner"]}><IntegrationsPage /></RoleGuard>} />
                  <Route path="integrations/instagram/callback" element={<InstagramCallbackPage />} />
                  <Route path="audit" element={<RoleGuard allowed={["owner"]}><AuditLogPage /></RoleGuard>} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        </AppInit>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

/** Shell wrapper for nested approver routes — renders child via Outlet. */
function ApproverShellRoute() {
  return <Outlet />;
}
