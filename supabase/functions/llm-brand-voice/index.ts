// llm-brand-voice/index.ts
// Proxy LLM calls through brand voice context.
// Receives workspace_id + prompt, injects brand_voice system prompt, streams SSE response.
// API key from agency_integrations (provider = openai/anthropic), decrypted server-side.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Auth: validate caller
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401)
  }

  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Invalid auth token', code: 'AUTH_INVALID' }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    const { workspace_id, prompt, max_tokens } = body

    if (!workspace_id || !prompt) {
      return jsonResponse({ error: 'workspace_id and prompt are required', code: 'VALIDATION_ERROR' }, 400)
    }

    console.log(`[llm-brand-voice] Request for workspace ${workspace_id} by user ${user.id}`)

    // 1. Verify workspace membership
    const { data: wsMember } = await supabase
      .from('workspace_members')
      .select('id, role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!wsMember) {
      return jsonResponse({ error: 'Not a member of this workspace', code: 'NOT_AUTHORIZED' }, 403)
    }

    // 2. Get workspace's agency_id
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id, agency_id, name')
      .eq('id', workspace_id)
      .single()

    if (!workspace) {
      return jsonResponse({ error: 'Workspace not found', code: 'NOT_FOUND' }, 404)
    }

    // 3. Get brand_voice for this workspace
    const { data: brandVoice } = await supabase
      .from('brand_voice')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single()

    // Fallback to brand_profiles if brand_voice not configured
    let voiceContext: BrandVoiceContext
    if (brandVoice) {
      voiceContext = {
        tone: brandVoice.tone,
        emoji_policy: brandVoice.emoji_policy,
        slang_allowed: brandVoice.slang_allowed,
        vocab_preferred: brandVoice.vocab_preferred || [],
        vocab_forbidden: brandVoice.vocab_forbidden || [],
        approved_examples: brandVoice.approved_examples_json || [],
        system_prompt_override: brandVoice.system_prompt_override,
        llm_model: brandVoice.llm_model,
        llm_temperature: brandVoice.llm_temperature,
      }
    } else {
      const { data: brandProfile } = await supabase
        .from('brand_profiles')
        .select('tone_of_voice, do_not_say, keywords')
        .eq('workspace_id', workspace_id)
        .single()

      voiceContext = {
        tone: brandProfile?.tone_of_voice || 'neutral',
        emoji_policy: 'sparingly',
        slang_allowed: false,
        vocab_preferred: brandProfile?.keywords || [],
        vocab_forbidden: brandProfile?.do_not_say || [],
        approved_examples: [],
        system_prompt_override: null,
        llm_model: 'claude-3-5-sonnet',
        llm_temperature: 0.7,
      }
    }

    // 4. Get LLM API key from agency_integrations
    const { data: llmIntegrations } = await supabase
      .from('agency_integrations_public')
      .select('id, provider, status')
      .eq('agency_id', workspace.agency_id)
      .in('provider', ['anthropic', 'openai'])
      .eq('status', 'active')
      .limit(1)

    if (!llmIntegrations || llmIntegrations.length === 0) {
      return jsonResponse({
        error: 'Configure sua chave de IA em Admin → Integracoes',
        code: 'LLM_NOT_CONFIGURED',
      }, 402)
    }

    const integration = llmIntegrations[0]

    // Decrypt API key
    const { data: secrets, error: decryptErr } = await supabase.rpc('decrypt_integration_secret', {
      p_integration_id: integration.id,
    })

    if (decryptErr || !secrets?.[0]?.secret) {
      return jsonResponse({ error: 'Failed to decrypt LLM key', code: 'DECRYPT_ERROR' }, 500)
    }

    const apiKey = secrets[0].secret
    const provider = integration.provider as 'anthropic' | 'openai'

    // 5. Build system prompt
    const systemPrompt = buildSystemPrompt(voiceContext, prompt)

    // 6. Stream response via SSE
    console.log(`[llm-brand-voice] Calling ${provider} for workspace ${workspace_id}`)

    if (provider === 'anthropic') {
      return await streamAnthropic(apiKey, systemPrompt, prompt, voiceContext, max_tokens)
    } else {
      return await streamOpenAI(apiKey, systemPrompt, prompt, voiceContext, max_tokens)
    }
  } catch (err) {
    const error = err as Error
    console.error('[llm-brand-voice] Error:', error.message)
    return jsonResponse({ error: error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

interface BrandVoiceContext {
  tone: string
  emoji_policy: string
  slang_allowed: boolean
  vocab_preferred: string[]
  vocab_forbidden: string[]
  approved_examples: unknown[]
  system_prompt_override: string | null
  llm_model: string
  llm_temperature: number
}

function buildSystemPrompt(voice: BrandVoiceContext, _userPrompt: string): string {
  if (voice.system_prompt_override) {
    return voice.system_prompt_override
  }

  const examples = (voice.approved_examples as Array<{ body?: string }>)
    .map((e) => `- ${e.body || JSON.stringify(e)}`)
    .join('\n')

  return `Voce e um copywriter social para Instagram. Respeite RIGOROSAMENTE a brand voice a seguir:

TOM: ${voice.tone}
EMOJIS: ${voice.emoji_policy}
GIRIAS: ${voice.slang_allowed ? 'permitidas' : 'proibidas'}
PREFERIR: ${voice.vocab_preferred.join(', ') || '(nenhuma restricao)'}
PROIBIDO: ${voice.vocab_forbidden.join(', ') || '(nenhuma restricao)'}

${examples ? `EXEMPLOS APROVADOS:\n${examples}` : ''}

RESTRICOES DO INSTAGRAM:
- Primeira linha (ate 125 caracteres) e o hook — aparece antes do "... ver mais".
- Legenda total maxima 2200 caracteres.

Gere apenas o conteudo pedido, sem comentarios extras.`
}

async function streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  voice: BrandVoiceContext,
  maxTokens?: number
): Promise<Response> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: voice.llm_model || 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens || 2048,
      temperature: voice.llm_temperature,
      system: systemPrompt,
      stream: true,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!res.ok) {
    const errData = await res.text()
    console.error('[llm-brand-voice] Anthropic error:', errData)
    if (res.status === 429) {
      return jsonResponse({ error: 'LLM rate limit exceeded', code: 'LLM_RATE_LIMIT' }, 429)
    }
    return jsonResponse({ error: 'LLM upstream error', code: 'LLM_UPSTREAM_ERROR' }, 502)
  }

  // Pass through the SSE stream
  return new Response(res.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

async function streamOpenAI(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  voice: BrandVoiceContext,
  maxTokens?: number
): Promise<Response> {
  const model = voice.llm_model?.startsWith('gpt') ? voice.llm_model : 'gpt-4o'

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens || 2048,
      temperature: voice.llm_temperature,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    const errData = await res.text()
    console.error('[llm-brand-voice] OpenAI error:', errData)
    if (res.status === 429) {
      return jsonResponse({ error: 'LLM rate limit exceeded', code: 'LLM_RATE_LIMIT' }, 429)
    }
    return jsonResponse({ error: 'LLM upstream error', code: 'LLM_UPSTREAM_ERROR' }, 502)
  }

  return new Response(res.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
