import { CRIE } from "@/lib/crie-tokens";

interface PillProps {
  children: React.ReactNode;
  dark?: boolean;
  small?: boolean;
  style?: React.CSSProperties;
}

export function Pill({ children, dark = true, small = false, style = {} }: PillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: small ? "4px 10px" : "8px 14px",
        borderRadius: 999,
        background: dark ? CRIE.ink : CRIE.butter,
        color: dark ? "#fff" : CRIE.ink,
        fontSize: small ? 11 : 13,
        fontWeight: 500,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
