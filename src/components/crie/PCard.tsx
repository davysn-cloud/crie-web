import { CRIE } from "@/lib/crie-tokens";

interface PCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number;
}

export function PCard({ children, style = {}, pad = 20 }: PCardProps) {
  return (
    <div
      style={{
        background: CRIE.card,
        border: `1px solid ${CRIE.line}`,
        borderRadius: 22,
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
