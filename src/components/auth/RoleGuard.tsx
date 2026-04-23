import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useWorkspaceRole } from "@/hooks/useWorkspaceRole";
import { useAuthStore } from "@/stores/useAuthStore";
import type { WorkspaceRole } from "@/lib/constants";
import { CRIE } from "@/lib/crie-tokens";

interface RoleGuardProps {
  allowed: WorkspaceRole[];
  children: React.ReactNode;
}

/**
 * Returns true if the user is the actual agency owner (by owner_id)
 * or has agency_role = 'admin'. Does NOT trust agency_role = 'owner'
 * alone because the column has DEFAULT 'owner' which gets applied
 * to all members if the insert didn't specify a role.
 */
function useIsAgencyAdmin(): boolean {
  const { agencies, currentAgencyId, user } = useAuthStore();
  if (!currentAgencyId || !user) return false;
  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  if (!membership) return false;

  // Primary check: is this user the actual agency owner?
  const agency = (membership as any).agency;
  if (agency?.owner_id === user.id) return true;

  // Secondary: explicit admin role
  if (membership.role === "admin") return true;

  return false;
}

export function RoleGuard({ allowed, children }: RoleGuardProps) {
  const { data: workspaceRole, isLoading } = useWorkspaceRole();
  const isAgencyAdmin = useIsAgencyAdmin();
  const { agencies, currentAgencyId } = useAuthStore();

  // Effective role: workspace role first, then agency role as fallback
  const agencyRole = agencies.find((a) => a.agency_id === currentAgencyId)?.role as WorkspaceRole | undefined;
  const role = workspaceRole ?? agencyRole ?? null;

  const isDenied = !isLoading && !isAgencyAdmin && (role === null || !allowed.includes(role));

  useEffect(() => {
    if (isDenied) {
      toast.error("Acesso negado");
    }
  }, [isDenied]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: CRIE.muted,
          fontSize: 14,
        }}
        role="status"
        aria-live="polite"
        aria-label="Verificando permissões"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }}
        >
          <circle cx="10" cy="10" r="8" stroke={CRIE.line} strokeWidth="2.5" />
          <path
            d="M10 2a8 8 0 018 8"
            stroke={CRIE.butterDeep}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Verificando permissões...
      </div>
    );
  }

  if (isDenied) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}
