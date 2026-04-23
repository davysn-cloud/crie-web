import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE, ROLE_META, BRANDS_LIST } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader, CrieBadge } from "@/components/crie";
import { useTeam, useInvites, useInviteMember, useRemoveMember, useRevokeInvite } from "@/features/admin/hooks/useTeam";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";
import type { AgencyMember } from "@/types";

// ─── Workspace Members Query ─────────────────────────────────────────────────

interface WorkspaceMemberRow {
  workspace_id: string;
  user_id: string;
  workspaces: { name: string } | null;
}

function useWorkspaceMembersForAgency() {
  const { workspaces } = useAuthStore();
  const workspaceIds = workspaces.map((w) => w.id);

  return useQuery({
    queryKey: ["workspace-members-for-agency", workspaceIds],
    queryFn: async () => {
      if (workspaceIds.length === 0) return [] as WorkspaceMemberRow[];
      const { data, error } = await supabase
        .from("workspace_members")
        .select("workspace_id, user_id, workspaces(name)")
        .in("workspace_id", workspaceIds);
      if (error) throw error;
      return (data ?? []) as unknown as WorkspaceMemberRow[];
    },
    enabled: workspaceIds.length > 0,
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function normalizeRole(role: string | undefined): keyof typeof ROLE_META {
  const map: Record<string, keyof typeof ROLE_META> = {
    owner: "Admin",
    admin: "Admin",
    strategist: "Estrategista",
    copywriter: "Copywriter",
    designer: "Designer",
    social_media: "Social Media",
    viewer: "Social Media",
  };
  return map[role ?? ""] ?? "Social Media";
}

// ─── Invite Modal ────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("strategist");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { workspaces } = useAuthStore();
  const inviteMember = useInviteMember();

  function toggleBrand(id: string) {
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    try {
      await inviteMember.mutateAsync({ email, role, display_name: displayName || email });

      const { data } = await supabase
        .from("agency_invites")
        .select("id")
        .eq("email", email)
        .is("accepted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setInviteLink(`${window.location.origin}/signup/member?invite=${data.id}`);
      } else {
        onClose();
      }
    } catch {
      // error toast handled by the hook
    }
  }

  const brandItems = workspaces.length > 0
    ? workspaces.map((ws) => ({ id: ws.id, name: ws.name, handle: `@${ws.slug}`, color: CRIE.butter }))
    : BRANDS_LIST.map((b) => ({ ...b }));

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(14,14,12,0.55)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", width: 460, background: CRIE.card, borderRadius: 24, padding: 32, border: `1px solid ${CRIE.line}`, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: CRIE.ink }}>Convidar membro</h2>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>Nome</label>
          <input
            type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nome do colaborador"
            disabled={!!inviteLink}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 12, border: `1px solid ${CRIE.line}`, background: CRIE.paper, fontSize: 14, color: CRIE.ink, outline: "none", fontFamily: "Inter, sans-serif" }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>E-mail</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@empresa.com"
            disabled={!!inviteLink}
            style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 12, border: `1px solid ${CRIE.line}`, background: CRIE.paper, fontSize: 14, color: CRIE.ink, outline: "none", fontFamily: "Inter, sans-serif" }}
          />
        </div>

        {/* Role */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}>Cargo</label>
          <select
            value={role} onChange={(e) => setRole(e.target.value)} disabled={!!inviteLink}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${CRIE.line}`, background: CRIE.paper, fontSize: 14, color: CRIE.ink, outline: "none", fontFamily: "Inter, sans-serif", cursor: "pointer" }}
          >
            <option value="strategist">Estrategista</option>
            <option value="copywriter">Copywriter</option>
            <option value="designer">Designer</option>
            <option value="social_media">Social Media</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Brands */}
        <div style={{ marginBottom: 28 }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 10 }}>Marcas</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {brandItems.map((brand) => {
              const checked = selectedBrands.includes(brand.id);
              return (
                <label key={brand.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 10, border: `1px solid ${checked ? CRIE.butterDeep : CRIE.line}`, background: checked ? CRIE.butterWash : CRIE.paper, transition: "all .12s" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleBrand(brand.id)} disabled={!!inviteLink} style={{ accentColor: CRIE.butterDeep, width: 15, height: 15 }} />
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: brand.color, border: `1px solid ${CRIE.line}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: CRIE.ink }}>{brand.name}</span>
                  <span style={{ fontSize: 12, color: CRIE.muted, marginLeft: "auto" }}>{brand.handle}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Invite link result */}
        {inviteLink && (
          <div style={{ background: CRIE.butterWash, border: `1px solid ${CRIE.butterDeep}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: CRIE.butterInk, marginBottom: 6 }}>Convite criado! Envie este link para o membro:</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                readOnly value={inviteLink}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${CRIE.butterDeep}`, fontSize: 12, fontFamily: "monospace", background: "#fff", color: CRIE.ink }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Btn size="sm" variant="butter" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Link copiado!"); }}>Copiar</Btn>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {inviteLink ? (
            <Btn onClick={onClose}>Fechar</Btn>
          ) : (
            <>
              <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
              <Btn variant="butter" onClick={handleSubmit} disabled={!email.trim() || inviteMember.isPending}>
                {inviteMember.isPending ? "Enviando..." : "Enviar convite"}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Team Row (active member) ────────────────────────────────────────────────

function TeamRow({
  member,
  workspaceMemberRows,
  onDelete,
}: {
  member: AgencyMember;
  workspaceMemberRows: WorkspaceMemberRow[];
  onDelete: (id: string) => void;
}) {
  const roleKey = normalizeRole(member.role);
  const roleMeta = ROLE_META[roleKey] ?? { color: CRIE.muted, bg: CRIE.lineSoft };

  const memberWorkspaces = workspaceMemberRows
    .filter((wm) => wm.user_id === member.user_id)
    .map((wm) => wm.workspaces?.name ?? "")
    .filter(Boolean);

  const isActive = member.accepted_at !== null;
  const initials = getInitials(member.display_name);

  return (
    <tr>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {member.avatar_url ? (
            <img src={member.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 999, background: CRIE.butter, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: CRIE.butterInk, flexShrink: 0 }}>{initials}</div>
          )}
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: CRIE.ink }}>{member.display_name}</div>
            <div style={{ fontSize: 11.5, color: CRIE.muted }}>{member.invited_email ?? ""}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <CrieBadge label={roleKey} color={roleMeta.color} bg={roleMeta.bg} />
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {memberWorkspaces.length > 0 ? memberWorkspaces.map((name) => (
            <span key={name} style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 500, background: CRIE.lineSoft, color: CRIE.inkSoft, whiteSpace: "nowrap" }}>{name}</span>
          )) : (
            <span style={{ fontSize: 11.5, color: CRIE.mutedSoft }}>—</span>
          )}
        </div>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: isActive ? "#22C55E" : CRIE.amber }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: isActive ? "#22C55E" : CRIE.amber, flexShrink: 0 }} />
          {isActive ? "Ativo" : "Pendente"}
        </span>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <Btn variant="ghost" size="sm" onClick={() => onDelete(member.id)} style={{ color: CRIE.rose }}>Remover</Btn>
      </td>
    </tr>
  );
}

// ─── Invite Row (pending) ────────────────────────────────────────────────────

function InviteRow({ invite, onRevoke }: { invite: any; onRevoke: (id: string) => void }) {
  const roleKey = normalizeRole(invite.default_role);
  const roleMeta = ROLE_META[roleKey] ?? { color: CRIE.muted, bg: CRIE.lineSoft };
  const initials = getInitials(invite.display_name || invite.email);
  const inviteLink = `${window.location.origin}/signup/member?invite=${invite.id}`;

  return (
    <tr style={{ opacity: 0.75 }}>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: CRIE.lineSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: CRIE.muted, flexShrink: 0, border: `2px dashed ${CRIE.line}` }}>{initials}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: CRIE.ink }}>{invite.display_name || "Convidado"}</div>
            <div style={{ fontSize: 11.5, color: CRIE.muted }}>{invite.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <CrieBadge label={roleKey} color={roleMeta.color} bg={roleMeta.bg} />
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <span style={{ fontSize: 11.5, color: CRIE.mutedSoft }}>—</span>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: CRIE.amber }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: CRIE.amber, flexShrink: 0 }} />
          Convite pendente
        </span>
      </td>
      <td style={{ padding: "14px 20px", borderBottom: `1px solid ${CRIE.lineSoft}` }}>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success("Link copiado!"); }}>Link</Btn>
          <Btn variant="ghost" size="sm" onClick={() => onRevoke(invite.id)} style={{ color: CRIE.rose }}>Revogar</Btn>
        </div>
      </td>
    </tr>
  );
}

// ─── Team Page ───────────────────────────────────────────────────────────────

export function TeamPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: members = [], isLoading: loadingMembers } = useTeam();
  const { data: invites = [], isLoading: loadingInvites } = useInvites();
  const { data: workspaceMemberRows = [] } = useWorkspaceMembersForAgency();
  const removeMember = useRemoveMember();
  const revokeInvite = useRevokeInvite();

  const isLoading = loadingMembers || loadingInvites;

  return (
    <div style={{ background: CRIE.bg, fontFamily: "Inter, sans-serif", padding: 32 }}>
      <SectionHeader
        title="Equipe"
        action={<Btn variant="butter" onClick={() => setShowModal(true)}>+ Convidar membro</Btn>}
      />

      <PCard pad={0} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: CRIE.lineSoft }}>
              {["Membro", "Cargo", "Marcas", "Status", "Acoes"].map((col) => (
                <th key={col} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase", borderBottom: `1px solid ${CRIE.line}` }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: "48px 20px", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>Carregando equipe...</td></tr>
            ) : (
              <>
                {/* Active members */}
                {members.map((m) => (
                  <TeamRow key={m.id} member={m} workspaceMemberRows={workspaceMemberRows} onDelete={(id) => removeMember.mutate(id)} />
                ))}
                {/* Pending invites */}
                {invites.map((inv: any) => (
                  <InviteRow key={inv.id} invite={inv} onRevoke={(id) => revokeInvite.mutate(id)} />
                ))}
              </>
            )}
          </tbody>
        </table>

        {!isLoading && members.length === 0 && invites.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
            Nenhum membro encontrado. Convide sua equipe!
          </div>
        )}
      </PCard>

      {showModal && <InviteModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
