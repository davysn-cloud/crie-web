interface CrieBadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export function CrieBadge({ label, color = "#8B8B82", bg }: CrieBadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
        background: bg || color + "22",
        color,
      }}
    >
      {label}
    </span>
  );
}
