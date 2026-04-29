import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MagicLink {
  id: string;
  agency_id: string;
  workspace_id: string | null;
  purpose: "approval" | "portal_view";
  token_hash: string;
  email: string;
  label: string;
  created_by: string;
  expires_at: string;
  revoked_at: string | null;
  used_at: string | null;
  use_count: number;
  last_used_ip: string | null;
  last_used_user_agent: string | null;
  created_at: string;
}

interface MagicLinkWithWorkspace extends MagicLink {
  workspaces?: { name: string } | null;
}

// ─── Token generation ─────────────────────────────────────────────────────────

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useApprovers() {
  const { currentAgencyId } = useAuthStore();
  return useQuery({
    queryKey: ["magic-links", currentAgencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("magic_links")
        .select("*, workspaces(name)")
        .eq("agency_id", currentAgencyId!)
        .eq("purpose", "approval")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MagicLinkWithWorkspace[];
    },
    enabled: !!currentAgencyId,
  });
}

function useCreateApprover() {
  const qc = useQueryClient();
  const { currentAgencyId, user } = useAuthStore();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      label: string;
      workspace_id: string;
      expires_days: number;
    }) => {
      const token = generateToken();
      const token_hash = await hashToken(token);
      const expires_at = new Date(
        Date.now() + payload.expires_days * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase.from("magic_links").insert({
        agency_id: currentAgencyId,
        workspace_id: payload.workspace_id || null,
        purpose: "approval",
        token_hash,
        email: payload.email,
        label: payload.label,
        created_by: user?.id,
        expires_at,
      });
      if (error) throw error;
      return { token };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["magic-links"] });
    },
    onError: () => {
      toast.error("Erro ao criar aprovador");
    },
  });
}

function useRevokeApprover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("magic_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["magic-links"] });
      toast.success("Aprovador revogado");
    },
    onError: () => {
      toast.error("Erro ao revogar aprovador");
    },
  });
}

function useResendApprover() {
  const qc = useQueryClient();
  const { currentAgencyId, user } = useAuthStore();
  return useMutation({
    mutationFn: async (link: MagicLinkWithWorkspace) => {
      const token = generateToken();
      const token_hash = await hashToken(token);
      const expires_at = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Revoke old, insert new
      await supabase
        .from("magic_links")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", link.id);

      const { error } = await supabase.from("magic_links").insert({
        agency_id: currentAgencyId,
        workspace_id: link.workspace_id,
        purpose: "approval",
        token_hash,
        email: link.email,
        label: link.label,
        created_by: user?.id,
        expires_at,
      });
      if (error) throw error;
      return { token };
    },
    onSuccess: (_data, _vars, _ctx) => {
      qc.invalidateQueries({ queryKey: ["magic-links"] });
      toast.success("Novo link gerado");
    },
    onError: () => {
      toast.error("Erro ao regerar link");
    },
  });
}

// ─── Status helpers ───────────────────────────────────────────────────────────

type ApproverStatus = "active" | "expired" | "revoked" | "never";

function getStatus(link: MagicLink): ApproverStatus {
  if (link.revoked_at) return "revoked";
  if (new Date(link.expires_at) < new Date()) return "expired";
  if (!link.used_at) return "never";
  return "active";
}

const STATUS_STYLE: Record<ApproverStatus, { label: string; color: string; bg: string }> = {
  active:  { label: "Ativo",         color: CRIE.emerald, bg: "#F0FDF4" },
  expired: { label: "Expirado",      color: CRIE.amber,   bg: "#FFFBEB" },
  revoked: { label: "Revogado",      color: CRIE.rose,    bg: "#FFF1F2" },
  never:   { label: "Nunca acessou", color: CRIE.muted,   bg: CRIE.lineSoft },
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

// ─── Create Approver Modal ────────────────────────────────────────────────────

function CreateApproverModal({ onClose }: { onClose: () => void }) {
  const { workspaces } = useAuthStore();
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [workspaceId, setWorkspaceId] = useState(workspaces[0]?.id ?? "");
  const [expiresDays, setExpiresDays] = useState(7);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const create = useCreateApprover();

  async function handleSubmit() {
    if (!email.trim() || !label.trim()) {
      toast.error("Preencha e-mail e nome");
      return;
    }
    try {
      const { token } = await create.mutateAsync({
        email: email.trim(),
        label: label.trim(),
        workspace_id: workspaceId,
        expires_days: expiresDays,
      });
      const link = `${window.location.origin}/a/${token}`;
      setGeneratedLink(link);
    } catch {
      // handled by mutation
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${CRIE.line}`,
    background: CRIE.paper,
    fontSize: 14,
    color: CRIE.ink,
    outline: "none",
    fontFamily: "Inter, sans-serif",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(14,14,12,0.55)", backdropFilter: "blur(4px)" }}
      />
      <div style={{ position: "relative", width: 460, background: CRIE.card, borderRadius: 24, padding: 32, border: `1px solid ${CRIE.line}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h2 id="modal-title" style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: CRIE.ink }}>
          Novo aprovador
        </h2>

        {!generatedLink ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>
                Nome / Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Maria - Cafe Bonito"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>
                Marca (workspace)
              </label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>
                Expira em (dias)
              </label>
              <select
                value={expiresDays}
                onChange={(e) => setExpiresDays(Number(e.target.value))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {[3, 7, 14, 30, 60].map((d) => (
                  <option key={d} value={d}>{d} dias</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
              <Btn
                variant="butter"
                onClick={handleSubmit}
                disabled={create.isPending || !email.trim() || !label.trim()}
              >
                {create.isPending ? "Criando..." : "Criar aprovador"}
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ background: CRIE.butterWash, border: `1px solid ${CRIE.butterDeep}`, borderRadius: 12, padding: 16, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: CRIE.butterInk, marginBottom: 8 }}>
                Aprovador criado! Envie este link para o cliente:
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  readOnly
                  value={generatedLink}
                  style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${CRIE.butterDeep}`, fontSize: 12, fontFamily: "monospace", background: "#fff", color: CRIE.ink }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Btn
                  size="sm"
                  variant="butter"
                  onClick={() => { navigator.clipboard.writeText(generatedLink); toast.success("Link copiado!"); }}
                >
                  Copiar
                </Btn>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={onClose}>Fechar</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Approver Row ─────────────────────────────────────────────────────────────

function ApproverRow({
  link,
  onRevoke,
  onResend,
}: {
  link: MagicLinkWithWorkspace;
  onRevoke: () => void;
  onResend: () => void;
}) {
  const status = getStatus(link);
  const meta = STATUS_STYLE[status];
  const workspaceName = link.workspaces?.name ?? "—";

  function handleCopy() {
    toast.info("Para copiar o link, use 'Re-enviar link' para gerar um novo token seguro.");
  }

  const isRevoked = status === "revoked";

  return (
    <tr style={{ opacity: isRevoked ? 0.6 : 1 }}>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: CRIE.ink }}>{link.label}</div>
        <div style={{ fontSize: 11.5, color: CRIE.muted }}>{link.email}</div>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: CRIE.lineSoft, color: CRIE.inkSoft }}>
          {workspaceName}
        </span>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ fontSize: 12.5, color: CRIE.inkSoft }}>{formatDate(link.last_used_ip ? link.used_at : null)}</div>
        {link.use_count > 0 && (
          <div style={{ fontSize: 11, color: CRIE.muted }}>{link.use_count}x acessado</div>
        )}
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 600,
          color: meta.color,
          background: meta.bg,
          padding: "3px 10px", borderRadius: 999,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: meta.color, flexShrink: 0 }} />
          {meta.label}
        </span>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          {!isRevoked && (
            <Btn variant="ghost" size="sm" onClick={onResend} style={{ color: CRIE.sky }}>
              Re-enviar link
            </Btn>
          )}
          <Btn variant="ghost" size="sm" onClick={handleCopy}>
            Copiar link
          </Btn>
          {!isRevoked && (
            <Btn variant="ghost" size="sm" onClick={onRevoke} style={{ color: CRIE.rose }}>
              Revogar
            </Btn>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ApproversPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: links = [], isLoading } = useApprovers();
  const { workspaces } = useAuthStore();
  const revoke = useRevokeApprover();
  const resend = useResendApprover();

  // Group by workspace
  const grouped = workspaces.map((ws) => ({
    workspace: ws,
    links: links.filter((l) => l.workspace_id === ws.id),
  }));
  const ungrouped = links.filter((l) => !l.workspace_id);

  const COL_HEADERS = ["Nome / Label", "Marca", "Ultimo acesso", "Status", "Acoes"];

  function renderTable(rows: MagicLinkWithWorkspace[]) {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: CRIE.lineSoft }}>
            {COL_HEADERS.map((h) => (
              <th
                key={h}
                style={{ padding: "11px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase", borderBottom: `1px solid ${CRIE.line}` }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((link) => (
            <ApproverRow
              key={link.id}
              link={link}
              onRevoke={() => revoke.mutate(link.id)}
              onResend={() => resend.mutate(link)}
            />
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div style={{ background: CRIE.bg, fontFamily: "Inter, sans-serif", padding: 32 }}>
      <SectionHeader
        title="Aprovadores"
        action={<Btn variant="butter" onClick={() => setShowModal(true)}>+ Novo aprovador</Btn>}
      />

      {isLoading ? (
        <PCard>
          <div style={{ padding: "48px 0", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
            Carregando aprovadores...
          </div>
        </PCard>
      ) : links.length === 0 ? (
        <PCard>
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: CRIE.muted, marginBottom: 8 }}>Nenhum aprovador cadastrado.</div>
            <div style={{ fontSize: 12, color: CRIE.mutedSoft }}>
              Crie magic links para que clientes aprovem conteudo sem precisar de login.
            </div>
          </div>
        </PCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {grouped.map(({ workspace, links: wLinks }) =>
            wLinks.length > 0 ? (
              <div key={workspace.id}>
                <div style={{ fontSize: 12, fontWeight: 700, color: CRIE.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                  {workspace.name}
                </div>
                <PCard pad={0} style={{ overflow: "hidden" }}>
                  {renderTable(wLinks)}
                </PCard>
              </div>
            ) : null
          )}
          {ungrouped.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: CRIE.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
                Sem marca associada
              </div>
              <PCard pad={0} style={{ overflow: "hidden" }}>
                {renderTable(ungrouped)}
              </PCard>
            </div>
          )}
        </div>
      )}

      {showModal && <CreateApproverModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
