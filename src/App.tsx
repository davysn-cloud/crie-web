import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/useAuthStore";

// Auth
import { AuthGuard } from "@/components/auth/AuthGuard";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { LoginPage } from "@/components/auth/LoginPage";
import { SignUpPage } from "@/components/auth/SignUpPage";
import { ForgotPasswordPage } from "@/components/auth/ForgotPasswordPage";
import { MemberSignUpPage } from "@/components/auth/MemberSignUpPage";

// Layout
import { CrieLayout } from "@/components/layout/CrieLayout";

// Pages — all new design-matched pages
import { OnboardingPage } from "@/pages/OnboardingPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { KanbanBoardPage } from "@/pages/KanbanBoardPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { PillarsPage } from "@/pages/PillarsPage";
import { CopyInboxPage } from "@/pages/CopyInboxPage";
import { CaptionEditorPage } from "@/pages/CaptionEditorPage";
import { AssetLibraryPage } from "@/pages/AssetLibraryPage";
import { BrandKitPage } from "@/pages/BrandKitPage";
import { PublishQueuePage } from "@/pages/PublishQueuePage";
import { GridPlannerPage } from "@/pages/GridPlannerPage";
import { TeamPage } from "@/pages/TeamPage";
import { BrandsPage } from "@/pages/BrandsPage";
import { BillingPage } from "@/pages/BillingPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ApproverPortalPage } from "@/pages/ApproverPortalPage";
import { ApproverHistoryPage } from "@/pages/ApproverHistoryPage";
import { ApproverSettingsPage } from "@/pages/ApproverSettingsPage";
import { HookLibraryPage } from "@/pages/HookLibraryPage";
import { CTALibraryPage } from "@/pages/CTALibraryPage";
import { HashtagSetsPage } from "@/pages/HashtagSetsPage";
import { DesignPage } from "@/pages/DesignPage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { PerformancePage } from "@/pages/PerformancePage";
import { ApproversPage } from "@/pages/ApproversPage";
import { WhiteLabelPage } from "@/pages/WhiteLabelPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { AuditLogPage } from "@/pages/AuditLogPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

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
                <Route path="copy" element={<RoleGuard allowed={["owner", "copywriter"]}><CopyInboxPage /></RoleGuard>} />
                <Route path="copy-write" element={<RoleGuard allowed={["owner", "copywriter"]}><CaptionEditorPage /></RoleGuard>} />
                <Route path="hooks" element={<RoleGuard allowed={["owner", "copywriter"]}><HookLibraryPage /></RoleGuard>} />
                <Route path="ctas" element={<RoleGuard allowed={["owner", "copywriter"]}><CTALibraryPage /></RoleGuard>} />
                <Route path="hashtags" element={<RoleGuard allowed={["owner", "copywriter", "strategist"]}><HashtagSetsPage /></RoleGuard>} />
                <Route path="assets" element={<RoleGuard allowed={["owner", "strategist", "copywriter", "designer"]}><AssetLibraryPage /></RoleGuard>} />
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
                <Route path="audit" element={<RoleGuard allowed={["owner"]}><AuditLogPage /></RoleGuard>} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
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
