import { CRIE } from "@/lib/crie-tokens";
import { Btn } from "./Btn";

interface EmptyStateProps {
  icon: string;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, body, cta, onCta }: EmptyStateProps) {
  return (
    <div style={{ display: "grid", placeItems: "center", padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: CRIE.muted, marginBottom: 20, maxWidth: 280 }}>{body}</div>
      {cta && <Btn onClick={onCta}>{cta}</Btn>}
    </div>
  );
}
