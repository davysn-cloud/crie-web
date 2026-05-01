import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

export function AuthGuard() {
  const { session, isLoading, isInitialized } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showStuckWarning, setShowStuckWarning] = useState(false);

  useEffect(() => {
    if (isInitialized && !isLoading && !session) {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [session, isLoading, isInitialized, navigate, location.pathname]);

  // Se o spinner aparecer por mais de 6s, mostra opção de reset
  useEffect(() => {
    if (!isInitialized || isLoading) {
      const t = setTimeout(() => setShowStuckWarning(true), 6000);
      return () => clearTimeout(t);
    }
    setShowStuckWarning(false);
  }, [isInitialized, isLoading]);

  async function handleReset() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    // Limpa qualquer storage residual e recarrega
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("sb-") || k.includes("supabase"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.href = "/login";
  }

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        {showStuckWarning && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              Está demorando demais. Pode ser uma sessão inválida do projeto anterior.
            </p>
            <button
              onClick={handleReset}
              className="text-sm font-medium text-primary underline hover:no-underline"
            >
              Limpar sessão e ir para o login
            </button>
          </div>
        )}
      </div>
    );
  }

  if (!session) return null;

  return <Outlet />;
}
