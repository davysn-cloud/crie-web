import { useState } from "react";
import { Link } from "react-router-dom";
import { CrieMark } from "@/components/crie";
import { CRIE } from "@/lib/crie-tokens";
import { supabase } from "@/lib/supabase";

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  id,
  autoComplete,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  id: string;
  autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        htmlFor={id}
        style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft, fontFamily: "Inter, sans-serif" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: `1.5px solid ${focused ? CRIE.butterDeep : error ? CRIE.rose : CRIE.line}`,
          fontSize: 14,
          color: CRIE.ink,
          background: focused ? CRIE.butterWash : "#fff",
          outline: "none",
          fontFamily: "Inter, sans-serif",
          transition: "border-color .12s, background .12s",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
      {error && (
        <span style={{ fontSize: 12, color: CRIE.rose, fontFamily: "Inter, sans-serif" }}>{error}</span>
      )}
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function validate() {
    if (!email) return "Email obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email inválido";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setEmailError(err);
    if (err) return;

    setLoading(true);
    setServerError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro ao enviar o email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: CRIE.card,
          border: `1px solid ${CRIE.line}`,
          borderRadius: 24,
          padding: "40px 36px",
          boxShadow: "0 4px 32px rgba(0,0,0,.06)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              background: CRIE.butter,
              borderRadius: 14,
              padding: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CrieMark size={30} />
          </div>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }} role="img" aria-label="Email enviado">
              ✉️
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: CRIE.ink,
                margin: "0 0 10px",
                letterSpacing: "-0.02em",
              }}
            >
              Email enviado!
            </h1>
            <p
              style={{
                fontSize: 14,
                color: CRIE.muted,
                margin: "0 0 28px",
                lineHeight: 1.6,
              }}
            >
              Enviamos um link de recuperação para{" "}
              <strong style={{ color: CRIE.inkSoft }}>{email}</strong>.
              Verifique sua caixa de entrada (e o spam).
            </p>
            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "11px 28px",
                borderRadius: 12,
                background: CRIE.ink,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                transition: "opacity .12s",
              }}
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: CRIE.ink,
                  margin: "0 0 8px",
                  letterSpacing: "-0.02em",
                }}
              >
                Recuperar senha
              </h1>
              <p style={{ fontSize: 14, color: CRIE.muted, margin: 0, lineHeight: 1.5 }}>
                Digite seu email para receber o link de recuperação.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              <InputField
                id="forgot-email"
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={setEmail}
                error={emailError}
                autoComplete="email"
              />

              {serverError && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: `1px solid ${CRIE.rose}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: CRIE.rose,
                  }}
                >
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 12,
                  border: "none",
                  background: loading ? CRIE.muted : CRIE.ink,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "background .12s",
                  letterSpacing: "-0.01em",
                }}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <Link
                to="/login"
                style={{ fontSize: 13, color: CRIE.muted, textDecoration: "none", fontWeight: 500 }}
              >
                ← Voltar ao login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
