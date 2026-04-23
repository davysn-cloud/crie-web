// Crie! — Admin / Agency dashboard (desktop)
// Aesthetic: soft warm paper, butter-yellow accents, dark ink pills, dot matrices.
// 1280-wide full view with sidebar + hero band + metric grid.

function CrieSidebar() {
  const items = [
    { label: 'Início',   icon: 'home',     active: true },
    { label: 'Board',    icon: 'columns' },
    { label: 'Calendário', icon: 'calendar' },
    { label: 'Copy',     icon: 'type' },
    { label: 'Design',   icon: 'brush' },
    { label: 'Publicar', icon: 'send' },
    { label: 'Equipe',   icon: 'users' },
  ];
  const ICON = {
    home:     'M4 11l8-7 8 7v8a2 2 0 01-2 2h-3v-6h-6v6H6a2 2 0 01-2-2v-8z',
    columns:  'M4 5h4v14H4zM10 5h4v14h-4zM16 5h4v14h-4z',
    calendar: 'M3 8h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4',
    type:     'M5 6h14M9 6v14M15 10h4v10',
    brush:    'M9 15l-2 5 5-2L21 8l-3-3L9 15zM7 20l-3 1 1-3',
    send:     'M4 12l16-8-6 18-3-8-7-2z',
    users:    'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1-4 4-6 8-6s7 2 8 6',
  };
  return (
    <aside style={{
      width: 80, background: CRIE.paper, borderRight: `1px solid ${CRIE.line}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '22px 0', gap: 4, flex: 'none',
    }}>
      <div style={{ marginBottom: 18 }}><CrieMark size={32} /></div>
      {items.map((it) => (
        <button key={it.label} style={{
          width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer',
          background: it.active ? CRIE.butter : 'transparent',
          color: CRIE.ink, display: 'grid', placeItems: 'center',
          transition: 'background 0.15s',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke={CRIE.ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON[it.icon]} />
          </svg>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button style={{
        width: 48, height: 48, borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'transparent', color: CRIE.muted, display: 'grid', placeItems: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={CRIE.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>
    </aside>
  );
}

function HeroBand() {
  // Full-bleed "brand hero" band with frosted metric tiles + add-member card.
  return (
    <div style={{
      position: 'relative', borderRadius: 28, overflow: 'hidden',
      height: 300,
      background: `
        radial-gradient(120% 140% at 80% 0%, #D7E5C9 0%, #B7CDA5 45%, #92AE87 100%),
        linear-gradient(180deg, #A9C29C, #8CAA82)
      `,
    }}>
      {/* Abstract soft architecture as pseudo-imagery */}
      <svg viewBox="0 0 1200 300" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="dome" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4F7370"/>
            <stop offset="1" stopColor="#2B4A4A"/>
          </linearGradient>
        </defs>
        {/* soft cloud bands */}
        <ellipse cx="950" cy="60" rx="220" ry="28" fill="#F0F3E3" opacity="0.6"/>
        <ellipse cx="720" cy="40" rx="180" ry="18" fill="#F0F3E3" opacity="0.45"/>
        {/* dome */}
        <path d="M700 280 Q780 120 900 120 T1100 280 Z" fill="url(#dome)" opacity="0.85"/>
        <g stroke="#8BB0A8" strokeWidth="0.6" opacity="0.55" fill="none">
          {Array.from({ length: 14 }).map((_, i) => (
            <path key={i} d={`M720 ${260 - i*10} Q900 ${140 - i*9} 1080 ${260 - i*10}`} />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={'v'+i} x1={720 + i*23} y1="280" x2={720 + i*23} y2={160 + Math.abs(i-8)*8}/>
          ))}
        </g>
      </svg>

      {/* Top row — workspace title + search + icons */}
      <div style={{
        position: 'absolute', inset: 0, padding: '22px 28px',
        display: 'flex', flexDirection: 'column', color: CRIE.ink,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Atelier Canto</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 360, background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
              borderRadius: 999, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10,
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CRIE.muted} strokeWidth="2">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              <span style={{ color: CRIE.muted, fontSize: 13, flex: 1 }}>Buscar posts, marcas, briefs…</span>
              <span style={{ fontSize: 11, color: CRIE.muted, fontFamily: 'ui-monospace, Menlo, monospace' }}>⌘K</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['cal', 'bell', 'avatar'].map((k) => (
              <div key={k} style={{
                width: 38, height: 38, borderRadius: 999,
                background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.6)',
                display: 'grid', placeItems: 'center', position: 'relative',
              }}>
                {k === 'cal' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>}
                {k === 'bell' && <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth="1.8"><path d="M6 8a6 6 0 1112 0v5l1.5 3h-15L6 13z"/><path d="M10 20a2 2 0 004 0"/></svg>
                  <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: CRIE.rose, borderRadius: 999, border: '1.5px solid #fff' }}/>
                </>}
                {k === 'avatar' && <div style={{
                  width: 30, height: 30, borderRadius: 999, background: 'linear-gradient(135deg,#C9A07C,#8B6748)',
                  color: '#fff', fontSize: 11, fontWeight: 600, display: 'grid', placeItems: 'center',
                }}>AM</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Metric tiles + CTA card */}
        <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.25fr', gap: 14 }}>
          <GlassStat label="Marcas" value="12" icon="building"/>
          <GlassStat label="Posts no mês" value="147" icon="layers"/>
          <GlassStat label="Aprovações" value="89%" icon="check"/>
          <ButterCTA />
        </div>
      </div>
    </div>
  );
}

function GlassStat({ label, value, icon }) {
  const ICON = {
    building: 'M3 21h18M5 21V7l7-4 7 4v14M9 9h2M13 9h2M9 13h2M13 13h2M9 17h2M13 17h2',
    layers:   'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 18l9 5 9-5',
    check:    'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };
  return (
    <div style={{
      background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.55)', borderRadius: 18,
      padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: '0 10px 30px rgba(30,40,25,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: CRIE.ink, fontSize: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON[icon]}/>
          </svg>
          {label}
        </div>
        <div style={{ color: CRIE.muted, fontSize: 16, lineHeight: 1 }}>⋯</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, color: CRIE.ink }}>{value}</div>
        <ArrowChip size={26} />
      </div>
    </div>
  );
}

function ButterCTA() {
  return (
    <div style={{
      background: CRIE.butter, borderRadius: 18, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 12,
      border: `1px solid ${CRIE.butterDeep}`,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: CRIE.ink }}>Convidar equipe</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
        <button style={btBtn()}>+ Copywriter</button>
        <button style={btBtn()}>+ Designer</button>
      </div>
    </div>
  );
}
function btBtn() {
  return {
    flex: 1, background: 'rgba(255,255,255,0.7)', border: `1px solid ${CRIE.butterDeep}`,
    borderRadius: 999, padding: '8px 10px', fontSize: 11.5, fontWeight: 500,
    color: CRIE.ink, cursor: 'pointer', whiteSpace: 'nowrap',
  };
}

// ---- Mid section: Aprovação ring, Funil (bar chart), Upcoming deadlines
function ApprovalCard() {
  const pct = 84;
  const r = 74, c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <Card title="Taxa de aprovação" rightSelector="Mensal">
      <div style={{ display: 'grid', placeItems: 'center', padding: '10px 0 4px', position: 'relative' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* background dashed ring */}
          <circle cx="100" cy="100" r={r} stroke={CRIE.line} strokeWidth="16" fill="none" strokeDasharray="2 7" strokeLinecap="round"/>
          <circle cx="100" cy="100" r={r} stroke={CRIE.butter} strokeWidth="16" fill="none"
            strokeDasharray={`${c - off} ${off}`} strokeDashoffset={c * 0.25} strokeLinecap="round"
            transform="rotate(-90 100 100)"/>
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: 42, fontWeight: 700, color: CRIE.butterInk, letterSpacing: -1.5 }}>{pct}%</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <div style={{ color: CRIE.muted, fontSize: 12 }}>Aprovados de 1ª</div>
        <div style={{
          width: 34, height: 34, borderRadius: 999, background: CRIE.ink,
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>
          </svg>
        </div>
      </div>
    </Card>
  );
}

function FunnelCard() {
  const data = [
    { m: 'Jan', v: 38 }, { m: 'Fev', v: 55 }, { m: 'Mar', v: 41 },
    { m: 'Abr', v: 72 }, { m: 'Mai', v: 90 }, { m: 'Jun', v: 68 },
    { m: 'Jul', v: 82 }, { m: 'Ago', v: 50 }, { m: 'Set', v: 95 },
    { m: 'Out', v: 74 }, { m: 'Nov', v: 58 }, { m: 'Dez', v: 40 },
  ];
  const max = 100;
  return (
    <Card title="Publicações por mês" rightSelector="Mensal">
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 180, gap: 8, padding: '14px 4px 8px',
        borderBottom: `1px dashed ${CRIE.line}` }}>
        {data.map((d, i) => {
          const h = (d.v / max) * 170;
          const isPeak = d.v === Math.max(...data.map((x) => x.v));
          return (
            <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', height: h, borderRadius: '10px 10px 4px 4px',
                background: isPeak ? CRIE.butterDeep : CRIE.butter,
                boxShadow: isPeak ? `inset 0 -6px 0 ${CRIE.butterInk}22` : 'none',
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '8px 4px 0' }}>
        {data.map((d) => (
          <div key={d.m} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: CRIE.muted }}>{d.m}</div>
        ))}
      </div>
    </Card>
  );
}

function Card({ title, rightSelector, children, dark = false, pad = 18 }) {
  return (
    <div style={{
      background: dark ? CRIE.ink : CRIE.card,
      color: dark ? '#fff' : CRIE.ink,
      border: `1px solid ${dark ? 'transparent' : CRIE.line}`,
      borderRadius: 22, padding: pad, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        {rightSelector && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : CRIE.line}`,
            fontSize: 12, color: dark ? '#D6D6CF' : CRIE.inkSoft,
          }}>
            {rightSelector}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4.5l3 3 3-3"/></svg>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function UpcomingCard() {
  const items = [
    { when: 'Segunda 22/abr 2025', title: 'Aprovar carrossel do @cafebonito' },
    { when: 'Quarta 24/abr 2025',  title: 'Brief de lançamento • @modazen' },
    { when: 'Quinta 25/abr 2025',  title: 'Revisão final do Reel institucional' },
    { when: 'Sexta 26/abr 2025',   title: 'Agenda mensal da @padariaestrela' },
    { when: 'Segunda 29/abr 2025', title: 'Relatório de performance • Maio' },
    { when: 'Terça 30/abr 2025',   title: 'Publicar stories da @viververde' },
  ];
  return (
    <Card title="Próximas entregas" rightSelector={<span style={{ background: CRIE.ink, color: '#fff', padding: '4px 10px', borderRadius: 999, fontSize: 11 }}>Ver tudo</span>}>
      <div style={{ color: CRIE.muted, fontSize: 12, marginBottom: 10 }}>Briefs, aprovações e publicações previstas.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            border: `1px solid ${CRIE.line}`, borderRadius: 14, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, color: CRIE.muted, marginBottom: 2 }}>{it.when}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: CRIE.ink }}>{it.title}</div>
            </div>
            <div style={{ color: CRIE.muted, fontSize: 18, letterSpacing: 2 }}>⋮</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CountdownCard() {
  return (
    <Card title=" " pad={22}>
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.5, lineHeight: 1.05, color: CRIE.ink }}>
        7 dias<br/>para lançar
      </div>
      <div style={{ color: CRIE.muted, fontSize: 12.5, marginTop: 8, maxWidth: 240 }}>
        Campanha de outono da @cafebonito entra no ar. 9 posts aprovados, 3 pendentes.
      </div>
      <div style={{ marginTop: 14 }}>
        <DotMatrix rows={3} cols={11} filled={0.64} />
      </div>
    </Card>
  );
}

function TopCreatorsCard() {
  const rows = [
    { name: 'Ana Rocha',    role: 'Copywriter', initials: 'AR', tone: '#EFC79A' },
    { name: 'Marina Silva', role: 'Designer',   initials: 'MS', tone: '#C6D3A3' },
    { name: 'Júlia Prado',  role: 'Estrategista', initials: 'JP', tone: '#B8C0E0' },
  ];
  return (
    <div style={{ background: CRIE.ink, color: '#fff', borderRadius: 22, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Top criadores</div>
        <div style={{ display: 'flex', gap: 6, background: '#1C1C1A', padding: 3, borderRadius: 999 }}>
          <span style={{ padding: '4px 10px', fontSize: 11, color: '#D6D6CF' }}>Mês</span>
          <span style={{ padding: '4px 10px', fontSize: 11, background: CRIE.butter, color: CRIE.ink, borderRadius: 999, fontWeight: 600 }}>Ano</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 999, background: r.tone,
              display: 'grid', placeItems: 'center', color: CRIE.ink, fontWeight: 600, fontSize: 13,
            }}>{r.initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 11.5, color: '#A5A59B' }}>{r.role}</div>
            </div>
            <ArrowChip size={30} dark={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CrieDesktop() {
  return (
    <div style={{
      width: 1280, height: 820, background: CRIE.paper, display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif', color: CRIE.ink,
    }}>
      <CrieSidebar/>
      <main style={{ flex: 1, padding: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <HeroBand/>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.45fr 1.3fr', gap: 16, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
            <ApprovalCard/>
            <CountdownCard/>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
            <FunnelCard/>
            <TopCreatorsCard/>
          </div>
          <UpcomingCard/>
        </div>
      </main>
    </div>
  );
}
window.CrieDesktop = CrieDesktop;
