import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CrieMark } from "@/components/crie";
import { CRIE } from "@/lib/crie-tokens";
import { useAuthStore } from "@/stores/useAuthStore";

const FEATURE_PILLS = [
  { icon: "✓", text: "Aprovação de conteúdo em 1 clique" },
  { icon: "✓", text: "Board Kanban para toda a equipe" },
  { icon: "✓", text: "Calendário editorial integrado" },
  { icon: "✓", text: "Publicação direta no Instagram" },
];

function FeaturePill({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(255,255,255,.09)",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 999,
        padding: "7px 14px",
        fontSize: 13,
        color: "rgba(255,255,255,.88)",
        fontWeight: 500,
      }}
    >
      <span style={{ color: CRIE.butter, fontWeight: 700 }}>✓</span>
      {text}
    </div>
  );
}

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

export function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: typeof errors = {};
    if (!email) e.email = "Email obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    if (!password) e.password = "Senha obrigatória";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setServerError("");
    try {
      await signIn(email, password);
      navigate("/app", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Left panel — 44% dark */}
      <div
        style={{
          width: "44%",
          flexShrink: 0,
          background: CRIE.ink,
          display: "flex",
          flexDirection: "column",
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle dot texture */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(238,240,168,.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }}
        />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
          <div
            style={{
              background: CRIE.butter,
              borderRadius: 12,
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CrieMark size={26} />
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            Crie!
          </span>
        </div>

        {/* Main copy */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: CRIE.butter,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              Para agências de conteúdo
            </p>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.2,
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Seu conteúdo.{" "}
              <span style={{ color: CRIE.butter }}>Aprovado mais rápido.</span>
            </h2>
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FEATURE_PILLS.map((p) => (
              <FeaturePill key={p.text} text={p.text} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 12, color: "rgba(255,255,255,.38)", margin: 0, position: "relative" }}>
          © 2026 Crie! Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: CRIE.bg,
          padding: "40px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: CRIE.ink,
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}
            >
              Entrar na sua conta
            </h1>
            <p style={{ fontSize: 14, color: CRIE.muted, margin: 0 }}>
              Bem-vindo de volta. Digite suas credenciais.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <InputField
              id="login-email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
            />
            <div>
              <InputField
                id="login-password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
                error={errors.password}
                autoComplete="current-password"
              />
              <div style={{ textAlign: "right", marginTop: 6 }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 12, color: CRIE.muted, textDecoration: "none" }}
                >
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

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
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 13, color: CRIE.muted, textAlign: "center" }}>
            Não tem conta?{" "}
            <Link
              to="/signup"
              style={{ color: CRIE.ink, fontWeight: 600, textDecoration: "none" }}
            >
              Criar conta grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
