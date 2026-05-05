// delete-account/index.ts
// POST autenticado — exclui a conta do usuário autenticado.
// Ordem: remove agency_members, workspaces e agencies onde é owner,
// depois chama auth.admin.deleteUser via service_role key.
// O cascade ON DELETE nas FK cuida das tabelas filhas.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withSentry } from '../_shared/sentry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(withSentry(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Valida JWT do usuário
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Client com JWT do usuário para verificar identidade
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Confirmação obrigatória no body
  const body = await req.json().catch(() => ({}))
  if (body.confirm !== 'EXCLUIR') {
    return new Response(JSON.stringify({ error: 'Confirmation required: send { confirm: "EXCLUIR" }' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Admin client para operações privilegiadas
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // 1. Agências onde o usuário é owner — exclui em cascata workspaces, post_cards, etc.
  const { data: ownedAgencies } = await adminClient
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)

  if (ownedAgencies && ownedAgencies.length > 0) {
    const agencyIds = ownedAgencies.map((a: { id: string }) => a.id)
    await adminClient.from('agencies').delete().in('id', agencyIds)
  }

  // 2. Remove memberships em agências de terceiros (onde não é owner)
  await adminClient
    .from('agency_members')
    .delete()
    .eq('user_id', user.id)

  // 3. Exclui o usuário do Auth (cascata limpa auth.identities, sessions, etc.)
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('[delete-account] auth.admin.deleteUser failed:', deleteError)
    return new Response(JSON.stringify({ error: 'Failed to delete user', detail: deleteError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}, { name: 'delete-account' }))
