// crie-pages-strategy.jsx — Calendar, Pillars, Copy Inbox, Caption Editor

// ─── CALENDAR ────────────────────────────────────────────────────
const PILLAR_C = { Educativo:'#8B5CF6', Inspiração:'#0EA5E9', Promocional:'#F43F5E', Bastidores:'#10B981', Datas:'#F59E0B' };
const POSTS_BY_DAY = {
  '2025-04-07': [{p:'Educativo',t:'5 dicas de conteúdo'},{p:'Bastidores',t:'Tour pelo estúdio'}],
  '2025-04-09': [{p:'Promocional',t:'Oferta relâmpago'}],
  '2025-04-14': [{p:'Educativo',t:'Como usar o Crie!'},{p:'Inspiração',t:'Frase motivacional'},{p:'Datas',t:'Páscoa 2025'}],
  '2025-04-16': [{p:'Bastidores',t:'Equipe em ação'}],
  '2025-04-21': [{p:'Educativo',t:'Tutorial carrossel'},{p:'Promocional',t:'Black Friday teaser'}],
  '2025-04-22': [{p:'Inspiração',t:'Segunda motivacional'}],
  '2025-04-24': [{p:'Datas',t:'Dia das mães teaser'},{p:'Educativo',t:'Marketing de conteúdo 101'}],
  '2025-04-28': [{p:'Bastidores',t:'Making of campanha'}],
  '2025-04-30': [{p:'Promocional',t:'Encerramento mês'}],
};

function CalendarPage() {
  const [month] = React.useState({ year:2025, month:3 }); // April (0-indexed)
  const [selected, setSelected] = React.useState(null);
  const firstDay = new Date(month.year, month.month, 1).getDay();
  const daysInMonth = new Date(month.year, month.month+1, 0).getDate();
  const today = 22;
  const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return (
    <div style={{ padding:24, display:'flex', gap:18, height:'100%', boxSizing:'border-box', overflow:'hidden' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Abril 2025</h2>
            <div style={{ display:'flex', gap:4 }}>
              <button style={{ width:28, height:28, borderRadius:8, border:`1px solid ${CRIE.line}`, background:'#fff', cursor:'pointer', display:'grid', placeItems:'center' }}>‹</button>
              <button style={{ width:28, height:28, borderRadius:8, border:`1px solid ${CRIE.line}`, background:'#fff', cursor:'pointer', display:'grid', placeItems:'center' }}>›</button>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn variant="secondary" size="sm">Semana</Btn>
            <Btn variant="butter" size="sm">Mês</Btn>
            <Btn size="sm" onClick={()=>{}}>+ Novo brief</Btn>
          </div>
        </div>
        {/* Grid */}
        <PCard style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', padding:0 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:CRIE.lineSoft, borderBottom:`1px solid ${CRIE.line}` }}>
            {DAYS.map(d=>(
              <div key={d} style={{ padding:'10px 0', textAlign:'center', fontSize:11.5, fontWeight:600, color:CRIE.muted }}>{d}</div>
            ))}
          </div>
          <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'1fr', overflow:'auto' }}>
            {Array.from({length: firstDay}).map((_,i) => <div key={'e'+i} style={{ borderRight:`1px solid ${CRIE.line}`, borderBottom:`1px solid ${CRIE.line}` }}/>)}
            {Array.from({length: daysInMonth}).map((_,i) => {
              const day = i+1;
              const key = `2025-04-${String(day).padStart(2,'0')}`;
              const posts = POSTS_BY_DAY[key] || [];
              const isToday = day === today;
              const isSel = selected === day;
              return (
                <div key={day} onClick={()=>setSelected(isSel?null:day)} style={{
                  borderRight:`1px solid ${CRIE.line}`, borderBottom:`1px solid ${CRIE.line}`,
                  padding:'6px 8px', cursor:'pointer', minHeight:90,
                  background: isSel ? CRIE.butterWash : 'transparent',
                  transition:'background .1s',
                }}>
                  <div style={{
                    width:24, height:24, borderRadius:999, marginBottom:4,
                    background: isToday ? CRIE.ink : 'transparent',
                    color: isToday ? '#fff' : CRIE.ink,
                    display:'grid', placeItems:'center', fontSize:12, fontWeight: isToday ? 700 : 400,
                  }}>{day}</div>
                  {posts.slice(0,2).map((p,pi)=>(
                    <div key={pi} style={{
                      display:'flex', alignItems:'center', gap:4, marginBottom:3, padding:'2px 6px',
                      background:(PILLAR_C[p.p]||'#8B8B82')+'18', borderRadius:5,
                    }}>
                      <div style={{ width:5, height:5, borderRadius:999, background:PILLAR_C[p.p]||'#8B8B82', flex:'none' }}/>
                      <span style={{ fontSize:10, color:CRIE.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.t}</span>
                    </div>
                  ))}
                  {posts.length > 2 && <div style={{ fontSize:10, color:CRIE.muted }}>+{posts.length-2} mais</div>}
                </div>
              );
            })}
          </div>
        </PCard>
      </div>
      {/* Sidebar */}
      <div style={{ width:240, display:'flex', flexDirection:'column', gap:14, flexShrink:0 }}>
        <PCard pad={14}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Pilares do mês</div>
          {Object.entries(PILLAR_C).map(([p,c])=>(
            <div key={p} style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
                <span style={{ color:CRIE.inkSoft }}>{p}</span>
                <span style={{ color:CRIE.muted }}>{Math.floor(Math.random()*8+2)}</span>
              </div>
              <div style={{ height:5, borderRadius:99, background:CRIE.line }}>
                <div style={{ height:'100%', borderRadius:99, background:c, width:`${Math.floor(Math.random()*60+20)}%` }}/>
              </div>
            </div>
          ))}
        </PCard>
        {selected && POSTS_BY_DAY[`2025-04-${String(selected).padStart(2,'0')}`] && (
          <PCard pad={14}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Dia {selected} de abril</div>
            {(POSTS_BY_DAY[`2025-04-${String(selected).padStart(2,'0')}`]||[]).map((p,i)=>(
              <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:10 }}>
                <div style={{ width:8, height:8, borderRadius:999, background:PILLAR_C[p.p], marginTop:4, flex:'none' }}/>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:500 }}>{p.t}</div>
                  <div style={{ fontSize:11, color:CRIE.muted }}>{p.p}</div>
                </div>
              </div>
            ))}
          </PCard>
        )}
        <PCard pad={14}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Próximos prazos</div>
          {[{d:'24 abr',t:'Brief @modazen'},{d:'26 abr',t:'Revisão carrossel'},{d:'30 abr',t:'Encerramento mês'}].map((it,i)=>(
            <div key={i} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'flex-start' }}>
              <div style={{ fontSize:10.5, color:CRIE.muted, whiteSpace:'nowrap', marginTop:1 }}>{it.d}</div>
              <div style={{ fontSize:12.5, fontWeight:500 }}>{it.t}</div>
            </div>
          ))}
        </PCard>
      </div>
    </div>
  );
}
window.CalendarPage = CalendarPage;

// ─── PILLAR MANAGER ───────────────────────────────────────────────
function PillarsPage() {
  const pillars = [
    { name:'Educativo',  color:'#8B5CF6', target:30, atual:25, posts:12, hashtags:45 },
    { name:'Inspiração', color:'#0EA5E9', target:25, atual:28, posts:10, hashtags:32 },
    { name:'Promocional',color:'#F43F5E', target:20, atual:18, posts:7,  hashtags:22 },
    { name:'Bastidores', color:'#10B981', target:15, atual:17, posts:6,  hashtags:18 },
    { name:'Datas',      color:'#F59E0B', target:10, atual:12, posts:5,  hashtags:14 },
  ];
  return (
    <div style={{ padding:24 }}>
      <SectionHeader title="Pilares de Conteúdo" action={<Btn>+ Novo pilar</Btn>}/>
      {/* Distribution donut */}
      <PCard style={{ marginBottom:20, display:'flex', alignItems:'center', gap:40 }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          {(() => {
            let offset = 0;
            const total = pillars.reduce((a,p)=>a+p.atual,0);
            const r=60, circ=2*Math.PI*r;
            return pillars.map((p,i)=>{
              const len=(p.atual/total)*circ;
              const el=(
                <circle key={i} cx="80" cy="80" r={r} fill="none"
                  stroke={p.color} strokeWidth="22"
                  strokeDasharray={`${len} ${circ-len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 80 80)"/>
              );
              offset+=len;
              return el;
            });
          })()}
          <text x="80" y="84" textAnchor="middle" fontSize="20" fontWeight="700" fill={CRIE.ink}>100%</text>
        </svg>
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {pillars.map(p=>(
            <div key={p.name} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:3, background:p.color, flex:'none' }}/>
              <span style={{ fontSize:12.5 }}>{p.name} — {p.atual}%</span>
            </div>
          ))}
        </div>
      </PCard>
      {/* Pillar cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {pillars.map(p=>(
          <PCard key={p.name}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:p.color }}/>
                <span style={{ fontSize:15, fontWeight:600 }}>{p.name}</span>
              </div>
              <div style={{ color:CRIE.muted, letterSpacing:2, cursor:'pointer' }}>⋯</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:CRIE.muted, marginBottom:8 }}>
              <span>Meta: {p.target}%</span><span>Atual: {p.atual}%</span>
            </div>
            <div style={{ height:7, borderRadius:99, background:CRIE.line, marginBottom:10 }}>
              <div style={{ height:'100%', borderRadius:99, background:p.color, width:`${Math.min(100,(p.atual/p.target)*100)}%`, transition:'width .4s' }}/>
            </div>
            <div style={{ display:'flex', gap:14, fontSize:12, color:CRIE.muted }}>
              <span>{p.posts} posts este mês</span><span>{p.hashtags} hashtags</span>
            </div>
          </PCard>
        ))}
      </div>
    </div>
  );
}
window.PillarsPage = PillarsPage;

// ─── COPY INBOX ───────────────────────────────────────────────────
const COPY_CARDS = [
  {id:1,stage:'escrever',title:'5 dicas para agências modernas',brand:'@cafebonito',format:'Carrossel',deadline:'22 abr',brief:'Aborde automação de aprovação com tom educativo.'},
  {id:2,stage:'escrever',title:'Tendências de moda verão',brand:'@modazen',format:'Feed 4:5',deadline:'24 abr',brief:'Visual e inspirador, foco em texturas e paletas.'},
  {id:3,stage:'escrever',title:'Workshop de permacultura',brand:'@viververde',format:'Story',deadline:'25 abr',brief:'Convidar seguidores para o evento presencial.'},
  {id:4,stage:'ajuste',title:'Campanha dia das mães',brand:'@modazen',format:'Carrossel',deadline:'26 abr',brief:'Ajuste solicitado: CTA precisa ser mais direto.'},
  {id:5,stage:'ajuste',title:'Receita de pão de queijo',brand:'@padariaestrela',format:'Reel',deadline:'27 abr',brief:'Reduzir texto overlay no slide 3.'},
  {id:6,stage:'aprovado',title:'Lançamento linha outono',brand:'@modazen',format:'Feed 1:1',deadline:'20 abr',brief:''},
  {id:7,stage:'aprovado',title:'Sustentabilidade no dia a dia',brand:'@viververde',format:'Carrossel',deadline:'19 abr',brief:''},
];
const COPY_STAGES = {
  escrever:{ label:'Para escrever', color:'#3B82F6' },
  ajuste:  { label:'Em ajuste',    color:'#F59E0B' },
  aprovado:{ label:'Aprovado',     color:'#22C55E' },
};
function CopyInboxPage() {
  return (
    <div style={{ padding:'16px 24px', display:'flex', flexDirection:'column', height:'100%', boxSizing:'border-box' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div style={{ fontSize:13, color:CRIE.muted }}>Briefs atribuídos a você esta semana.</div>
        <Btn variant="secondary" size="sm" onClick={() => window.navigateTo('copy-write')}>Abrir editor</Btn>
      </div>
      <div style={{ flex:1, display:'flex', gap:14, overflow:'hidden' }}>
        {Object.entries(COPY_STAGES).map(([stageKey, stageMeta])=>{
          const cards = COPY_CARDS.filter(c => c.stage === stageKey);
          return (
            <div key={stageKey} style={{
              flex:1, background:`${stageMeta.color}0D`, borderRadius:20, padding:14,
              display:'flex', flexDirection:'column', gap:10, overflow:'hidden',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <div style={{ width:8, height:8, borderRadius:999, background:stageMeta.color }}/>
                <span style={{ fontSize:13, fontWeight:600 }}>{stageMeta.label}</span>
                <span style={{ fontSize:12, color:CRIE.muted, background:'rgba(0,0,0,0.06)', padding:'1px 7px', borderRadius:999 }}>{cards.length}</span>
              </div>
              <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
                {cards.map(c=>(
                  <div key={c.id} onClick={()=>window.navigateTo('copy-write')} style={{
                    background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:14, padding:14, cursor:'pointer',
                    transition:'box-shadow .15s',
                  }}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.08)'}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                    <div style={{ fontSize:13.5, fontWeight:500, lineHeight:1.4, marginBottom:8, color:CRIE.ink }}>{c.title}</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                      <Badge label={c.format} color={stageMeta.color}/>
                      <span style={{ fontSize:11, color:CRIE.muted }}>{c.brand}</span>
                    </div>
                    <div style={{ fontSize:11.5, color:CRIE.muted, lineHeight:1.4 }}>{c.brief}</div>
                    <div style={{ marginTop:8, fontSize:11, color:CRIE.muted }}>📅 {c.deadline}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.CopyInboxPage = CopyInboxPage;

// ─── CAPTION EDITOR ───────────────────────────────────────────────
function IGPreview({ caption, slide }) {
  const truncated = caption.length > 125;
  return (
    <div style={{ background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:14, overflow:'hidden', maxWidth:340, margin:'0 auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px' }}>
        <div style={{ width:32, height:32, borderRadius:999, background:'linear-gradient(45deg,#833ab4,#fd1d1d,#fcb045)', padding:2, display:'grid', placeItems:'center' }}>
          <div style={{ width:'100%', height:'100%', borderRadius:999, background:'#fff', display:'grid', placeItems:'center' }}>
            <div style={{ width:24, height:24, borderRadius:999, background:CRIE.butter, display:'grid', placeItems:'center', fontSize:9, fontWeight:700 }}>CB</div>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12.5, fontWeight:600 }}>cafebonito</div>
          <div style={{ fontSize:10.5, color:CRIE.muted }}>Patrocinado</div>
        </div>
        <div style={{ color:CRIE.muted, fontSize:18, letterSpacing:1 }}>⋯</div>
      </div>
      {/* Image */}
      <div style={{ aspectRatio:'4/5', background:`repeating-linear-gradient(135deg,${CRIE.lineSoft} 0 14px,${CRIE.line} 14px 28px)`, display:'flex', alignItems:'flex-end', justifyContent:'center', position:'relative' }}>
        <div style={{ position:'absolute', bottom:10, display:'flex', gap:4 }}>
          {[0,1,2].map(i=><div key={i} style={{ width:6, height:6, borderRadius:999, background:i===slide?'#fff':'rgba(255,255,255,0.5)' }}/>)}
        </div>
      </div>
      {/* Actions */}
      <div style={{ padding:'10px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', gap:14 }}>
            {['♡','💬','➦'].map(ic=><span key={ic} style={{ fontSize:22, cursor:'pointer' }}>{ic}</span>)}
          </div>
          <span style={{ fontSize:22 }}>🔖</span>
        </div>
        <div style={{ fontSize:12.5, fontWeight:600, marginBottom:4 }}>1.247 curtidas</div>
        <div style={{ fontSize:12.5, lineHeight:1.5 }}>
          <span style={{ fontWeight:600 }}>cafebonito </span>
          {truncated ? caption.slice(0,125)+'...' : caption}
          {truncated && <span style={{ color:'#8B8B82' }}> mais</span>}
        </div>
        <div style={{ fontSize:11.5, color:CRIE.muted, marginTop:4 }}>há 2 horas</div>
      </div>
    </div>
  );
}

function CaptionEditorPage() {
  const [caption, setCaption] = React.useState(
    'Você sabia que 80% das agências ainda aprovam conteúdo pelo WhatsApp? 🤯\n\nDescubra como a Crie! elimina esse caos e coloca sua equipe em sincronia.\n\n✅ Aprovação em 1 clique\n✅ Kanban visual\n✅ Publicação direto para o Instagram\n\nSalva esse post para não esquecer! 💾'
  );
  const [hashtags, setHashtags] = React.useState('#marketing #conteudo #agencia #criesaas #instagram #redesociais');
  const [slide, setSlide] = React.useState(0);
  const maxChars = 2200, previewMax = 125;
  const pct = caption.length / maxChars;
  const counterColor = pct > 1 ? '#EF4444' : pct > 0.8 ? '#F59E0B' : CRIE.muted;
  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>
      {/* Left editor */}
      <div style={{ flex:'0 0 55%', borderRight:`1px solid ${CRIE.line}`, display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
        {/* Post header info */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${CRIE.line}`, background:CRIE.paper }}>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>5 dicas para agências modernas</div>
          <div style={{ display:'flex', gap:8 }}>
            <Badge label="Educativo" color="#8B5CF6"/>
            <Badge label="Carrossel" color="#0EA5E9"/>
            <span style={{ fontSize:12, color:CRIE.muted }}>@cafebonito</span>
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Slide selector (carousel) */}
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:6 }}>Slide ativo (1 de 10)</div>
            <div style={{ display:'flex', gap:6 }}>
              {Array.from({length:5}).map((_,i)=>(
                <button key={i} onClick={()=>setSlide(i)} style={{
                  width:36, height:36, borderRadius:8, border:`1.5px solid ${slide===i?CRIE.ink:CRIE.line}`,
                  background: slide===i ? CRIE.ink : '#fff', color: slide===i?'#fff':CRIE.ink,
                  fontSize:12, fontWeight:600, cursor:'pointer',
                }}>{i+1}</button>
              ))}
              <span style={{ fontSize:12, color:CRIE.muted, alignSelf:'center', marginLeft:2 }}>…</span>
            </div>
          </div>
          {/* Legenda */}
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:6 }}>Legenda</div>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={10}
              style={{
                width:'100%', padding:'12px 14px', borderRadius:12, border:`1.5px solid ${CRIE.line}`,
                fontSize:13.5, fontFamily:'JetBrains Mono, ui-monospace, monospace', lineHeight:1.65,
                resize:'vertical', outline:'none', color:CRIE.ink, boxSizing:'border-box',
              }}
              onFocus={e=>e.target.style.borderColor=CRIE.butterDeep}
              onBlur={e=>e.target.style.borderColor=CRIE.line}
            />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginTop:4 }}>
              <span style={{ color:CRIE.muted }}>Preview: <span style={{ color: caption.length > previewMax ? CRIE.amber:'inherit' }}>{Math.min(caption.length, previewMax)}/{previewMax}</span></span>
              <span style={{ color:counterColor, fontWeight: pct>0.8?600:400 }}>{caption.length}/{maxChars}</span>
            </div>
          </div>
          {/* Hashtags */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted }}>Hashtags</div>
              <Btn variant="butter" size="sm">✨ Sugerir hashtags</Btn>
            </div>
            <textarea value={hashtags} onChange={e=>setHashtags(e.target.value)} rows={3}
              style={{
                width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`,
                fontSize:12.5, fontFamily:'JetBrains Mono, ui-monospace, monospace', resize:'none',
                outline:'none', color:'#0EA5E9', boxSizing:'border-box',
              }}/>
            <div style={{ fontSize:11.5, color:CRIE.muted, marginTop:4 }}>{hashtags.split(' ').filter(h=>h.startsWith('#')).length} hashtags</div>
          </div>
          {/* First comment */}
          <div>
            <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:6 }}>Primeiro comentário (opcional)</div>
            <textarea placeholder="Adicione hashtags extras aqui para não poluir a legenda…" rows={3}
              style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:12.5, fontFamily:'JetBrains Mono, ui-monospace, monospace', resize:'none', outline:'none', color:CRIE.muted, boxSizing:'border-box' }}/>
          </div>
        </div>
        {/* Footer actions */}
        <div style={{ padding:'14px 20px', borderTop:`1px solid ${CRIE.line}`, display:'flex', gap:8, background:CRIE.paper }}>
          <Btn variant="butter">✨ Gerar com IA</Btn>
          <Btn variant="secondary">Salvar rascunho</Btn>
          <div style={{ flex:1 }}/>
          <Btn>Enviar para aprovação</Btn>
        </div>
      </div>
      {/* Right preview */}
      <div style={{ flex:1, padding:24, overflowY:'auto', background:CRIE.bg }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:600 }}>Preview do Instagram</div>
          <div style={{ display:'flex', gap:6 }}>
            {['Feed','Grid','Story'].map(v=>(
              <button key={v} style={{ padding:'5px 12px', borderRadius:999, border:`1.5px solid ${v==='Feed'?CRIE.ink:CRIE.line}`, background:v==='Feed'?CRIE.ink:'#fff', color:v==='Feed'?'#fff':CRIE.muted, fontSize:11.5, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{v}</button>
            ))}
          </div>
        </div>
        <IGPreview caption={caption} slide={slide}/>
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:12, fontWeight:500, color:CRIE.muted, marginBottom:8 }}>Histórico de versões</div>
          {['v3 — atual','v2 — ontem 16:40','v1 — ontem 10:12'].map((v,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:10, marginBottom:6, fontSize:12.5 }}>
              <span style={{ fontWeight: i===0?600:400 }}>{v}</span>
              {i>0 && <Btn variant="ghost" size="sm">Restaurar</Btn>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.CaptionEditorPage = CaptionEditorPage;
