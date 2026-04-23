// Crie! design tokens — centralised so tweaks flow cleanly.
const CRIE = {
  // Warm neutrals
  bg:        '#F3F1EB',      // canvas behind frames
  paper:     '#FAF8F3',      // dashboard wash
  card:      '#FFFFFF',
  ink:       '#0E0E0C',      // primary text / pill
  inkSoft:   '#2A2A26',
  muted:     '#8B8B82',
  mutedSoft: '#B8B6AC',
  line:      '#ECE9DF',
  lineSoft:  '#F2EFE5',

  // Butter accent — the signature pastel yellow
  butter:    '#EEF0A8',
  butterDeep:'#D9DD6E',
  butterInk: '#6B6E1F',
  butterWash:'#F6F7C9',

  // Status pillars (per brief)
  violet:    '#8B5CF6',
  sky:       '#0EA5E9',
  emerald:   '#10B981',
  rose:      '#F43F5E',
  amber:     '#F59E0B',

  // Workflow stage colors
  stageIdea: '#94A3B8',
  stageCreate:'#3B82F6',
  stageApp:  '#F59E0B',
  stageSched:'#06B6D4',
  stagePub:  '#22C55E',
  stageFail: '#EF4444',
};
window.CRIE = CRIE;

// Shared logo mark: three soft pebbles arranged as the "Crie!" mascot
function CrieMark({ size = 28 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 32 32" fill="none" aria-label="Crie">
      <path d="M10 22c-3 0-5-2.2-5-5s2-5 5-5c1.1 0 2 .3 2.8.8" stroke="#0E0E0C" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="20.5" cy="12" r="4.2" fill="#EEF0A8" stroke="#0E0E0C" strokeWidth="2"/>
      <circle cx="22" cy="22.5" r="2.2" fill="#0E0E0C"/>
    </svg>
  );
}
window.CrieMark = CrieMark;

// Subtly-striped placeholder used in place of any "real" imagery.
function ImgPlaceholder({ label = 'imagem', h = 180, tone = 'warm', rounded = 18, style = {} }) {
  const a = tone === 'warm' ? '#E8E4D5' : tone === 'butter' ? '#EEF0A8' : '#E3E6D4';
  const b = tone === 'warm' ? '#DED9C6' : tone === 'butter' ? '#E4E78C' : '#D0D5BA';
  return (
    <div style={{
      height: h, borderRadius: rounded, overflow: 'hidden', position: 'relative',
      background: `repeating-linear-gradient(135deg, ${a} 0 14px, ${b} 14px 28px)`,
      display: 'flex', alignItems: 'flex-end', padding: 14, ...style,
    }}>
      <span style={{
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase',
        color: CRIE.ink, background: 'rgba(255,255,255,0.72)',
        padding: '4px 8px', borderRadius: 6,
      }}>{label}</span>
    </div>
  );
}
window.ImgPlaceholder = ImgPlaceholder;

// Soft dot matrix (signature visual, for progress / loaders).
function DotMatrix({ rows = 4, cols = 12, filled = 0.6, tone = 'butter' }) {
  const total = rows * cols;
  const on = Math.round(total * filled);
  const palette = tone === 'butter'
    ? ['#EEF0A8', '#E4E78C', '#D9DD6E']
    : ['#CFD4B6', '#B7BE8E', '#9BA476'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i < on;
        const intensity = active ? Math.min(2, Math.floor(i / (total / 3))) : -1;
        const color = active ? palette[intensity] : '#ECE9DF';
        return <div key={i} style={{ aspectRatio: '1', borderRadius: 999, background: color }} />;
      })}
    </div>
  );
}
window.DotMatrix = DotMatrix;

// Dark pill button / badge.
function Pill({ children, dark = true, small = false, style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '4px 10px' : '8px 14px',
      borderRadius: 999,
      background: dark ? CRIE.ink : CRIE.butter,
      color: dark ? '#fff' : CRIE.ink,
      fontSize: small ? 11 : 13, fontWeight: 500,
      whiteSpace: 'nowrap',
      ...style,
    }}>{children}</span>
  );
}
window.Pill = Pill;

// Arrow chip used on list rows (up-right arrow in a soft circle).
function ArrowChip({ size = 32, dark = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: dark ? CRIE.ink : CRIE.lineSoft,
      display: 'grid', placeItems: 'center', flex: 'none',
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M4 10L10 4M10 4H5M10 4V9" stroke={dark ? '#fff' : CRIE.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}
window.ArrowChip = ArrowChip;
