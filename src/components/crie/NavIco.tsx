import { CRIE } from "@/lib/crie-tokens";

interface NavIcoProps {
  d: string;
  sz?: number;
  color?: string;
}

export function NavIco({ d, sz = 20, color = CRIE.inkSoft }: NavIcoProps) {
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
