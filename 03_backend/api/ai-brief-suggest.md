---
created: 2026-05-01
updated: 2026-05-01
owner: backend
status: active
confidence: high
---

# API Contract — ai-brief-suggest

Edge Function que gera sugestoes de campos de brief com IA (Claude Haiku) dado o titulo do post.
Usada pelo [[../../src/components/BriefBuilderDrawer]] via botao "Sugerir com IA".

## Endpoint

```
POST /functions/v1/ai-brief-suggest
```

## Auth

Bearer JWT (sessao Supabase do usuario autenticado). A funcao valida via `supabase.auth.getUser()` usando o anon key. A `SUPABASE_SERVICE_ROLE_KEY` nao e exposta ao frontend.

## Request Body

```json
{
  "title": "string (min 5 chars, obrigatorio)",
  "pillar": "string (opcional — nome do pilar para contexto)",
  "brand_voice": "string (opcional — descricao do tom para contexto)"
}
```

## Response 200

```json
{
  "target_audience": "string",
  "key_message": "string",
  "cta": "string",
  "caption_suggestion": "string"
}
```

## Erros

| Status | code | Situacao |
|---|---|---|
| 400 | VALIDATION_ERROR | title ausente ou < 5 chars |
| 400 | PARSE_ERROR | body JSON invalido |
| 401 | AUTH_REQUIRED | sem header Authorization |
| 401 | AUTH_INVALID | JWT invalido ou expirado |
| 405 | METHOD_NOT_ALLOWED | metodo != POST |
| 429 | LLM_RATE_LIMIT | rate limit Anthropic |
| 502 | LLM_UPSTREAM_ERROR | erro HTTP da API Anthropic |
| 502 | LLM_NETWORK_ERROR | falha de rede ao chamar Anthropic |
| 502 | LLM_FORMAT_ERROR | modelo retornou JSON invalido |
| 503 | LLM_NOT_CONFIGURED | ANTHROPIC_API_KEY nao setado |
| 500 | INTERNAL_ERROR | erro inesperado (capturado pelo wrapper Sentry) |

## Modelo LLM

`claude-haiku-4-5-20251001` — escolhido por latencia (~1-2s) e custo reduzido vs Sonnet/Opus.
`max_tokens: 512`, `temperature: 0.7`.

## Configuracao necessaria

Setar secret no projeto Supabase:
```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

## Uso no frontend

```ts
const { data, error } = await supabase.functions.invoke("ai-brief-suggest", {
  body: { title, pillar: pillarName },
});
// data: { target_audience, key_message, cta, caption_suggestion }
```

## Seguranca

- `ANTHROPIC_API_KEY` e `SUPABASE_SERVICE_ROLE_KEY` ficam apenas server-side (Edge Function).
- JWT verificado antes de qualquer chamada externa.
- Sem acesso a dados de workspace — funcao e stateless, nao le nem escreve no banco.
- CORS: `Access-Control-Allow-Origin: *` (aceitavel pois auth e via JWT, nao cookie).

## Links

- [[../schema]] — contexto do brief (tabela briefs, campos target_audience/key_message/cta)
- [[llm-brand-voice]] — funcao similar com brand voice + streaming SSE
