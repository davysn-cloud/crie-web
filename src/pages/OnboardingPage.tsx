import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrieMark } from "@/components/crie";
import { CRIE } from "@/lib/crie-tokens";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StepData {
  agencyName: string;
  agencySegment: string;
  clientName: string;
  clientHandle: string;
  brandColor: string;
  brandVoice: string;
  teamEmails: string;
  igConnected: boolean;
}

const INITIAL_DATA: StepData = {
  agencyName: "",
  agencySegment: "",
  clientName: "",
  clientHandle: "",
  brandColor: "#EEF0A8",
  brandVoice: "",
  teamEmails: "",
  igConnected: false,
};

const STEPS = [
  { number: 1, label: "Sua agência" },
  { number: 2, label: "Primeiro cliente" },
  { number: 3, label: "Brand kit" },
  { number: 4, label: "Equipe" },
  { number: 5, label: "Instagram" },
];

const SEGMENTS = [
  "Moda & Lifestyle",
  "Gastronomia",
  "Saúde & Bem-estar",
  "Educação",
  "Tecnologia",
  "Varejo",
  "Imobiliário",
  "Outro",
];

const BRAND_COLORS = [
  "#EEF0A8", "#C6D3A3", "#B8C0E0", "#F0C9CC",
  "#FDE68A", "#A5F3FC", "#DDD6FE", "#FECACA",
];

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  hint,
  autoComplete,
}: {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
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
      {hint && !error && (
        <span style={{ fontSize: 12, color: CRIE.muted, fontFamily: "Inter, sans-serif" }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 12, color: CRIE.rose, fontFamily: "Inter, sans-serif" }}>{error}</span>
      )}
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        marginBottom: 36,
      }}
      role="list"
      aria-label="Progresso do cadastro"
    >
      {STEPS.map((step, i) => {
        const isDone = step.number < current;
        const isActive = step.number === current;
        return (
          <div
            key={step.number}
            role="listitem"
            style={{ display: "flex", alignItems: "center" }}
          >
            {/* Circle */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div
                aria-current={isActive ? "step" : undefined}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "Inter, sans-serif",
                  border: `2px solid ${isDone ? CRIE.emerald : isActive ? CRIE.butterDeep : CRIE.line}`,
                  background: isDone ? CRIE.emerald : isActive ? CRIE.butter : "#fff",
                  color: isDone ? "#fff" : isActive ? CRIE.butterInk : CRIE.muted,
                  transition: "all .2s",
                }}
              >
                {isDone ? "✓" : step.number}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? CRIE.ink : CRIE.muted,
                  whiteSpace: "nowrap",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  width: 40,
                  height: 2,
                  background: step.number < current ? CRIE.emerald : CRIE.line,
                  marginBottom: 18,
                  transition: "background .2s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Sua agência ──────────────────────────────────────────────────────
function Step1({
  data,
  onChange,
  errors,
}: {
  data: StepData;
  onChange: (k: keyof StepData, v: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Field
        id="agency-name"
        label="Nome da agência"
        placeholder="Ex: Studio Criativo"
        value={data.agencyName}
        onChange={(v) => onChange("agencyName", v)}
        error={errors.agencyName}
        autoComplete="organization"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label
          htmlFor="agency-segment"
          style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft, fontFamily: "Inter, sans-serif" }}
        >
          Segmento principal dos seus clientes
        </label>
        <select
          id="agency-segment"
          value={data.agencySegment}
          onChange={(e) => onChange("agencySegment", e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: `1.5px solid ${errors.agencySegment ? CRIE.rose : CRIE.line}`,
            fontSize: 14,
            color: data.agencySegment ? CRIE.ink : CRIE.muted,
            background: "#fff",
            outline: "none",
            fontFamily: "Inter, sans-serif",
            cursor: "pointer",
            width: "100%",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B8B82' stroke-width='2'%3E%3Cpath d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: 36,
          }}
        >
          <option value="" disabled>Selecione um segmento</option>
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.agencySegment && (
          <span style={{ fontSize: 12, color: CRIE.rose, fontFamily: "Inter, sans-serif" }}>
            {errors.agencySegment}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Step 2: Primeiro cliente ─────────────────────────────────────────────────
function Step2({
  data,
  onChange,
  errors,
}: {
  data: StepData;
  onChange: (k: keyof StepData, v: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Field
        id="client-name"
        label="Nome do cliente / marca"
        placeholder="Ex: Café Bonito"
        value={data.clientName}
        onChange={(v) => onChange("clientName", v)}
        error={errors.clientName}
      />
      <Field
        id="client-handle"
        label="@ no Instagram"
        placeholder="@cafebonito"
        value={data.clientHandle}
        onChange={(v) => onChange("clientHandle", v)}
        error={errors.clientHandle}
        hint="Usaremos para vincular a conta de publicação."
      />
    </div>
  );
}

// ─── Step 3: Brand kit ────────────────────────────────────────────────────────
function Step3({
  data,
  onChange,
}: {
  data: StepData;
  onChange: (k: keyof StepData, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span
          style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft, fontFamily: "Inter, sans-serif" }}
        >
          Cor principal da marca
        </span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {BRAND_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onChange("brandColor", c)}
              aria-label={`Cor ${c}`}
              aria-pressed={data.brandColor === c}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: c,
                border: data.brandColor === c
                  ? `3px solid ${CRIE.ink}`
                  : `2px solid ${CRIE.line}`,
                cursor: "pointer",
                transition: "border .12s, transform .1s",
                transform: data.brandColor === c ? "scale(1.12)" : "scale(1)",
              }}
            />
          ))}
          {/* Custom color picker */}
          <label
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: `2px dashed ${CRIE.line}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: CRIE.muted,
              overflow: "hidden",
              position: "relative",
            }}
            title="Cor personalizada"
            aria-label="Escolher cor personalizada"
          >
            +
            <input
              type="color"
              value={data.brandColor}
              onChange={(e) => onChange("brandColor", e.target.value)}
              style={{
                position: "absolute",
                opacity: 0,
                width: "100%",
                height: "100%",
                cursor: "pointer",
              }}
            />
          </label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: data.brandColor,
              border: `1.5px solid ${CRIE.line}`,
            }}
          />
          <span style={{ fontSize: 12, color: CRIE.muted, fontFamily: "Inter, sans-serif" }}>
            {data.brandColor}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label
          htmlFor="brand-voice"
          style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft, fontFamily: "Inter, sans-serif" }}
        >
          Tom de voz da marca
        </label>
        <textarea
          id="brand-voice"
          placeholder="Ex: Descontraído, próximo e inspirador. Fala com jovens entre 18-30 anos que valorizam autenticidade..."
          value={data.brandVoice}
          onChange={(e) => onChange("brandVoice", e.target.value)}
          rows={3}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: `1.5px solid ${CRIE.line}`,
            fontSize: 14,
            color: CRIE.ink,
            background: "#fff",
            outline: "none",
            fontFamily: "Inter, sans-serif",
            resize: "vertical",
            width: "100%",
            boxSizing: "border-box",
            lineHeight: 1.5,
            transition: "border-color .12s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = CRIE.butterDeep; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = CRIE.line; }}
        />
        <span style={{ fontSize: 12, color: CRIE.muted, fontFamily: "Inter, sans-serif" }}>
          Opcional — o Crie! usará isso para sugerir copies.
        </span>
      </div>
    </div>
  );
}

// ─── Step 4: Equipe ───────────────────────────────────────────────────────────
function Step4({
  data,
  onChange,
}: {
  data: StepData;
  onChange: (k: keyof StepData, v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          background: CRIE.butterWash,
          border: `1px solid ${CRIE.butterDeep}`,
          borderRadius: 14,
          padding: "14px 16px",
          fontSize: 13,
          color: CRIE.butterInk,
          lineHeight: 1.5,
          fontFamily: "Inter, sans-serif",
        }}
      >
        Os convidados receberao um email com link de acesso. Eles podem ser editores, designers ou aprovadores.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label
          htmlFor="team-emails"
          style={{ fontSize: 13, fontWeight: 600, color: CRIE.inkSoft, fontFamily: "Inter, sans-serif" }}
        >
          Emails da equipe
        </label>
        <textarea
          id="team-emails"
          placeholder={"ana@agencia.com\njose@agencia.com\ncliente@empresa.com"}
          value={data.teamEmails}
          onChange={(e) => onChange("teamEmails", e.target.value)}
          rows={4}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: `1.5px solid ${CRIE.line}`,
            fontSize: 14,
            color: CRIE.ink,
            background: "#fff",
            outline: "none",
            fontFamily: "Inter, sans-serif",
            resize: "vertical",
            width: "100%",
            boxSizing: "border-box",
            lineHeight: 1.6,
            transition: "border-color .12s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = CRIE.butterDeep; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = CRIE.line; }}
        />
        <span style={{ fontSize: 12, color: CRIE.muted, fontFamily: "Inter, sans-serif" }}>
          Um email por linha. Você pode pular esta etapa e convidar depois.
        </span>
      </div>
    </div>
  );
}

// ─── Step 5: Instagram ────────────────────────────────────────────────────────
function Step5({
  data,
  onConnect,
}: {
  data: StepData;
  onConnect: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}>
      {/* IG gradient icon */}
      <div
        aria-hidden="true"
        style={{
          width: 72,
          height: 72,
          borderRadius: 22,
          background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(188,24,136,.22)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="#fff" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="1.8" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="#fff" />
        </svg>
      </div>

      <div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: CRIE.ink,
            margin: "0 0 8px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Conecte seu Instagram
        </h3>
        <p
          style={{
            fontSize: 14,
            color: CRIE.muted,
            margin: 0,
            lineHeight: 1.6,
            fontFamily: "Inter, sans-serif",
            maxWidth: 320,
          }}
        >
          Publique direto do Crie! sem precisar abrir o app. Usamos a API oficial da Meta.
        </p>
      </div>

      {data.igConnected ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#F0FDF4",
            border: `1px solid ${CRIE.emerald}`,
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 600,
            color: CRIE.emerald,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" stroke={CRIE.emerald} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Instagram conectado com sucesso!
        </div>
      ) : (
        <button
          onClick={onConnect}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "13px 28px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 16px rgba(188,24,136,.3)",
            transition: "opacity .12s, transform .1s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="#fff" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4.2" stroke="#fff" strokeWidth="1.8" />
            <circle cx="17.5" cy="6.5" r="1.1" fill="#fff" />
          </svg>
          Conectar com Meta / Instagram
        </button>
      )}

      <p style={{ fontSize: 12, color: CRIE.muted, fontFamily: "Inter, sans-serif", margin: 0 }}>
        Você pode pular e conectar depois em Configurações.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate = useNavigate();
  const { currentAgencyId, fetchAgencies, fetchWorkspaces } = useAuthStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<StepData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function setField(k: keyof StepData, v: string | boolean) {
    setData((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[k as string];
      return next;
    });
  }

  function validateStep(): Record<string, string> {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!data.agencyName.trim() || data.agencyName.trim().length < 2)
        e.agencyName = "Nome obrigatório (mínimo 2 caracteres)";
      if (!data.agencySegment)
        e.agencySegment = "Selecione um segmento";
    }
    if (step === 2) {
      if (!data.clientName.trim() || data.clientName.trim().length < 2)
        e.clientName = "Nome obrigatório";
      if (!data.clientHandle.trim())
        e.clientHandle = "Handle obrigatório";
    }
    return e;
  }

  async function persistStep(): Promise<void> {
    // Step 1: atualiza nome da agência criada pelo trigger
    if (step === 1 && currentAgencyId) {
      const slug = data.agencyName
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await supabase
        .from("agencies")
        .update({ name: data.agencyName.trim() })
        .eq("id", currentAgencyId);

      // Atualiza slug só se ainda é o padrão gerado automaticamente
      const { data: agency } = await supabase
        .from("agencies")
        .select("slug")
        .eq("id", currentAgencyId)
        .single();

      if (agency?.slug?.startsWith("ag-")) {
        await supabase
          .from("agencies")
          .update({ slug })
          .eq("id", currentAgencyId);
      }

      // Recarrega agências para refletir novo nome no store
      await fetchAgencies();
    }

    // Step 2: cria o primeiro workspace (marca do cliente)
    if (step === 2 && currentAgencyId) {
      const handle = data.clientHandle.replace(/^@/, "").trim();
      const slug = (handle || data.clientName)
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { data: ws } = await supabase
        .from("workspaces")
        .insert({
          agency_id: currentAgencyId,
          name: data.clientName.trim(),
          slug: slug || `ws-${Date.now()}`,
        })
        .select("id")
        .single();

      if (ws?.id) {
        // Cria brand profile com instagram handle
        await supabase.from("brand_profiles").insert({
          workspace_id: ws.id,
          brand_name: data.clientName.trim(),
          instagram_handle: handle || null,
        });

        await fetchWorkspaces(currentAgencyId);
      }
    }
  }

  async function handleNext() {
    const errs = validateStep();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      await persistStep();
    } catch {
      // falha silenciosa — o onboarding não bloqueia o acesso ao app
    } finally {
      setSaving(false);
    }

    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      navigate("/app/dashboard", { replace: true });
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  function handleSkip() {
    if (step < 5) {
      setStep((s) => s + 1);
    } else {
      navigate("/app/dashboard", { replace: true });
    }
  }

  const STEP_SKIPPABLE = [2, 3, 4, 5];
  const canSkip = STEP_SKIPPABLE.includes(step);

  const STEP_TITLES: Record<number, string> = {
    1: "Conte-nos sobre sua agência",
    2: "Adicione seu primeiro cliente",
    3: "Defina o Brand Kit",
    4: "Convide sua equipe",
    5: "Conecte o Instagram",
  };

  const STEP_DESCS: Record<number, string> = {
    1: "Essas informações aparecem no seu perfil e ajudam a personalizar o Crie!",
    2: "Crie o primeiro espaço de trabalho para começar a criar conteúdo.",
    3: "Configure a identidade visual da marca do seu cliente.",
    4: "Traga sua equipe para colaborar desde o primeiro dia.",
    5: "Publique conteúdo direto do Crie! sem sair da plataforma.",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: CRIE.bg,
        fontFamily: "Inter, sans-serif",
        padding: "32px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: CRIE.butter,
                borderRadius: 10,
                padding: 8,
                display: "flex",
              }}
            >
              <CrieMark size={22} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: CRIE.ink, letterSpacing: "-0.02em" }}>
              Crie!
            </span>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: CRIE.card,
            border: `1px solid ${CRIE.line}`,
            borderRadius: 24,
            padding: "40px 40px 36px",
            boxShadow: "0 4px 32px rgba(0,0,0,.06)",
          }}
        >
          <Stepper current={step} />

          {/* Step header */}
          <div style={{ marginBottom: 28, textAlign: "center" }}>
            <h1
              style={{
                fontSize: 21,
                fontWeight: 800,
                color: CRIE.ink,
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}
            >
              {STEP_TITLES[step]}
            </h1>
            <p style={{ fontSize: 14, color: CRIE.muted, margin: 0, lineHeight: 1.5 }}>
              {STEP_DESCS[step]}
            </p>
          </div>

          {/* Step content */}
          <div style={{ marginBottom: 32 }}>
            {step === 1 && (
              <Step1
                data={data}
                onChange={(k, v) => setField(k, v)}
                errors={errors}
              />
            )}
            {step === 2 && (
              <Step2
                data={data}
                onChange={(k, v) => setField(k, v)}
                errors={errors}
              />
            )}
            {step === 3 && (
              <Step3
                data={data}
                onChange={(k, v) => setField(k, v)}
              />
            )}
            {step === 4 && (
              <Step4
                data={data}
                onChange={(k, v) => setField(k, v)}
              />
            )}
            {step === 5 && (
              <Step5
                data={data}
                onConnect={() => setField("igConnected", true)}
              />
            )}
          </div>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* Back button */}
            {step > 1 ? (
              <button
                onClick={handleBack}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: `1px solid ${CRIE.line}`,
                  background: "#fff",
                  color: CRIE.inkSoft,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = CRIE.lineSoft; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                ← Voltar
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Skip */}
              {canSkip && (
                <button
                  onClick={handleSkip}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: CRIE.muted,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    transition: "color .12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = CRIE.inkSoft; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = CRIE.muted; }}
                >
                  Pular
                </button>
              )}

              {/* Next / Finish */}
              <button
                onClick={handleNext}
                disabled={saving}
                style={{
                  padding: "11px 26px",
                  borderRadius: 10,
                  border: "none",
                  background: saving ? CRIE.muted : CRIE.ink,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "-0.01em",
                  transition: "opacity .12s",
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = "0.88"; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              >
                {saving ? "Salvando..." : step === 5 ? "Finalizar e entrar" : "Próximo →"}
              </button>
            </div>
          </div>
        </div>

        {/* Step count */}
        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 12,
            color: CRIE.muted,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Passo {step} de {STEPS.length}
        </p>
      </div>
    </div>
  );
}
