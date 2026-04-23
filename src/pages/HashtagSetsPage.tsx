import { useState, useRef, KeyboardEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE, PILLAR_COLORS } from "@/lib/crie-tokens";
import { SectionHeader, EmptyState, PCard, Btn } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HashtagSet {
  id: string;
  workspace_id: string;
  name: string;
  pillar_id: string | null;
  description: string | null;
  archived: boolean;
  created_at: string;
  // joined
  tag_count?: number;
  items?: HashtagSetItem[];
}

interface HashtagSetItem {
  id: string;
  hashtag_set_id: string;
  tag: string;
  sort_order: number;
  avg_reach: number | null;
}

interface Pillar {
  id: string;
  name: string;
  color: string | null;
}

// ─── Tag pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag, reach, onRemove }: { tag: string; reach?: number | null; onRemove?: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: CRIE.lineSoft,
        color: CRIE.inkSoft,
        border: `1px solid ${CRIE.line}`,
        whiteSpace: "nowrap",
      }}
    >
      #{tag}
      {reach != null && (
        <span style={{ fontSize: 10, color: CRIE.muted, marginLeft: 2 }}>
          ~{reach >= 1000 ? `${(reach / 1000).toFixed(0)}k` : reach}
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Remover #${tag}`}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            marginLeft: 2,
            fontSize: 12,
            color: CRIE.muted,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}

// ─── Hashtag set card ─────────────────────────────────────────────────────────

function HashtagSetCard({
  set,
  pillars,
  onAddTag,
  onRemoveTag,
}: {
  set: HashtagSet;
  pillars: Pillar[];
  onAddTag: (setId: string, tag: string) => void;
  onRemoveTag: (setId: string, itemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pillar = pillars.find((p) => p.id === set.pillar_id);
  const pillarColor = pillar ? (pillar.color ?? PILLAR_COLORS[pillar.name] ?? CRIE.muted) : null;
  const items = set.items ?? [];
  const previewTags = items.slice(0, 5);
  const extraCount = Math.max(0, items.length - 5);

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = newTag.replace(/^#/, "").trim();
      if (tag) {
        onAddTag(set.id, tag);
        setNewTag("");
      }
    }
  }

  return (
    <PCard pad={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 15,
              fontWeight: 700,
              color: CRIE.ink,
              lineHeight: 1.3,
            }}
          >
            {set.name}
          </p>
          {set.description && (
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: CRIE.muted,
                lineHeight: 1.4,
              }}
            >
              {set.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {pillar && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: pillarColor ?? CRIE.muted,
                background: (pillarColor ?? CRIE.muted) + "22",
                padding: "2px 8px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {pillar.name}
            </span>
          )}
        </div>
      </div>

      {/* Tag count + preview */}
      <div>
        <p style={{ margin: "0 0 6px", fontSize: 11, color: CRIE.muted, fontWeight: 500 }}>
          {items.length} {items.length === 1 ? "hashtag" : "hashtags"}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {previewTags.map((item) => (
            <TagPill key={item.id} tag={item.tag} />
          ))}
          {extraCount > 0 && !expanded && (
            <span style={{ fontSize: 12, color: CRIE.muted, fontWeight: 500 }}>
              +{extraCount} mais
            </span>
          )}
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          background: "none",
          border: `1px solid ${CRIE.line}`,
          cursor: "pointer",
          fontSize: 12,
          color: CRIE.muted,
          fontWeight: 500,
          padding: "6px 12px",
          borderRadius: 8,
          fontFamily: "Inter, sans-serif",
          textAlign: "left",
          alignSelf: "flex-start",
        }}
      >
        {expanded ? "Recolher" : "Ver todas"}
      </button>

      {/* Expanded view */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${CRIE.lineSoft}`,
            paddingTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* All tags with avg_reach and remove */}
          {items.length > 0 ? (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {items.map((item) => (
                <TagPill
                  key={item.id}
                  tag={item.tag}
                  reach={item.avg_reach}
                  onRemove={() => onRemoveTag(set.id, item.id)}
                />
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: CRIE.muted, fontStyle: "italic" }}>
              Nenhuma hashtag ainda.
            </p>
          )}

          {/* Add tag input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="#novahashtag (Enter para adicionar)"
              aria-label="Nova hashtag"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: `1.5px solid ${CRIE.line}`,
                fontSize: 13,
                color: CRIE.ink,
                background: CRIE.paper,
                outline: "none",
                fontFamily: "Inter, sans-serif",
              }}
            />
            <Btn
              variant="secondary"
              size="sm"
              onClick={() => {
                const tag = newTag.replace(/^#/, "").trim();
                if (tag) {
                  onAddTag(set.id, tag);
                  setNewTag("");
                }
              }}
              disabled={!newTag.trim()}
            >
              Adicionar
            </Btn>
          </div>
        </div>
      )}
    </PCard>
  );
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateSetModal({
  open,
  onClose,
  workspaceId,
  pillars,
}: {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  pillars: Pillar[];
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pillarId, setPillarId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { data: setData, error: setError } = await supabase
        .from("hashtag_sets")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          description: description.trim() || null,
          pillar_id: pillarId || null,
          archived: false,
        })
        .select("id")
        .single();

      if (setError) throw setError;

      if (tags.length > 0) {
        const { error: itemsError } = await supabase.from("hashtag_set_items").insert(
          tags.map((tag, i) => ({
            hashtag_set_id: setData.id,
            tag,
            sort_order: i,
            avg_reach: null,
          }))
        );
        if (itemsError) throw itemsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hashtag-sets", workspaceId] });
      toast.success("Conjunto criado!");
      setName("");
      setDescription("");
      setPillarId("");
      setTags([]);
      setTagInput("");
      onClose();
    },
    onError: () => {
      toast.error("Erro ao criar conjunto.");
    },
  });

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.replace(/^#/, "").trim();
      if (tag && !tags.includes(tag)) {
        setTags((prev) => [...prev, tag]);
        setTagInput("");
      }
    }
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(14,14,12,0.5)" }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Novo conjunto de hashtags"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 540,
          background: CRIE.card,
          borderRadius: 20,
          padding: "24px",
          boxShadow: "0 20px 60px rgba(0,0,0,.15)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: CRIE.ink }}>
            Novo conjunto de hashtags
          </h3>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: `1px solid ${CRIE.line}`,
              background: CRIE.paper,
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: CRIE.muted,
            }}
          >
            ×
          </button>
        </div>

        {/* Name */}
        <div>
          <label
            htmlFor="set-name"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Nome *
          </label>
          <input
            id="set-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Cafe - Educativo"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: `1.5px solid ${CRIE.line}`,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              outline: "none",
              color: CRIE.ink,
              background: CRIE.paper,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="set-description"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Descricao <span style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span>
          </label>
          <input
            id="set-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quando usar este conjunto..."
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: `1.5px solid ${CRIE.line}`,
              fontSize: 14,
              fontFamily: "Inter, sans-serif",
              outline: "none",
              color: CRIE.ink,
              background: CRIE.paper,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Pillar */}
        {pillars.length > 0 && (
          <div>
            <label
              htmlFor="set-pillar"
              style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
            >
              Pilar (opcional)
            </label>
            <select
              id="set-pillar"
              value={pillarId}
              onChange={(e) => setPillarId(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 10,
                border: `1.5px solid ${CRIE.line}`,
                fontSize: 13,
                color: CRIE.ink,
                background: CRIE.paper,
                outline: "none",
                fontFamily: "Inter, sans-serif",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Sem pilar</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tags */}
        <div>
          <label
            htmlFor="set-tags"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}
          >
            Hashtags
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1.5px solid ${CRIE.line}`,
              background: CRIE.paper,
              minHeight: 44,
              alignItems: "center",
              cursor: "text",
            }}
            onClick={() => document.getElementById("set-tags")?.focus()}
          >
            {tags.map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
              />
            ))}
            <input
              id="set-tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? "#hashtag (Enter para adicionar)" : ""}
              style={{
                border: "none",
                outline: "none",
                fontSize: 13,
                fontFamily: "Inter, sans-serif",
                color: CRIE.ink,
                background: "transparent",
                minWidth: 120,
                flex: 1,
              }}
            />
          </div>
          {tags.length > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: CRIE.muted }}>
              {tags.length} {tags.length === 1 ? "hashtag" : "hashtags"} adicionada{tags.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <Btn
          variant="primary"
          onClick={() => create.mutate()}
          disabled={!name.trim() || create.isPending}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {create.isPending ? "Criando..." : "Criar conjunto"}
        </Btn>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function HashtagSetsPage() {
  const { currentWorkspaceId } = useAuthStore();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: pillars = [] } = useQuery<Pillar[]>({
    queryKey: ["pillars-list", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("pillars")
        .select("id, name, color")
        .eq("workspace_id", currentWorkspaceId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Pillar[];
    },
    enabled: !!currentWorkspaceId,
  });

  // Fetch sets + items in one query
  const { data: sets = [], isLoading } = useQuery<HashtagSet[]>({
    queryKey: ["hashtag-sets", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];

      const { data: setsData, error: setsError } = await supabase
        .from("hashtag_sets")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .eq("archived", false)
        .order("created_at", { ascending: false });

      if (setsError) throw setsError;

      if (!setsData || setsData.length === 0) return [];

      const setIds = setsData.map((s: HashtagSet) => s.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("hashtag_set_items")
        .select("*")
        .in("hashtag_set_id", setIds)
        .order("sort_order");

      if (itemsError) throw itemsError;

      const itemsBySet = ((itemsData ?? []) as HashtagSetItem[]).reduce<Record<string, HashtagSetItem[]>>(
        (acc, item) => {
          if (!acc[item.hashtag_set_id]) acc[item.hashtag_set_id] = [];
          acc[item.hashtag_set_id]!.push(item);
          return acc;
        },
        {}
      );

      return setsData.map((s: HashtagSet) => ({
        ...s,
        items: itemsBySet[s.id] ?? [],
        tag_count: (itemsBySet[s.id] ?? []).length,
      }));
    },
    enabled: !!currentWorkspaceId,
  });

  const addTag = useMutation({
    mutationFn: async ({ setId, tag }: { setId: string; tag: string }) => {
      const maxOrder = sets
        .find((s) => s.id === setId)
        ?.items?.reduce((m, i) => Math.max(m, i.sort_order), -1) ?? -1;

      const { error } = await supabase.from("hashtag_set_items").insert({
        hashtag_set_id: setId,
        tag,
        sort_order: maxOrder + 1,
        avg_reach: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hashtag-sets", currentWorkspaceId] });
    },
    onError: () => {
      toast.error("Erro ao adicionar hashtag.");
    },
  });

  const removeTag = useMutation({
    mutationFn: async ({ itemId }: { setId: string; itemId: string }) => {
      const { error } = await supabase
        .from("hashtag_set_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hashtag-sets", currentWorkspaceId] });
    },
    onError: () => {
      toast.error("Erro ao remover hashtag.");
    },
  });

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <SectionHeader
        title="Conjuntos de Hashtags"
        action={
          <Btn onClick={() => setModalOpen(true)}>
            + Novo conjunto
          </Btn>
        }
      />

      {isLoading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
          Carregando conjuntos...
        </div>
      ) : sets.length === 0 ? (
        <EmptyState
          icon="#"
          title="Nenhum conjunto ainda"
          body="Crie conjuntos de hashtags reutilizaveis para acelerar a publicacao."
          cta="+ Novo conjunto"
          onCta={() => setModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 16,
          }}
        >
          {sets.map((set) => (
            <HashtagSetCard
              key={set.id}
              set={set}
              pillars={pillars}
              onAddTag={(setId, tag) => addTag.mutate({ setId, tag })}
              onRemoveTag={(setId, itemId) => removeTag.mutate({ setId, itemId })}
            />
          ))}
        </div>
      )}

      <CreateSetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        workspaceId={currentWorkspaceId ?? ""}
        pillars={pillars}
      />
    </div>
  );
}
