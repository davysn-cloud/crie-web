import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { NavIco } from "@/components/crie/NavIco";
import { Btn } from "@/components/crie/Btn";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pillar {
  id: string;
  name: string;
  color: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface Member {
  id: string;
  user_id: string;
  display_name: string;
}

interface HashtagSet {
  id: string;
  name: string;
}

type Objective = "awareness" | "consideration" | "conversion" | "retention";
type IGFormat = "feed_1_1" | "feed_4_5" | "story" | "reel" | "carousel";

interface BriefForm {
  title: string;
  pillar_id: string;
  campaign_id: string;
  objective: Objective | "";
  ig_format: IGFormat | "";
  target_audience: string;
  key_message: string;
  cta: string;
  references: string[];
  assignee_copy: string;
  assignee_design: string;
  due_at: string;
  hashtag_set_id: string;
}

const EMPTY_FORM: BriefForm = {
  title: "",
  pillar_id: "",
  campaign_id: "",
  objective: "",
  ig_format: "",
  target_audience: "",
  key_message: "",
  cta: "",
  references: [""],
  assignee_copy: "",
  assignee_design: "",
  due_at: "",
  hashtag_set_id: "",
};

const OBJECTIVES: { value: Objective; label: string }[] = [
  { value: "awareness", label: "Awareness" },
  { value: "consideration", label: "Consideracao" },
  { value: "conversion", label: "Conversao" },
  { value: "retention", label: "Retencao" },
];

const IG_FORMATS: { value: IGFormat; label: string }[] = [
  { value: "feed_1_1", label: "Feed 1:1" },
  { value: "feed_4_5", label: "Feed 4:5" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel" },
  { value: "carousel", label: "Carrossel" },
];

// ─── Small UI primitives ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        color: CRIE.muted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: CRIE.ink,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 14,
        paddingBottom: 8,
        borderBottom: `1px solid ${CRIE.line}`,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: `1px solid ${CRIE.line}`,
  background: CRIE.bg,
  fontSize: 13,
  color: CRIE.ink,
  fontFamily: "Inter, sans-serif",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .12s",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 72,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  cursor: "pointer",
};

// ─── Drawer component ─────────────────────────────────────────────────────────

interface BriefBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BriefBuilderDrawer({ isOpen, onClose }: BriefBuilderDrawerProps) {
  const { currentWorkspaceId, currentAgencyId } = useAuthStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<BriefForm>(EMPTY_FORM);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
    }
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Data queries ──────────────────────────────────────────────────────────

  const { data: pillars = [] } = useQuery<Pillar[]>({
    queryKey: ["pillars", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("pillars")
        .select("id, name, color")
        .eq("workspace_id", currentWorkspaceId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentWorkspaceId && isOpen,
    staleTime: 120_000,
  });

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["campaigns", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("workspace_id", currentWorkspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentWorkspaceId && isOpen,
    staleTime: 60_000,
  });

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["agency-members", currentAgencyId],
    queryFn: async () => {
      if (!currentAgencyId) return [];
      const { data, error } = await supabase
        .from("agency_members")
        .select("id, user_id, display_name")
        .eq("agency_id", currentAgencyId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentAgencyId && isOpen,
    staleTime: 300_000,
  });

  const { data: hashtagSets = [] } = useQuery<HashtagSet[]>({
    queryKey: ["hashtag-sets", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return [];
      const { data, error } = await supabase
        .from("hashtag_sets")
        .select("id, name")
        .eq("workspace_id", currentWorkspaceId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentWorkspaceId && isOpen,
    staleTime: 120_000,
  });

  // ── Mutation: create brief ────────────────────────────────────────────────

  const createBriefMutation = useMutation({
    mutationFn: async ({ asDraft }: { asDraft: boolean }) => {
      if (!currentWorkspaceId) throw new Error("Workspace nao selecionado");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nao autenticado");

      // 1. Insert post_card
      const { data: postCard, error: pcError } = await supabase
        .from("post_cards")
        .insert({
          workspace_id: currentWorkspaceId,
          title: form.title,
          stage: "ideia",
          created_by: user.id,
          sort_order: 0,
          archived: false,
        })
        .select("id")
        .single();
      if (pcError) throw pcError;

      // 2. Insert brief
      const refsFiltered = form.references.filter((r) => r.trim() !== "");
      const { error: briefError } = await supabase
        .from("briefs")
        .insert({
          workspace_id: currentWorkspaceId,
          post_card_id: postCard.id,
          pillar_id: form.pillar_id || null,
          campaign_id: form.campaign_id || null,
          objective: form.objective || null,
          ig_format: form.ig_format || null,
          target_audience: form.target_audience || null,
          key_message: form.key_message || null,
          cta: form.cta || null,
          references_json: refsFiltered.length > 0 ? refsFiltered : null,
          due_at: form.due_at || null,
          assignee_copy: form.assignee_copy || null,
          assignee_design: form.assignee_design || null,
          hashtag_set_id: form.hashtag_set_id || null,
          status: asDraft ? "draft" : "active",
          created_by: user.id,
        });
      if (briefError) throw briefError;

      return { asDraft };
    },
    onSuccess: ({ asDraft }) => {
      toast.success(asDraft ? "Rascunho salvo!" : "Brief criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["briefs"] });
      queryClient.invalidateQueries({ queryKey: ["post_cards"] });
      onClose();
    },
    onError: (err: Error) => {
      toast.error(`Erro ao criar brief: ${err.message}`);
    },
  });

  // ── Form helpers ──────────────────────────────────────────────────────────

  function set<K extends keyof BriefForm>(key: K, value: BriefForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setRef(index: number, value: string) {
    setForm((prev) => {
      const refs = [...prev.references];
      refs[index] = value;
      return { ...prev, references: refs };
    });
  }

  function addRef() {
    setForm((prev) => ({ ...prev, references: [...prev.references, ""] }));
  }

  function removeRef(index: number) {
    setForm((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  }

  // ── AI suggestions ────────────────────────────────────────────────────────

  const [isSuggesting, setIsSuggesting] = useState(false);

  async function handleAiSuggest() {
    if (form.title.trim().length < 5) return;
    setIsSuggesting(true);
    try {
      const pillarName = pillars.find((p) => p.id === form.pillar_id)?.name;
      const { data, error } = await supabase.functions.invoke("ai-brief-suggest", {
        body: {
          title: form.title.trim(),
          ...(pillarName ? { pillar: pillarName } : {}),
        },
      });
      if (error) throw error;
      if (data?.target_audience) set("target_audience", data.target_audience);
      if (data?.key_message) set("key_message", data.key_message);
      if (data?.cta) set("cta", data.cta);
      toast.success("Sugestoes preenchidas pela IA!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Erro ao gerar sugestoes: ${msg}`);
    } finally {
      setIsSuggesting(false);
    }
  }

  const isBusy = createBriefMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(14,14,12,0.38)",
          zIndex: 1000,
          backdropFilter: "blur(2px)",
          animation: "fadeIn .15s ease",
        }}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Criar Brief"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 640,
          maxWidth: "100vw",
          background: CRIE.paper,
          borderLeft: `1px solid ${CRIE.line}`,
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, sans-serif",
          animation: "slideInRight .2s cubic-bezier(.22,.61,.36,1)",
          boxShadow: "-8px 0 32px rgba(0,0,0,.12)",
        }}
      >
        {/* Animation keyframes */}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .brief-input:focus { border-color: ${CRIE.butterDeep} !important; }
        `}</style>

        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: `1px solid ${CRIE.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: CRIE.ink }}>Novo Brief</div>
            <div style={{ fontSize: 12.5, color: CRIE.muted, marginTop: 2 }}>
              Defina o briefing para a equipe de criacao
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.bg,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <NavIco d="M6 18L18 6M6 6l12 12" sz={16} color={CRIE.inkSoft} />
          </button>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            scrollbarWidth: "thin",
          }}
        >
          {/* Section 1 — Basico */}
          <section>
            <SectionTitle>Basico</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Label>Titulo do post *</Label>
                <input
                  className="brief-input"
                  style={inputStyle}
                  placeholder="Ex: Post lancamento produto X"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>

              {form.title.trim().length >= 5 && (
                <div>
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isSuggesting || isBusy}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "9px 16px",
                      borderRadius: 10,
                      border: `1.5px solid ${CRIE.butterDeep}`,
                      background: isSuggesting ? CRIE.butterWash : CRIE.butter,
                      color: CRIE.butterInk,
                      fontWeight: 700,
                      fontSize: 13,
                      fontFamily: "Inter, sans-serif",
                      cursor: isSuggesting || isBusy ? "not-allowed" : "pointer",
                      opacity: isSuggesting || isBusy ? 0.7 : 1,
                      transition: "all .12s",
                      width: "100%",
                      justifyContent: "center",
                    }}
                    aria-label="Sugerir campos com IA"
                  >
                    <span style={{ fontSize: 15, lineHeight: 1 }}>✨</span>
                    {isSuggesting ? "Gerando sugestoes..." : "Sugerir com IA"}
                  </button>
                  <div
                    style={{
                      fontSize: 11,
                      color: CRIE.muted,
                      marginTop: 5,
                      textAlign: "center",
                    }}
                  >
                    Preenche automaticamente: publico-alvo, mensagem-chave e CTA
                  </div>
                </div>
              )}

              <div>
                <Label>Pilar</Label>
                <div style={{ position: "relative" }}>
                  <select
                    className="brief-input"
                    style={selectStyle}
                    value={form.pillar_id}
                    onChange={(e) => set("pillar_id", e.target.value)}
                  >
                    <option value="">Selecionar pilar...</option>
                    {pillars.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <NavIco d="M19 9l-7 7-7-7" sz={14} color={CRIE.muted} />
                  </span>
                </div>
              </div>

              <div>
                <Label>Campanha (opcional)</Label>
                <div style={{ position: "relative" }}>
                  <select
                    className="brief-input"
                    style={selectStyle}
                    value={form.campaign_id}
                    onChange={(e) => set("campaign_id", e.target.value)}
                  >
                    <option value="">Sem campanha</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <NavIco d="M19 9l-7 7-7-7" sz={14} color={CRIE.muted} />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 — Objetivo & Formato */}
          <section>
            <SectionTitle>Objetivo & Formato</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Label>Objetivo</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {OBJECTIVES.map((obj) => {
                    const active = form.objective === obj.value;
                    return (
                      <button
                        key={obj.value}
                        onClick={() => set("objective", active ? "" : obj.value)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1.5px solid ${active ? CRIE.butterDeep : CRIE.line}`,
                          background: active ? CRIE.butterWash : CRIE.bg,
                          color: active ? CRIE.butterInk : CRIE.inkSoft,
                          fontWeight: active ? 700 : 500,
                          fontSize: 13,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "Inter, sans-serif",
                          transition: "all .12s",
                        }}
                        aria-pressed={active}
                      >
                        {obj.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Formato IG</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {IG_FORMATS.map((fmt) => {
                    const active = form.ig_format === fmt.value;
                    return (
                      <button
                        key={fmt.value}
                        onClick={() => set("ig_format", active ? "" : fmt.value)}
                        style={{
                          padding: "7px 14px",
                          borderRadius: 999,
                          border: `1.5px solid ${active ? CRIE.ink : CRIE.line}`,
                          background: active ? CRIE.ink : CRIE.bg,
                          color: active ? "#fff" : CRIE.inkSoft,
                          fontWeight: active ? 600 : 400,
                          fontSize: 12.5,
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                          transition: "all .12s",
                        }}
                        aria-pressed={active}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 — Conteudo */}
          <section>
            <SectionTitle>Conteudo</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <Label>Publico-alvo</Label>
                <textarea
                  className="brief-input"
                  style={textareaStyle}
                  placeholder="Descreva o publico que este post deve atingir..."
                  value={form.target_audience}
                  onChange={(e) => set("target_audience", e.target.value)}
                />
              </div>

              <div>
                <Label>Mensagem-chave</Label>
                <textarea
                  className="brief-input"
                  style={textareaStyle}
                  placeholder="O que o publico deve sentir ou entender apos ver este post?"
                  value={form.key_message}
                  onChange={(e) => set("key_message", e.target.value)}
                />
              </div>

              <div>
                <Label>CTA</Label>
                <input
                  className="brief-input"
                  style={inputStyle}
                  placeholder='Ex: "Compre agora" / "Saiba mais no link"'
                  value={form.cta}
                  onChange={(e) => set("cta", e.target.value)}
                />
              </div>

              <div>
                <Label>Referencias (URLs)</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {form.references.map((ref, i) => (
                    <div key={i} style={{ display: "flex", gap: 8 }}>
                      <input
                        className="brief-input"
                        style={{ ...inputStyle, flex: 1 }}
                        type="url"
                        placeholder="https://..."
                        value={ref}
                        onChange={(e) => setRef(i, e.target.value)}
                      />
                      {form.references.length > 1 && (
                        <button
                          onClick={() => removeRef(i)}
                          aria-label="Remover referencia"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: `1px solid ${CRIE.line}`,
                            background: CRIE.bg,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <NavIco d="M6 18L18 6M6 6l12 12" sz={14} color={CRIE.muted} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addRef}
                    style={{
                      alignSelf: "flex-start",
                      background: "none",
                      border: "none",
                      color: CRIE.butterInk,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "2px 0",
                      fontFamily: "Inter, sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <NavIco d="M12 4v16m-8-8h16" sz={13} color={CRIE.butterInk} />
                    Adicionar referencia
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 — Atribuicao */}
          <section>
            <SectionTitle>Atribuicao</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <Label>Copywriter</Label>
                <div style={{ position: "relative" }}>
                  <select
                    className="brief-input"
                    style={selectStyle}
                    value={form.assignee_copy}
                    onChange={(e) => set("assignee_copy", e.target.value)}
                  >
                    <option value="">Nao atribuido</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.display_name}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <NavIco d="M19 9l-7 7-7-7" sz={14} color={CRIE.muted} />
                  </span>
                </div>
              </div>

              <div>
                <Label>Designer</Label>
                <div style={{ position: "relative" }}>
                  <select
                    className="brief-input"
                    style={selectStyle}
                    value={form.assignee_design}
                    onChange={(e) => set("assignee_design", e.target.value)}
                  >
                    <option value="">Nao atribuido</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.display_name}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <NavIco d="M19 9l-7 7-7-7" sz={14} color={CRIE.muted} />
                  </span>
                </div>
              </div>

              <div>
                <Label>Prazo</Label>
                <input
                  className="brief-input"
                  style={inputStyle}
                  type="date"
                  value={form.due_at}
                  onChange={(e) => set("due_at", e.target.value)}
                />
              </div>

              <div>
                <Label>Set de Hashtags</Label>
                <div style={{ position: "relative" }}>
                  <select
                    className="brief-input"
                    style={selectStyle}
                    value={form.hashtag_set_id}
                    onChange={(e) => set("hashtag_set_id", e.target.value)}
                  >
                    <option value="">Sem set</option>
                    {hashtagSets.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <NavIco d="M19 9l-7 7-7-7" sz={14} color={CRIE.muted} />
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${CRIE.line}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexShrink: 0,
            background: CRIE.paper,
          }}
        >
          <Btn
            variant="secondary"
            disabled={isBusy || !form.title.trim()}
            onClick={() => createBriefMutation.mutate({ asDraft: true })}
          >
            Salvar rascunho
          </Btn>
          <Btn
            variant="primary"
            disabled={isBusy || !form.title.trim()}
            onClick={() => createBriefMutation.mutate({ asDraft: false })}
          >
            {isBusy ? "Criando..." : "Criar brief"}
          </Btn>
        </div>
      </aside>
    </>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBriefDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const BriefDrawerComponent = useCallback(
    () => <BriefBuilderDrawer isOpen={isOpen} onClose={close} />,
    [isOpen, close]
  );

  return { open, close, isOpen, BriefDrawerComponent };
}
