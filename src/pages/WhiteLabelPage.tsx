import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CRIE } from "@/lib/crie-tokens";
import { PCard, Btn, SectionHeader } from "@/components/crie";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WhiteLabelSettings {
  logo_url: string | null;
  primary_color: string;
  subdomain: string;
  sender_email: string;
  remove_powered_by: boolean;
}

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  logo_url: null,
  primary_color: "#EEF0A8",
  subdomain: "",
  sender_email: "",
  remove_powered_by: false,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useWhiteLabel() {
  const { currentAgencyId, agencies } = useAuthStore();
  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  const agency = (membership as any)?.agency;

  return useQuery({
    queryKey: ["white-label", currentAgencyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agencies")
        .select("logo_url, metadata")
        .eq("id", currentAgencyId!)
        .single();
      if (error) throw error;

      const meta = (data?.metadata as Record<string, unknown>) ?? {};
      return {
        logo_url: data?.logo_url ?? null,
        primary_color: (meta.primary_color as string) ?? DEFAULT_SETTINGS.primary_color,
        subdomain: (meta.subdomain as string) ?? DEFAULT_SETTINGS.subdomain,
        sender_email: (meta.sender_email as string) ?? DEFAULT_SETTINGS.sender_email,
        remove_powered_by: (meta.remove_powered_by as boolean) ?? false,
      } as WhiteLabelSettings;
    },
    enabled: !!currentAgencyId,
    placeholderData: DEFAULT_SETTINGS,
  });
}

function useSaveWhiteLabel() {
  const qc = useQueryClient();
  const { currentAgencyId } = useAuthStore();

  return useMutation({
    mutationFn: async (settings: WhiteLabelSettings) => {
      const { logo_url, primary_color, subdomain, sender_email, remove_powered_by } = settings;
      const { error } = await supabase
        .from("agencies")
        .update({
          logo_url,
          metadata: { primary_color, subdomain, sender_email, remove_powered_by },
        } as any)
        .eq("id", currentAgencyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["white-label"] });
      toast.success("Configuracoes salvas!");
    },
    onError: () => {
      toast.error("Erro ao salvar configuracoes");
    },
  });
}

function useUploadLogo() {
  const { currentAgencyId } = useAuthStore();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `agencies/${currentAgencyId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("agency-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("agency-assets").getPublicUrl(path);
      return data.publicUrl;
    },
    onError: () => {
      toast.error("Erro ao fazer upload da logo");
    },
  });
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const [hex, setHex] = useState(value);

  useEffect(() => {
    setHex(value);
  }, [value]);

  function handleChange(raw: string) {
    setHex(raw);
    if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
      onChange(raw);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <input
        type="color"
        value={hex}
        onChange={(e) => { setHex(e.target.value); onChange(e.target.value); }}
        style={{ width: 44, height: 44, padding: 2, border: `1px solid ${CRIE.line}`, borderRadius: 10, cursor: "pointer", background: CRIE.paper }}
        aria-label="Escolher cor"
      />
      <input
        type="text"
        value={hex}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={7}
        placeholder="#EEF0A8"
        style={{ width: 110, padding: "10px 12px", borderRadius: 10, border: `1px solid ${CRIE.line}`, background: CRIE.paper, fontSize: 13, fontFamily: "monospace", color: CRIE.ink, outline: "none" }}
        aria-label="Valor hexadecimal da cor"
      />
      {/* Swatch preview */}
      <div
        style={{ width: 32, height: 32, borderRadius: 8, background: /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : CRIE.line, border: `1px solid ${CRIE.line}` }}
        aria-hidden="true"
      />
    </div>
  );
}

// ─── Portal Preview ───────────────────────────────────────────────────────────

function PortalPreview({
  logoUrl,
  primaryColor,
  agencyName,
}: {
  logoUrl: string | null;
  primaryColor: string;
  agencyName: string;
}) {
  return (
    <div style={{ position: "sticky", top: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: CRIE.muted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
        Preview
      </div>
      <PCard style={{ overflow: "hidden", padding: 0 }}>
        {/* Portal header mockup */}
        <div style={{ background: primaryColor, padding: "18px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: 32, objectFit: "contain", maxWidth: 120 }} />
          ) : (
            <div style={{ height: 32, width: 80, borderRadius: 6, background: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>
              LOGO
            </div>
          )}
          <span style={{ fontSize: 14, fontWeight: 700, color: CRIE.ink }}>{agencyName}</span>
        </div>

        {/* Content area mockup */}
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: CRIE.ink, marginBottom: 12 }}>Aprovacao de Conteudo</div>
          {/* Fake post card */}
          <div style={{ border: `1px solid ${CRIE.line}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: 80, background: CRIE.lineSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: CRIE.line }} aria-hidden="true" />
            </div>
            <div style={{ padding: "10px 12px" }}>
              <div style={{ height: 10, width: "80%", borderRadius: 4, background: CRIE.lineSoft, marginBottom: 6 }} />
              <div style={{ height: 8, width: "60%", borderRadius: 4, background: CRIE.lineSoft }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, height: 32, borderRadius: 999, background: CRIE.lineSoft }} />
            <div style={{ flex: 1, height: 32, borderRadius: 999, background: primaryColor, opacity: 0.7 }} />
          </div>
        </div>

        {/* Powered by footer */}
        <div style={{ borderTop: `1px solid ${CRIE.line}`, padding: "10px 20px", textAlign: "center", fontSize: 11, color: CRIE.muted }}>
          Powered by Crie
        </div>
      </PCard>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WhiteLabelPage() {
  const { data, isLoading } = useWhiteLabel();
  const save = useSaveWhiteLabel();
  const uploadLogo = useUploadLogo();

  const { agencies, currentAgencyId } = useAuthStore();
  const membership = agencies.find((a) => a.agency_id === currentAgencyId);
  const agencyName = (membership as any)?.agency?.name ?? "Agencia";
  const subscriptionStatus = (membership as any)?.agency?.subscription_status ?? "free";
  const isEnterprise = subscriptionStatus === "enterprise";

  const [form, setForm] = useState<WhiteLabelSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file, {
      onSuccess: (url) => {
        setForm((f) => ({ ...f, logo_url: url }));
        toast.success("Logo carregada!");
      },
    });
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: CRIE.muted,
    marginBottom: 6,
  };

  return (
    <div style={{ background: CRIE.bg, fontFamily: "Inter, sans-serif", padding: 32 }}>
      <SectionHeader title="White-label" />

      {isLoading ? (
        <PCard>
          <div style={{ padding: "48px 0", textAlign: "center", color: CRIE.muted, fontSize: 14 }}>
            Carregando configuracoes...
          </div>
        </PCard>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          {/* Left — form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Logo */}
            <PCard>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink, marginBottom: 4 }}>Logo da agencia</div>
                <div style={{ fontSize: 12, color: CRIE.muted }}>
                  Exibida no cabecalho do portal de aprovacao. Recomendado: PNG com fundo transparente, minimo 200x60px.
                </div>
              </div>

              <div
                style={{
                  border: `2px dashed ${CRIE.line}`,
                  borderRadius: 14,
                  padding: 24,
                  textAlign: "center",
                  background: CRIE.lineSoft,
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() => document.getElementById("logo-upload")?.click()}
                role="button"
                tabIndex={0}
                aria-label="Fazer upload de logo"
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("logo-upload")?.click()}
              >
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo atual" style={{ maxHeight: 60, maxWidth: 200, objectFit: "contain", margin: "0 auto" }} />
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden="true">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={CRIE.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto" }}>
                        <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: 13, color: CRIE.muted }}>Clique para fazer upload</div>
                    <div style={{ fontSize: 11, color: CRIE.mutedSoft, marginTop: 4 }}>PNG, SVG ou JPG — max 2 MB</div>
                  </>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  style={{ display: "none" }}
                  onChange={handleLogoUpload}
                />
              </div>

              {form.logo_url && (
                <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                  <Btn variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo_url: null }))} style={{ color: CRIE.rose }}>
                    Remover logo
                  </Btn>
                </div>
              )}
            </PCard>

            {/* Primary color */}
            <PCard>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink, marginBottom: 4 }}>Cor primaria</div>
                <div style={{ fontSize: 12, color: CRIE.muted }}>
                  Usada no cabecalho e botoes de acao do portal de aprovacao.
                </div>
              </div>
              <ColorPicker
                value={form.primary_color}
                onChange={(hex) => setForm((f) => ({ ...f, primary_color: hex }))}
              />
            </PCard>

            {/* Subdomain */}
            <PCard>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink, marginBottom: 4 }}>Subdominio</div>
                <div style={{ fontSize: 12, color: CRIE.muted }}>
                  Links de aprovacao ficarao em <strong>[slug].crieweb.com</strong> ou em dominio customizado via CNAME.
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Subdominio</label>
                <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <input
                    type="text"
                    value={form.subdomain}
                    onChange={(e) => setForm((f) => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                    placeholder="minha-agencia"
                    style={{ ...inputStyle, borderRadius: "12px 0 0 12px", borderRight: "none", flex: 1 }}
                    aria-label="Slug do subdominio"
                  />
                  <span style={{ padding: "10px 14px", background: CRIE.lineSoft, border: `1px solid ${CRIE.line}`, borderRadius: "0 12px 12px 0", fontSize: 13, color: CRIE.muted, whiteSpace: "nowrap" }}>
                    .crieweb.com
                  </span>
                </div>
              </div>

              <div style={{ padding: "12px 14px", background: CRIE.lineSoft, borderRadius: 10, fontSize: 12, color: CRIE.muted }}>
                Para CNAME customizado, aponte seu dominio para <code style={{ fontFamily: "monospace", background: CRIE.line, padding: "1px 5px", borderRadius: 4 }}>portal.crieweb.com</code> e entre em contato com o suporte.
              </div>
            </PCard>

            {/* Sender email */}
            <PCard>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink, marginBottom: 4 }}>E-mail remetente</div>
                <div style={{ fontSize: 12, color: CRIE.muted }}>
                  Endereco de origem para notificacoes de aprovacao enviadas aos clientes.
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>E-mail</label>
                <input
                  type="email"
                  value={form.sender_email}
                  onChange={(e) => setForm((f) => ({ ...f, sender_email: e.target.value }))}
                  placeholder="aprovacoes@suaagencia.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: CRIE.butterWash, border: `1px solid ${CRIE.butterDeep}`, borderRadius: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRIE.butterInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span style={{ fontSize: 12, color: CRIE.butterInk }}>
                  Para evitar spam, configure registros{" "}
                  <a href="https://docs.crieweb.com/email-setup" target="_blank" rel="noopener noreferrer" style={{ color: CRIE.butterInk, fontWeight: 600 }}>
                    SPF e DKIM
                  </a>{" "}
                  no seu dominio.
                </span>
              </div>
            </PCard>

            {/* Remove powered by */}
            <PCard>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: CRIE.ink }}>Remover "Powered by Crie"</span>
                    {!isEnterprise && (
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: CRIE.violet, color: "#fff" }}>
                        Enterprise
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: CRIE.muted }}>
                    Oculta a marca Crie no rodape do portal de aprovacao para uma experiencia 100% white-label.
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={form.remove_powered_by}
                  disabled={!isEnterprise}
                  onClick={() => isEnterprise && setForm((f) => ({ ...f, remove_powered_by: !f.remove_powered_by }))}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 999,
                    border: "none",
                    background: form.remove_powered_by && isEnterprise ? CRIE.butterDeep : CRIE.line,
                    cursor: isEnterprise ? "pointer" : "not-allowed",
                    position: "relative",
                    transition: "background .15s",
                    flexShrink: 0,
                    opacity: isEnterprise ? 1 : 0.5,
                  }}
                  aria-label="Remover powered by Crie"
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: form.remove_powered_by && isEnterprise ? 22 : 2,
                      width: 20,
                      height: 20,
                      borderRadius: 999,
                      background: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                      transition: "left .15s",
                    }}
                  />
                </button>
              </div>
            </PCard>

            {/* Save */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn
                variant="butter"
                onClick={() => save.mutate(form)}
                disabled={save.isPending}
              >
                {save.isPending ? "Salvando..." : "Salvar configuracoes"}
              </Btn>
            </div>
          </div>

          {/* Right — preview */}
          <PortalPreview
            logoUrl={form.logo_url}
            primaryColor={form.primary_color}
            agencyName={agencyName}
          />
        </div>
      )}
    </div>
  );
}
