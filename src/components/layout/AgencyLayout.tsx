import { useEffect, useState } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { AgencySidebar } from "./AgencySidebar";
import { CreateWorkspaceDialog } from "@/features/workspace/CreateWorkspaceDialog";

export function AgencyLayout() {
  const { agencySlug } = useParams<{ agencySlug: string }>();
  const navigate = useNavigate();
  const { agencies, setCurrentAgency, fetchWorkspaces } = useAuthStore();
  const [showCreateWs, setShowCreateWs] = useState(false);

  useEffect(() => {
    const membership = agencies.find((a) => a.agency.slug === agencySlug);
    if (membership) {
      setCurrentAgency(membership.agency_id);
      fetchWorkspaces(membership.agency_id);
    } else if (agencies.length > 0) {
      navigate(`/app/${agencies[0]!.agency.slug}`, { replace: true });
    }
  }, [agencySlug, agencies, setCurrentAgency, fetchWorkspaces, navigate]);

  return (
    <div className="flex h-screen">
      <AgencySidebar onCreateWorkspace={() => setShowCreateWs(true)} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <CreateWorkspaceDialog open={showCreateWs} onOpenChange={setShowCreateWs} />
    </div>
  );
}
