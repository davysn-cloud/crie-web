import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import type { AgencyMember } from "@/types";

// ─── Nav Section ──────────────────────────────────────────────────────────────

type SettingsSection =
  | "perfil"
  | "seguranca"
  | "preferencias"
  | "geral"
  | "white-label"
  | "integracoes"
  | "excluir";

interface NavItem {
  id: SettingsSection;
  label: string;
  danger?: boolean;
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "Conta",
    items: [
      { id: "perfil", label: "Perfil" },
      { id: "seguranca", label: "Seguranca" },
      { id: "preferencias", label: "Preferencias" },
    ],
  },
  {
    group: "Agencia",
    items: [
      { id: "geral", label: "Configuracoes gerais" },
      { id: "white-label", label: "White-label" },
      { id: "integracoes", label: "Integracoes" },
    ],
  },
  {
    group: "Danger zone",
    items: [{ id: "excluir", label: "Excluir conta", danger: true }],
  },
];

// ─── Input Field ──────────────────────────────────────────────────────────────

function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  readOnly,
}: {
  id: string;
  label: string;
  type?: string;
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: CRIE.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${CRIE.line}`,
          background: readOnly ? CRIE.lineSoft : CRIE.paper,
          fontSize: 14,
          color: readOnly ? CRIE.muted : CRIE.ink,
          outline: "none",
          fontFamily: "Inter, sans-serif",
          transition: "border-color .12s",
          cursor: readOnly ? "default" : undefined,
        }}
        onFocus={(e) => {
          if (!readOnly) e.currentTarget.style.borderColor = CRIE.butterDeep;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = CRIE.line;
        }}
      />
    </div>
  );
}

// ─── Profile Content ──────────────────────────────────────────────────────────

function ProfileContent() {
  const { user, currentAgencyId } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch agency_member record for this user
  const { data: memberRecord, isLoading } = useQuery({
    queryKey: ["my-agency-member", user?.id, currentAgencyId],
    queryFn: async () => {
      if (!user?.id || !currentAgencyId) return null;
      const { data, error } = await supabase
        .from("agency_members")
        .select("display_name, avatar_url, role, invited_email")
        .eq("user_id", user.id)
        .eq("agency_id", currentAgencyId)
        .maybeSingle();

      if (error) throw error;
      return data as Pick<AgencyMember, "display_name" | "avatar_url" | "invited_email"> & { role?: string } | null;
    },
    enabled: !!user?.id && !!currentAgencyId,
  });

  const [displayName, setDisplayName] = useState("");

  // Populate once data arrives
  const resolvedName = displayName || memberRecord?.display_name || user?.user_metadata?.display_name || "";
  const email = user?.email ?? "";
  const avatarUrl = memberRecord?.avatar_url ?? null;

  const initials = resolvedName
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

  // Save mutation
  const saveProfile = useMutation({
    mutationFn: async () => {
      const name = displayName.trim() || resolvedName;

      // Update Supabase auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: name },
      });
      if (authError) throw authError;

      // Update agency_members record
      if (user?.id && currentAgencyId) {
        const { error: memberError } = await supabase
          .from("agency_members")
          .update({ display_name: name })
          .eq("user_id", user.id)
          .eq("agency_id", currentAgencyId);
        if (memberError) throw memberError;
      }
    },
    onSuccess: () => {
      toast.success("Perfil atualizado");
      queryClient.invalidateQueries({ queryKey: ["my-agency-member", user?.id, currentAgencyId] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err) => {
      toast.error(`Erro: ${err instanceof Error ? err.message : "Erro ao salvar"}`);
    },
  });

  if (isLoading) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
        Carregando perfil…
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: CRIE.ink }}>
        Perfil
      </h2>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={resolvedName}
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              objectFit: "cover",
              border: `2px solid ${CRIE.line}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            aria-label={`Avatar ${initials}`}
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "linear-gradient(135deg, #EEF0A8 0%, #C6D3A3 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
              color: CRIE.butterInk,
              flexShrink: 0,
              border: `2px solid ${CRIE.line}`,
            }}
          >
            {initials}
          </div>
        )}
        <div>
          <Btn variant="secondary" size="sm">
            Trocar foto
          </Btn>
          <p style={{ margin: "6px 0 0", fontSize: 11.5, color: CRIE.muted }}>
            JPG, PNG ou GIF. Max 2 MB.
          </p>
        </div>
      </div>

      {/* Fields 2x2 grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <InputField
          id="nome"
          label="Nome completo"
          value={displayName || memberRecord?.display_name || user?.user_metadata?.display_name || ""}
          onChange={setDisplayName}
        />
        <InputField
          id="email"
          label="E-mail"
          type="email"
          value={email}
          readOnly
        />
        <InputField
          id="cargo"
          label="Cargo"
          value={(memberRecord as any)?.role ?? ""}
          readOnly
        />
        <InputField
          id="telefone"
          label="Telefone"
          type="tel"
          value=""
          readOnly
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={() => setDisplayName("")}>
          Cancelar
        </Btn>
        <Btn
          variant="butter"
          onClick={() => saveProfile.mutate()}
          disabled={saveProfile.isPending}
        >
          {saveProfile.isPending ? "Salvando…" : "Salvar alteracoes"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Sign Out Content ─────────────────────────────────────────────────────────

function SignOutContent() {
  const navigate = useNavigate();
  const signOut = useAuthStore((s) => s.signOut);
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch {
      toast.error("Erro ao sair. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: CRIE.ink }}>
        Sair da conta
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: CRIE.muted, lineHeight: 1.6 }}>
        Encerra sua sessao neste dispositivo e limpa todos os dados em cache.
        Voce precisara fazer login novamente para acessar o painel.
      </p>
      <Btn
        variant="secondary"
        onClick={handleSignOut}
        disabled={loading}
      >
        {loading ? "Saindo…" : "Sair da conta"}
      </Btn>
    </div>
  );
}

// ─── Delete Account Content ───────────────────────────────────────────────────

function DeleteAccountContent() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState<"idle" | "confirm">("idle");

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: "EXCLUIR" },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Conta excluida com sucesso.");
      // signOut limpa store + localStorage + sessionStorage
      await signOut();
      navigate("/login", { replace: true });
    },
    onError: (err) => {
      toast.error(`Erro ao excluir conta: ${err instanceof Error ? err.message : "Tente novamente."}`);
    },
  });

  const canDelete = confirm === "EXCLUIR";

  if (step === "idle") {
    return (
      <div>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: CRIE.rose }}>
          Excluir conta
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: CRIE.muted, lineHeight: 1.6 }}>
          Esta acao e permanente e nao pode ser desfeita. Todos os seus dados,
          agencias, workspaces e conteudos serao excluidos imediatamente.
        </p>
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 24,
            fontSize: 13,
            color: "#991B1B",
            lineHeight: 1.6,
          }}
        >
          <strong>O que sera excluido:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>Sua conta e dados de perfil</li>
            <li>Todas as agencias onde voce e owner (e seus workspaces, marcas e conteudos)</li>
            <li>Suas participacoes em agencias de terceiros</li>
          </ul>
        </div>
        <Btn
          variant="secondary"
          onClick={() => setStep("confirm")}
          style={{ color: CRIE.rose, borderColor: CRIE.rose }}
        >
          Quero excluir minha conta
        </Btn>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: CRIE.rose }}>
        Confirmar exclusao
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: CRIE.muted, lineHeight: 1.6 }}>
        Para confirmar, digite <strong>EXCLUIR</strong> no campo abaixo.
        Esta acao nao pode ser desfeita.
      </p>
      <div style={{ marginBottom: 8 }}>
        <label
          htmlFor="delete-confirm"
          style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}
        >
          Confirmacao
        </label>
        <input
          id="delete-confirm"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Digite EXCLUIR"
          autoComplete="off"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 14px",
            borderRadius: 12,
            border: `1px solid ${canDelete ? CRIE.rose : CRIE.line}`,
            background: CRIE.paper,
            fontSize: 14,
            color: CRIE.ink,
            outline: "none",
            fontFamily: "Inter, sans-serif",
            transition: "border-color .12s",
            marginBottom: 20,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn
          variant="secondary"
          onClick={() => { setStep("idle"); setConfirm(""); }}
          disabled={deleteAccount.isPending}
        >
          Cancelar
        </Btn>
        <Btn
          variant="secondary"
          onClick={() => deleteAccount.mutate()}
          disabled={!canDelete || deleteAccount.isPending}
          style={canDelete ? { color: CRIE.rose, borderColor: CRIE.rose } : {}}
        >
          {deleteAccount.isPending ? "Excluindo…" : "Excluir conta permanentemente"}
        </Btn>
      </div>
      <p style={{ margin: "16px 0 0", fontSize: 12, color: CRIE.muted }}>
        Conta: {user?.email}
      </p>
    </div>
  );
}

// ─── Placeholder Content ──────────────────────────────────────────────────────

function PlaceholderContent({ section }: { section: SettingsSection }) {
  const labels: Record<SettingsSection, string> = {
    perfil: "Perfil",
    seguranca: "Seguranca",
    preferencias: "Preferencias",
    geral: "Configuracoes gerais",
    "white-label": "White-label",
    integracoes: "Integracoes",
    excluir: "Excluir conta",
  };

  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: CRIE.muted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🔧</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: CRIE.ink, marginBottom: 8 }}>
        {labels[section]}
      </div>
      <div style={{ fontSize: 13 }}>Secao em construcao.</div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("perfil");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        padding: "32px",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 24,
        alignItems: "start",
      }}
    >
      {/* ── Left nav ── */}
      <nav aria-label="Configuracoes" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.group}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: CRIE.mutedSoft,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                marginBottom: 6,
                paddingLeft: 12,
              }}
            >
              {group.group}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {group.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13.5,
                      fontWeight: isActive ? 600 : 500,
                      color: item.danger
                        ? CRIE.rose
                        : isActive
                        ? CRIE.ink
                        : CRIE.inkSoft,
                      background: isActive && !item.danger ? CRIE.butter : "transparent",
                      fontFamily: "Inter, sans-serif",
                      transition: "background .1s, color .1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        e.currentTarget.style.background = item.danger
                          ? "#FEF2F2"
                          : CRIE.lineSoft;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Right content ── */}
      <PCard pad={28}>
        {activeSection === "perfil" && <ProfileContent />}
        {activeSection === "seguranca" && <SignOutContent />}
        {activeSection === "excluir" && <DeleteAccountContent />}
        {activeSection !== "perfil" && activeSection !== "seguranca" && activeSection !== "excluir" && (
          <PlaceholderContent section={activeSection} />
        )}
      </PCard>
    </div>
  );
}
