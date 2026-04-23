// crie-layout.jsx — AppShell: Sidebar + Topbar + content slot

const NAV_GROUPS = [
  { items: [
    { id:'dashboard', label:'Início',      route:'dashboard', icon:'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { id:'board',     label:'Board',       route:'board',     icon:'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 0a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2' },
  ]},
  { label:'Estratégia', items: [
    { id:'calendar', label:'Calendário', route:'calendar', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id:'pillars',  label:'Pilares',    route:'pillars',  icon:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  ]},
  { label:'Criação', items: [
    { id:'copy',   label:'Copy',        route:'copy',   icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id:'assets', label:'Assets',      route:'assets', icon:'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id:'brandkit',label:'Brand Kit',  route:'brandkit',icon:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
  ]},
  { label:'Publicação', items: [
    { id:'queue', label:'Fila',        route:'queue', icon:'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
    { id:'grid',  label:'Grid Planner',route:'grid',  icon:'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z' },
  ]},
];
const BOTTOM_NAV = [
  { id:'team',   label:'Equipe',   route:'team',    icon:'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id:'billing',label:'Plano',    route:'billing', icon:'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { id:'settings',label:'Config.', route:'settings',icon:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function NavIco({ d, sz=20, color=CRIE.inkSoft }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

function Sidebar({ route }) {
  const [hov, setHov] = React.useState(null);
  return (
    <aside style={{
      width: 62, background: CRIE.paper, borderRight: `1px solid ${CRIE.line}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 0', gap: 0, flexShrink: 0, zIndex: 20, position: 'relative',
    }}>
      <div style={{ marginBottom: 14, cursor:'pointer' }} onClick={() => window.navigateTo('dashboard')}>
        <CrieMark size={28}/>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:0, width:'100%', alignItems:'center' }}>
        {NAV_GROUPS.map((g, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div style={{ width:28, height:1, background:CRIE.line, margin:'5px 0' }}/>}
            {g.items.map(it => {
              const active = route === it.route;
              return (
                <div key={it.id} style={{ position:'relative', width:'100%', display:'flex', justifyContent:'center' }}>
                  <button onClick={() => window.navigateTo(it.route)}
                    onMouseEnter={() => setHov(it.id)} onMouseLeave={() => setHov(null)}
                    style={{
                      width:44, height:44, borderRadius:12, border:'none', cursor:'pointer',
                      background: active ? CRIE.butter : hov===it.id ? CRIE.lineSoft : 'transparent',
                      display:'grid', placeItems:'center', transition:'background .12s',
                    }}>
                    <NavIco d={it.icon} color={active ? CRIE.butterInk : CRIE.inkSoft}/>
                  </button>
                  {hov === it.id && (
                    <div style={{
                      position:'absolute', left:'105%', top:'50%', transform:'translateY(-50%)',
                      background:CRIE.ink, color:'#fff', fontSize:11.5, fontWeight:500,
                      padding:'4px 10px', borderRadius:8, whiteSpace:'nowrap', pointerEvents:'none',
                      boxShadow:'0 4px 14px rgba(0,0,0,0.18)', zIndex:50,
                    }}>{it.label}</div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ borderTop:`1px solid ${CRIE.line}`, paddingTop:6, display:'flex', flexDirection:'column', gap:0, width:'100%', alignItems:'center' }}>
        {BOTTOM_NAV.map(it => {
          const active = route === it.route;
          return (
            <div key={it.id} style={{ position:'relative', width:'100%', display:'flex', justifyContent:'center' }}>
              <button onClick={() => window.navigateTo(it.route)}
                onMouseEnter={() => setHov(it.id)} onMouseLeave={() => setHov(null)}
                style={{
                  width:44, height:44, borderRadius:12, border:'none', cursor:'pointer',
                  background: active ? CRIE.butter : hov===it.id ? CRIE.lineSoft : 'transparent',
                  display:'grid', placeItems:'center', transition:'background .12s',
                }}>
                <NavIco d={it.icon} color={active ? CRIE.butterInk : CRIE.muted}/>
              </button>
              {hov === it.id && (
                <div style={{
                  position:'absolute', left:'105%', top:'50%', transform:'translateY(-50%)',
                  background:CRIE.ink, color:'#fff', fontSize:11.5, fontWeight:500,
                  padding:'4px 10px', borderRadius:8, whiteSpace:'nowrap', pointerEvents:'none', zIndex:50,
                }}>{it.label}</div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

const BRANDS_LIST = [
  { id:'cafebonito', name:'Café Bonito',      handle:'@cafebonito',      color:'#EEF0A8' },
  { id:'modazen',    name:'Moda Zen',          handle:'@modazen',         color:'#C6D3A3' },
  { id:'viververde', name:'Viver Verde',       handle:'@viververde',      color:'#B8C0E0' },
  { id:'padariaestrela', name:'Padaria Estrela', handle:'@padariaestrela', color:'#F0C9CC' },
];

const PAGE_TITLES = {
  dashboard:'Início', board:'Board de Conteúdo', calendar:'Calendário Editorial',
  pillars:'Pilares de Conteúdo', copy:'Caixa de Copy', 'copy-write':'Editor de Legenda',
  assets:'Biblioteca de Assets', brandkit:'Brand Kit', queue:'Fila de Publicação',
  grid:'Grid Planner', team:'Equipe', brands:'Marcas', billing:'Plano & Cobrança',
  integrations:'Integrações', audit:'Log de Auditoria', whitelabel:'White-label',
  notifications:'Notificações', settings:'Configurações',
};

function Topbar({ route, brand, setBrand, notifCount=3 }) {
  const [brandOpen, setBrandOpen] = React.useState(false);
  const cur = BRANDS_LIST.find(b => b.id === brand) || BRANDS_LIST[0];
  return (
    <header style={{
      height: 58, background: CRIE.paper, borderBottom: `1px solid ${CRIE.line}`,
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 10, flexShrink: 0, zIndex: 10,
    }}>
      <div style={{ fontSize:15, fontWeight:700, letterSpacing:-0.4, whiteSpace:'nowrap' }}>
        {PAGE_TITLES[route] || 'Crie!'}
      </div>

      {/* Brand selector */}
      <div style={{ position:'relative' }}>
        <button onClick={() => setBrandOpen(b => !b)} style={{
          display:'flex', alignItems:'center', gap:7, padding:'5px 12px 5px 7px',
          borderRadius:999, border:`1px solid ${CRIE.line}`, background:'#fff', cursor:'pointer', fontSize:12.5,
        }}>
          <div style={{ width:22, height:22, borderRadius:7, background:cur.color, display:'grid', placeItems:'center', fontSize:9, fontWeight:700 }}>{cur.name[0]}</div>
          <span style={{ fontWeight:500 }}>{cur.name}</span>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={CRIE.muted} strokeWidth="1.5"><path d="M3 4.5l3 3 3-3"/></svg>
        </button>
        {brandOpen && (
          <div style={{
            position:'absolute', top:'110%', left:0, minWidth:210, background:'#fff',
            border:`1px solid ${CRIE.line}`, borderRadius:14, boxShadow:'0 8px 30px rgba(0,0,0,0.12)',
            overflow:'hidden', zIndex:100,
          }}>
            {BRANDS_LIST.map(b => (
              <button key={b.id} onClick={() => { setBrand(b.id); setBrandOpen(false); }} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 13px',
                border:'none', background: b.id===brand ? CRIE.lineSoft : '#fff',
                cursor:'pointer', fontSize:12.5, textAlign:'left', fontFamily:'Inter,sans-serif',
              }}>
                <div style={{ width:24, height:24, borderRadius:8, background:b.color, display:'grid', placeItems:'center', fontSize:9, fontWeight:700 }}>{b.name[0]}</div>
                <div>
                  <div style={{ fontWeight:500, color:CRIE.ink }}>{b.name}</div>
                  <div style={{ fontSize:11, color:CRIE.muted }}>{b.handle}</div>
                </div>
              </button>
            ))}
            <div style={{ borderTop:`1px solid ${CRIE.line}`, padding:'8px 13px' }}>
              <button onClick={() => { window.navigateTo('brands'); setBrandOpen(false); }} style={{
                background:'none', border:'none', cursor:'pointer', fontSize:11.5, color:CRIE.muted, fontFamily:'Inter,sans-serif',
              }}>+ Gerenciar marcas</button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div style={{
        flex:1, maxWidth:380, margin:'0 auto',
        display:'flex', alignItems:'center', gap:8, background:'#fff',
        border:`1px solid ${CRIE.line}`, borderRadius:999, padding:'7px 14px',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CRIE.muted} strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
        </svg>
        <input placeholder="Buscar posts, marcas, briefs…" style={{
          border:'none', outline:'none', background:'transparent',
          flex:1, fontSize:12.5, color:CRIE.ink, fontFamily:'Inter,system-ui,sans-serif',
        }}/>
        <span style={{ fontSize:10.5, color:CRIE.muted, fontFamily:'ui-monospace,monospace' }}>⌘K</span>
      </div>

      {/* Icons */}
      <div style={{ display:'flex', gap:7, alignItems:'center' }}>
        <div style={{ position:'relative' }}>
          <button onClick={() => window.navigateTo('notifications')} style={{
            width:36, height:36, borderRadius:10, border:`1px solid ${CRIE.line}`,
            background:'#fff', cursor:'pointer', display:'grid', placeItems:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 8a6 6 0 1112 0v5l1.5 3h-15L6 13z"/><path d="M10 20a2 2 0 004 0"/>
            </svg>
          </button>
          {notifCount > 0 && <span style={{
            position:'absolute', top:5, right:5,
            width:7, height:7, background:'#EF4444', borderRadius:999, border:`2px solid ${CRIE.paper}`,
          }}/>}
        </div>
        <button onClick={() => window.navigateTo('settings')} style={{
          width:36, height:36, borderRadius:999, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#C9A07C,#8B6748)',
          color:'#fff', fontWeight:700, fontSize:12.5, fontFamily:'Inter,sans-serif',
        }}>AM</button>
      </div>
    </header>
  );
}

function AppShell({ route, brand, setBrand, children }) {
  return (
    <div style={{
      display:'flex', height:'100vh', width:'100vw', overflow:'hidden',
      fontFamily:"'Inter', system-ui, sans-serif", color:CRIE.ink, background:CRIE.bg,
    }}>
      <Sidebar route={route}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Topbar route={route} brand={brand} setBrand={setBrand}/>
        <main style={{ flex:1, overflow:'auto', background:CRIE.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Shared UI primitives
function Btn({ children, variant='primary', onClick, style={}, size='md' }) {
  const pad = size === 'sm' ? '6px 14px' : '10px 18px';
  const fs = size === 'sm' ? 12 : 13.5;
  const base = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:pad, borderRadius:999, border:'none', cursor:'pointer',
    fontSize:fs, fontWeight:600, fontFamily:'Inter,sans-serif', transition:'opacity .12s',
  };
  const variants = {
    primary: { background:CRIE.ink, color:'#fff' },
    secondary: { background:'#fff', color:CRIE.ink, border:`1px solid ${CRIE.line}` },
    butter: { background:CRIE.butter, color:CRIE.ink, border:`1px solid ${CRIE.butterDeep}` },
    ghost: { background:'transparent', color:CRIE.muted },
  };
  return <button onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>{children}</button>;
}

function PCard({ children, style={}, pad=20 }) {
  return (
    <div style={{
      background:CRIE.card, border:`1px solid ${CRIE.line}`, borderRadius:22,
      padding:pad, ...style,
    }}>{children}</div>
  );
}

function Badge({ label, color='#8B8B82', bg }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', padding:'3px 9px',
      borderRadius:999, fontSize:11.5, fontWeight:500,
      background: bg || color+'22', color,
    }}>{label}</span>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
      <h2 style={{ margin:0, fontSize:18, fontWeight:700, letterSpacing:-0.4 }}>{title}</h2>
      {action}
    </div>
  );
}

function EmptyState({ icon, title, body, cta, onCta }) {
  return (
    <div style={{ display:'grid', placeItems:'center', padding:'60px 20px', textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:17, fontWeight:600, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:13.5, color:CRIE.muted, marginBottom:20, maxWidth:280 }}>{body}</div>
      {cta && <Btn onClick={onCta}>{cta}</Btn>}
    </div>
  );
}

Object.assign(window, { AppShell, Btn, PCard, Badge, SectionHeader, EmptyState, NavIco, BRANDS_LIST, PAGE_TITLES });
