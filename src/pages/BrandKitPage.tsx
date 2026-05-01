import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, SectionHeader, Btn } from "@/components/crie";
import { NavIco } from "@/components/crie";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import type { BrandProfile, BrandColor, BrandFont } from "@/types";

// ─── Icon paths ───────────────────────────────────────────────────────────────
const ICO_UPLOAD = "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12";
const ICO_PLUS = "M12 4v16m8-8H4";
const ICO_PREVIEW = "M15 10l4.553-2.069A1 1 0 0121 8.869v6.262a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z";

// ─── Brand voice types (migration 00010) ──────────────────────────────────────
type BrandVoiceTone = "formal" | "neutro" | "casual" | "divertido";
type EmojiPolicyDB = "none" | "moderate" | "free";

interface BrandVoice {
  id: string;
  workspace_id: string;
  tone: BrandVoiceTone;
  vocab_preferred: string[];
  vocab_forbidden: string[];
  emoji_policy: EmojiPolicyDB;
  system_prompt_override: string | null;
}

// ─── UI types (display labels) ────────────────────────────────────────────────
type ToneUI = "Formal" | "Neutro" | "Casual" | "Divertido";
type EmojiPolicyUI = "Nenhum" | "Moderado" | "Liberado";

const TONE_UI_TO_DB: Record<ToneUI, BrandVoiceTone> = {
  Formal: "formal",
  Neutro: "neutro",
  Casual: "casual",
  Divertido: "divertido",
};
const TONE_DB_TO_UI: Record<BrandVoiceTone, ToneUI> = {
  formal: "Formal",
  neutro: "Neutro",
  casual: "Casual",
  divertido: "Divertido",
};
const EMOJI_UI_TO_DB: Record<EmojiPolicyUI, EmojiPolicyDB> = {
  Nenhum: "none",
  Moderado: "moderate",
  Liberado: "free",
};
const EMOJI_DB_TO_UI: Record<EmojiPolicyDB, EmojiPolicyUI> = {
  none: "Nenhum",
  moderate: "Moderado",
  free: "Liberado",
};

const FONT_OPTIONS = [
  "Inter",
  "Playfair Display",
  "Montserrat",
  "Poppins",
  "DM Sans",
  "Merriweather",
  "Raleway",
  "Lato",
];

const CUSTOM_FONT_VALUE = "__custom__";

// ─── Dropzone ─────────────────────────────────────────────────────────────────
function LogoDropzone({ label, logoUrl, onUpload }: { label: string; logoUrl?: string | null; onUpload: (file: File) => void }) {
  const [hovering, setHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = "";
  }

  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </p>
      <div
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Fazer upload de ${label}`}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        style={{
          border: `2px dashed ${hovering ? CRIE.butterDeep : CRIE.line}`,
          borderRadius: 14,
          height: 100,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          background: hovering ? CRIE.butterWash : CRIE.bg,
          transition: "border-color .15s, background .15s",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleChange} />
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={label}
            style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }}
          />
        ) : (
          <>
            <NavIco d={ICO_UPLOAD} sz={20} color={hovering ? CRIE.butterInk : CRIE.muted} />
            <span style={{ fontSize: 11.5, color: CRIE.muted }}>Arrastar ou clique</span>
          </>
        )}
      </div>
      {/* Preview strips */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <div style={{ flex: 1, height: 28, borderRadius: 8, background: "#fff", border: `1px solid ${CRIE.line}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Claro" style={{ maxHeight: "90%", maxWidth: "90%", objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 10, color: CRIE.muted }}>Claro</span>
          )}
        </div>
        <div style={{ flex: 1, height: 28, borderRadius: 8, background: CRIE.ink, border: `1px solid ${CRIE.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.5)" }}>Escuro</span>
        </div>
      </div>
    </div>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────
function ColorSwatch({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: color,
          border: `1.5px solid ${CRIE.line}`,
          cursor: "pointer",
          transition: "transform .12s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.06)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      />
      <span style={{ fontSize: 10.5, color: CRIE.muted, fontFamily: "monospace" }}>{color}</span>
    </div>
  );
}

// ─── Mini IG preview (sidebar) ────────────────────────────────────────────────
function MiniIGPreview({ tone, titleFont, bodyFont, brandName }: { tone: ToneUI; titleFont: string; bodyFont: string; brandName: string }) {
  const bgMap: Record<ToneUI, string> = {
    Formal: "#F1F5F9",
    Neutro: CRIE.butterWash,
    Casual: "#F0FDF4",
    Divertido: "#FFF1F2",
  };
  const captionMap: Record<ToneUI, string> = {
    Formal: "Excelência em cada detalhe. Conheça nossa linha premium.",
    Neutro: "Produto novo chegou. Confira no link da bio.",
    Casual: "Gente, AMAMOS esse lançamento! Vem conferir 🙌",
    Divertido: "UÉ! Você ainda não viu?? Corre ver esse produto incrível!! 🎉✨",
  };

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${CRIE.line}`,
        background: bgMap[tone],
      }}
    >
      {/* Fake post image */}
      <div
        style={{
          height: 160,
          background: CRIE.butter,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "rgba(255,255,255,.55)",
            border: "2px solid rgba(255,255,255,.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <NavIco d={ICO_PREVIEW} sz={28} color={CRIE.butterInk} />
        </div>
      </div>
      {/* Caption area */}
      <div style={{ padding: "10px 12px" }}>
        <p
          style={{
            margin: "0 0 4px",
            fontSize: 12,
            fontWeight: 700,
            color: CRIE.ink,
            fontFamily: `${titleFont}, sans-serif`,
          }}
        >
          {brandName || "Sua Marca"}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: CRIE.inkSoft,
            lineHeight: 1.5,
            fontFamily: `${bodyFont}, sans-serif`,
          }}
        >
          {captionMap[tone]}
        </p>
      </div>
    </div>
  );
}

// ─── Font selector ────────────────────────────────────────────────────────────
function FontSelector({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // If the current value is not in the preset list, treat it as custom
  const isPreset = FONT_OPTIONS.includes(value);
  const [customActive, setCustomActive] = useState(!isPreset);
  const [customInput, setCustomInput] = useState(isPreset ? "" : value);

  // Keep customInput in sync when value is set externally (e.g. server sync)
  useEffect(() => {
    const preset = FONT_OPTIONS.includes(value);
    setCustomActive(!preset);
    if (!preset) setCustomInput(value);
  }, [value]);

  function handleSelectChange(selected: string) {
    if (selected === CUSTOM_FONT_VALUE) {
      setCustomActive(true);
      // Keep current custom input value or empty
      if (customInput) onChange(customInput);
    } else {
      setCustomActive(false);
      onChange(selected);
    }
  }

  function handleCustomInputChange(raw: string) {
    setCustomInput(raw);
    if (raw.trim()) onChange(raw.trim());
  }

  const selectValue = customActive ? CUSTOM_FONT_VALUE : value;
  const previewFamily = value || "Inter";

  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>
        {label}
      </p>
      <select
        value={selectValue}
        onChange={(e) => handleSelectChange(e.target.value)}
        aria-label={`Fonte para ${label}`}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 10,
          border: `1px solid ${CRIE.line}`,
          background: CRIE.card,
          fontSize: 13,
          color: CRIE.ink,
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          outline: "none",
        }}
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
        <option value={CUSTOM_FONT_VALUE}>Outra...</option>
      </select>
      {customActive && (
        <input
          type="text"
          value={customInput}
          onChange={(e) => handleCustomInputChange(e.target.value)}
          placeholder="Nome da fonte (ex: Roboto)"
          aria-label={`Nome personalizado da fonte para ${label}`}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${CRIE.butterDeep}`,
            background: CRIE.butterWash,
            fontSize: 13,
            color: CRIE.ink,
            outline: "none",
            fontFamily: "Inter, sans-serif",
            boxSizing: "border-box",
          }}
        />
      )}
      <div
        style={{
          marginTop: 8,
          padding: "8px 12px",
          borderRadius: 10,
          background: CRIE.lineSoft,
          fontFamily: `${previewFamily}, sans-serif`,
          fontSize: 14,
          color: CRIE.inkSoft,
        }}
      >
        Aa Bb 123
      </div>
    </div>
  );
}

// ─── Vocab chips input ────────────────────────────────────────────────────────
function VocabInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (words: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  function addWord() {
    const word = inputVal.trim();
    if (word && !value.includes(word)) {
      onChange([...value, word]);
    }
    setInputVal("");
  }

  function removeWord(w: string) {
    onChange(value.filter((v) => v !== w));
  }

  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 500, color: CRIE.muted }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
        {value.map((w) => (
          <span
            key={w}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 8px",
              borderRadius: 999,
              background: CRIE.lineSoft,
              color: CRIE.inkSoft,
              fontSize: 11.5,
            }}
          >
            {w}
            <button
              onClick={() => removeWord(w)}
              aria-label={`Remover ${w}`}
              style={{ background: "none", border: "none", cursor: "pointer", color: CRIE.muted, padding: 0, lineHeight: 1, fontSize: 13 }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addWord(); } }}
        placeholder={placeholder}
        aria-label={label}
        style={{
          width: "100%",
          padding: "8px 12px",
          borderRadius: 10,
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
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", display: "flex", gap: 24 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
        {[100, 120, 100, 180].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              background: CRIE.lineSoft,
              borderRadius: 16,
            }}
          />
        ))}
      </div>
      <div style={{ width: 300, flexShrink: 0, height: 280, background: CRIE.lineSoft, borderRadius: 16 }} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function BrandKitPage() {
  const { currentWorkspaceId, user } = useAuthStore();
  const queryClient = useQueryClient();

  // ─── Local form state (synced from server) ────────────────────────────────
  const [tone, setTone] = useState<ToneUI>("Neutro");
  const [emojiPolicy, setEmojiPolicy] = useState<EmojiPolicyUI>("Moderado");
  const [titleFont, setTitleFont] = useState("Playfair Display");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [colors, setColors] = useState<BrandColor[]>([]);
  const [vocabPreferred, setVocabPreferred] = useState<string[]>([]);
  const [vocabForbidden, setVocabForbidden] = useState<string[]>([]);
  const [brandName, setBrandName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // ─── Inline color picker state ────────────────────────────────────────────
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newColorName, setNewColorName] = useState("");

  // ─── Fetch brand_profiles ─────────────────────────────────────────────────
  const { data: brandProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["brand-profile", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return null;
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .maybeSingle();
      if (error) throw error;
      return data as BrandProfile | null;
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  // ─── Fetch brand_voice ────────────────────────────────────────────────────
  const { data: brandVoice, isLoading: loadingVoice } = useQuery({
    queryKey: ["brand-voice", currentWorkspaceId],
    queryFn: async () => {
      if (!currentWorkspaceId) return null;
      const { data, error } = await supabase
        .from("brand_voice")
        .select("*")
        .eq("workspace_id", currentWorkspaceId)
        .maybeSingle();
      if (error && (error as { code?: string }).code !== "PGRST116") throw error;
      return data as BrandVoice | null;
    },
    enabled: !!currentWorkspaceId,
    staleTime: 60_000,
  });

  // ─── Sync server data → form state ───────────────────────────────────────
  useEffect(() => {
    if (!brandProfile) return;
    setBrandName(brandProfile.brand_name ?? "");
    setLogoUrl(brandProfile.logo_url ?? null);
    setColors(brandProfile.colors ?? []);
    // Derive fonts from fonts array
    const fonts = brandProfile.fonts ?? [];
    const titleF = fonts.find((f) => f.usage === "title" || f.usage === "Título");
    const bodyF = fonts.find((f) => f.usage === "body" || f.usage === "Corpo");
    if (titleF) setTitleFont(titleF.family);
    if (bodyF) setBodyFont(bodyF.family);
  }, [brandProfile]);

  useEffect(() => {
    if (!brandVoice) return;
    setTone(TONE_DB_TO_UI[brandVoice.tone] ?? "Neutro");
    setEmojiPolicy(EMOJI_DB_TO_UI[brandVoice.emoji_policy] ?? "Moderado");
    setVocabPreferred(brandVoice.vocab_preferred ?? []);
    setVocabForbidden(brandVoice.vocab_forbidden ?? []);
  }, [brandVoice]);

  // ─── Save mutation ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentWorkspaceId) throw new Error("Workspace não selecionado");

      const fonts: BrandFont[] = [
        { family: titleFont, weight: "700", usage: "title" },
        { family: bodyFont, weight: "400", usage: "body" },
      ];

      // Upsert brand_profiles
      const { error: profileError } = await supabase
        .from("brand_profiles")
        .upsert(
          {
            workspace_id: currentWorkspaceId,
            brand_name: brandName || null,
            logo_url: logoUrl,
            colors,
            fonts,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "workspace_id" }
        );
      if (profileError) throw profileError;

      // Upsert brand_voice
      const { error: voiceError } = await supabase
        .from("brand_voice")
        .upsert(
          {
            workspace_id: currentWorkspaceId,
            tone: TONE_UI_TO_DB[tone],
            emoji_policy: EMOJI_UI_TO_DB[emojiPolicy],
            vocab_preferred: vocabPreferred,
            vocab_forbidden: vocabForbidden,
          },
          { onConflict: "workspace_id" }
        );
      if (voiceError) throw voiceError;
    },
    onSuccess: () => {
      toast.success("Brand kit salvo com sucesso");
      queryClient.invalidateQueries({ queryKey: ["brand-profile", currentWorkspaceId] });
      queryClient.invalidateQueries({ queryKey: ["brand-voice", currentWorkspaceId] });
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err instanceof Error ? err.message : "Erro"}`);
    },
  });

  // ─── Logo upload mutation ─────────────────────────────────────────────────
  const logoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentWorkspaceId || !user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logos/${currentWorkspaceId}/logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("brand-assets")
        .getPublicUrl(path);

      setLogoUrl(publicUrl);
    },
    onSuccess: () => toast.success("Logo enviado"),
    onError: (err) => toast.error(`Erro no upload: ${err instanceof Error ? err.message : "Erro"}`),
  });

  // ─── Add color ────────────────────────────────────────────────────────────
  function commitColor() {
    const hex = newColorHex.trim();
    if (!hex) return;
    const name = newColorName.trim() || hex;
    setColors((prev) => [...prev, { hex, name }]);
    setShowColorPicker(false);
    setNewColorHex("#000000");
    setNewColorName("");
  }

  function cancelColorPicker() {
    setShowColorPicker(false);
    setNewColorHex("#000000");
    setNewColorName("");
  }

  if (loadingProfile || loadingVoice) return <LoadingSkeleton />;

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
        fontFamily: "Inter, sans-serif",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* ── Left column ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Brand name */}
        <PCard>
          <SectionHeader title="Nome da Marca" />
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Ex: Café Bonito"
            aria-label="Nome da marca"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 10,
              border: `1px solid ${CRIE.line}`,
              background: CRIE.card,
              fontSize: 14,
              color: CRIE.ink,
              outline: "none",
              fontFamily: "Inter, sans-serif",
              boxSizing: "border-box",
            }}
          />
        </PCard>

        {/* Logos */}
        <PCard>
          <SectionHeader title="Logotipos" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <LogoDropzone
              label="Principal"
              logoUrl={logoUrl}
              onUpload={(file) => logoUploadMutation.mutate(file)}
            />
            <LogoDropzone
              label="Alternativo / Ícone"
              logoUrl={null}
              onUpload={() => {}}
            />
          </div>
        </PCard>

        {/* Colors */}
        <PCard>
          <SectionHeader title="Cores da Marca" />
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
            {colors.map((c, i) => (
              <ColorSwatch key={`${c.hex}-${i}`} color={c.hex} />
            ))}
            {/* Add button — only show when picker is closed */}
            {!showColorPicker && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <button
                  aria-label="Adicionar cor"
                  onClick={() => setShowColorPicker(true)}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    border: `2px dashed ${CRIE.line}`,
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color .12s, background .12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = CRIE.butterDeep;
                    (e.currentTarget as HTMLElement).style.background = CRIE.butterWash;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = CRIE.line;
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <NavIco d={ICO_PLUS} sz={18} color={CRIE.muted} />
                </button>
                <span style={{ fontSize: 10.5, color: CRIE.muted }}>Adicionar</span>
              </div>
            )}
          </div>

          {/* Inline color picker form */}
          {showColorPicker && (
            <div
              style={{
                marginTop: 16,
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${CRIE.line}`,
                background: CRIE.lineSoft,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Color picker + hex input side by side */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {/* Native color picker swatch */}
                <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: newColorHex,
                      border: `1.5px solid ${CRIE.line}`,
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  />
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    aria-label="Selecionar cor"
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                      border: "none",
                      padding: 0,
                    }}
                  />
                </div>

                {/* Hex text input */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    Hex
                  </label>
                  <input
                    type="text"
                    value={newColorHex}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewColorHex(v);
                    }}
                    onBlur={(e) => {
                      // Normalise: ensure leading # and valid length
                      let v = e.target.value.trim();
                      if (!v.startsWith("#")) v = "#" + v;
                      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
                        setNewColorHex(v);
                      }
                    }}
                    placeholder="#000000"
                    aria-label="Valor hexadecimal da cor"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 8,
                      border: `1px solid ${CRIE.line}`,
                      background: CRIE.card,
                      fontSize: 13,
                      color: CRIE.ink,
                      outline: "none",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Name input */}
                <div style={{ flex: 1.4 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: CRIE.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 }}>
                    Nome (opcional)
                  </label>
                  <input
                    type="text"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitColor(); }}
                    placeholder="ex: Coral"
                    aria-label="Nome da cor"
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 8,
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
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={commitColor}
                  aria-label="Confirmar adição de cor"
                  style={{
                    padding: "7px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: CRIE.ink,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    transition: "opacity .12s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Adicionar
                </button>
                <button
                  onClick={cancelColorPicker}
                  aria-label="Cancelar adição de cor"
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: CRIE.muted,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </PCard>

        {/* Typography */}
        <PCard>
          <SectionHeader title="Tipografia" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FontSelector label="Título" value={titleFont} onChange={setTitleFont} />
            <FontSelector label="Corpo" value={bodyFont} onChange={setBodyFont} />
          </div>
        </PCard>

        {/* Tone of voice */}
        <PCard>
          <SectionHeader title="Tom de Voz" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Tone toggles */}
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>
                Personalidade
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["Formal", "Neutro", "Casual", "Divertido"] as ToneUI[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    aria-pressed={tone === t}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: 10,
                      border: `1px solid ${tone === t ? CRIE.ink : CRIE.line}`,
                      background: tone === t ? CRIE.ink : "transparent",
                      color: tone === t ? "#fff" : CRIE.muted,
                      fontSize: 12.5,
                      fontWeight: tone === t ? 600 : 400,
                      cursor: "pointer",
                      transition: "all .12s",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Vocab inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <VocabInput
                label="Palavras preferidas"
                placeholder="ex: exclusivo, artesanal"
                value={vocabPreferred}
                onChange={setVocabPreferred}
              />
              <VocabInput
                label="Palavras proibidas"
                placeholder="ex: barato, genérico"
                value={vocabForbidden}
                onChange={setVocabForbidden}
              />
            </div>

            {/* Emoji policy */}
            <div>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: CRIE.muted, letterSpacing: 0.3, textTransform: "uppercase" }}>
                Política de emojis
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                {(["Nenhum", "Moderado", "Liberado"] as EmojiPolicyUI[]).map((ep) => (
                  <button
                    key={ep}
                    onClick={() => setEmojiPolicy(ep)}
                    aria-pressed={emojiPolicy === ep}
                    style={{
                      flex: 1,
                      padding: "8px 6px",
                      borderRadius: 10,
                      border: `1px solid ${emojiPolicy === ep ? CRIE.butterDeep : CRIE.line}`,
                      background: emojiPolicy === ep ? CRIE.butter : "transparent",
                      color: emojiPolicy === ep ? CRIE.butterInk : CRIE.muted,
                      fontSize: 12.5,
                      fontWeight: emojiPolicy === ep ? 600 : 400,
                      cursor: "pointer",
                      transition: "all .12s",
                    }}
                  >
                    {ep}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PCard>

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn
            variant="secondary"
            onClick={() => {
              // Reset from server data
              if (brandProfile) {
                setBrandName(brandProfile.brand_name ?? "");
                setLogoUrl(brandProfile.logo_url ?? null);
                setColors(brandProfile.colors ?? []);
              }
              if (brandVoice) {
                setTone(TONE_DB_TO_UI[brandVoice.tone] ?? "Neutro");
                setEmojiPolicy(EMOJI_DB_TO_UI[brandVoice.emoji_policy] ?? "Moderado");
                setVocabPreferred(brandVoice.vocab_preferred ?? []);
                setVocabForbidden(brandVoice.vocab_forbidden ?? []);
              }
            }}
          >
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Salvando..." : "Salvar brand kit"}
          </Btn>
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          position: "sticky",
          top: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <PCard>
          <SectionHeader title="Preview" />
          <MiniIGPreview tone={tone} titleFont={titleFont} bodyFont={bodyFont} brandName={brandName} />
          <p style={{ margin: "10px 0 0", fontSize: 11.5, color: CRIE.muted, textAlign: "center" }}>
            Simulação de post no Instagram
          </p>
        </PCard>

        <Btn variant="butter" style={{ width: "100%", justifyContent: "center" }}>
          Aplicar brand kit
        </Btn>
      </div>
    </div>
  );
}
