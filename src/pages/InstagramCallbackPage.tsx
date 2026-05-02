import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { CRIE } from "@/lib/crie-tokens";
import { CrieMark } from "@/components/crie";

export function InstagramCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (errorParam) {
        setStatus("error");
        setMessage(errorDescription ?? "Autorizacao negada pelo usuario.");
        return;
      }

      if (!code || !state) {
        setStatus("error");
        setMessage("Parametros invalidos no callback.");
        return;
      }

      const [workspaceId, agencyId] = state.split(":");
      if (!workspaceId || !agencyId) {
        setStatus("error");
        setMessage("Estado invalido no callback.");
        return;
      }

      const redirectUri = `${window.location.origin}/app/integrations/instagram/callback`;

      try {
        const { data, error } = await supabase.functions.invoke("instagram-oauth", {
          body: { code, workspace_id: workspaceId, agency_id: agencyId, redirect_uri: redirectUri },
        });

        if (error || (data as any)?.error) {
          setStatus("error");
          setMessage((data as any)?.error ?? error?.message ?? "Erro ao conectar com o Instagram.");
          return;
        }

        setStatus("success");
        setMessage(
          (data as any)?.account_name
            ? `Conectado como ${(data as any).account_name}`
            : "Instagram conectado com sucesso!"
        );
        setTimeout(() => navigate("/app/integrations"), 2500);
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Erro desconhecido.");
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        gap: 24,
        padding: 32,
      }}
    >
      <div
        style={{
          background: CRIE.paper,
          borderRadius: 24,
          padding: 48,
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          border: `1px solid ${CRIE.line}`,
          boxShadow: "0 8px 24px rgba(0,0,0,.08)",
        }}
      >
        <CrieMark size={32} />
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          {isLoading && (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `4px solid ${CRIE.line}`,
                borderTopColor: CRIE.butterDeep,
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
          )}
          {isSuccess && <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>}
          {status === "error" && <div style={{ fontSize: 48, marginBottom: 8 }}>✗</div>}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 700, color: CRIE.ink, margin: "0 0 8px" }}>
          {isLoading
            ? "Conectando ao Instagram..."
            : isSuccess
            ? "Conectado!"
            : "Erro na conexao"}
        </h2>
        <p style={{ fontSize: 14, color: CRIE.muted, margin: 0 }}>
          {isLoading ? "Aguarde enquanto processamos a autorizacao." : message}
        </p>

        {status === "error" && (
          <button
            onClick={() => navigate("/app/integrations")}
            style={{
              marginTop: 24,
              padding: "10px 24px",
              borderRadius: 12,
              border: "none",
              background: CRIE.ink,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Voltar para Integracoes
          </button>
        )}

        {isSuccess && (
          <p style={{ fontSize: 12, color: CRIE.muted, marginTop: 16 }}>Redirecionando...</p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
