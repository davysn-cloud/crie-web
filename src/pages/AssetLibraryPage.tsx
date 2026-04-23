import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, SectionHeader, Btn, CrieBadge } from "@/components/crie";
import { NavIco } from "@/components/crie";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type AssetKind = "image" | "video" | "icon" | "illustration" | "mockup" | "logo";
type AssetSource = "upload" | "canva" | "unsplash" | "pexels";

interface AssetLibraryItem {
  id: string;
  workspace_id: string;
  storage_path: string;
  public_url: string | null;
  kind: AssetKind;
  tags: string[];
  dominant_color: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  source: AssetSource;
  created_by: string;
  archived: boolean;
  created_at: string;
  // name is derived from storage_path
  name?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const KIND_LABEL: Record<AssetKind, string> = {
  image: "Foto",
  video: "Vídeo",
  icon: "Ícone",
  illustration: "Ilustração",
  mockup: "Mockup",
  logo: "Logo",
};

const FILTER_TABS = ["Todos", "Foto", "Vídeo", "Ícone", "Logo"] as const;
const CONTENT_TABS = ["Meus arquivos", "Unsplash", "Pexels"] as const;

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getNameFromPath(path: string): string {
  return path.split("/").pop() ?? path;
}

function getThumbColor(item: AssetLibraryItem): string {
  if (item.dominant_color) return item.dominant_color;
  // Fallback palette by index of id char
  const COLORS = ["#E8DFD0", "#D0E8E0", "#E8E0D0", "#D0D8E8", "#E8D0D8", "#D8E8D0", "#E8E8D0", "#D0E8E8"];
  const idx = item.id.charCodeAt(0) % COLORS.length;
  return COLORS[idx]!;
}

// ─── Icon paths ───────────────────────────────────────────────────────────────
const ICO_SEARCH = "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z";
const ICO_GRID = "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z";
const ICO_LIST = "M4 6h16M4 10h16M4 14h16M4 18h16";
const ICO_UPLOAD = "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12";
const ICO_DOWNLOAD = "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4";
const ICO_EDIT = "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
const ICO_TRASH = "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const ICO_PLUS = "M12 4v16m8-8H4";

// ─── Grid card ────────────────────────────────────────────────────────────────
function GridCard({ asset }: { asset: AssetLibraryItem }) {
  const [hovered, setHovered] = useState(false);
  const thumbColor = getThumbColor(asset);
  const name = asset.name ?? getNameFromPath(asset.storage_path);
  const kindLabel = KIND_LABEL[asset.kind] ?? asset.kind;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: CRIE.card,
        border: `1px solid ${CRIE.line}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow .15s, transform .15s",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,.10)" : "0 1px 4px rgba(0,0,0,.04)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          height: 140,
          background: thumbColor,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {asset.public_url && asset.kind !== "video" ? (
          <img
            src={asset.public_url}
            alt={name}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(255,255,255,.35)",
              border: "1.5px solid rgba(255,255,255,.5)",
            }}
          />
        )}
        {/* Kind overlay badge */}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(0,0,0,.45)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 999,
            backdropFilter: "blur(4px)",
            zIndex: 1,
          }}
        >
          {kindLabel}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            fontWeight: 600,
            color: CRIE.ink,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <p style={{ margin: "2px 0 8px", fontSize: 11, color: CRIE.muted }}>{formatBytes(asset.bytes)}</p>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(asset.tags ?? []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 999,
                background: CRIE.lineSoft,
                color: CRIE.muted,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Upload dropzone card ─────────────────────────────────────────────────────
function UploadDropzoneCard({ onUpload }: { onUpload: (file: File) => void }) {
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Fazer upload de arquivo"
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      style={{
        height: "100%",
        minHeight: 200,
        border: `2px dashed ${hovering ? CRIE.butterDeep : CRIE.line}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        background: hovering ? CRIE.butterWash : "transparent",
        transition: "border-color .15s, background .15s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: CRIE.lineSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <NavIco d={ICO_PLUS} sz={20} color={CRIE.muted} />
      </div>
      <p style={{ margin: 0, fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>Fazer upload</p>
    </div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────
function ListRow({ asset, last, onArchive }: { asset: AssetLibraryItem; last: boolean; onArchive: (id: string) => void }) {
  const name = asset.name ?? getNameFromPath(asset.storage_path);
  const kindLabel = KIND_LABEL[asset.kind] ?? asset.kind;
  const thumbColor = getThumbColor(asset);

  return (
    <tr
      style={{
        borderBottom: last ? "none" : `1px solid ${CRIE.lineSoft}`,
      }}
    >
      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 500, color: CRIE.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: thumbColor,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {asset.public_url && asset.kind !== "video" && (
              <img
                src={asset.public_url}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
          {name}
        </div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12.5, color: CRIE.muted }}>
        <CrieBadge label={kindLabel} />
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12.5, color: CRIE.muted }}>{formatBytes(asset.bytes)}</td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(asset.tags ?? []).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 10,
                fontWeight: 500,
                padding: "2px 7px",
                borderRadius: 999,
                background: CRIE.lineSoft,
                color: CRIE.muted,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {asset.public_url && (
            <a
              href={asset.public_url}
              download={name}
              aria-label={`Baixar ${name}`}
              style={iconBtnStyle}
            >
              <NavIco d={ICO_DOWNLOAD} sz={14} color={CRIE.muted} />
            </a>
          )}
          <button
            aria-label={`Editar ${name}`}
            style={iconBtnStyle}
          >
            <NavIco d={ICO_EDIT} sz={14} color={CRIE.muted} />
          </button>
          <button
            aria-label={`Arquivar ${name}`}
            onClick={() => onArchive(asset.id)}
            style={{ ...iconBtnStyle }}
          >
            <NavIco d={ICO_TRASH} sz={14} color={CRIE.rose} />
          </button>
        </div>
      </td>
    </tr>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: `1px solid ${CRIE.line}`,
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        background: CRIE.card,
        border: `1px solid ${CRIE.line}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div style={{ height: 140, background: CRIE.lineSoft, animation: "pulse 1.5s infinite" }} />
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ height: 14, background: CRIE.lineSoft, borderRadius: 6, marginBottom: 6, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 11, background: CRIE.lineSoft, borderRadius: 6, width: "50%", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AssetLibraryPage() {
  const { currentWorkspaceId, user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("Meus arquivos");

  // ─── Fetch assets ───────────────────────────────────────────────────────────
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["asset-library", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("asset_library")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .eq("archived", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssetLibraryItem[];
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  // ─── Upload mutation ────────────────────────────────────────────────────────
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentWorkspaceId || !user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() ?? "bin";
      const path = `workspace-assets/${currentWorkspaceId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("asset-library")
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("asset-library")
        .getPublicUrl(path);

      const kind: AssetKind = file.type.startsWith("video/")
        ? "video"
        : file.type.includes("svg") || file.type.includes("icon")
        ? "icon"
        : "image";

      const { error: insertError } = await supabase.from("asset_library").insert({
        workspace_id: currentWorkspaceId,
        storage_path: path,
        public_url: publicUrl,
        kind,
        tags: [],
        bytes: file.size,
        source: "upload",
        archived: false,
        created_by: user.id,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Asset enviado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["asset-library", currentWorkspaceId] });
    },
    onError: (err) => {
      toast.error(`Erro no upload: ${err instanceof Error ? err.message : "Erro"}`);
    },
  });

  // ─── Archive mutation ───────────────────────────────────────────────────────
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("asset_library")
        .update({ archived: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Asset arquivado");
      queryClient.invalidateQueries({ queryKey: ["asset-library", currentWorkspaceId] });
    },
    onError: () => toast.error("Erro ao arquivar"),
  });

  // ─── Client-side filter ─────────────────────────────────────────────────────
  const KIND_FILTER_MAP: Record<string, AssetKind | null> = {
    Todos: null,
    Foto: "image",
    Vídeo: "video",
    Ícone: "icon",
    Logo: "logo",
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const kindKey = KIND_FILTER_MAP[kindFilter] ?? null;
    return assets.filter((a) => {
      const name = a.name ?? getNameFromPath(a.storage_path);
      const matchesKind = kindKey === null || a.kind === kindKey;
      const matchesSearch =
        q === "" ||
        name.toLowerCase().includes(q) ||
        (a.tags ?? []).some((t) => t.toLowerCase().includes(q));
      return matchesKind && matchesSearch;
    });
  }, [search, kindFilter, assets]);

  function handleHeaderUpload() {
    fileInputRef.current?.click();
  }

  function handleHeaderFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  }

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Hidden file input for header button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={handleHeaderFileChange}
      />

      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <NavIco d={ICO_SEARCH} sz={15} color={CRIE.muted} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar assets..."
            aria-label="Buscar assets"
            style={{
              width: "100%",
              paddingLeft: 36,
              paddingRight: 14,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: 999,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.card,
              fontSize: 13,
              color: CRIE.ink,
              outline: "none",
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Kind filters */}
        <div style={{ display: "flex", gap: 6 }}>
          {FILTER_TABS.map((f) => (
            <button
              key={f}
              onClick={() => setKindFilter(f)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${kindFilter === f ? CRIE.ink : CRIE.line}`,
                background: kindFilter === f ? CRIE.ink : CRIE.card,
                color: kindFilter === f ? "#fff" : CRIE.inkSoft,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .12s",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div
          style={{
            display: "flex",
            border: `1px solid ${CRIE.line}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
          role="group"
          aria-label="Alternar visualização"
        >
          {(["grid", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-label={mode === "grid" ? "Visão grade" : "Visão lista"}
              style={{
                width: 34,
                height: 34,
                border: "none",
                background: viewMode === mode ? CRIE.ink : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background .12s",
              }}
            >
              <NavIco
                d={mode === "grid" ? ICO_GRID : ICO_LIST}
                sz={16}
                color={viewMode === mode ? "#fff" : CRIE.muted}
              />
            </button>
          ))}
        </div>

        {/* Upload button */}
        <Btn
          variant="primary"
          onClick={handleHeaderUpload}
          disabled={uploadMutation.isPending}
        >
          <NavIco d={ICO_UPLOAD} sz={14} color="#fff" />
          {uploadMutation.isPending ? "Enviando..." : "Upload"}
        </Btn>
      </div>

      {/* Content tabs */}
      <div
        style={{
          display: "flex",
          gap: 0,
          borderBottom: `1px solid ${CRIE.line}`,
          marginBottom: 24,
        }}
        role="tablist"
      >
        {CONTENT_TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 18px",
              border: "none",
              background: "transparent",
              fontSize: 13.5,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? CRIE.ink : CRIE.muted,
              cursor: "pointer",
              borderBottom: activeTab === tab ? `2px solid ${CRIE.ink}` : "2px solid transparent",
              marginBottom: -1,
              transition: "color .12s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && activeTab === "Meus arquivos" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Grid view */}
      {!isLoading && viewMode === "grid" && activeTab === "Meus arquivos" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {filtered.map((asset) => (
            <GridCard key={asset.id} asset={asset} />
          ))}
          <UploadDropzoneCard onUpload={(file) => uploadMutation.mutate(file)} />
        </div>
      )}

      {/* List view */}
      {!isLoading && viewMode === "list" && activeTab === "Meus arquivos" && (
        <PCard pad={0} style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${CRIE.line}` }}>
                {["Nome", "Tipo", "Tamanho", "Tags", "Ações"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: CRIE.muted,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset, i) => (
                <ListRow
                  key={asset.id}
                  asset={asset}
                  last={i === filtered.length - 1}
                  onArchive={(id) => archiveMutation.mutate(id)}
                />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p style={{ textAlign: "center", padding: 32, color: CRIE.muted, fontSize: 13 }}>
              Nenhum asset encontrado.
            </p>
          )}
        </PCard>
      )}

      {/* External tabs placeholder */}
      {activeTab !== "Meus arquivos" && (
        <div style={{ textAlign: "center", padding: 64, color: CRIE.muted, fontSize: 13 }}>
          Integração com {activeTab} em breve.
        </div>
      )}
    </div>
  );
}
