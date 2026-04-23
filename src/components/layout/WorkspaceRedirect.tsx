import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export function WorkspaceRedirect() {
  const navigate = useNavigate();
  const { agencySlug } = useParams();
  const { workspaces, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (workspaces.length > 0) {
      navigate(`/app/${agencySlug}/w/${workspaces[0]!.slug}`, { replace: true });
    }
  }, [workspaces, isLoading, agencySlug, navigate]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Nenhum workspace ainda</h2>
        <p className="text-sm text-muted-foreground">Crie um workspace na barra lateral.</p>
      </div>
    </div>
  );
}
