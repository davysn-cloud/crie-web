// crie-pages-overview.jsx — Dashboard (admin home) + Kanban board

// ─── DASHBOARD ───────────────────────────────────────────────────
function StatCard({ label, value, sub, subColor }) {
  return (
    <PCard style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ fontSize:12, color:CRIE.muted }}>{label}</div>
      <div style={{ fontSize:38, fontWeight:700, letterSpacing:-1.5, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:subColor||CRIE.muted }}>{sub}</div>}
    </PCard>
  );
}

function RingChart({ pct, label }) {
  const r=68, circ=2*Math.PI*r, off=circ*(1-pct/100);
  return (
    <PCard style={{ display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <div style={{ fontSize:15, fontWeight:600 }}>Taxa de aprovação</div>
        <select style={{ border:`1px solid ${CRIE.line}`, borderRadius:999, padding:'4px 10px', fontSize:12, color:CRIE.ink, background:'#fff', cursor:'pointer' }}>
          <option>Mensal</option><option>Anual</option>
        </select>
      </div>
      <div style={{ display:'grid', placeItems:'center', padding:'14px 0', position:'relative' }}>
        <svg width="186" height="186" viewBox="0 0 186 186">
          <circle cx="93" cy="93" r={r} stroke={CRIE.line} strokeWidth="14" fill="none" strokeDasharray="2 6" strokeLinecap="round"/>
          <circle cx="93" cy="93" r={r} stroke={CRIE.butter} strokeWidth="14" fill="none"
            strokeDasharray={`${circ-off} ${off}`} strokeLinecap="round"
            transform="rotate(-90 93 93)" style={{ transition:'stroke-dasharray .6s ease' }}/>
        </svg>
        <div style={{ position:'absolute', textAlign:'center' }}>
          <div style={{ fontSize:36, fontWeight:700, color:CRIE.butterInk, letterSpacing:-1 }}>{pct}%</div>
          <div style={{ fontSize:11, color:CRIE.muted }}>aprovados</div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:12, color:CRIE.muted }}>{label}</span>
        <div style={{ width:32, height:32, borderRadius:999, background:CRIE.ink, display:'grid', placeItems:'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>
        </div>
      </div>
    </PCard>
  );
}

function BarChart() {
  const data = [
    {m:'Jan',v:38},{m:'Fev',v:55},{m:'Mar',v:41},{m:'Abr',v:72},
    {m:'Mai',v:90},{m:'Jun',v:68},{m:'Jul',v:82},{m:'Ago',v:50},
    {m:'Set',v:95},{m:'Out',v:74},{m:'Nov',v:58},{m:'Dez',v:40},
  ];
  const mx=100;
  return (
    <PCard style={{ display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight:600 }}>Publicações por mês</div>
        <select style={{ border:`1px solid ${CRIE.line}`, borderRadius:999, padding:'4px 10px', fontSize:12, color:CRIE.ink, background:'#fff', cursor:'pointer' }}>
          <option>Mensal</option><option>Anual</option>
        </select>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', height:160, gap:6, borderBottom:`1px dashed ${CRIE.line}`, paddingBottom:6 }}>
        {data.map(d => {
          const pk=d.v===Math.max(...data.map(x=>x.v));
          return (
            <div key={d.m} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' }}>
              <div style={{
                width:'100%', height:`${(d.v/mx)*148}px`, borderRadius:'8px 8px 3px 3px',
                background: pk ? CRIE.butterDeep : CRIE.butter,
                transition:'height .4s ease',
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:6, marginTop:6 }}>
        {data.map(d => <div key={d.m} style={{ flex:1, textAlign:'center', fontSize:10, color:CRIE.muted }}>{d.m}</div>)}
      </div>
    </PCard>
  );
}

function UpcomingList() {
  const items = [
    {when:'Seg 22/abr',title:'Aprovar carrossel • @cafebonito'},
    {when:'Qua 24/abr',title:'Brief lançamento • @modazen'},
    {when:'Qui 25/abr',title:'Revisão Reel institucional'},
    {when:'Sex 26/abr',title:'Agenda mensal • @padariaestrela'},
    {when:'Seg 29/abr',title:'Relatório de performance'},
    {when:'Ter 30/abr',title:'Publicar stories • @viververde'},
  ];
  return (
    <PCard style={{ display:'flex', flexDirection:'column', gridRow:'span 2' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
        <div style={{ fontSize:15, fontWeight:600 }}>Próximas entregas</div>
        <Btn size="sm" onClick={() => window.navigateTo('calendar')}>Ver tudo</Btn>
      </div>
      <div style={{ fontSize:12, color:CRIE.muted, marginBottom:12 }}>Briefs, aprovações e publicações previstas.</div>
      <div style={{ display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }}>
        {items.map((it,i) => (
          <div key={i} style={{ border:`1px solid ${CRIE.line}`, borderRadius:14, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
            onMouseEnter={e=>e.currentTarget.style.background=CRIE.lineSoft}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            <div>
              <div style={{ fontSize:10.5, color:CRIE.muted, marginBottom:2 }}>{it.when}, 2025</div>
              <div style={{ fontSize:13.5, fontWeight:500 }}>{it.title}</div>
            </div>
            <div style={{ color:CRIE.mutedSoft, letterSpacing:2 }}>⋮</div>
          </div>
        ))}
      </div>
    </PCard>
  );
}

function TopCreators() {
  const rows=[
    {name:'Ana Rocha',role:'Copywriter',ini:'AR',bg:'#EFC79A'},
    {name:'Marina Silva',role:'Designer',ini:'MS',bg:'#C6D3A3'},
    {name:'Júlia Prado',role:'Estrategista',ini:'JP',bg:'#B8C0E0'},
  ];
  return (
    <div style={{ background:CRIE.ink, borderRadius:22, padding:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:15, fontWeight:600, color:'#fff' }}>Top criadores</div>
        <div style={{ display:'flex', background:'#1C1C1A', borderRadius:999, padding:3 }}>
          <span style={{ padding:'4px 10px', fontSize:11, color:'#A5A59B' }}>Mês</span>
          <span style={{ padding:'4px 10px', fontSize:11, background:CRIE.butter, color:CRIE.ink, borderRadius:999, fontWeight:600 }}>Ano</span>
        </div>
      </div>
      {rows.map(r => (
        <div key={r.name} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:36, height:36, borderRadius:999, background:r.bg, display:'grid', placeItems:'center', color:CRIE.ink, fontWeight:600, fontSize:12 }}>{r.ini}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13.5, fontWeight:500, color:'#fff' }}>{r.name}</div>
            <div style={{ fontSize:11, color:'#A5A59B' }}>{r.role}</div>
          </div>
          <div style={{ width:28, height:28, borderRadius:999, background:'rgba(255,255,255,0.1)', display:'grid', placeItems:'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M4 10L10 4M10 4H5M10 4V9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      ))}
    </div>
  );
}

function CountdownWidget() {
  return (
    <PCard>
      <div style={{ fontSize:32, fontWeight:700, letterSpacing:-1, lineHeight:1.1, marginBottom:8 }}>7 dias<br/>para lançar</div>
      <div style={{ fontSize:12.5, color:CRIE.muted, marginBottom:14 }}>Campanha de outono da @cafebonito. 9 posts aprovados, 3 pendentes.</div>
      <DotMatrix rows={3} cols={12} filled={0.75}/>
    </PCard>
  );
}

function DashboardPage() {
  return (
    <div style={{ padding:24, display:'flex', flexDirection:'column', gap:18 }}>
      {/* Hero band */}
      <div style={{
        borderRadius:24, overflow:'hidden', height:220, position:'relative',
        background:'linear-gradient(135deg,#B7CDA5 0%,#92AE87 55%,#6A9068 100%)',
      }}>
        <svg style={{ position:'absolute', right:0, bottom:0, width:'65%', height:'100%' }} viewBox="0 0 700 220" preserveAspectRatio="xMaxYMax slice">
          <defs><linearGradient id="dome2" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4F7370"/><stop offset="1" stopColor="#2B4A4A"/></linearGradient></defs>
          <ellipse cx="520" cy="30" rx="180" ry="20" fill="#F0F3E3" opacity="0.5"/>
          <path d="M350 220 Q440 80 560 80 T750 220 Z" fill="url(#dome2)" opacity="0.8"/>
          {Array.from({length:12}).map((_,i)=>(
            <path key={i} d={`M360 ${200-i*9} Q560 ${100-i*7} 750 ${200-i*9}`} stroke="#8BB0A8" strokeWidth="0.5" fill="none" opacity="0.5"/>
          ))}
        </svg>
        <div style={{ position:'absolute', inset:0, padding:'22px 26px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
          <div style={{ fontSize:20, fontWeight:700 }}>Atelier Canto</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1.3fr', gap:12 }}>
            {[
              {label:'Marcas', value:'12', icon:'🏢'},
              {label:'Posts este mês', value:'147', icon:'📄'},
              {label:'Aprovados de 1ª', value:'89%', icon:'✅'},
            ].map(s => (
              <div key={s.label} style={{
                background:'rgba(255,255,255,0.72)', backdropFilter:'blur(16px)',
                border:'1px solid rgba(255,255,255,0.5)', borderRadius:16, padding:14,
              }}>
                <div style={{ fontSize:11.5, marginBottom:6 }}>{s.label}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                  <div style={{ fontSize:30, fontWeight:700, letterSpacing:-1 }}>{s.value}</div>
                  <div style={{ width:24, height:24, borderRadius:999, background:'rgba(0,0,0,0.07)', display:'grid', placeItems:'center', fontSize:12 }}>{s.icon}</div>
                </div>
              </div>
            ))}
            <div style={{ background:CRIE.butter, border:`1px solid ${CRIE.butterDeep}`, borderRadius:16, padding:14 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Convidar equipe</div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ flex:1, padding:'7px 0', background:'rgba(255,255,255,0.7)', border:`1px solid ${CRIE.butterDeep}`, borderRadius:999, fontSize:11, fontWeight:500, cursor:'pointer' }}>+ Copy</button>
                <button style={{ flex:1, padding:'7px 0', background:'rgba(255,255,255,0.7)', border:`1px solid ${CRIE.butterDeep}`, borderRadius:999, fontSize:11, fontWeight:500, cursor:'pointer' }}>+ Designer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        <StatCard label="Posts este mês" value="47" sub="↑12% vs mês anterior" subColor="#22C55E"/>
        <StatCard label="Aprovados de 1ª" value="78%" sub="Meta: 85%"/>
        <StatCard label="Tempo médio aprox." value="4.2h" sub="↓ de 6.1h" subColor="#22C55E"/>
        <StatCard label="Backlog pendente" value="12" sub="3 urgentes (<24h)" subColor="#F59E0B"/>
      </div>
      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr 1.2fr', gap:14, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <RingChart pct={84} label="Aprovados de 1ª" />
          <CountdownWidget/>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <BarChart/>
          <TopCreators/>
        </div>
        <UpcomingList/>
      </div>
    </div>
  );
}
window.DashboardPage = DashboardPage;

// ─── KANBAN BOARD ────────────────────────────────────────────────
const STAGE_COLORS = {
  ideacao:  { bg:'#F1F5F9', dot:'#94A3B8', label:'Ideação' },
  criacao:  { bg:'#EFF6FF', dot:'#3B82F6', label:'Em criação' },
  aprovacao:{ bg:'#FFFBEB', dot:'#F59E0B', label:'Aprovação' },
  agendado: { bg:'#ECFEFF', dot:'#06B6D4', label:'Agendado' },
  publicado:{ bg:'#F0FDF4', dot:'#22C55E', label:'Publicado' },
};
const PILLAR_COLORS = { Educativo:'#8B5CF6', Inspiração:'#0EA5E9', Promocional:'#F43F5E', Bastidores:'#10B981' };
const MOCK_CARDS = [
  { id:1, stage:'ideacao',  title:'5 dicas para acelerar aprovação de posts', pillar:'Educativo',  brand:'@cafebonito',  assignee:'AR', date:'22 abr', comments:2, format:'Carrossel' },
  { id:2, stage:'ideacao',  title:'Novidades da nossa padaria artesanal',     pillar:'Bastidores', brand:'@padariaestrela', assignee:'MS', date:'24 abr', comments:0, format:'Reel' },
  { id:3, stage:'criacao',  title:'Como o Crie! elimina o WhatsApp do fluxo', pillar:'Educativo', brand:'@cafebonito',  assignee:'AR', date:'23 abr', comments:5, format:'Carrossel' },
  { id:4, stage:'criacao',  title:'Tendências de moda verão 2025',            pillar:'Inspiração', brand:'@modazen',     assignee:'JP', date:'25 abr', comments:1, format:'Feed 4:5' },
  { id:5, stage:'aprovacao',title:'Campanha dia das mães • teaser',           pillar:'Promocional',brand:'@modazen',     assignee:'MS', date:'26 abr', comments:3, format:'Story' },
  { id:6, stage:'aprovacao',title:'Receita especial de pão de queijo',        pillar:'Bastidores', brand:'@padariaestrela', assignee:'AR', date:'27 abr', comments:1, format:'Reel' },
  { id:7, stage:'agendado', title:'Lançamento linha outono 2025',             pillar:'Promocional',brand:'@modazen',     assignee:'JP', date:'28 abr', comments:0, format:'Carrossel' },
  { id:8, stage:'publicado',title:'Sustentabilidade no dia a dia',            pillar:'Educativo',  brand:'@viververde',  assignee:'MS', date:'20 abr', comments:4, format:'Feed 1:1' },
  { id:9, stage:'publicado',title:'Workshop de permacultura — abertura',      pillar:'Inspiração', brand:'@viververde',  assignee:'JP', date:'19 abr', comments:2, format:'Story' },
];

function KanbanCard({ card, onClick }) {
  const pc = PILLAR_COLORS[card.pillar] || '#8B8B82';
  return (
    <div onClick={() => onClick(card)}
      style={{
        background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:16, padding:14,
        cursor:'pointer', transition:'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e=>{ e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'; e.currentTarget.style.transform='translateY(-1px)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
      {/* Thumbnail */}
      <div style={{ height:80, borderRadius:10, background:`repeating-linear-gradient(135deg,${CRIE.lineSoft} 0 10px,${CRIE.line} 10px 20px)`, marginBottom:10, position:'relative', overflow:'hidden' }}>
        <span style={{ position:'absolute', bottom:6, left:8, fontFamily:'ui-monospace,monospace', fontSize:9.5, color:CRIE.muted, background:'rgba(255,255,255,0.7)', padding:'2px 6px', borderRadius:4, textTransform:'uppercase' }}>{card.format}</span>
      </div>
      <div style={{ fontSize:13.5, fontWeight:500, lineHeight:1.4, marginBottom:8, color:CRIE.ink,
        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {card.title}
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
        <span style={{ fontSize:10.5, padding:'2px 8px', borderRadius:999, background:pc+'18', color:pc, fontWeight:500 }}>{card.pillar}</span>
        <span style={{ fontSize:10.5, color:CRIE.muted }}>{card.brand}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:10, fontSize:11, color:CRIE.muted, alignItems:'center' }}>
          <div style={{ width:22, height:22, borderRadius:999, background:CRIE.butter, display:'grid', placeItems:'center', fontSize:9, fontWeight:700, color:CRIE.ink }}>{card.assignee}</div>
          <span>📅 {card.date}</span>
          {card.comments > 0 && <span>💬 {card.comments}</span>}
        </div>
      </div>
    </div>
  );
}

function CardDetailPanel({ card, onClose }) {
  const [stage, setStage] = React.useState(card.stage);
  if (!card) return null;
  return (
    <div style={{
      position:'fixed', right:0, top:0, bottom:0, width:440,
      background:'#fff', borderLeft:`1px solid ${CRIE.line}`, zIndex:200,
      display:'flex', flexDirection:'column',
      boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',
      animation:'slideIn .2s ease',
    }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>
      <div style={{ padding:'18px 20px', borderBottom:`1px solid ${CRIE.line}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:15, fontWeight:600 }}>Detalhe do post</div>
        <button onClick={onClose} style={{ width:32, height:32, borderRadius:999, border:`1px solid ${CRIE.line}`, background:'#fff', cursor:'pointer', display:'grid', placeItems:'center', fontSize:18, color:CRIE.muted }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:20 }}>
        {/* Thumb */}
        <div style={{ height:200, borderRadius:14, background:`repeating-linear-gradient(135deg,${CRIE.lineSoft} 0 14px,${CRIE.line} 14px 28px)`, marginBottom:16, display:'flex', alignItems:'flex-end', padding:12 }}>
          <span style={{ fontFamily:'ui-monospace,monospace', fontSize:10, color:CRIE.muted, background:'rgba(255,255,255,0.7)', padding:'3px 8px', borderRadius:6, textTransform:'uppercase' }}>{card.format}</span>
        </div>
        {/* Title */}
        <div style={{ fontSize:18, fontWeight:700, letterSpacing:-0.4, marginBottom:10 }}>{card.title}</div>
        {/* Stage stepper */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:8 }}>Etapa</div>
          <div style={{ display:'flex', gap:4 }}>
            {Object.entries(STAGE_COLORS).map(([k,s]) => (
              <button key={k} onClick={() => setStage(k)} style={{
                flex:1, padding:'6px 0', borderRadius:8, border:'none', cursor:'pointer',
                background: stage===k ? s.dot : CRIE.lineSoft,
                color: stage===k ? '#fff' : CRIE.muted,
                fontSize:10, fontWeight:500, transition:'all .15s',
              }}>{s.label.split(' ')[0]}</button>
            ))}
          </div>
        </div>
        {/* Meta */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {[['Marca',card.brand],['Pilar',card.pillar],['Formato',card.format],['Data',card.date+'/25']].map(([k,v])=>(
            <div key={k} style={{ background:CRIE.lineSoft, borderRadius:12, padding:'10px 12px' }}>
              <div style={{ fontSize:10.5, color:CRIE.muted, marginBottom:2 }}>{k}</div>
              <div style={{ fontSize:13.5, fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Caption */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:8 }}>Legenda</div>
          <textarea defaultValue="Você sabia que 80% das agências ainda aprovam conteúdo pelo WhatsApp? 🤯 Descubra como a Crie! muda isso..." rows={4} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13, fontFamily:'JetBrains Mono, ui-monospace, monospace', resize:'none', outline:'none', boxSizing:'border-box', color:CRIE.ink }}/>
          <div style={{ fontSize:11, color:CRIE.muted, textAlign:'right', marginTop:4 }}>234/2200 chars</div>
        </div>
        {/* Comments */}
        <div>
          <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:8 }}>Comentários</div>
          {[
            {who:'Ana R.',when:'hoje 14:32',text:'Caption aprovada! Só ajustar o CTA final.'},
            {who:'Carlos M.',when:'ontem 16:00',text:'Arte precisa de mais contraste no texto.'},
          ].map((c,i)=>(
            <div key={i} style={{ display:'flex', gap:10, marginBottom:12 }}>
              <div style={{ width:28, height:28, borderRadius:999, background:CRIE.butter, display:'grid', placeItems:'center', fontSize:10, fontWeight:700, flex:'none' }}>{c.who.split(' ').map(x=>x[0]).join('')}</div>
              <div>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                  <span style={{ fontSize:12.5, fontWeight:600 }}>{c.who}</span>
                  <span style={{ fontSize:11, color:CRIE.muted }}>{c.when}</span>
                </div>
                <div style={{ fontSize:12.5, color:CRIE.inkSoft }}>{c.text}</div>
              </div>
            </div>
          ))}
          <input placeholder="Adicionar comentário…" style={{ width:'100%', padding:'9px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/>
        </div>
      </div>
      <div style={{ padding:'14px 20px', borderTop:`1px solid ${CRIE.line}`, display:'flex', gap:8 }}>
        <Btn variant="secondary" style={{ flex:1 }} onClick={onClose}>Fechar</Btn>
        <Btn variant="butter" style={{ flex:1 }} onClick={() => window.navigateTo('copy-write')}>Editar legenda</Btn>
        <Btn style={{ flex:1 }}>Enviar para aprovação</Btn>
      </div>
    </div>
  );
}

function KanbanPage() {
  const [cards, setCards] = React.useState(MOCK_CARDS);
  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState('all');
  const stages = Object.keys(STAGE_COLORS);
  const filtered = filter === 'all' ? cards : cards.filter(c => c.brand === filter);
  return (
    <div style={{ padding:'0 0 0 0', display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Filter bar */}
      <div style={{ padding:'16px 24px 12px', borderBottom:`1px solid ${CRIE.line}`, display:'flex', gap:10, alignItems:'center', flexShrink:0, background:CRIE.bg }}>
        <div style={{ display:'flex', gap:6 }}>
          {[{id:'all',label:'Todos'},
            {id:'@cafebonito',label:'@cafebonito'},
            {id:'@modazen',label:'@modazen'},
            {id:'@viververde',label:'@viververde'}].map(f=>(
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{
              padding:'6px 14px', borderRadius:999, border:`1.5px solid ${filter===f.id ? CRIE.ink : CRIE.line}`,
              background: filter===f.id ? CRIE.ink : '#fff', color: filter===f.id ? '#fff' : CRIE.ink,
              fontSize:12, fontWeight:500, cursor:'pointer',
            }}>{f.label}</button>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <Btn onClick={() => {}} variant="butter">+ Novo post</Btn>
      </div>
      {/* Columns */}
      <div style={{ flex:1, overflowX:'auto', display:'flex', gap:14, padding:'16px 24px', alignItems:'flex-start', minHeight:0 }}>
        {stages.map(stage => {
          const sc = STAGE_COLORS[stage];
          const stageCards = filtered.filter(c => c.stage === stage);
          return (
            <div key={stage} style={{ width:280, flexShrink:0, background:sc.bg, borderRadius:20, padding:14, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ width:8, height:8, borderRadius:999, background:sc.dot }}/>
                  <span style={{ fontSize:13, fontWeight:600 }}>{sc.label}</span>
                  <span style={{ fontSize:12, color:CRIE.muted, background:'rgba(0,0,0,0.06)', padding:'1px 7px', borderRadius:999 }}>{stageCards.length}</span>
                </div>
                <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:CRIE.muted }}>+</button>
              </div>
              {stageCards.map(card=>(
                <KanbanCard key={card.id} card={card} onClick={setSelected}/>
              ))}
              {stageCards.length===0 && (
                <div style={{ padding:'24px 0', textAlign:'center', color:CRIE.muted, fontSize:12.5 }}>Nenhum post aqui</div>
              )}
            </div>
          );
        })}
      </div>
      {selected && <CardDetailPanel card={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}
window.KanbanPage = KanbanPage;
