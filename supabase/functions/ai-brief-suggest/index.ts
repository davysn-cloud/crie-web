// ai-brief-suggest/index.ts
// Generates AI-powered brief field suggestions (target_audience, key_message, cta,
// caption_suggestion) given a post title, optional pillar and brand voice context.
//
// POST /functions/v1/ai-brief-suggest
// Body: { title: string; pillar?: string; brand_voice?: string }
// Returns: { target_audience: string; key_message: string; cta: string; caption_suggestion: string }
//
// Auth: Bearer JWT (Supabase user session). Service-role key stays server-side.
// Model: gemini-3.1-flash-preview via Google Generative AI API — optimised for speed/cost.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withSentry } from '../_shared/sentry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ─── System prompt (PT-BR, social media agency context) ───────────────────────

function buildSystemPrompt(pillar?: string, brandVoice?: string): string {
  const pillarLine = pillar ? `\nPILAR DE CONTEÚDO: ${pillar}` : ''
  const voiceLine = brandVoice ? `\nTOM DA MARCA: ${brandVoice}` : ''

  return `Você é um estrategista de conteúdo para redes sociais especializado em Instagram para agências de marketing brasileiras.${pillarLine}${voiceLine}

Dado o título de um post, gere sugestões concisas e práticas para o brief de conteúdo.

REGRAS:
- Escreva SEMPRE em português do Brasil.
- Seja específico e acionável — sem frases genéricas.
- target_audience: máximo 2 frases descrevendo o público exato (demographics + psicographics).
- key_message: uma frase poderosa que resume o que o público deve sentir ou entender.
- cta: chamada para ação direta, curta (máximo 10 palavras), adequada ao Instagram.
- caption_suggestion: primeira linha da legenda (gancho), até 125 caracteres, sem emoji no início.

Retorne SOMENTE um objeto JSON válido com as 4 chaves: target_audience, key_message, cta, caption_suggestion.
Não inclua explicações, markdown, código fence ou qualquer texto fora do JSON.`
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(withSentry(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)
  }

  // ── Auth: verify Supabase JWT ──────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Invalid or expired auth token', code: 'AUTH_INVALID' }, 401)
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: { title?: unknown; pillar?: unknown; brand_voice?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body', code: 'PARSE_ERROR' }, 400)
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (title.length < 5) {
    return jsonResponse(
      { error: 'title must be at least 5 characters', code: 'VALIDATION_ERROR' },
      400,
    )
  }

  const pillar = typeof body.pillar === 'string' ? body.pillar.trim() : undefined
  const brandVoice = typeof body.brand_voice === 'string' ? body.brand_voice.trim() : undefined

  // ── Gemini API call ───────────────────────────────────────────────────────
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) {
    console.error('[ai-brief-suggest] GEMINI_API_KEY not set')
    return jsonResponse(
      { error: 'Servico de IA nao configurado', code: 'LLM_NOT_CONFIGURED' },
      503,
    )
  }

  const systemPrompt = buildSystemPrompt(pillar, brandVoice)
  const userMessage = `Título do post: "${title}"`

  console.log(`[ai-brief-suggest] User ${user.id} | title="${title}" pillar=${pillar ?? 'none'}`)

  const geminiModel = 'gemini-3.1-flash-preview'
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`

  let geminiRes: Response
  try {
    geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          responseMimeType: 'application/json',
        },
      }),
    })
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
    console.error('[ai-brief-suggest] Gemini fetch error:', msg)
    return jsonResponse({ error: 'Falha ao conectar com IA', code: 'LLM_NETWORK_ERROR' }, 502)
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text()
    console.error(`[ai-brief-suggest] Gemini ${geminiRes.status}:`, errText)
    if (geminiRes.status === 429) {
      return jsonResponse(
        { error: 'Limite de requisicoes atingido, tente novamente em instantes', code: 'LLM_RATE_LIMIT' },
        429,
      )
    }
    return jsonResponse({ error: 'Erro no servico de IA', code: 'LLM_UPSTREAM_ERROR' }, 502)
  }

  // ── Parse Gemini response ────────────────────────────────────────────────
  let geminiData: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  try {
    geminiData = await geminiRes.json()
  } catch {
    return jsonResponse({ error: 'Resposta invalida da IA', code: 'LLM_PARSE_ERROR' }, 502)
  }

  const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

  // The model should return pure JSON; strip any accidental code fences.
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let suggestions: {
    target_audience: string
    key_message: string
    cta: string
    caption_suggestion: string
  }

  try {
    suggestions = JSON.parse(cleaned)
  } catch {
    console.error('[ai-brief-suggest] Could not parse model JSON:', rawText)
    return jsonResponse(
      { error: 'IA retornou formato inesperado, tente novamente', code: 'LLM_FORMAT_ERROR' },
      502,
    )
  }

  // Basic shape validation
  const required = ['target_audience', 'key_message', 'cta', 'caption_suggestion'] as const
  for (const key of required) {
    if (typeof suggestions[key] !== 'string') {
      console.error(`[ai-brief-suggest] Missing field "${key}" in model response`)
      return jsonResponse(
        { error: 'IA retornou dados incompletos, tente novamente', code: 'LLM_FORMAT_ERROR' },
        502,
      )
    }
  }

  console.log(`[ai-brief-suggest] OK for user ${user.id}`)
  return jsonResponse({
    target_audience: suggestions.target_audience,
    key_message: suggestions.key_message,
    cta: suggestions.cta,
    caption_suggestion: suggestions.caption_suggestion,
  })
}, { name: 'ai-brief-suggest' }))
