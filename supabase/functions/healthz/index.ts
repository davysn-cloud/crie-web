// healthz/index.ts
// Public healthcheck endpoint for uptime monitors (BetterStack etc).
// Returns 200 with { status: "ok", db: "ok" } when SELECT 1 succeeds in <500ms.
// Returns 503 with { status: "degraded" } on DB failure.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const started = Date.now()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse(
      {
        status: 'degraded',
        db: 'unconfigured',
        timestamp: new Date().toISOString(),
      },
      503,
    )
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })
    // Cheap probe: a tiny indexed table read with limit 1.
    // Use information_schema.tables which always exists, via rpc-less query.
    const probe = supabase
      .from('telemetry_vitals')
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    const timeout = new Promise<{ error: Error }>((resolve) =>
      setTimeout(
        () => resolve({ error: new Error('db probe timeout') }),
        500,
      ),
    )
    const result: { error: unknown } = await Promise.race([
      probe.then((r) => ({ error: r.error })),
      timeout,
    ])

    if (result.error) {
      return jsonResponse(
        {
          status: 'degraded',
          db: 'fail',
          error: String((result.error as Error).message ?? result.error),
          duration_ms: Date.now() - started,
          timestamp: new Date().toISOString(),
        },
        503,
      )
    }

    return jsonResponse(
      {
        status: 'ok',
        db: 'ok',
        duration_ms: Date.now() - started,
        timestamp: new Date().toISOString(),
      },
      200,
    )
  } catch (err) {
    return jsonResponse(
      {
        status: 'degraded',
        db: 'fail',
        error: err instanceof Error ? err.message : 'unknown',
        timestamp: new Date().toISOString(),
      },
      503,
    )
  }
})

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
