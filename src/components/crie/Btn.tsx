import { CRIE } from "@/lib/crie-tokens";

type BtnVariant = "primary" | "secondary" | "butter" | "ghost";
type BtnSize = "sm" | "md";

interface BtnProps {
  children: React.ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const variantStyles: Record<BtnVariant, React.CSSProperties> = {
  primary: { background: CRIE.ink, color: "#fff" },
  secondary: { background: "#fff", color: CRIE.ink, border: `1px solid ${CRIE.line}` },
  butter: { background: CRIE.butter, color: CRIE.ink, border: `1px solid ${CRIE.butterDeep}` },
  ghost: { background: "transparent", color: CRIE.muted },
};

export function Btn({
  children,
  variant = "primary",
  size = "md",
  onClick,
  style = {},
  disabled,
}: BtnProps) {
  const pad = size === "sm" ? "6px 14px" : "10px 18px";
  const fs = size === "sm" ? 12 : 13.5;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        borderRadius: 999,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: fs,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        transition: "opacity .12s",
        opacity: disabled ? 0.5 : 1,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
