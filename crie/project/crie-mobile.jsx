// Crie! — Mobile screens. The approver portal is the core differentiator.

function MobileStatusBar() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '14px 28px 6px',
      fontSize: 13, fontWeight: 600, color: CRIE.ink, alignItems: 'center',
    }}>
      <span>11:16</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke={CRIE.ink} strokeWidth="1.4">
          <path d="M1 5.2c2-2 4-3 6-3s4 1 6 3M3 7c1.3-1.2 2.6-1.8 4-1.8S9.7 5.8 11 7"/>
          <circle cx="7" cy="8.6" r="0.8" fill={CRIE.ink}/>
        </svg>
        <svg width="16" height="10" viewBox="0 0 16 10" fill={CRIE.ink}>
          <rect x="0" y="6" width="3" height="4" rx="0.5"/>
          <rect x="4.5" y="4" width="3" height="6" rx="0.5"/>
          <rect x="9" y="2" width="3" height="8" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="10" rx="0.5"/>
        </svg>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" stroke={CRIE.ink} strokeWidth="1">
          <rect x="0.5" y="0.5" width="18" height="9" rx="2"/>
          <rect x="2" y="2" width="14" height="6" rx="1" fill={CRIE.ink}/>
          <rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill={CRIE.ink}/>
        </svg>
      </div>
    </div>
  );
}

function ApproverPortalMobile() {
  // Approver is reviewing a carousel. White-label: agency logo top-left.
  return (
    <div style={{
      width: 390, height: 844, background: '#FAF8F3', borderRadius: 44,
      fontFamily: 'Inter, system-ui, sans-serif', color: CRIE.ink,
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      <MobileStatusBar/>
      {/* White-label header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 22px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, background: CRIE.butter,
            display: 'grid', placeItems: 'center',
          }}>
            <CrieMark size={20}/>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Atelier Canto</div>
            <div style={{ fontSize: 10, color: CRIE.muted }}>aprovando como Marina</div>
          </div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 999, background: CRIE.butter,
          fontSize: 11, fontWeight: 600,
        }}>@cafebonito</div>
      </div>

      {/* Hero "12 Days left" style card — repurposed as pending summary */}
      <div style={{
        margin: '0 18px 14px', background: CRIE.card, borderRadius: 24, padding: 22,
        border: `1px solid ${CRIE.line}`,
      }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1.05 }}>
          5 posts<br/>para você
        </div>
        <div style={{ color: CRIE.muted, fontSize: 12.5, marginTop: 8, lineHeight: 1.45 }}>
          Revise e aprove para que sua equipe siga com a publicação desta semana.
        </div>
        <div style={{ marginTop: 16 }}>
          <DotMatrix rows={4} cols={11} filled={0.38}/>
        </div>
      </div>

      {/* Post preview card */}
      <div style={{
        margin: '0 18px 12px', background: CRIE.ink, color: '#fff', borderRadius: 24, padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Revisão atual</div>
          <div style={{ display: 'flex', gap: 4, background: '#1C1C1A', padding: 3, borderRadius: 999 }}>
            <span style={{ padding: '4px 10px', fontSize: 10, color: '#A5A59B' }}>Feed</span>
            <span style={{ padding: '4px 10px', fontSize: 10, background: CRIE.butter, color: CRIE.ink, borderRadius: 999, fontWeight: 600 }}>Carrossel</span>
          </div>
        </div>
        {/* Pseudo IG preview */}
        <div style={{
          borderRadius: 16, overflow: 'hidden', background: '#2A2A26',
          position: 'relative', aspectRatio: '4/5',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(135deg,#3A3A34 0 14px,#2F2F2A 14px 28px)',
          }}/>
          {/* Dot indicator */}
          <div style={{
            position: 'absolute', top: 12, right: 12, padding: '4px 10px', borderRadius: 999,
            background: 'rgba(0,0,0,0.5)', fontSize: 10.5, fontWeight: 600,
          }}>2 / 10</div>
          {/* Pin marker */}
          <div style={{
            position: 'absolute', top: '40%', left: '30%',
            width: 24, height: 24, borderRadius: 999, background: CRIE.butter,
            color: CRIE.ink, fontWeight: 700, fontSize: 12, display: 'grid', placeItems: 'center',
            boxShadow: '0 0 0 4px rgba(238,240,168,0.3)',
          }}>1</div>
          <div style={{ position: 'absolute', bottom: 14, left: 14, right: 14,
            fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 10, color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase', letterSpacing: 0.5 }}>
            carrossel · slide 2/10
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12.5, color: '#D8D6CE', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: '#fff' }}>@cafebonito </span>
          Você sabia que 80% das padarias ainda aprovam conteúdo pelo WhatsApp? Descubra como…
          <span style={{ color: '#A5A59B' }}> mais</span>
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: '0 18px', display: 'flex', gap: 10 }}>
        <button style={{
          flex: 1, padding: '14px', background: CRIE.butter, border: 'none', borderRadius: 18,
          fontSize: 14, fontWeight: 600, color: CRIE.ink, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7"/>
          </svg>
          Aprovar
        </button>
        <button style={{
          width: 56, padding: '14px', background: CRIE.card, border: `1px solid ${CRIE.line}`,
          borderRadius: 18, display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={CRIE.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20l-7-7 7-7M5 13h16"/>
          </svg>
        </button>
        <button style={{
          padding: '14px 18px', background: CRIE.ink, color: '#fff', border: 'none',
          borderRadius: 18, fontSize: 14, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          Pedir ajuste
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1 }}/>
      {/* Home indicator */}
      <div style={{ display: 'grid', placeItems: 'center', padding: '12px 0 10px' }}>
        <div style={{ width: 140, height: 5, borderRadius: 999, background: CRIE.ink, opacity: 0.85 }}/>
      </div>
    </div>
  );
}
window.ApproverPortalMobile = ApproverPortalMobile;

// Second mobile — manager's "Entregas" view, echoes the dark list screen
function ManagerQueueMobile() {
  const items = [
    { when: 'Segunda 22/abr', title: 'Carrossel @cafebonito' },
    { when: 'Terça 23/abr',   title: 'Reel institucional @modazen' },
    { when: 'Quarta 24/abr',  title: 'Stories @padariaestrela' },
    { when: 'Sexta 26/abr',   title: 'Carrossel de dicas @viververde' },
    { when: 'Segunda 29/abr', title: 'Feed do lançamento outono' },
    { when: 'Terça 30/abr',   title: 'Relatório mensal @cafebonito' },
  ];
  return (
    <div style={{
      width: 390, height: 844, background: '#FAF8F3', borderRadius: 44,
      fontFamily: 'Inter, system-ui, sans-serif', color: CRIE.ink,
      overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column',
    }}>
      <MobileStatusBar/>
      <div style={{ padding: '12px 24px 10px' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Próximas entregas</div>
        <div style={{ color: CRIE.muted, fontSize: 12.5, marginTop: 2 }}>Agenda da sua equipe para as próximas semanas.</div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '6px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            background: CRIE.card, border: `1px solid ${CRIE.line}`, borderRadius: 18,
            padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 10.5, color: CRIE.muted, marginBottom: 2 }}>{it.when}, 2025</div>
              <div style={{ fontSize: 14.5, fontWeight: 500 }}>{it.title}</div>
            </div>
            <div style={{ color: CRIE.mutedSoft, fontSize: 18, letterSpacing: 2 }}>⋮</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 18px 6px' }}>
        <button style={{
          padding: '12px 20px', background: CRIE.ink, color: '#fff', border: 'none',
          borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>Ver tudo</button>
      </div>
      <div style={{ display: 'grid', placeItems: 'center', padding: '10px 0 10px' }}>
        <div style={{ width: 140, height: 5, borderRadius: 999, background: CRIE.ink, opacity: 0.85 }}/>
      </div>
    </div>
  );
}
window.ManagerQueueMobile = ManagerQueueMobile;
