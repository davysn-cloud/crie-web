// crie-approver-full.jsx — Approver portal (mobile-first, no sidebar)

function ApproverPage() {
  const [postIndex, setPostIndex] = React.useState(0);
  const [approved, setApproved] = React.useState([]);
  const [showAjuste, setShowAjuste] = React.useState(false);
  const [slideIndex, setSlideIndex] = React.useState(0);
  const [pins, setPins] = React.useState([]);
  const [showPin, setShowPin] = React.useState(null);
  const [pinText, setPinText] = React.useState('');
  const [swipeConfirm, setSwipeConfirm] = React.useState(false);
  const [ajusteForm, setAjusteForm] = React.useState({ cat:'Copy', note:'' });

  const POSTS = [
    {id:1,brand:'@cafebonito',title:'5 dicas para agências modernas',format:'Carrossel',slides:10,caption:'Você sabia que 80% das agências ainda aprovam conteúdo pelo WhatsApp? 🤯\n\nDescubra como a Crie! elimina esse caos e coloca sua equipe em sincronia. Salva esse post! 💾\n\n#marketing #agencia #conteudo'},
    {id:2,brand:'@cafebonito',title:'Tendências de moda verão 2025',format:'Feed 4:5',slides:1,caption:'O verão 2025 chegou cheio de cor e leveza. Qual peça você já tem no look? 🌿☀️\n\n#moda #verao2025 #tendencias #estilo'},
    {id:3,brand:'@modazen',title:'Workshop de permacultura',format:'Story',slides:3,caption:'Oi! Você está convidado para o nosso workshop presencial de permacultura! 🌱\n\nDomingo 27/abril · 10h · Parque Trianon · SP\n\nLugares limitados — arrasta para cima e garanta o seu! 👆'},
    {id:4,brand:'@viververde',title:'Receita especial de pão de queijo',format:'Reel',slides:1,caption:'A receita mais pedida chegou! 🧀🔥 Pão de queijo crocante por fora, derretendo por dentro. Quem vai fazer em casa hoje? ⬇️'},
    {id:5,brand:'@padariaestrela',title:'Lançamento linha outono',format:'Carrossel',slides:6,caption:'Nossa nova linha outono acabou de chegar! Peças atemporais, paletas quentes e tecidos que abraçam. 🍂\n\nDisponível a partir de segunda!'},
  ];

  const post = POSTS[postIndex];
  const isApproved = approved.includes(post.id);
  const remaining = POSTS.length - approved.length;

  const handleImageTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    const newPin = { id: Date.now(), x: parseFloat(x), y: parseFloat(y), text:'', slide: slideIndex };
    setPins(p => [...p, newPin]);
    setShowPin(newPin.id);
    setPinText('');
  };

  const submitPin = () => {
    if (pinText.trim()) {
      setPins(p => p.map(pin => pin.id === showPin ? { ...pin, text: pinText } : pin));
    } else {
      setPins(p => p.filter(pin => pin.id !== showPin));
    }
    setShowPin(null);
    setPinText('');
  };

  const handleApprove = () => {
    setApproved(a => [...a, post.id]);
    setTimeout(() => {
      if (postIndex < POSTS.length - 1) setPostIndex(i => i + 1);
      setSlideIndex(0);
      setPins([]);
      setSwipeConfirm(false);
    }, 500);
  };

  const postPins = pins.filter(p => p.slide === slideIndex);

  return (
    <div style={{
      minHeight: '100vh', background: '#FAF8F3',
      fontFamily: "'Inter', system-ui, sans-serif", color: CRIE.ink,
      display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px 12px',
        background: '#fff', borderBottom: `1px solid ${CRIE.line}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: CRIE.butter, display: 'grid', placeItems: 'center' }}>
            <CrieMark size={20}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Atelier Canto</div>
            <div style={{ fontSize: 10, color: CRIE.muted }}>revisando como Marina</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ padding: '5px 10px', borderRadius: 999, background: CRIE.butter, fontSize: 11, fontWeight: 600 }}>{post.brand}</div>
          <button onClick={() => window.navigateTo('login')} style={{ background: 'none', border: 'none', fontSize: 12, color: CRIE.muted, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Sair →</button>
        </div>
      </div>

      {/* Magic link banner */}
      <div style={{ background: CRIE.butterWash, borderBottom: `1px solid ${CRIE.butterDeep}`, padding: '8px 20px', fontSize: 11.5, color: CRIE.butterInk, display: 'flex', alignItems: 'center', gap: 6 }}>
        🔗 Você está revisando via link mágico · Expira em <strong>47h</strong>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
        {/* Progress summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{remaining} post{remaining !== 1 ? 's' : ''} pendente{remaining !== 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {POSTS.map((p, i) => (
              <button key={p.id} onClick={() => { setPostIndex(i); setSlideIndex(0); setPins([]); }} style={{
                width: 26, height: 26, borderRadius: 999, border: `2px solid ${i === postIndex ? CRIE.ink : CRIE.line}`,
                background: approved.includes(p.id) ? CRIE.butter : i === postIndex ? CRIE.ink : '#fff',
                cursor: 'pointer', fontSize: 10, fontWeight: 700,
                color: approved.includes(p.id) ? CRIE.ink : i === postIndex ? '#fff' : CRIE.muted,
              }}>{approved.includes(p.id) ? '✓' : i + 1}</button>
            ))}
          </div>
        </div>

        {/* Post card */}
        {isApproved ? (
          <div style={{ background: '#F0FDF4', border: '2px solid #22C55E', borderRadius: 20, padding: 32, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#15803D' }}>Aprovado!</div>
            <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>Este post foi aprovado com sucesso.</div>
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${CRIE.line}`, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
            {/* Post meta */}
            <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${CRIE.line}` }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{post.title}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Badge label={post.format} color={CRIE.muted}/>
                <span style={{ fontSize: 11.5, color: CRIE.muted }}>{post.brand}</span>
              </div>
            </div>

            {/* Image with pins */}
            <div style={{ position: 'relative', aspectRatio: post.format === 'Story' ? '9/16' : post.format === 'Feed 4:5' ? '4/5' : '1/1', background: `repeating-linear-gradient(135deg,${CRIE.lineSoft} 0 16px,${CRIE.line} 16px 32px)`, cursor: 'crosshair', maxHeight: 400, overflow: 'hidden' }}
              onClick={handleImageTap}>
              {/* Placeholder label */}
              <div style={{ position: 'absolute', bottom: 12, left: 12, fontFamily: 'ui-monospace,monospace', fontSize: 10, color: CRIE.muted, background: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 5, textTransform: 'uppercase' }}>
                {post.format} · toque para comentar
              </div>
              {/* Slide indicator */}
              {post.slides > 1 && (
                <div style={{ position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.45)', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                  {slideIndex + 1} / {post.slides}
                </div>
              )}
              {/* Pins */}
              {postPins.map((pin, pi) => (
                <div key={pin.id} style={{
                  position: 'absolute', left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%,-50%)',
                  width: 24, height: 24, borderRadius: 999, background: pin.text ? CRIE.butter : CRIE.butterDeep,
                  border: '2px solid #fff', display: 'grid', placeItems: 'center',
                  fontSize: 11, fontWeight: 700, color: CRIE.ink, zIndex: 5,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                }} onClick={(e) => { e.stopPropagation(); setShowPin(pin.id); setPinText(pin.text); }}>
                  {pi + 1}
                </div>
              ))}
            </div>

            {/* Slide navigation */}
            {post.slides > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '10px 0', borderTop: `1px solid ${CRIE.line}` }}>
                {Array.from({ length: Math.min(post.slides, 6) }).map((_, i) => (
                  <button key={i} onClick={() => setSlideIndex(i)} style={{
                    width: 28, height: 28, borderRadius: 8, border: `1.5px solid ${slideIndex === i ? CRIE.ink : CRIE.line}`,
                    background: slideIndex === i ? CRIE.ink : '#fff', color: slideIndex === i ? '#fff' : CRIE.muted,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}>{i + 1}</button>
                ))}
                {post.slides > 6 && <span style={{ fontSize: 12, color: CRIE.muted, alignSelf: 'center' }}>…</span>}
              </div>
            )}

            {/* Caption */}
            <div style={{ padding: '12px 16px 14px', borderTop: `1px solid ${CRIE.line}` }}>
              <div style={{ fontSize: 11.5, color: CRIE.muted, marginBottom:6 }}>Legenda</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: CRIE.ink, whiteSpace: 'pre-line' }}>
                {post.caption.length > 200 ? post.caption.slice(0, 200) + '…' : post.caption}
                {post.caption.length > 200 && <span style={{ color: CRIE.muted, cursor: 'pointer' }}> ver mais</span>}
              </div>
            </div>
          </div>
        )}

        {/* Pin comment input */}
        {showPin !== null && (
          <div style={{
            background: '#fff', border: `1.5px solid ${CRIE.butterDeep}`, borderRadius: 16, padding: 14, marginBottom: 14,
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom:8 }}>
              Pin #{postPins.findIndex(p => p.id === showPin) + 1} — Slide {slideIndex + 1}
            </div>
            <textarea value={pinText} onChange={e => setPinText(e.target.value)} rows={3} placeholder="Descreva a alteração desejada…"
              style={{ width: '100%', padding: '9px 11px', borderRadius: 10, border: `1.5px solid ${CRIE.line}`, fontSize: 13, fontFamily: 'Inter,sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box' }}/>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Btn variant="secondary" size="sm" onClick={() => { setShowPin(null); setPins(p => p.filter(x => x.id !== showPin)); }}>Cancelar</Btn>
              <Btn size="sm" onClick={submitPin}>Enviar comentário</Btn>
            </div>
          </div>
        )}

        {/* Saved pins list */}
        {postPins.filter(p => p.text && p.id !== showPin).length > 0 && (
          <PCard pad={12} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: CRIE.muted, marginBottom: 8 }}>Comentários de pin ({postPins.filter(p => p.text).length})</div>
            {postPins.filter(p => p.text).map((pin, pi) => (
              <div key={pin.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: CRIE.butter, display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 700, flex: 'none' }}>{pi + 1}</div>
                <div style={{ fontSize: 12.5, color: CRIE.ink }}>{pin.text}</div>
              </div>
            ))}
          </PCard>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Btn variant="secondary" size="sm" onClick={() => { if (postIndex > 0) { setPostIndex(i => i - 1); setSlideIndex(0); setPins([]); } }} style={{ opacity: postIndex === 0 ? 0.4 : 1 }}>← Anterior</Btn>
          <span style={{ fontSize: 12.5, color: CRIE.muted }}>Post {postIndex + 1} de {POSTS.length}</span>
          <Btn variant="secondary" size="sm" onClick={() => { if (postIndex < POSTS.length - 1) { setPostIndex(i => i + 1); setSlideIndex(0); setPins([]); } }} style={{ opacity: postIndex === POSTS.length - 1 ? 0.4 : 1 }}>Próximo →</Btn>
        </div>
      </div>

      {/* Bottom action bar */}
      {!isApproved && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480,
          background: '#fff', borderTop: `1px solid ${CRIE.line}`, padding: '14px 16px',
          display: 'flex', gap: 10,
        }}>
          <button style={{
            flex: '0 0 48px', height: 52, borderRadius: 14, border: `1.5px solid ${CRIE.line}`,
            background: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center',
          }} onClick={() => setShowAjuste(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={CRIE.muted} strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
          {!swipeConfirm ? (
            <button onClick={() => setSwipeConfirm(true)} style={{
              flex: 1, height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: CRIE.butter, border: `1.5px solid ${CRIE.butterDeep}`,
              fontSize: 15, fontWeight: 700, color: CRIE.ink, fontFamily: 'Inter,sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              ✅ Aprovar
            </button>
          ) : (
            <div style={{ flex: 1, height: 52, borderRadius: 14, background: '#F0FDF4', border: '1.5px solid #22C55E', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803D', flex: 1 }}>Deslize para confirmar →</div>
              <button onClick={handleApprove} style={{
                padding: '8px 16px', borderRadius: 10, background: '#22C55E', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              }}>Confirmar ✓</button>
              <button onClick={() => setSwipeConfirm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#166534' }}>×</button>
            </div>
          )}
          <button onClick={() => setShowAjuste(true)} style={{
            flex: '0 0 120px', height: 52, borderRadius: 14, border: `1.5px solid ${CRIE.line}`,
            background: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: CRIE.ink, fontFamily: 'Inter,sans-serif',
          }}>Pedir ajuste ✏️</button>
        </div>
      )}

      {/* Pedir ajuste drawer */}
      {showAjuste && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }} onClick={() => setShowAjuste(false)}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: CRIE.line, margin: '0 auto 20px' }}/>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Pedir ajuste</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, color: CRIE.muted, marginBottom: 8 }}>Categoria *</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Copy','Arte','Timing','Outro'].map(cat => (
                  <button key={cat} onClick={() => setAjusteForm(f => ({ ...f, cat }))} style={{
                    padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${ajusteForm.cat === cat ? CRIE.ink : CRIE.line}`,
                    background: ajusteForm.cat === cat ? CRIE.ink : '#fff', color: ajusteForm.cat === cat ? '#fff' : CRIE.ink,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                  }}>{cat}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, color: CRIE.muted, marginBottom: 6 }}>Observação (opcional)</div>
              <textarea value={ajusteForm.note} onChange={e => setAjusteForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Descreva o que precisa ser alterado…" rows={4}
                style={{ width: '100%', padding: '11px 12px', borderRadius: 12, border: `1.5px solid ${CRIE.line}`, fontSize: 13.5, fontFamily: 'Inter,sans-serif', resize: 'none', outline: 'none', boxSizing: 'border-box', color: CRIE.ink }}/>
            </div>
            <Btn style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={() => setShowAjuste(false)}>Enviar solicitação</Btn>
          </div>
        </div>
      )}
    </div>
  );
}
window.ApproverPage = ApproverPage;
