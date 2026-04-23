/** Soft dot matrix — signature visual for progress / loaders. */
interface DotMatrixProps {
  rows?: number;
  cols?: number;
  filled?: number;
  tone?: "butter" | "sage";
}

export function DotMatrix({ rows = 4, cols = 12, filled = 0.6, tone = "butter" }: DotMatrixProps) {
  const total = rows * cols;
  const on = Math.round(total * filled);
  const palette =
    tone === "butter"
      ? ["#EEF0A8", "#E4E78C", "#D9DD6E"]
      : ["#CFD4B6", "#B7BE8E", "#9BA476"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < on;
        const intensity = active ? Math.min(2, Math.floor(i / (total / 3))) : -1;
        const color = active ? palette[intensity] : "#ECE9DF";
        return <div key={i} style={{ aspectRatio: "1", borderRadius: 999, background: color }} />;
      })}
    </div>
  );
}
