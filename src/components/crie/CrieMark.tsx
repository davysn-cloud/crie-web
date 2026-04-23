/** Crie! logo mark: three soft pebbles. */
export function CrieMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-label="Crie">
      <path
        d="M10 22c-3 0-5-2.2-5-5s2-5 5-5c1.1 0 2 .3 2.8.8"
        stroke="#0E0E0C"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="12" r="4.2" fill="#EEF0A8" stroke="#0E0E0C" strokeWidth="2" />
      <circle cx="22" cy="22.5" r="2.2" fill="#0E0E0C" />
    </svg>
  );
}
