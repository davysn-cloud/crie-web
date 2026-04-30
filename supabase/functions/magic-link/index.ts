// magic-link/index.ts
// Two modes:
//   POST /magic-link?mode=generate — create magic link, send email via Resend
//   POST /magic-link?mode=verify   — verify token, return session JWT
// Auth: generate requires auth.uid() (agency member); verify is public.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withSentry } from '../_shared/sentry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TOKEN_BYTES = 32 // 256-bit entropy
const TOKEN_TTL_HOURS = 24
const SESSION_TTL_MINUTES = 30
const MAX_GENERATES_PER_HOUR = 5

Deno.serve(withSentry(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const mode = url.searchParams.get('mode')

  try {
    if (mode === 'generate' && req.method === 'POST') {
      return await handleGenerate(req)
    } else if (mode === 'verify' && req.method === 'POST') {
      return await handleVerify(req)
    } else {
      return jsonResponse({ error: 'Invalid mode. Use ?mode=generate or ?mode=verify', code: 'INVALID_MODE' }, 400)
    }
  } catch (err) {
    const error = err as Error
    console.error(`[magic-link] Error (${mode}):`, error.message)
    return jsonResponse({ error: error.message, code: 'INTERNAL_ERROR' }, 500)
  }
}, { name: 'magic-link' }))

async function handleGenerate(req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hmacSecret = Deno.env.get('MAGIC_LINK_HMAC_SECRET')

  if (!hmacSecret) {
    return jsonResponse({ error: 'MAGIC_LINK_HMAC_SECRET not configured', code: 'CONFIG_ERROR' }, 500)
  }

  // Validate caller is authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401)
  }

  // Create authenticated client to verify the caller
  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Invalid auth token', code: 'AUTH_INVALID' }, 401)
  }

  // Service role client for writes
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const body = await req.json()
  const { approval_request_id, approver_email, agency_id } = body

  if (!approval_request_id || !approver_email || !agency_id) {
    return jsonResponse({ error: 'Missing required fields: approval_request_id, approver_email, agency_id', code: 'VALIDATION_ERROR' }, 400)
  }

  // Verify caller is agency member
  const { data: membership } = await supabase
    .from('agency_members')
    .select('id')
    .eq('agency_id', agency_id)
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .single()

  if (!membership) {
    return jsonResponse({ error: 'Not a member of this agency', code: 'NOT_AUTHORIZED' }, 403)
  }

  // Rate limit: max 5 generates per approval_request per hour
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString()
  const { count: recentCount } = await supabase
    .from('magic_links')
    .select('id', { count: 'exact', head: true })
    .eq('approval_request_id', approval_request_id)
    .gte('created_at', oneHourAgo)

  if ((recentCount || 0) >= MAX_GENERATES_PER_HOUR) {
    return jsonResponse({ error: 'Rate limit: max 5 links per approval request per hour', code: 'RATE_LIMIT' }, 429)
  }

  // Get the approval request for context
  const { data: approvalReq } = await supabase
    .from('approval_requests')
    .select('id, workspace_id, assignee_email, assignee_label')
    .eq('id', approval_request_id)
    .single()

  if (!approvalReq) {
    return jsonResponse({ error: 'Approval request not found', code: 'NOT_FOUND' }, 404)
  }

  // Generate token: 32 bytes random + HMAC-SHA256
  const randomBytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(randomBytes)

  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600_000)

  // HMAC payload
  const payload = JSON.stringify({
    approval_request_id,
    approver_email,
    exp: expiresAt.getTime(),
    nonce: bufferToBase64url(randomBytes),
  })

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(hmacSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))

  // Token = base64url(payload) + '.' + base64url(signature)
  const token = bufferToBase64url(new TextEncoder().encode(payload)) + '.' + bufferToBase64url(new Uint8Array(signature))

  // Store hash of token
  const tokenHash = await sha256(token)

  // Insert magic_link
  const { data: magicLink, error: insertErr } = await supabase
    .from('magic_links')
    .insert({
      agency_id,
      workspace_id: approvalReq.workspace_id,
      purpose: 'approval',
      approval_request_id,
      token_hash: tokenHash,
      email: approver_email,
      label: approvalReq.assignee_label || approver_email,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (insertErr) {
    console.error('[magic-link] Insert error:', insertErr.message)
    return jsonResponse({ error: 'Failed to create magic link', code: 'INSERT_ERROR' }, 500)
  }

  // Send email via Resend
  const siteUrl = Deno.env.get('SITE_URL') || 'https://app.crie.com'
  const approvalUrl = `${siteUrl}/a/${token}`

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (resendKey) {
    try {
      const { data: agency } = await supabase
        .from('agencies')
        .select('name')
        .eq('id', agency_id)
        .single()

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@crie.com',
          to: [approver_email],
          subject: `${agency?.name || 'Agencia'} — Novo conteudo para sua aprovacao`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Voce tem conteudo para aprovar</h2>
              <p>Clique no botao abaixo para revisar e aprovar o conteudo:</p>
              <a href="${approvalUrl}"
                 style="display: inline-block; padding: 12px 24px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                Revisar conteudo
              </a>
              <p style="color: #666; font-size: 14px;">Este link expira em ${TOKEN_TTL_HOURS} horas.</p>
            </div>
          `,
        }),
      })
      console.log(`[magic-link] Email sent to ${approver_email}`)
    } catch (emailErr) {
      console.warn('[magic-link] Failed to send email:', (emailErr as Error).message)
    }
  } else {
    console.warn('[magic-link] RESEND_API_KEY not set; skipping email')
  }

  return jsonResponse({
    id: magicLink!.id,
    token,
    expires_at: expiresAt.toISOString(),
    approval_url: approvalUrl,
  }, 201)
}

async function handleVerify(req: Request): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const hmacSecret = Deno.env.get('MAGIC_LINK_HMAC_SECRET')

  if (!hmacSecret) {
    return jsonResponse({ error: 'MAGIC_LINK_HMAC_SECRET not configured', code: 'CONFIG_ERROR' }, 500)
  }

  const body = await req.json()
  const { token } = body

  if (!token) {
    return jsonResponse({ error: 'Token required', code: 'VALIDATION_ERROR' }, 400)
  }

  // 1. Validate HMAC
  const parts = token.split('.')
  if (parts.length !== 2) {
    return jsonResponse({ error: 'Invalid token format', code: 'MAGIC_LINK_INVALID' }, 401)
  }

  const [payloadB64, signatureB64] = parts
  const payloadBytes = base64urlToBuffer(payloadB64)
  const signatureBytes = base64urlToBuffer(signatureB64)

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(hmacSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, payloadBytes)
  if (!valid) {
    return jsonResponse({ error: 'Invalid token signature', code: 'MAGIC_LINK_INVALID' }, 401)
  }

  // 2. Parse payload and validate expiration
  let payload: { approval_request_id: string; approver_email: string; exp: number }
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes))
  } catch {
    return jsonResponse({ error: 'Invalid token payload', code: 'MAGIC_LINK_INVALID' }, 401)
  }

  if (Date.now() > payload.exp) {
    return jsonResponse({ error: 'Token expired', code: 'MAGIC_LINK_EXPIRED' }, 401)
  }

  // 3. Look up the magic_link by token hash
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const tokenHash = await sha256(token)

  const { data: magicLink } = await supabase
    .from('magic_links')
    .select('id, agency_id, workspace_id, approval_request_id, revoked_at, expires_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!magicLink) {
    return jsonResponse({ error: 'Token not found', code: 'MAGIC_LINK_INVALID' }, 401)
  }

  if (magicLink.revoked_at) {
    return jsonResponse({ error: 'Token has been revoked', code: 'MAGIC_LINK_REVOKED' }, 401)
  }

  if (new Date(magicLink.expires_at) < new Date()) {
    return jsonResponse({ error: 'Token expired', code: 'MAGIC_LINK_EXPIRED' }, 401)
  }

  // 4. Update usage stats
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
  const ua = req.headers.get('user-agent') || null
  await supabase
    .from('magic_links')
    .update({
      used_at: new Date().toISOString(),
      use_count: (magicLink as Record<string, unknown>).use_count as number + 1 || 1,
      last_used_ip: ip,
      last_used_user_agent: ua,
    })
    .eq('id', magicLink.id)

  // 5. Generate session JWT (custom, signed with SUPABASE_SERVICE_ROLE_KEY for simplicity)
  const sessionSecret = Deno.env.get('MAGIC_LINK_SESSION_SECRET') || supabaseServiceKey
  const sessionExp = Math.floor(Date.now() / 1000) + SESSION_TTL_MINUTES * 60

  const jwtPayload = {
    role: 'approver',
    agency_id: magicLink.agency_id,
    workspace_id: magicLink.workspace_id,
    approval_request_id: magicLink.approval_request_id,
    magic_link_id: magicLink.id,
    email: payload.approver_email,
    exp: sessionExp,
    iat: Math.floor(Date.now() / 1000),
  }

  const sessionJwt = await signJwt(jwtPayload, sessionSecret)

  return jsonResponse({
    magic_link_id: magicLink.id,
    agency_id: magicLink.agency_id,
    workspace_id: magicLink.workspace_id,
    approval_request_id: magicLink.approval_request_id,
    session: {
      access_jwt: sessionJwt,
      expires_at: new Date(sessionExp * 1000).toISOString(),
    },
  })
}

// -- Crypto helpers --

function bufferToBase64url(buf: Uint8Array): string {
  const binStr = Array.from(buf, (b) => String.fromCharCode(b)).join('')
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlToBuffer(b64: string): Uint8Array {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (b64.length % 4)) % 4)
  const binStr = atob(padded)
  return Uint8Array.from(binStr, (c) => c.charCodeAt(0))
}

async function sha256(input: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = bufferToBase64url(new TextEncoder().encode(JSON.stringify(header)))
  const payloadB64 = bufferToBase64url(new TextEncoder().encode(JSON.stringify(payload)))
  const message = `${headerB64}.${payloadB64}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  const signatureB64 = bufferToBase64url(new Uint8Array(signature))

  return `${message}.${signatureB64}`
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
