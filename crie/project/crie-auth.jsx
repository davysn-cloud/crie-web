// crie-auth.jsx — Login, Signup, Onboarding (5-step wizard)

function AuthWrap({ children }) {
  return (
    <div style={{
      display:'flex', minHeight:'100vh', fontFamily:"'Inter', system-ui, sans-serif",
      background:CRIE.bg, color:CRIE.ink,
    }}>
      {/* Left — branding panel */}
      <div style={{
        width:'44%', background:CRIE.ink, display:'flex', flexDirection:'column',
        justifyContent:'space-between', padding:48, position:'relative', overflow:'hidden',
        flexShrink:0,
      }}>
        {/* Abstract arch decor */}
        <svg style={{ position:'absolute', right:-60, bottom:-40, opacity:0.12 }} width="340" height="340" viewBox="0 0 340 340">
          {Array.from({length:10}).map((_,i) => (
            <path key={i} d={`M170 ${340-i*18} Q${340-i*8} ${220-i*14} ${340-i*6} ${340-i*18}`}
              stroke="#EEF0A8" strokeWidth="1.2" fill="none" opacity={(10-i)/10}/>
          ))}
        </svg>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <CrieMark size={32}/>
          <span style={{ color:'#fff', fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>Crie!</span>
        </div>
        <div>
          <div style={{ color:CRIE.butter, fontSize:38, fontWeight:700, letterSpacing:-1.5, lineHeight:1.1, marginBottom:16 }}>
            Seu conteúdo.<br/>Aprovado mais rápido.
          </div>
          <div style={{ color:'rgba(255,255,255,0.55)', fontSize:14, lineHeight:1.65, maxWidth:340 }}>
            A plataforma para agências brasileiras que centraliza aprovação e publicação de conteúdo no Instagram.
          </div>
          <div style={{ display:'flex', gap:10, marginTop:24 }}>
            {['Aprovação em 1 clique','Kanban visual','Publicação direta'].map(f => (
              <div key={f} style={{
                padding:'6px 12px', borderRadius:999, background:'rgba(238,240,168,0.12)',
                color:CRIE.butter, fontSize:11.5, fontWeight:500, border:'1px solid rgba(238,240,168,0.25)',
              }}>{f}</div>
            ))}
          </div>
        </div>
        <div style={{ color:'rgba(255,255,255,0.3)', fontSize:12 }}>© 2025 Crie! · Todos os direitos reservados</div>
      </div>

      {/* Right — form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:400 }}>{children}</div>
      </div>
    </div>
  );
}

function FInput({ label, type='text', placeholder, value, onChange, autoFocus }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:CRIE.inkSoft, marginBottom:5 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
        style={{
          width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${CRIE.line}`,
          fontSize:14, color:CRIE.ink, fontFamily:'Inter,sans-serif', outline:'none',
          background:'#fff', boxSizing:'border-box', transition:'border-color .15s',
        }}
        onFocus={e => e.target.style.borderColor = CRIE.butterDeep}
        onBlur={e => e.target.style.borderColor = CRIE.line}
      />
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [err, setErr] = React.useState('');
  const submit = () => {
    if (!email || !pass) { setErr('Preencha todos os campos.'); return; }
    window.navigateTo('dashboard');
  };
  return (
    <AuthWrap>
      <div style={{ fontSize:26, fontWeight:700, letterSpacing:-0.6, marginBottom:6 }}>Entrar na sua conta</div>
      <div style={{ color:CRIE.muted, fontSize:13.5, marginBottom:28 }}>Bem-vindo de volta à Crie!</div>
      <FInput label="E-mail" type="email" placeholder="voce@agencia.com" value={email} onChange={e=>setEmail(e.target.value)} autoFocus/>
      <FInput label="Senha" type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}/>
      <div style={{ textAlign:'right', marginBottom:18 }}>
        <button onClick={() => window.navigateTo('forgot')} style={{ background:'none', border:'none', fontSize:12.5, color:CRIE.muted, cursor:'pointer' }}>Esqueceu a senha?</button>
      </div>
      {err && <div style={{ color:'#EF4444', fontSize:12.5, marginBottom:12 }}>{err}</div>}
      <button onClick={submit} style={{
        width:'100%', padding:'13px', background:CRIE.ink, color:'#fff',
        border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer',
        fontFamily:'Inter,sans-serif', marginBottom:16,
      }}>Entrar</button>
      <div style={{ textAlign:'center', fontSize:13, color:CRIE.muted, marginBottom:14 }}>ou continue com</div>
      <button style={{
        width:'100%', padding:'11px', background:'#fff', border:`1.5px solid ${CRIE.line}`,
        borderRadius:12, fontSize:13.5, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif',
        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Entrar com Google
      </button>
      <div style={{ textAlign:'center', marginTop:24, fontSize:13, color:CRIE.muted }}>
        Não tem conta?{' '}
        <button onClick={() => window.navigateTo('signup')} style={{ background:'none', border:'none', fontSize:13, color:CRIE.ink, fontWeight:600, cursor:'pointer' }}>Criar conta</button>
      </div>
    </AuthWrap>
  );
}

function SignupPage() {
  const [form, setForm] = React.useState({ name:'', email:'', pass:'' });
  const f = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const strength = form.pass.length === 0 ? 0 : form.pass.length < 6 ? 1 : form.pass.length < 10 ? 2 : 3;
  const sColors = ['#E5E5E5','#EF4444','#F59E0B','#22C55E'];
  const sLabels = ['','Fraca','Moderada','Forte'];
  return (
    <AuthWrap>
      <div style={{ fontSize:26, fontWeight:700, letterSpacing:-0.6, marginBottom:6 }}>Criar sua conta</div>
      <div style={{ color:CRIE.muted, fontSize:13.5, marginBottom:28 }}>Comece 14 dias grátis. Sem cartão.</div>
      <FInput label="Nome completo" placeholder="Ana Ribeiro" value={form.name} onChange={f('name')} autoFocus/>
      <FInput label="E-mail" type="email" placeholder="voce@agencia.com" value={form.email} onChange={f('email')}/>
      <FInput label="Senha" type="password" placeholder="••••••••" value={form.pass} onChange={f('pass')}/>
      {form.pass && (
        <div style={{ marginTop:-8, marginBottom:14 }}>
          <div style={{ display:'flex', gap:4, marginBottom:4 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i<=strength ? sColors[strength] : '#E5E5E5', transition:'background .2s' }}/>
            ))}
          </div>
          <div style={{ fontSize:11, color:sColors[strength] }}>{sLabels[strength]}</div>
        </div>
      )}
      <label style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:12.5, color:CRIE.muted, marginBottom:20, lineHeight:1.5 }}>
        <input type="checkbox" style={{ marginTop:2 }}/>
        Concordo com os <span style={{ color:CRIE.ink }}>Termos de Uso</span> e <span style={{ color:CRIE.ink }}>Política de Privacidade</span>
      </label>
      <button onClick={() => window.navigateTo('onboarding')} style={{
        width:'100%', padding:'13px', background:CRIE.ink, color:'#fff',
        border:'none', borderRadius:12, fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
      }}>Criar conta</button>
      <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:CRIE.muted }}>
        Já tem conta?{' '}
        <button onClick={() => window.navigateTo('login')} style={{ background:'none', border:'none', fontSize:13, color:CRIE.ink, fontWeight:600, cursor:'pointer' }}>Entrar</button>
      </div>
    </AuthWrap>
  );
}

function OnboardingPage() {
  const [step, setStep] = React.useState(0);
  const STEPS = ['Sua agência','Primeiro cliente','Brand kit','Convide a equipe','Instagram'];
  const totalSteps = STEPS.length;

  const StepContent = () => {
    if (step === 0) return (
      <div>
        <FInput label="Nome da agência" placeholder="Atelier Canto" autoFocus/>
        <FInput label="Site (opcional)" placeholder="ateliercanot.com.br"/>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:CRIE.inkSoft, marginBottom:5 }}>Logo da agência</label>
          <div style={{
            border:`2px dashed ${CRIE.line}`, borderRadius:12, padding:'28px 20px', textAlign:'center', cursor:'pointer',
          }}>
            <div style={{ fontSize:28, marginBottom:6 }}>🖼</div>
            <div style={{ fontSize:13, color:CRIE.muted }}>Arraste ou clique para enviar</div>
            <div style={{ fontSize:11.5, color:CRIE.mutedSoft, marginTop:4 }}>PNG, SVG ou JPG · máx 2MB</div>
          </div>
        </div>
      </div>
    );
    if (step === 1) return (
      <div>
        <FInput label="Nome da marca / cliente" placeholder="Café Bonito" autoFocus/>
        <FInput label="Perfil do Instagram" placeholder="@cafebonito"/>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:CRIE.inkSoft, marginBottom:5 }}>Fuso horário</label>
          <select style={{ width:'100%', padding:'11px 14px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:14, color:CRIE.ink, fontFamily:'Inter,sans-serif', background:'#fff' }}>
            <option>America/Sao_Paulo (UTC-3)</option>
            <option>America/Manaus (UTC-4)</option>
          </select>
        </div>
      </div>
    );
    if (step === 2) return (
      <div>
        <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:CRIE.inkSoft, marginBottom:8 }}>Cores da marca (até 5)</label>
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          {['#0E0E0C','#EEF0A8','#C6D3A3','#F0C9CC'].map((c,i) => (
            <div key={i} style={{ width:42, height:42, borderRadius:10, background:c, border:`2px solid ${CRIE.line}`, cursor:'pointer' }}/>
          ))}
          <div style={{ width:42, height:42, borderRadius:10, border:`2px dashed ${CRIE.line}`, display:'grid', placeItems:'center', cursor:'pointer', fontSize:20, color:CRIE.muted }}>+</div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:12.5, fontWeight:500, color:CRIE.inkSoft, marginBottom:5 }}>Tom de voz</label>
          <div style={{ display:'flex', gap:8 }}>
            {['Formal','Neutro','Casual','Divertido'].map(t => (
              <button key={t} style={{
                flex:1, padding:'8px 0', borderRadius:10,
                border:`1.5px solid ${t==='Neutro' ? CRIE.ink : CRIE.line}`,
                background: t==='Neutro' ? CRIE.ink : '#fff', color: t==='Neutro' ? '#fff' : CRIE.ink,
                fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif',
              }}>{t}</button>
            ))}
          </div>
        </div>
      </div>
    );
    if (step === 3) return (
      <div>
        <div style={{ color:CRIE.muted, fontSize:13, marginBottom:14 }}>Convide membros por e-mail e defina seus cargos.</div>
        {[0,1].map(i => (
          <div key={i} style={{ display:'flex', gap:8, marginBottom:10 }}>
            <input placeholder="email@agencia.com" style={{ flex:1, padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13, color:CRIE.ink, fontFamily:'Inter,sans-serif', outline:'none' }}/>
            <select style={{ padding:'10px 12px', borderRadius:10, border:`1.5px solid ${CRIE.line}`, fontSize:13, color:CRIE.ink, fontFamily:'Inter,sans-serif', background:'#fff' }}>
              <option>Estrategista</option><option>Copywriter</option><option>Designer</option><option>Social Media</option><option>Admin</option>
            </select>
          </div>
        ))}
        <button style={{ background:'none', border:'none', color:CRIE.muted, fontSize:12.5, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>+ Adicionar outro</button>
      </div>
    );
    if (step === 4) return (
      <div style={{ textAlign:'center', padding:'10px 0' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>📸</div>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>Conectar Instagram</div>
        <div style={{ fontSize:13, color:CRIE.muted, lineHeight:1.6, marginBottom:24 }}>
          Conecte a conta do Instagram do cliente via Meta para publicar diretamente pela Crie!
        </div>
        <button style={{
          padding:'12px 28px', borderRadius:999, border:'none', cursor:'pointer',
          fontFamily:'Inter,sans-serif', fontSize:14, fontWeight:600,
          background:'linear-gradient(45deg,#833ab4,#fd1d1d,#fcb045)', color:'#fff',
          marginBottom:14,
        }}>Conectar com Meta</button>
        <div style={{ fontSize:12, color:CRIE.muted }}>Você pode pular e conectar depois.</div>
      </div>
    );
    return null;
  };

  return (
    <div style={{
      minHeight:'100vh', background:CRIE.bg, display:'flex', alignItems:'center',
      justifyContent:'center', fontFamily:"'Inter', system-ui, sans-serif", padding:24,
    }}>
      <div style={{ width:'100%', maxWidth:520, background:'#fff', borderRadius:28, padding:40, boxShadow:'0 20px 60px rgba(0,0,0,0.08)', border:`1px solid ${CRIE.line}` }}>
        {/* Stepper */}
        <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, flex:1 }}>
                <div style={{
                  width:28, height:28, borderRadius:999,
                  background: i < step ? CRIE.ink : i === step ? CRIE.butter : CRIE.lineSoft,
                  border: `2px solid ${i === step ? CRIE.butterDeep : i < step ? CRIE.ink : CRIE.line}`,
                  display:'grid', placeItems:'center', fontSize:12, fontWeight:700,
                  color: i < step ? '#fff' : i === step ? CRIE.ink : CRIE.muted,
                  transition:'all .2s',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <div style={{ fontSize:10, color: i === step ? CRIE.ink : CRIE.muted, fontWeight: i===step?600:400, whiteSpace:'nowrap' }}>{s}</div>
              </div>
              {i < totalSteps - 1 && <div style={{ flex:'0 0 24px', height:2, background: i < step ? CRIE.ink : CRIE.line, borderRadius:99, marginBottom:16 }}/>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ fontSize:21, fontWeight:700, letterSpacing:-0.4, marginBottom:4 }}>
          {{0:'Sobre sua agência',1:'Primeiro cliente',2:'Brand kit básico',3:'Convide sua equipe',4:'Conecte o Instagram'}[step]}
        </div>
        <div style={{ fontSize:13, color:CRIE.muted, marginBottom:24 }}>Passo {step+1} de {totalSteps}</div>
        <StepContent/>
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:28 }}>
          {step > 0
            ? <button onClick={() => setStep(s => s-1)} style={{ background:'none', border:`1.5px solid ${CRIE.line}`, borderRadius:10, padding:'10px 20px', fontSize:13.5, fontWeight:500, cursor:'pointer', fontFamily:'Inter,sans-serif', color:CRIE.ink }}>Voltar</button>
            : <div/>}
          <button onClick={() => step < totalSteps - 1 ? setStep(s=>s+1) : window.navigateTo('dashboard')} style={{
            background:CRIE.ink, color:'#fff', border:'none', borderRadius:10, padding:'10px 28px',
            fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif',
          }}>
            {step < totalSteps - 1 ? 'Próximo' : 'Começar a usar o Crie!'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginPage, SignupPage, OnboardingPage });
