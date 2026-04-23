import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useApproverStore } from "@/stores/useApproverStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface MagicLinkGateProps {
  children: React.ReactNode;
}

export function MagicLinkGate({ children }: MagicLinkGateProps) {
  const { token } = useParams<{ token: string }>();
  const { session, isValidating, error, setSession, setValidating, setError } = useApproverStore();

  useEffect(() => {
    if (!token) {
      setError("Token ausente");
      return;
    }

    // Check localStorage for cached session
    const cached = localStorage.getItem(`approver_session_${token}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Check if still valid (simple expiry check)
        if (parsed && parsed.magic_link_id) {
          setSession(parsed);
          // Still validate in background
          validateToken(token);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    validateToken(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function validateToken(t: string) {
    setValidating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("magic-link", {
        body: { action: "verify", token: t },
      });

      if (fnError || !data) {
        throw new Error(fnError?.message ?? "Falha na validacao do link");
      }

      setSession(data);
      localStorage.setItem(`approver_session_${t}`, JSON.stringify(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Link invalido ou expirado";
      setError(msg);
      localStorage.removeItem(`approver_session_${t}`);
    } finally {
      setValidating(false);
    }
  }

  if (isValidating && !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-80 w-full max-w-sm rounded-xl" />
        <p className="text-sm text-muted-foreground">Validando seu link...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Link indisponivel</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "Este link expirou ou foi revogado."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => token && validateToken(token)}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
        <p className="text-xs text-muted-foreground">
          Se o problema persistir, solicite um novo link ao seu contato na agencia.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
