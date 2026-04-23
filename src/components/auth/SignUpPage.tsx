import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CrieMark } from "@/components/crie";
import { CRIE } from "@/lib/crie-tokens";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Password strength ────────────────────────────────────────────────────────
function getStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (pw.length === 0) return { level: 0, label: "", color: CRIE.line };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Fraca", color: CRIE.rose };
  if (score === 2 || score === 3) return { level: 2, label: "Moderada", color: CRIE.amber };
  return { level: 3, label: "Forte", color: CRIE.emerald };
}

// ─── Reusable input ───────────────────────────────────────────────────────────
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

export function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const strength = getStrength(password);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Mínimo 2 caracteres";
    if (!email) e.email = "Email obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    if (!password || password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!termsAccepted) e.terms = "Você precisa aceitar os termos";
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
      await signUp(email, password, {
        display_name: name.trim(),
        agency_name: name.trim() + " Agency",
      });
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Left panel */}
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
          <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            Crie!
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: CRIE.butter,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Comece grátis
          </p>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Crie sua conta e{" "}
            <span style={{ color: CRIE.butter }}>leve sua agência ao próximo nível.</span>
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", margin: 0, lineHeight: 1.6 }}>
            Mais de 200 agências já usam o Crie! para aprovar e publicar conteúdo com mais agilidade.
          </p>
        </div>

        <p style={{ fontSize: 12, color: "rgba(255,255,255,.38)", margin: 0, position: "relative" }}>
          © 2026 Crie! Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel */}
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
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: CRIE.ink,
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}
            >
              Criar sua conta
            </h1>
            <p style={{ fontSize: 14, color: CRIE.muted, margin: 0 }}>
              Preencha os dados abaixo para começar.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <InputField
              id="signup-name"
              label="Nome completo"
              placeholder="Maria Silva"
              value={name}
              onChange={setName}
              error={errors.name}
              autoComplete="name"
            />
            <InputField
              id="signup-email"
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={setEmail}
              error={errors.email}
              autoComplete="email"
            />

            {/* Password with strength indicator */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label
                htmlFor="signup-password"
                style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft, fontFamily: "Inter, sans-serif" }}
              >
                Senha
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${pwFocused ? CRIE.butterDeep : errors.password ? CRIE.rose : CRIE.line}`,
                  fontSize: 14,
                  color: CRIE.ink,
                  background: pwFocused ? CRIE.butterWash : "#fff",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                  transition: "border-color .12s, background .12s",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              {/* Strength bar */}
              {password.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <div style={{ flex: 1, display: "flex", gap: 4 }}>
                    {([1, 2, 3] as const).map((seg) => (
                      <div
                        key={seg}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 999,
                          background: strength.level >= seg ? strength.color : CRIE.line,
                          transition: "background .2s",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: strength.color,
                      minWidth: 52,
                      textAlign: "right",
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
              {errors.password && (
                <span style={{ fontSize: 12, color: CRIE.rose, fontFamily: "Inter, sans-serif" }}>
                  {errors.password}
                </span>
              )}
            </div>

            {/* Terms */}
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                fontSize: 13,
                color: CRIE.inkSoft,
                lineHeight: 1.5,
              }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: 2, accentColor: CRIE.butterDeep, width: 15, height: 15, cursor: "pointer" }}
                aria-label="Aceitar termos de uso e política de privacidade"
              />
              <span>
                Concordo com os{" "}
                <Link to="/terms" style={{ color: CRIE.ink, fontWeight: 600, textDecoration: "none" }}>
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link to="/privacy" style={{ color: CRIE.ink, fontWeight: 600, textDecoration: "none" }}>
                  Política de Privacidade
                </Link>
              </span>
            </label>
            {errors.terms && (
              <span style={{ fontSize: 12, color: CRIE.rose, fontFamily: "Inter, sans-serif", marginTop: -8 }}>
                {errors.terms}
              </span>
            )}

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
              {loading ? "Criando conta..." : "Criar conta grátis"}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 13, color: CRIE.muted, textAlign: "center" }}>
            Já tem conta?{" "}
            <Link to="/login" style={{ color: CRIE.ink, fontWeight: 600, textDecoration: "none" }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
