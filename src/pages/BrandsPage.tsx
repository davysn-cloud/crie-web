import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader } from "@/components/crie";
import { useBrands, useCreateBrand, useArchiveBrand } from "@/features/admin/hooks/useBrands";
import { supabase } from "@/lib/supabase";
import type { Workspace, BrandProfile } from "@/types";

// ─── Brand profile query ───────────────────────────────────────────────────────

function useBrandProfile(workspaceId: string) {
  return useQuery({
    queryKey: ["brand-profile", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("logo_url, instagram_handle, colors")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) throw error;
      return data as Pick<BrandProfile, "logo_url" | "instagram_handle" | "colors"> | null;
    },
    enabled: !!workspaceId,
  });
}

function usePostCountThisMonth(workspaceId: string) {
  return useQuery({
    queryKey: ["post-count-month", workspaceId],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count, error } = await supabase
        .from("post_cards")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gte("created_at", startOfMonth);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!workspaceId,
  });
}

// ─── New Brand Modal ──────────────────────────────────────────────────────────

function NewBrandModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const createBrand = useCreateBrand();

  function buildSlug(n: string) {
    return n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    const slug = buildSlug(name) || `brand-${Date.now()}`;
    await createBrand.mutateAsync({ name: name.trim(), slug });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-brand-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(14,14,12,0.55)",
          backdropFilter: "blur(4px)",
        }}
        aria-hidden="true"
      />
      <div
        style={{
          position: "relative",
          width: 400,
          background: CRIE.card,
          borderRadius: 24,
          padding: 32,
          border: `1px solid ${CRIE.line}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <h2
          id="new-brand-modal-title"
          style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 700, color: CRIE.ink }}
        >
          Nova marca
        </h2>

        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="brand-name"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6 }}
          >
            Nome da marca
          </label>
          <input
            id="brand-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Café Bonito"
            style={{
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
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn variant="secondary" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="butter"
            onClick={handleSubmit}
            disabled={!name.trim() || createBrand.isPending}
          >
            {createBrand.isPending ? "Criando…" : "Criar marca"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Brand Card ───────────────────────────────────────────────────────────────

function BrandCard({ workspace }: { workspace: Workspace }) {
  const { data: profile } = useBrandProfile(workspace.id);
  const { data: postCount = 0 } = usePostCountThisMonth(workspace.id);
  const archiveBrand = useArchiveBrand();

  const logoUrl = profile?.logo_url ?? null;
  const igHandle = profile?.instagram_handle ?? null;
  const primaryColor =
    (profile?.colors && profile.colors.length > 0 ? profile.colors[0]?.hex : null) ?? CRIE.butter;

  const initials = workspace.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <PCard pad={20}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={workspace.name}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              objectFit: "cover",
              border: `1px solid ${CRIE.line}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: primaryColor,
              border: `1px solid ${CRIE.line}`,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: CRIE.butterInk,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: CRIE.ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {workspace.name}
          </div>
          <div style={{ fontSize: 12.5, color: CRIE.muted, fontWeight: 500 }}>
            {igHandle ? `@${igHandle}` : `@${workspace.slug}`}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "12px 14px",
            background: CRIE.lineSoft,
            borderRadius: 12,
            border: `1px solid ${CRIE.line}`,
          }}
        >
          <div style={{ fontSize: 11, color: CRIE.muted, fontWeight: 600, marginBottom: 4 }}>
            Posts/mês
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: CRIE.ink, lineHeight: 1 }}>
            {postCount}
          </div>
        </div>
        <div
          style={{
            padding: "12px 14px",
            background: CRIE.lineSoft,
            borderRadius: 12,
            border: `1px solid ${CRIE.line}`,
          }}
        >
          <div style={{ fontSize: 11, color: CRIE.muted, fontWeight: 600, marginBottom: 4 }}>
            Aprovação 1ª
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: CRIE.emerald, lineHeight: 1 }}>
            —
          </div>
        </div>
      </div>

      {/* Instagram connection status */}
      <div
        style={{
          fontSize: 12.5,
          color: igHandle ? CRIE.emerald : CRIE.amber,
          fontWeight: 600,
          marginBottom: 16,
        }}
      >
        {igHandle ? "Instagram conectado" : "Conectar Instagram"}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn variant="secondary" size="sm" aria-label={`Editar ${workspace.name}`}>
          Editar
        </Btn>
        <Btn
          variant="ghost"
          size="sm"
          style={{ color: CRIE.muted }}
          aria-label={`Arquivar ${workspace.name}`}
          onClick={() => archiveBrand.mutate(workspace.id)}
          disabled={archiveBrand.isPending}
        >
          Arquivar
        </Btn>
      </div>
    </PCard>
  );
}

// ─── New Brand Card ───────────────────────────────────────────────────────────

function NewBrandCard({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Nova marca"
      style={{
        minHeight: 200,
        background: hovered ? CRIE.butterWash : "transparent",
        border: `2px dashed ${hovered ? CRIE.butterDeep : CRIE.line}`,
        borderRadius: 22,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: "pointer",
        transition: "all .15s",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <span
        style={{
          fontSize: 32,
          color: hovered ? CRIE.butterInk : CRIE.mutedSoft,
          fontWeight: 300,
          lineHeight: 1,
          transition: "color .15s",
        }}
      >
        +
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: hovered ? CRIE.butterInk : CRIE.muted,
          transition: "color .15s",
        }}
      >
        Nova marca
      </span>
    </button>
  );
}

// ─── Brands Page ──────────────────────────────────────────────────────────────

export function BrandsPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: workspaces = [], isLoading } = useBrands();

  // useBrands fetches all (including archived), filter to active only
  const activeBrands = workspaces.filter((ws) => !ws.archived);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        padding: "32px",
      }}
    >
      <SectionHeader
        title="Marcas"
        action={
          <Btn variant="butter" onClick={() => setShowModal(true)}>
            + Nova marca
          </Btn>
        }
      />

      {isLoading ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            color: CRIE.muted,
            fontSize: 14,
          }}
        >
          Carregando marcas…
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
        >
          {activeBrands.map((ws) => (
            <BrandCard key={ws.id} workspace={ws} />
          ))}
          <NewBrandCard onClick={() => setShowModal(true)} />
        </div>
      )}

      {showModal && <NewBrandModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
