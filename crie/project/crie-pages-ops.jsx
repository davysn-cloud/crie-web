// crie-pages-ops.jsx — Assets, Brand Kit, Publish Queue, Grid Planner, all Admin pages, Notifications, Settings

// ─── ASSET LIBRARY ────────────────────────────────────────────────
const MOCK_ASSETS = [
  {id:1,name:'hero-cafe.jpg',kind:'Foto',size:'3.2MB',tags:['produto','hero'],col:'#E8DFD0'},
  {id:2,name:'logo-principal.svg',kind:'Logo',size:'42KB',tags:['logo','marca'],col:'#D0E8E0'},
  {id:3,name:'icone-estrela.png',kind:'Ícone',size:'18KB',tags:['ui','icone'],col:'#E8E0D0'},
  {id:4,name:'foto-equipe.jpg',kind:'Foto',size:'5.1MB',tags:['equipe','bastidores'],col:'#D0D8E8'},
  {id:5,name:'padrao-texturas.png',kind:'Textura',size:'890KB',tags:['background'],col:'#E8D0D8'},
  {id:6,name:'banner-promo.jpg',kind:'Arte',size:'2.4MB',tags:['campanha','promo'],col:'#D8E8D0'},
  {id:7,name:'foto-produto-1.jpg',kind:'Foto',size:'4.8MB',tags:['produto'],col:'#E8E8D0'},
  {id:8,name:'mockup-reel.mp4',kind:'Vídeo',size:'12MB',tags:['reel','video'],col:'#D0E8E8'},
];

function AssetLibraryPage() {
  const [view, setView] = React.useState('grid');
  const [search, setSearch] = React.useState('');
  const filtered = MOCK_ASSETS.filter(a => a.name.includes(search) || a.tags.some(t=>t.includes(search)));
  return (
    <div style={{ padding:24 }}>
      {/* Top bar */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:10, padding:'8px 12px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={CRIE.muted} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          <input placeholder="Buscar assets…" value={search} onChange={e=>setSearch(e.target.value)} style={{ border:'none', outline:'none', flex:1, fontSize:13, fontFamily:'Inter,sans-serif', color:CRIE.ink }}/>
        </div>
        {['Todos','Foto','Logo','Ícone','Vídeo'].map(k=>(
          <button key={k} style={{ padding:'7px 14px', borderRadius:999, border:`1px solid ${CRIE.line}`, background:'#fff', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{k}</button>
        ))}
        <div style={{ display:'flex', gap:4, marginLeft:4 }}>
          {['grid','list'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              width:34, height:34, borderRadius:8, border:`1px solid ${CRIE.line}`, cursor:'pointer',
              background:view===v?CRIE.ink:'#fff', color:view===v?'#fff':CRIE.muted,
              display:'grid', placeItems:'center',
            }}>
              {v==='grid' ? <svg width="14" height="14" viewBox="0 0 14 14"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor"/></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.5"/></svg>}
            </button>
          ))}
        </div>
        <Btn>Upload</Btn>
      </div>
      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:18, borderBottom:`1px solid ${CRIE.line}`, paddingBottom:0 }}>
        {['Meus arquivos','Unsplash','Pexels'].map((t,i)=>(
          <button key={t} style={{
            padding:'8px 16px', border:'none', borderBottom:`2px solid ${i===0?CRIE.ink:'transparent'}`,
            background:'none', fontSize:13.5, fontWeight:i===0?600:400, cursor:'pointer',
            color:i===0?CRIE.ink:CRIE.muted, fontFamily:'Inter,sans-serif',
          }}>{t}</button>
        ))}
      </div>
      {view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
          {filtered.map(a=>(
            <div key={a.id} style={{ background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'box-shadow .15s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.09)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
              <div style={{ height:140, background:a.col, display:'flex', alignItems:'flex-end', padding:10 }}>
                <span style={{ fontFamily:'ui-monospace,monospace', fontSize:9.5, background:'rgba(0,0,0,0.15)', color:'rgba(0,0,0,0.7)', padding:'2px 6px', borderRadius:4, textTransform:'uppercase' }}>{a.kind}</span>
              </div>
              <div style={{ padding:'10px 12px' }}>
                <div style={{ fontSize:12.5, fontWeight:500, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                <div style={{ fontSize:11, color:CRIE.muted }}>{a.size}</div>
                <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>
                  {a.tags.slice(0,2).map(t=><span key={t} style={{ fontSize:10, padding:'1px 7px', borderRadius:999, background:CRIE.lineSoft, color:CRIE.muted }}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
          {/* Upload dropzone */}
          <div style={{
            border:`2px dashed ${CRIE.line}`, borderRadius:16, height:200, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', cursor:'pointer', color:CRIE.muted,
          }}>
            <div style={{ fontSize:32, marginBottom:8 }}>+</div>
            <div style={{ fontSize:12.5 }}>Enviar arquivo</div>
          </div>
        </div>
      ) : (
        <PCard pad={0} style={{ overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ borderBottom:`1px solid ${CRIE.line}`, background:CRIE.lineSoft }}>
              {['Nome','Tipo','Tamanho','Tags','Ações'].map(h=>(
                <th key={h} style={{ padding:'10px 14px', fontSize:11.5, fontWeight:600, color:CRIE.muted, textAlign:'left' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((a,i)=>(
                <tr key={a.id} style={{ borderBottom: i<filtered.length-1?`1px solid ${CRIE.line}`:'none' }}>
                  <td style={{ padding:'11px 14px', fontSize:13.5, fontWeight:500 }}>{a.name}</td>
                  <td style={{ padding:'11px 14px' }}><Badge label={a.kind} color={CRIE.muted}/></td>
                  <td style={{ padding:'11px 14px', fontSize:12.5, color:CRIE.muted }}>{a.size}</td>
                  <td style={{ padding:'11px 14px' }}><div style={{ display:'flex', gap:4 }}>{a.tags.map(t=><span key={t} style={{ fontSize:10.5, padding:'2px 7px', borderRadius:999, background:CRIE.lineSoft, color:CRIE.muted }}>{t}</span>)}</div></td>
                  <td style={{ padding:'11px 14px' }}><div style={{ display:'flex', gap:6 }}><Btn variant="ghost" size="sm">↓</Btn><Btn variant="ghost" size="sm">✎</Btn><Btn variant="ghost" size="sm">🗑</Btn></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </PCard>
      )}
    </div>
  );
}
window.AssetLibraryPage = AssetLibraryPage;

// ─── BRAND KIT ────────────────────────────────────────────────────
function BrandKitPage() {
  const [tone, setTone] = React.useState('Neutro');
  const colors = ['#0E0E0C','#EEF0A8','#C6D3A3','#F0C9CC','#B8C0E0'];
  return (
    <div style={{ padding:24, display:'flex', gap:22, overflow:'hidden' }}>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:18, overflowY:'auto' }}>
        {/* Logo */}
        <PCard>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Logo</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {['Principal','Alternativo / ícone'].map(v=>(
              <div key={v}>
                <div style={{ fontSize:11.5, color:CRIE.muted, marginBottom:6 }}>{v}</div>
                <div style={{
                  height:120, border:`2px dashed ${CRIE.line}`, borderRadius:12,
                  display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', gap:6,
                }}>
                  <div style={{ fontSize:28 }}>🖼</div>
                  <div style={{ fontSize:11.5, color:CRIE.muted }}>Enviar logo</div>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:10 }}>
                  {[{bg:'#fff',border:CRIE.line,label:'Claro'},{bg:CRIE.ink,label:'Escuro'}].map(b=>(
                    <div key={b.label} style={{ flex:1, height:50, borderRadius:10, background:b.bg, border:`1px solid ${b.border||'transparent'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:10, color:b.bg==='#fff'?CRIE.muted:'rgba(255,255,255,0.4)' }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PCard>
        {/* Colors */}
        <PCard>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Cores (máx. 5)</div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {colors.map((c,i)=>(
              <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ width:52, height:52, borderRadius:12, background:c, border:`2px solid ${CRIE.line}`, cursor:'pointer', position:'relative' }}>
                  {i===0 && <span style={{ position:'absolute', bottom:-18, left:'50%', transform:'translateX(-50%)', fontSize:9, color:CRIE.muted, whiteSpace:'nowrap' }}>Primária</span>}
                </div>
                <div style={{ fontSize:9.5, color:CRIE.muted, marginTop:8 }}>{c}</div>
              </div>
            ))}
            <div style={{ width:52, height:52, borderRadius:12, border:`2px dashed ${CRIE.line}`, display:'grid', placeItems:'center', cursor:'pointer', fontSize:22, color:CRIE.muted }}>+</div>
          </div>
        </PCard>
        {/* Fonts */}
        <PCard>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Tipografia (máx. 2)</div>
          {[{label:'Título / Display',font:'Inter',weight:'700'},
            {label:'Corpo de texto',font:'Inter',weight:'400'}].map(f=>(
            <div key={f.label} style={{ marginBottom:14 }}>
              <div style={{ fontSize:11.5, color:CRIE.muted, marginBottom:5 }}>{f.label}</div>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <select style={{ flex:1, padding:'9px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13, fontFamily:'Inter,sans-serif', color:CRIE.ink, background:'#fff' }}>
                  <option>Inter</option><option>Playfair Display</option><option>Space Grotesk</option><option>DM Sans</option>
                </select>
                <div style={{ fontSize:24, fontWeight:f.weight, color:CRIE.ink, minWidth:80 }}>Aa Bb 123</div>
              </div>
            </div>
          ))}
        </PCard>
        {/* Tone */}
        <PCard>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Tom de voz</div>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {['Formal','Neutro','Casual','Divertido'].map(t=>(
              <button key={t} onClick={()=>setTone(t)} style={{
                flex:1, padding:'9px 0', borderRadius:10, border:`1.5px solid ${tone===t?CRIE.ink:CRIE.line}`,
                background:tone===t?CRIE.ink:'#fff', color:tone===t?'#fff':CRIE.ink,
                fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}>{t}</button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[{label:'Vocabulário preferido',placeholder:'inovação, sustentável, autêntico'},
              {label:'Vocabulário proibido',placeholder:'barato, desconto agressivo'}].map(v=>(
              <div key={v.label}>
                <div style={{ fontSize:11.5, color:CRIE.muted, marginBottom:5 }}>{v.label}</div>
                <input placeholder={v.placeholder} style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:`1.5px solid ${CRIE.line}`, fontSize:12.5, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11.5, color:CRIE.muted, marginBottom:6 }}>Uso de emojis</div>
            <div style={{ display:'flex', gap:8 }}>
              {['Nenhum','Moderado','Liberado'].map(e=>(
                <button key={e} style={{ flex:1, padding:'7px 0', borderRadius:8, border:`1.5px solid ${e==='Moderado'?CRIE.butterDeep:CRIE.line}`, background:e==='Moderado'?CRIE.butter:'#fff', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>{e}</button>
              ))}
            </div>
          </div>
        </PCard>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
          <Btn variant="secondary">Cancelar</Btn><Btn>Salvar brand kit</Btn>
        </div>
      </div>
      {/* Right preview */}
      <div style={{ width:300, flexShrink:0 }}>
        <PCard style={{ position:'sticky', top:0 }}>
          <div style={{ fontSize:13, fontWeight:600, marginBottom:12 }}>Preview do post</div>
          <div style={{ background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px' }}>
              <div style={{ width:28, height:28, borderRadius:999, background:colors[0], display:'grid', placeItems:'center' }}>
                <span style={{ color:'#fff', fontSize:9, fontWeight:700 }}>CB</span>
              </div>
              <span style={{ fontSize:12, fontWeight:600 }}>cafebonito</span>
            </div>
            <div style={{ height:180, background:colors[1]||CRIE.butter }}/>
            <div style={{ padding:'8px 10px' }}>
              <div style={{ fontSize:12, lineHeight:1.5 }}>
                <span style={{ fontWeight:600 }}>cafebonito </span>
                Tom <em>{tone.toLowerCase()}</em> · Vocabulário preferido da marca.
              </div>
            </div>
          </div>
          <Btn style={{ width:'100%', marginTop:12, justifyContent:'center' }} variant="butter">Aplicar brand kit</Btn>
        </PCard>
      </div>
    </div>
  );
}
window.BrandKitPage = BrandKitPage;

// ─── PUBLISH QUEUE ─────────────────────────────────────────────────
const QUEUE_ITEMS = [
  {time:'14:00',status:'publicado',brand:'@cafebonito',format:'Feed 4:5',title:'5 dicas para agências'},
  {time:'18:00',status:'agendado', brand:'@modazen',   format:'Carrossel',title:'Tendências verão 2025'},
  {time:'20:00',status:'falhou',   brand:'@cafebonito',format:'Reel',   title:'Making of campanha'},
  {time:'23 abr 10:00',status:'agendado',brand:'@viververde',format:'Story',title:'Workshop permacultura'},
  {time:'23 abr 14:30',status:'agendado',brand:'@modazen',format:'Feed 1:1',title:'Lançamento linha outono'},
  {time:'24 abr 09:00',status:'agendado',brand:'@padariaestrela',format:'Reel',title:'Receita especial'},
];
const STATUS_META = {
  publicado:{ label:'Publicado', color:'#22C55E', bg:'#F0FDF4' },
  agendado: { label:'Agendado',  color:'#06B6D4', bg:'#ECFEFF' },
  falhou:   { label:'Falhou',    color:'#EF4444', bg:'#FEF2F2' },
};
function PublishQueuePage() {
  return (
    <div style={{ padding:24 }}>
      {/* Token expiry warning */}
      <div style={{ background:'#FEF3C7', border:'1px solid #F59E0B', borderRadius:14, padding:'12px 16px', display:'flex', gap:10, alignItems:'center', marginBottom:18 }}>
        <span style={{ fontSize:18 }}>⚠️</span>
        <div style={{ flex:1, fontSize:13 }}>O token do Instagram de <strong>@modazen</strong> expira em 6 dias. <button style={{ background:'none', border:'none', fontWeight:600, cursor:'pointer', color:'#92400E', fontFamily:'Inter,sans-serif', padding:0, textDecoration:'underline' }}>Renovar agora</button></div>
        <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#92400E' }}>×</button>
      </div>
      <SectionHeader title="Hoje, 22 abr" action={<Btn size="sm" variant="secondary">+ Agendar post</Btn>}/>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
        {QUEUE_ITEMS.filter((_,i)=>i<3).map((it,i)=>{
          const sm=STATUS_META[it.status];
          return (
            <div key={i} style={{ background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:16, padding:'14px 18px', display:'flex', gap:16, alignItems:'center' }}>
              <div style={{ fontSize:14, fontWeight:600, color:CRIE.ink, minWidth:70 }}>{it.time}</div>
              <div style={{ width:48, height:48, borderRadius:10, background:`repeating-linear-gradient(135deg,${CRIE.lineSoft} 0 8px,${CRIE.line} 8px 16px)`, flex:'none' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>{it.title}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:11.5, color:CRIE.muted }}>{it.brand}</span>
                  <Badge label={it.format} color={CRIE.muted}/>
                </div>
              </div>
              <div style={{ padding:'5px 12px', borderRadius:999, background:sm.bg, color:sm.color, fontSize:12, fontWeight:600 }}>{sm.label}</div>
              {it.status==='publicado' && <Btn variant="secondary" size="sm">Ver no IG →</Btn>}
              {it.status==='agendado'  && <><Btn variant="secondary" size="sm">Editar</Btn><div style={{ color:CRIE.muted, letterSpacing:2 }}>⋯</div></>}
              {it.status==='falhou'    && <><Btn size="sm" style={{ background:'#EF4444' }}>Tentar novamente</Btn><div style={{ color:CRIE.muted, letterSpacing:2 }}>⋯</div></>}
            </div>
          );
        })}
      </div>
      <SectionHeader title="Amanhã, 23 abr"/>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {QUEUE_ITEMS.slice(3).map((it,i)=>{
          const sm=STATUS_META[it.status];
          return (
            <div key={i} style={{ background:'#fff', border:`1px solid ${CRIE.line}`, borderRadius:16, padding:'14px 18px', display:'flex', gap:16, alignItems:'center' }}>
              <div style={{ fontSize:14, fontWeight:600, color:CRIE.ink, minWidth:70 }}>{it.time}</div>
              <div style={{ width:48, height:48, borderRadius:10, background:`repeating-linear-gradient(135deg,${CRIE.lineSoft} 0 8px,${CRIE.line} 8px 16px)`, flex:'none' }}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>{it.title}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <span style={{ fontSize:11.5, color:CRIE.muted }}>{it.brand}</span>
                  <Badge label={it.format} color={CRIE.muted}/>
                </div>
              </div>
              <div style={{ padding:'5px 12px', borderRadius:999, background:sm.bg, color:sm.color, fontSize:12, fontWeight:600 }}>{sm.label}</div>
              <Btn variant="secondary" size="sm">Editar</Btn>
            </div>
          );
        })}
      </div>
    </div>
  );
}
window.PublishQueuePage = PublishQueuePage;

// ─── GRID PLANNER ─────────────────────────────────────────────────
const GRID_POSTS = [
  {status:'pub',  col:'#C6D3A3'},{status:'pub',  col:'#EEF0A8'},{status:'pub',  col:'#D0E8E8'},
  {status:'pub',  col:'#E8D0D0'},{status:'pub',  col:'#D0D8E8'},{status:'pub',  col:'#E8E0D0'},
  {status:'sched',col:'#C6D3A3'},{status:'sched',col:'#EEF0A8'},{status:'sched',col:'#D0E8E8'},
  {status:'draft', col:'#F5F5F0'},{status:'draft',col:'#F5F5F0'},{status:'draft',col:'#F5F5F0'},
];
function GridPlannerPage() {
  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'flex', gap:22 }}>
        {/* IG profile mock */}
        <div style={{ flex:1, maxWidth:540 }}>
          <PCard style={{ marginBottom:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:72, height:72, borderRadius:999, background:'linear-gradient(45deg,#833ab4,#fd1d1d,#fcb045)', padding:3, display:'grid', placeItems:'center' }}>
                <div style={{ width:'100%', height:'100%', borderRadius:999, background:'#fff', display:'grid', placeItems:'center' }}>
                  <div style={{ width:60, height:60, borderRadius:999, background:CRIE.butter, display:'grid', placeItems:'center', fontSize:20, fontWeight:700 }}>CB</div>
                </div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:2 }}>@cafebonito</div>
                <div style={{ display:'flex', gap:20, fontSize:13 }}>
                  <div><strong>1.247</strong> posts</div>
                  <div><strong>45K</strong> seguidores</div>
                  <div><strong>380</strong> seguindo</div>
                </div>
                <div style={{ fontSize:12.5, color:CRIE.muted, marginTop:4 }}>Padaria artesanal · São Paulo 🥐</div>
              </div>
            </div>
          </PCard>
          {/* Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
            {GRID_POSTS.map((p,i)=>(
              <div key={i} style={{
                aspectRatio:'1',
                background:`repeating-linear-gradient(135deg,${p.col} 0 12px,${p.col}CC 12px 24px)`,
                border: p.status==='sched' ? `3px dashed ${CRIE.butterDeep}` : p.status==='draft' ? `3px dashed ${CRIE.line}` : 'none',
                opacity: p.status==='draft' ? 0.5 : 1,
                position:'relative', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {p.status==='pub' && <div style={{ position:'absolute', top:4, right:4, width:16, height:16, borderRadius:999, background:'rgba(34,197,94,0.9)', display:'grid', placeItems:'center' }}>
                  <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                </div>}
                {p.status==='sched' && <div style={{ position:'absolute', top:4, right:4, width:16, height:16, borderRadius:999, background:'rgba(6,182,212,0.9)', display:'grid', placeItems:'center' }}>
                  <svg width="8" height="8" viewBox="0 0 10 10"><path d="M5 3v2l1 1" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round"/><circle cx="5" cy="5" r="4" stroke="#fff" strokeWidth="1" fill="none"/></svg>
                </div>}
                {p.status==='draft' && <div style={{ fontSize:28, opacity:0.3 }}>+</div>}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:12, justifyContent:'center', fontSize:12, color:CRIE.muted }}>
            <span>🟢 Publicado</span><span>🔵 Agendado</span><span>⬜ Rascunho</span>
          </div>
        </div>
        {/* Controls */}
        <div style={{ width:260, flexShrink:0, display:'flex', flexDirection:'column', gap:14 }}>
          <PCard pad={14}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:10 }}>Próximas publicações</div>
            {QUEUE_ITEMS.filter(q=>q.status==='agendado').map((q,i)=>(
              <div key={i} style={{ marginBottom:10, padding:'8px 10px', background:CRIE.lineSoft, borderRadius:10 }}>
                <div style={{ fontSize:11.5, color:CRIE.muted, marginBottom:2 }}>{q.time}</div>
                <div style={{ fontSize:12.5, fontWeight:500 }}>{q.title}</div>
                <div style={{ fontSize:11, color:CRIE.muted }}>{q.brand}</div>
              </div>
            ))}
          </PCard>
          <PCard pad={14}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Alerta de harmonia</div>
            <div style={{ fontSize:12, color:CRIE.muted, lineHeight:1.5 }}>
              ⚠️ 3 posts consecutivos do pilar <strong>Educativo</strong>. Considere intercalar outros pilares.
            </div>
          </PCard>
          <Btn style={{ width:'100%', justifyContent:'center' }} onClick={() => window.navigateTo('queue')}>Ver fila completa</Btn>
        </div>
      </div>
    </div>
  );
}
window.GridPlannerPage = GridPlannerPage;

// ─── TEAM ─────────────────────────────────────────────────────────
const ROLE_META = {
  Admin:        { color:'#64748B', bg:'#F1F5F9' },
  Estrategista: { color:'#7C3AED', bg:'#F5F3FF' },
  Copywriter:   { color:'#2563EB', bg:'#EFF6FF' },
  Designer:     { color:'#DB2777', bg:'#FDF2F8' },
  'Social Media':{ color:'#0891B2', bg:'#ECFEFF' },
};
const TEAM_MEMBERS = [
  {name:'Ana Rocha',    email:'ana@ateliercanot.com.br',   role:'Copywriter',    brands:['@cafebonito','@viververde'],status:'Ativo'},
  {name:'Carlos Melo',  email:'carlos@ateliercanot.com.br',role:'Designer',      brands:['@modazen'],                status:'Ativo'},
  {name:'Júlia Prado',  email:'julia@ateliercanot.com.br', role:'Estrategista',  brands:['@cafebonito','@modazen'],  status:'Ativo'},
  {name:'Rafael Lima',  email:'rafael@ateliercanot.com.br',role:'Social Media',  brands:['@padariaestrela'],         status:'Pendente'},
  {name:'Marina Silva', email:'marina@ateliercanot.com.br',role:'Admin',         brands:['todos'],                   status:'Ativo'},
];
function TeamPage() {
  const [showInvite, setShowInvite] = React.useState(false);
  return (
    <div style={{ padding:24 }}>
      <SectionHeader title="Equipe" action={<Btn onClick={()=>setShowInvite(true)}>+ Convidar membro</Btn>}/>
      <PCard pad={0} style={{ overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:CRIE.lineSoft, borderBottom:`1px solid ${CRIE.line}` }}>
            {['Membro','Cargo','Marcas','Status','Ações'].map(h=>(
              <th key={h} style={{ padding:'11px 16px', fontSize:11.5, fontWeight:600, color:CRIE.muted, textAlign:'left' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {TEAM_MEMBERS.map((m,i)=>{
              const rm=ROLE_META[m.role]||ROLE_META.Admin;
              return (
                <tr key={i} style={{ borderBottom: i<TEAM_MEMBERS.length-1?`1px solid ${CRIE.line}`:'none' }}>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:999, background:CRIE.butter, display:'grid', placeItems:'center', fontSize:11, fontWeight:700, flex:'none' }}>
                        {m.name.split(' ').map(x=>x[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:500 }}>{m.name}</div>
                        <div style={{ fontSize:11.5, color:CRIE.muted }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'4px 10px', borderRadius:999, background:rm.bg, color:rm.color, fontSize:12, fontWeight:500 }}>{m.role}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {m.brands.map(b=><span key={b} style={{ fontSize:11.5, padding:'2px 8px', borderRadius:999, background:CRIE.lineSoft, color:CRIE.muted }}>{b}</span>)}
                    </div>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ fontSize:12.5, color: m.status==='Ativo'?'#22C55E':'#F59E0B', fontWeight:500 }}>● {m.status}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}><Btn variant="secondary" size="sm">Editar</Btn><Btn variant="ghost" size="sm">🗑</Btn></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </PCard>
      {showInvite && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300 }}>
          <div style={{ background:'#fff', borderRadius:24, padding:32, width:460, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Convidar membro</div>
            <div style={{ fontSize:13, color:CRIE.muted, marginBottom:20 }}>Um e-mail com link de acesso será enviado.</div>
            <div style={{ marginBottom:12 }}><label style={{ fontSize:12.5, color:CRIE.muted, display:'block', marginBottom:4 }}>E-mail</label><input placeholder="email@agencia.com.br" style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13.5, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/></div>
            <div style={{ marginBottom:12 }}><label style={{ fontSize:12.5, color:CRIE.muted, display:'block', marginBottom:4 }}>Cargo</label><select style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13.5, fontFamily:'Inter,sans-serif', background:'#fff', color:CRIE.ink }}>{Object.keys(ROLE_META).map(r=><option key={r}>{r}</option>)}</select></div>
            <div style={{ marginBottom:20 }}><label style={{ fontSize:12.5, color:CRIE.muted, display:'block', marginBottom:6 }}>Marcas</label><div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{BRANDS_LIST.map(b=><label key={b.id} style={{ display:'flex', gap:6, alignItems:'center', fontSize:12.5, cursor:'pointer' }}><input type="checkbox"/>{b.name}</label>)}</div></div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Btn variant="secondary" onClick={()=>setShowInvite(false)}>Cancelar</Btn>
              <Btn onClick={()=>setShowInvite(false)}>Enviar convite</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.TeamPage = TeamPage;

// ─── BILLING ──────────────────────────────────────────────────────
function BillingPage() {
  const meters = [
    {label:'Membros',used:5,max:10},{label:'Marcas',used:4,max:15},{label:'Posts/mês',used:147,max:Infinity},
  ];
  const invoices = [
    {date:'01/abr/2025',val:'R$ 297,00',status:'Pago'},
    {date:'01/mar/2025',val:'R$ 297,00',status:'Pago'},
    {date:'01/fev/2025',val:'R$ 297,00',status:'Pago'},
  ];
  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:18 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <PCard>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:11.5, color:CRIE.muted, marginBottom:2 }}>Plano atual</div>
                <div style={{ fontSize:22, fontWeight:700 }}>Profissional</div>
                <div style={{ fontSize:28, fontWeight:700, color:CRIE.ink, marginTop:4 }}>R$ 297<span style={{ fontSize:14, fontWeight:400, color:CRIE.muted }}>/mês</span></div>
              </div>
              <span style={{ padding:'5px 12px', borderRadius:999, background:'#F0FDF4', color:'#22C55E', fontSize:12, fontWeight:600 }}>Ativo</span>
            </div>
            {meters.map(m=>(
              <div key={m.label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5, marginBottom:4 }}>
                  <span>{m.label}</span>
                  <span style={{ color:CRIE.muted }}>{m.used}/{m.max===Infinity?'∞':m.max}</span>
                </div>
                {m.max!==Infinity && <div style={{ height:7, borderRadius:99, background:CRIE.line }}>
                  <div style={{ height:'100%', borderRadius:99, background:CRIE.butter, width:`${(m.used/m.max)*100}%` }}/>
                </div>}
                {m.max===Infinity && <div style={{ fontSize:11.5, color:CRIE.muted }}>Ilimitado neste plano</div>}
              </div>
            ))}
            <Btn variant="secondary" style={{ marginTop:6 }}>Gerenciar no Stripe →</Btn>
          </PCard>
          <PCard>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Histórico de faturas</div>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr style={{ borderBottom:`1px solid ${CRIE.line}` }}>
                {['Data','Valor','Status','PDF'].map(h=><th key={h} style={{ padding:'8px 0', fontSize:11.5, color:CRIE.muted, textAlign:'left' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {invoices.map((inv,i)=>(
                  <tr key={i} style={{ borderBottom:i<invoices.length-1?`1px solid ${CRIE.line}`:'none' }}>
                    <td style={{ padding:'10px 0', fontSize:13.5 }}>{inv.date}</td>
                    <td style={{ padding:'10px 0', fontSize:13.5, fontWeight:500 }}>{inv.val}</td>
                    <td style={{ padding:'10px 0' }}><span style={{ color:'#22C55E', fontSize:12.5, fontWeight:500 }}>● {inv.status}</span></td>
                    <td style={{ padding:'10px 0' }}><button style={{ background:'none', border:'none', cursor:'pointer', fontSize:12.5, color:CRIE.muted, fontFamily:'Inter,sans-serif' }}>↓ PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PCard>
        </div>
        {/* Plan comparison */}
        <PCard>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Mudar de plano</div>
          {[
            {name:'Básico',price:'R$ 97',members:3,brands:5,desc:'Para agências pequenas começando.'},
            {name:'Profissional',price:'R$ 297',members:10,brands:15,desc:'Para agências em crescimento.',current:true},
            {name:'Enterprise',price:'Sob consulta',members:'∞',brands:'∞',desc:'White-label + suporte dedicado.'},
          ].map(p=>(
            <div key={p.name} style={{
              border:`1.5px solid ${p.current?CRIE.butterDeep:CRIE.line}`,
              background:p.current?CRIE.butterWash:'#fff',
              borderRadius:14, padding:14, marginBottom:10,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <div style={{ fontSize:14, fontWeight:600 }}>{p.name}</div>
                <div style={{ fontSize:14, fontWeight:700 }}>{p.price}/mês</div>
              </div>
              <div style={{ fontSize:12, color:CRIE.muted, marginBottom:8 }}>{p.desc}</div>
              <div style={{ fontSize:12, color:CRIE.muted }}>{p.members} membros · {p.brands} marcas</div>
              {!p.current && <Btn variant="secondary" size="sm" style={{ marginTop:8 }}>Mudar para este</Btn>}
              {p.current && <span style={{ fontSize:11.5, color:CRIE.butterInk, fontWeight:600, display:'block', marginTop:6 }}>✓ Plano atual</span>}
            </div>
          ))}
        </PCard>
      </div>
    </div>
  );
}
window.BillingPage = BillingPage;

// ─── NOTIFICATIONS ────────────────────────────────────────────────
const NOTIFS = [
  {type:'aprovado', icon:'✅', text:'Post "5 dicas para agências" foi aprovado por Marina.', when:'há 2 min', read:false},
  {type:'comment',  icon:'💬', text:'Novo comentário de Carlos em "Campanha outono".', when:'há 15 min', read:false},
  {type:'ajuste',   icon:'✏️', text:'Cliente pediu ajuste em "Receita de pão de queijo".', when:'há 1h', read:false},
  {type:'falhou',   icon:'🔴', text:'Publicação de "Making of campanha" falhou. Token expirado.', when:'há 2h', read:true},
  {type:'token',    icon:'⚠️', text:'Token do Instagram de @modazen expira em 7 dias.', when:'há 3h', read:true},
  {type:'aprovado', icon:'✅', text:'Post "Tendências verão" foi aprovado por Ana.', when:'há 5h', read:true},
];
function NotificationsPage() {
  const [notifs, setNotifs] = React.useState(NOTIFS);
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <div style={{ padding:24, maxWidth:680 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>Notificações</h2>
          {unread>0 && <div style={{ fontSize:13, color:CRIE.muted, marginTop:2 }}>{unread} não lidas</div>}
        </div>
        <button onClick={()=>setNotifs(n=>n.map(x=>({...x,read:true})))} style={{ background:'none', border:'none', fontSize:13, color:CRIE.muted, cursor:'pointer', fontFamily:'Inter,sans-serif', textDecoration:'underline' }}>Marcar todas como lidas</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {notifs.map((n,i)=>(
          <div key={i} onClick={()=>setNotifs(ns=>ns.map((x,xi)=>xi===i?{...x,read:true}:x))} style={{
            background:'#fff', border:`1px solid ${CRIE.line}`,
            borderLeft:`3px solid ${n.read?CRIE.line:CRIE.butter}`,
            borderRadius:14, padding:'14px 16px', display:'flex', gap:12, cursor:'pointer',
            opacity: n.read ? 0.7 : 1, transition:'opacity .15s',
          }}>
            <div style={{ fontSize:22, flex:'none' }}>{n.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, color:CRIE.ink, lineHeight:1.5, marginBottom:2 }}>{n.text}</div>
              <div style={{ fontSize:11.5, color:CRIE.muted }}>{n.when}</div>
            </div>
            {!n.read && <div style={{ width:8, height:8, borderRadius:999, background:CRIE.butterDeep, flex:'none', marginTop:6 }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}
window.NotificationsPage = NotificationsPage;

// ─── SETTINGS ─────────────────────────────────────────────────────
function SettingsPage() {
  return (
    <div style={{ padding:24 }}>
      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:22 }}>
        {/* Settings nav */}
        <div>
          {[
            {g:'Conta', items:['Perfil','Segurança','Preferências']},
            {g:'Agência', items:['Configurações gerais','White-label','Integrações']},
            {g:'Danger zone', items:['Excluir conta']},
          ].map(sec=>(
            <div key={sec.g} style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, fontWeight:600, color:CRIE.muted, textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 }}>{sec.g}</div>
              {sec.items.map(item=>(
                <button key={item} style={{
                  width:'100%', textAlign:'left', padding:'9px 12px', borderRadius:10, border:'none', cursor:'pointer',
                  background: item==='Perfil' ? CRIE.butter : 'transparent', color: item==='Excluir conta'?'#EF4444':CRIE.ink,
                  fontSize:13.5, fontWeight: item==='Perfil'?500:400, fontFamily:'Inter,sans-serif', marginBottom:2,
                }}>{item}</button>
              ))}
            </div>
          ))}
        </div>
        {/* Content */}
        <PCard>
          <div style={{ fontSize:17, fontWeight:700, marginBottom:20 }}>Perfil</div>
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:24 }}>
            <div style={{ width:72, height:72, borderRadius:999, background:'linear-gradient(135deg,#C9A07C,#8B6748)', display:'grid', placeItems:'center', color:'#fff', fontSize:24, fontWeight:700 }}>AM</div>
            <div><Btn variant="secondary" size="sm">Trocar foto</Btn><div style={{ fontSize:11.5, color:CRIE.muted, marginTop:4 }}>JPG, PNG · máx 2MB</div></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[{l:'Nome completo',p:'Ana Melo'},{l:'E-mail',p:'ana@ateliercanot.com.br'},{l:'Cargo',p:'Admin'},{l:'Telefone',p:'+55 11 9 8765-4321'}].map(f=>(
              <div key={f.l}>
                <label style={{ display:'block', fontSize:12, color:CRIE.muted, marginBottom:4 }}>{f.l}</label>
                <input defaultValue={f.p} style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13.5, fontFamily:'Inter,sans-serif', outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:20 }}>
            <Btn variant="secondary">Cancelar</Btn><Btn>Salvar alterações</Btn>
          </div>
        </PCard>
      </div>
    </div>
  );
}
window.SettingsPage = SettingsPage;

// ─── BRANDS ADMIN ─────────────────────────────────────────────────
function BrandsPage() {
  return (
    <div style={{ padding:24 }}>
      <SectionHeader title="Marcas" action={<Btn>+ Nova marca</Btn>}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {BRANDS_LIST.map(b=>(
          <PCard key={b.id}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:b.color, display:'grid', placeItems:'center', fontSize:18, fontWeight:700, color:CRIE.ink }}>{b.name[0]}</div>
              <div>
                <div style={{ fontSize:15, fontWeight:600 }}>{b.name}</div>
                <div style={{ fontSize:12.5, color:CRIE.muted }}>{b.handle}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              <div style={{ background:CRIE.lineSoft, borderRadius:10, padding:'8px 10px' }}>
                <div style={{ fontSize:10.5, color:CRIE.muted, marginBottom:2 }}>Posts/mês</div>
                <div style={{ fontSize:18, fontWeight:700 }}>{Math.floor(Math.random()*30+10)}</div>
              </div>
              <div style={{ background:CRIE.lineSoft, borderRadius:10, padding:'8px 10px' }}>
                <div style={{ fontSize:10.5, color:CRIE.muted, marginBottom:2 }}>Aprovação 1ª</div>
                <div style={{ fontSize:18, fontWeight:700 }}>{Math.floor(Math.random()*30+65)}%</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
              {['Ana R.','Carlos M.'].map(m=>(
                <div key={m} style={{ width:24, height:24, borderRadius:999, background:CRIE.butter, display:'grid', placeItems:'center', fontSize:9, fontWeight:700 }}>{m.split(' ').map(x=>x[0]).join('')}</div>
              ))}
            </div>
            <div style={{ fontSize:12, color:'#22C55E', fontWeight:500, marginBottom:12 }}>✅ Instagram conectado</div>
            <div style={{ display:'flex', gap:8 }}><Btn variant="secondary" size="sm">Editar</Btn><Btn variant="ghost" size="sm">Arquivar</Btn></div>
          </PCard>
        ))}
        {/* Add card */}
        <div style={{
          border:`2px dashed ${CRIE.line}`, borderRadius:22, padding:24, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', cursor:'pointer', color:CRIE.muted, gap:8, minHeight:200,
        }}>
          <div style={{ fontSize:36 }}>+</div>
          <div style={{ fontSize:13.5 }}>Nova marca</div>
        </div>
      </div>
    </div>
  );
}
window.BrandsPage = BrandsPage;
