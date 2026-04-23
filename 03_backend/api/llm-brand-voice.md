---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: active
confidence: high
---

# API — LLM Brand Voice Proxy

> Edge Function que gera rascunho de copy com LLM **condicionado ao `brand_voice` da workspace**. Mantém chaves de API server-side, impõe rate limit, registra uso.

## Por que proxy (não chamar LLM direto do client)
- Chave de API (Anthropic/OpenAI) nunca vai para o browser.
- Chaves configuradas **por agência** (admin registra em `agency_integrations`; a tabela será criada em rodada futura — **pendência**).
- Auditoria/custo: cada chamada vira `audit_log` + tabela `llm_usage` (futura).
- Rate limit por workspace + por agência.

## Edge Function

### `POST /llm/draft-copy`
**Auth:** `auth.uid()` membro de workspace, role `copywriter|strategist|owner`.

**Request (Zod):**
```ts
{
  workspace_id: string (uuid),
  kind: 'caption' | 'reel_script' | 'stories_script' | 'carousel_script' | 'hook' | 'cta',
  brief_id: string (uuid) | null,        // opcional — injeta brief.key_message, objective, etc.
  context: {
    ig_format: 'feed_1_1' | 'feed_4_5' | 'feed_1_91_1' | 'story' | 'reel' | 'carousel' | null,
    pillar_id: string (uuid) | null,
    campaign_id: string (uuid) | null,
    references: Array<string> | null,     // URLs / trechos de inspiração
    length_hint: 'short' | 'medium' | 'long' | null,
    instructions: string | null           // mandato livre do copywriter
  }
}
```

**Response:**
```ts
{
  draft: string | { slides: Array<{ title, body, cta }> } | { hook, dev, cta, audio_ref },
  model: string,
  input_tokens: number,
  output_tokens: number,
  request_id: string (uuid)    // para rastrear no audit_log
}
```

**Lógica:**
1. Fetch `brand_voice` (fallback `brand_profiles.tone_of_voice` se brand_voice vazio).
2. Fetch `pillars` + `campaigns` relevantes para contexto.
3. Compor **system prompt** com:
   - Tom (`tone`), emoji policy, slang.
   - `vocab_preferred` ("prefira usar: X, Y, Z").
   - `vocab_forbidden` ("NUNCA use: A, B, C").
   - `approved_examples_json` (few-shot).
   - Instrução de formato IG (ex: carrossel = JSON com array de 10 slides; Reel = hook/dev/cta).
   - Constraints de plataforma (legenda ≤ 2200 chars, hook ≤ 125 chars para "ver mais", etc.).
4. `POST` para o provider configurado na `agency_integrations.llm_provider` (anthropic ou openai).
5. Validar/parsear output. Se não bater o schema, retry 1x com correção.
6. Registrar uso em `audit_log` + `llm_usage` (futura tabela: agency_id, workspace_id, user_id, kind, tokens in/out, cost_usd, created_at).

**Rate limit:**
- 10 chamadas/min por user.
- Limite mensal de tokens por plano (a definir com billing).

**Erros:**
- `403 LLM_NOT_CONFIGURED` — agência sem API key LLM em `agency_integrations`.
- `429 LLM_RATE_LIMIT` — cliente excedeu cap.
- `422 LLM_OUTPUT_INVALID` — modelo retornou JSON quebrado mesmo após retry.
- `502 LLM_UPSTREAM_ERROR` — provider fora do ar.

## System prompt (template sintetizado)
```
Você é um copywriter social para Instagram. Respeite RIGOROSAMENTE a brand voice a seguir:

TOM: {tone}
EMOJIS: {emoji_policy}
GÍRIAS: {slang_allowed ? 'permitidas' : 'proibidas'}
PREFERIR: {vocab_preferred.join(', ')}
PROIBIDO: {vocab_forbidden.join(', ')}

EXEMPLOS APROVADOS:
{approved_examples_json.map(e => '- ' + e.body).join('\n')}

FORMATO IG: {ig_format}
PILAR: {pillar.name} — {pillar.description}
CAMPANHA: {campaign.name}

RESTRIÇÕES DO INSTAGRAM:
- Primeira linha (até 125 caracteres) é o hook — aparece antes do "... ver mais".
- Legenda total máxima 2200 caracteres.
- {kind === 'carousel_script' && 'Gerar 10 slides, slide 1 = hook, slide 10 = CTA com "salva esse post".'}
- {kind === 'reel_script' && 'Hook nos primeiros 3 segundos. Texto em tela ≤ 25 chars por linha.'}

OBJETIVO: {brief.objective}
MENSAGEM-CHAVE: {brief.key_message}
CTA: {brief.cta}

Gere apenas o conteúdo pedido, sem comentários.
```

## Observabilidade
- Cada request gera `request_id` retornado ao frontend.
- `audit_log` action `llm.draft_copy.generated` com entity_type='workspace', diff_json={kind, input_tokens, output_tokens}.
- Dashboard admin (F4) puxa `llm_usage` agrupado por mês/marca.

## Decisoes resolvidas
- **agency_integrations:** criada em migration 00018 (pgcrypto). LLM keys com provider='openai'|'anthropic'.
- **Streaming SSE:** implementado na Edge Function (passthrough do stream do provider).
- **Criptografia:** pgcrypto AES-256 via `decrypt_integration_secret`.
- **Implementacao:** `supabase/functions/llm-brand-voice/index.ts` (completa, 2026-04-16). Suporta Anthropic e OpenAI, streaming SSE, fallback brand_profiles se brand_voice nao configurada. Retorna 402 se agencia sem chave LLM.
- **Pendente fase 2:** tabela `llm_usage` para tracking de custo; rate limit por workspace/user (atualmente sem cap).

## Links
- [[../schema#brand_voice]] · [[../schema#brand_profiles]]
- [[../../01_product/roles/copywriter]]
