import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export function AgencyRedirect() {
  const navigate = useNavigate();
  const { agencies, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (agencies.length > 0) {
      navigate(`/app/${agencies[0]!.agency.slug}`, { replace: true });
    }
  }, [agencies, isLoading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
