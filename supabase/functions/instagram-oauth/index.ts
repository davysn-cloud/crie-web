// instagram-oauth/index.ts
// Handles Meta Business OAuth token exchange for Instagram integration.
//
// POST /functions/v1/instagram-oauth
// Body: { code: string; workspace_id: string; agency_id: string; redirect_uri: string }
// Returns: { success: true; account_name?: string } | { error: string }
//
// Auth: Bearer JWT (Supabase user session).
// Requires env vars: META_APP_ID, META_APP_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Schema notes:
//   - integration_provider enum value for Instagram is 'meta_graph' (00018).
//   - agency_integrations.secret_encrypted is bytea (pgcrypto). Direct upserts
//     from Edge Functions are blocked by RLS (USING false for authenticated).
//     Tokens are persisted via the save_agency_integration() RPC (security definer),
//     which accepts plaintext and encrypts with pgp_sym_encrypt in-DB.
//     The RPC also handles the soft-revoke of any previously active integration
//     for the same (agency_id, workspace_id, provider) tuple.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withSentry } from '../_shared/sentry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(withSentry(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Invalid auth token' }, 401)
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { code?: unknown; workspace_id?: unknown; agency_id?: unknown; redirect_uri?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const workspaceId = typeof body.workspace_id === 'string' ? body.workspace_id.trim() : ''
  const agencyId = typeof body.agency_id === 'string' ? body.agency_id.trim() : ''
  const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri.trim() : ''

  if (!code || !workspaceId || !agencyId || !redirectUri) {
    return jsonResponse({ error: 'Missing required fields: code, workspace_id, agency_id, redirect_uri' }, 400)
  }

  // ── Meta App credentials ──────────────────────────────────────────────────
  const metaAppId = Deno.env.get('META_APP_ID')
  const metaAppSecret = Deno.env.get('META_APP_SECRET')

  if (!metaAppId || !metaAppSecret) {
    console.error('[instagram-oauth] META_APP_ID or META_APP_SECRET not set')
    return jsonResponse({ error: 'Instagram integration not configured on server' }, 503)
  }

  // ── Step 1: Exchange code for short-lived access token ────────────────────
  const tokenParams = new URLSearchParams({
    client_id: metaAppId,
    client_secret: metaAppSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  })

  let shortLivedToken: string

  try {
    const tokenRes = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('[instagram-oauth] Token exchange error:', err)
      return jsonResponse({ error: 'Failed to exchange authorization code', detail: err }, 502)
    }

    const tokenData = await tokenRes.json() as { access_token: string; token_type: string }
    shortLivedToken = tokenData.access_token
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: 'Network error during token exchange', detail: msg }, 502)
  }

  // ── Step 2: Exchange for long-lived token (60 days) ───────────────────────
  let longLivedToken: string
  let expiresAt: string

  try {
    const llParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: metaAppId,
      client_secret: metaAppSecret,
      fb_exchange_token: shortLivedToken,
    })

    const llRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${llParams.toString()}`)

    if (!llRes.ok) {
      const err = await llRes.text()
      console.error('[instagram-oauth] Long-lived token exchange error:', err)
      return jsonResponse({ error: 'Failed to obtain long-lived token', detail: err }, 502)
    }

    const llData = await llRes.json() as { access_token: string; expires_in?: number }
    longLivedToken = llData.access_token
    const expiresSeconds = llData.expires_in ?? 60 * 24 * 3600 // default 60 days
    expiresAt = new Date(Date.now() + expiresSeconds * 1000).toISOString()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: 'Network error during long-lived token exchange', detail: msg }, 502)
  }

  // ── Step 3: Get user info (Facebook Page or Instagram Business account) ───
  let accountName = 'Instagram'
  let instagramAccountId: string | null = null
  let fbUserId: string | null = null

  try {
    const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${longLivedToken}`)
    if (meRes.ok) {
      const meData = await meRes.json() as { id?: string; name?: string }
      fbUserId = meData.id ?? null
      accountName = meData.name ?? 'Instagram'
    }

    // Try to get Instagram Business Account linked to Facebook page
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account,name&access_token=${longLivedToken}`
    )
    if (pagesRes.ok) {
      const pagesData = await pagesRes.json() as {
        data?: Array<{ instagram_business_account?: { id: string }; name?: string }>
      }
      const firstPage = pagesData.data?.[0]
      if (firstPage?.instagram_business_account?.id) {
        instagramAccountId = firstPage.instagram_business_account.id
        accountName = firstPage.name ?? accountName
      }
    }
  } catch {
    // Non-fatal — continue without account info
  }

  // ── Step 4: Persist via save_agency_integration RPC ──────────────────────
  // agency_integrations uses pgcrypto (secret_encrypted bytea). Direct writes
  // are blocked by RLS for all roles including service_role via USING(false).
  // The save_agency_integration() function is SECURITY DEFINER and handles:
  //   - Soft-revoking the previous active integration (same agency/workspace/provider)
  //   - Encrypting the secret with pgp_sym_encrypt using app.encryption_key GUC
  //
  // provider = 'meta_graph' — the enum in 00018 covers Instagram via Meta Graph API.
  // workspace_id is required for meta_graph by the CHECK constraint in 00018.
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

  const { error: rpcError } = await supabaseAdmin.rpc('save_agency_integration', {
    p_agency_id: agencyId,
    p_workspace_id: workspaceId,
    p_provider: 'meta_graph',
    p_secret: longLivedToken,
    p_refresh: null,
    p_external_account_id: instagramAccountId ?? fbUserId ?? null,
    p_external_account_name: accountName,
    p_scopes: ['instagram_basic', 'instagram_content_publish', 'instagram_manage_posts'],
    p_expires_at: expiresAt,
  })

  if (rpcError) {
    console.error('[instagram-oauth] save_agency_integration RPC error:', rpcError)
    return jsonResponse({ error: 'Failed to save integration', detail: rpcError.message }, 500)
  }

  console.log(`[instagram-oauth] Integration saved for agency=${agencyId} workspace=${workspaceId} account=${accountName}`)
  return jsonResponse({ success: true, account_name: accountName })
}, { name: 'instagram-oauth' }))
