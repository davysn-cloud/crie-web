import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthGuard() {
  const { session, isLoading, isInitialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isInitialized && !isLoading && !session) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [session, isLoading, isInitialized, navigate, location.pathname]);

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return <Outlet />;
}
