---
created: 2026-04-15
updated: 2026-04-15
owner: frontend
status: draft
confidence: medium
---

# Componente — MagicLinkGate

Gate de autenticação do aprovador via token na URL. Valida o `magicLinkToken`, cria sessão efêmera (httpOnly cookie ou JWT em localStorage) e renderiza o painel do aprovador. Usado em [[../screens/panel-aprovador]].

## API proposta
```tsx
type MagicLinkGateProps = {
  token: string;                          // from useParams
  children: React.ReactNode;              // conteúdo do painel
  onValidated?: (session: MagicSession) => void;
};

type MagicSession = {
  magic_link_id: string;
  approver_id: string;
  workspace_ids: string[];               // escopo (uma ou mais marcas)
  approver_name: string;
  approver_email: string;
  expires_at: string;
  white_label: {
    agency_name: string;
    logo_url: string | null;
    primary_color: string | null;
  };
};
```

## Fluxo
```
1. Usuário acessa /a/<token>
2. MagicLinkGate monta
3. Lê token do useParams
4. Chama POST /api/magic-link/validate { token }
5. Backend:
   - procura magic_link where token=? and revoked_at is null and expires_at > now()
   - incrementa last_used_at, registra IP/UA em audit_log
   - devolve session + payload JWT assinado (ou cookie httpOnly)
6. Frontend salva session (Zustand) e registra em localStorage como fallback
7. Renderiza children
Falha: renderiza ExpiredLinkPage com CTA "Solicitar novo link"
```

## Layout ASCII — estados
```
LOADING
┌───────────────┐
│ [spinner]     │
│ Validando     │
│ seu acesso... │
└───────────────┘

VALID (→ renderiza children)

EXPIRED / REVOKED
┌───────────────┐
│ [Logo agência]│
│               │
│ Este link     │
│ expirou       │
│               │
│ [Solicitar    │
│  novo link]   │
│               │
│ Atendimento:  │
│ agencia@ex.com│
└───────────────┘
```

## Comportamentos
- **Token inválido** → 410 Gone + `ExpiredLinkPage`.
- **Token expirado** → idem.
- **Token revogado** → idem + mensagem "Acesso revogado; contate agência".
- **Token válido mas network fail** → retry automático 3× com backoff + mensagem "Sem conexão — retente".
- **Refresh de sessão** — sessão expira em 24h (configurável); antes de expirar, background refresh se uso ativo.
- **Solicitar novo link** — botão chama `POST /api/magic-link/request-new` → gera notificação ao admin (não cria link direto por segurança).
- **Audit** — toda validação registra IP + user-agent no `audit_log`.
- **White-label** — aplica `primary_color` via CSS `style="--color-primary: ..."` no root do gate para herdar nos filhos.

## Comportamento offline
- Se já houve validação nessa sessão e cache está válido, renderiza em offline.
- Mutations ficam em fila até reconexão.

## Acessibilidade
- Loading state tem `role="status"` + `aria-live="polite"`.
- CTA de "solicitar novo link" tem foco imediato na página de erro.
- Mensagens não usam apenas cor.

## Performance
- Validação é bloqueante mas rápida (endpoint direto, <200ms).
- Bundle separado: este gate + painel do aprovador é um chunk independente (via `React.lazy()` no `App.tsx`).
- Skeleton mínimo (clientes não gostam de "apps lentos").

## Onde será implementado
`src/features/approver/MagicLinkGate.tsx`.
Subcomponentes:
- `./ExpiredLinkPage.tsx`
- `./useMagicLinkSession.ts` — hook com query + mutation.

## Estado
### Server (TanStack Query)
- `["magic-link", token]` — validação (cache 5min).
- `["approver-profile", magicLinkId]` — dados do aprovador.

### Client (Zustand)
- `src/stores/useMagicLinkStore.ts` — session + whiteLabel aplicados.
- `localStorage['mls:<token>']` — fallback cache assinado.

## Dependências
- shadcn `Alert`, `Button`, `Card`.
- Endpoint backend `POST /api/magic-link/validate`.
- Endpoint backend `POST /api/magic-link/request-new`.
- Tabelas `magic_links`, `approvers`, `audit_log` (backend).

## Segurança
- **Token formato**: UUID v4 ou nanoid 32 chars + assinatura HMAC.
- **Rate limiting** no endpoint de validate (Supabase edge function com IP throttling).
- **CSRF protection** nos endpoints de mutation (via sameSite=strict cookie).
- **Audit log** de tudo.
- **httpOnly + secure + sameSite=strict** para cookie da sessão (preferido sobre localStorage).
- Revogação imediata: admin revoga → próximo refresh do cliente cai na `ExpiredLinkPage`.

## Fora de escopo
- Multi-factor auth no magic link (ex: OTP por SMS).
- WebAuthn/Passkeys.
- "Lembrar deste dispositivo" (cliente final precisa de zero atrito).
