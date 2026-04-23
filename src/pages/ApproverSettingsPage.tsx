import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CRIE } from "@/lib/crie-tokens";
import { CrieMark, PCard, Btn } from "@/components/crie";
import { useApproverStore } from "@/stores/useApproverStore";

// ─── Page tab nav ──────────────────────────────────────────────────────────────

function ApproverPageTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const base = location.pathname.replace(/\/(history|settings)$/, "");

  const tabs = [
    { label: "Fila", path: base },
    { label: "Historico", path: `${base}/history` },
    { label: "Config", path: `${base}/settings` },
  ];

  function isActive(path: string) {
    if (path === base) {
      return location.pathname === base || location.pathname === `${base}/`;
    }
    return location.pathname.startsWith(path);
  }

  return (
    <nav
      aria-label="Navegacao do portal do aprovador"
      style={{
        maxWidth: 480,
        margin: "0 auto",
        background: CRIE.paper,
        borderBottom: `1px solid ${CRIE.line}`,
        display: "flex",
        width: "100%",
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              padding: "9px 0",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              color: active ? CRIE.ink : CRIE.muted,
              fontFamily: "Inter, sans-serif",
              borderBottom: `2px solid ${active ? CRIE.butterDeep : "transparent"}`,
              transition: "all .12s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 0",
      }}
    >
      <div>
        <label
          htmlFor={id}
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 600,
            color: CRIE.ink,
            cursor: "pointer",
            marginBottom: description ? 3 : 0,
          }}
        >
          {label}
        </label>
        {description && (
          <p style={{ margin: 0, fontSize: 12, color: CRIE.muted, lineHeight: 1.4 }}>
            {description}
          </p>
        )}
      </div>
      {/* Custom toggle switch */}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: checked ? CRIE.ink : CRIE.line,
          cursor: "pointer",
          transition: "background .15s",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .15s",
            boxShadow: "0 1px 4px rgba(0,0,0,.18)",
          }}
        />
      </button>
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${CRIE.lineSoft}`,
        gap: 12,
      }}
    >
      <span style={{ fontSize: 13, color: CRIE.muted, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: CRIE.ink,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "60%",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function ApproverSettingsPage() {
  const navigate = useNavigate();
  const session = useApproverStore((s) => s.session);
  const clearSession = useApproverStore((s) => s.clearSession);

  const [weeklyDigest, setWeeklyDigest] = useState<boolean>(() => {
    try {
      return localStorage.getItem("approver_weekly_digest") === "true";
    } catch {
      return false;
    }
  });

  function handleToggleDigest(v: boolean) {
    setWeeklyDigest(v);
    try {
      localStorage.setItem("approver_weekly_digest", String(v));
    } catch {
      // localStorage unavailable
    }
  }

  function handleSignOut() {
    clearSession();
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: CRIE.card,
          borderBottom: `1px solid ${CRIE.line}`,
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: CRIE.butter,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CrieMark size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: CRIE.ink, lineHeight: 1.2 }}>
                {session?.agency_name ?? "Agencia"}
              </div>
              <div style={{ fontSize: 11, color: CRIE.muted, lineHeight: 1.2 }}>
                revisando como {session?.approver_name ?? "Aprovador"}
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: CRIE.muted,
              fontFamily: "Inter, sans-serif",
              padding: "4px 8px",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
            aria-label="Sair"
          >
            Sair →
          </button>
        </div>
      </header>

      {/* Magic link banner */}
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          background: CRIE.butterWash,
          borderBottom: `1px solid ${CRIE.butterDeep}`,
          padding: "9px 16px",
          fontSize: 12.5,
          color: CRIE.butterInk,
          textAlign: "center",
        }}
      >
        Voce esta revisando via link magico
      </div>

      {/* Page tabs */}
      <ApproverPageTabs />

      {/* Content */}
      <main
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "20px 16px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: CRIE.ink,
            letterSpacing: -0.4,
          }}
        >
          Configuracoes
        </h2>

        {/* Notificacoes */}
        <PCard pad={16}>
          <p
            style={{
              margin: "0 0 2px",
              fontSize: 12,
              fontWeight: 700,
              color: CRIE.muted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Notificacoes
          </p>
          <Toggle
            id="weekly-digest-toggle"
            checked={weeklyDigest}
            onChange={handleToggleDigest}
            label="Resumo semanal por email"
            description="Receba um resumo das aprovacoes e pendencias toda segunda-feira."
          />
        </PCard>

        {/* Session info */}
        <PCard pad={16}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 700,
              color: CRIE.muted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Sua sessao
          </p>
          <InfoRow label="Revisando como" value={session?.approver_name ?? "—"} />
          <InfoRow label="Email" value={session?.approver_email ?? "—"} />
          <InfoRow label="Agencia" value={session?.agency_name ?? "—"} last />
        </PCard>

        {/* Sign out */}
        <div style={{ paddingTop: 4 }}>
          <Btn
            variant="secondary"
            onClick={handleSignOut}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Sair desta sessao
          </Btn>
        </div>
      </main>
    </div>
  );
}
