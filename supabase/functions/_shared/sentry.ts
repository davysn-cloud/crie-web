// supabase/functions/_shared/sentry.ts
// Minimal Sentry wrapper for Deno Edge Functions.
// No-op when SENTRY_DSN_FUNCTIONS env is unset.
// Uses @sentry/deno from deno.land/x.

// deno-lint-ignore-file no-explicit-any

let sentryModule: any = null
let initialized = false
let initFailed = false

async function getSentry(): Promise<any | null> {
  if (initialized) return sentryModule
  if (initFailed) return null

  const dsn = Deno.env.get('SENTRY_DSN_FUNCTIONS')
  if (!dsn) {
    initFailed = true
    return null
  }

  try {
    // Dynamic import so functions without DSN don't pay any download cost.
    const Sentry = await import('https://deno.land/x/sentry@8.55.0/index.mjs')
    Sentry.init({
      dsn,
      environment: Deno.env.get('SENTRY_ENVIRONMENT') ?? 'production',
      release: Deno.env.get('SENTRY_RELEASE') ?? 'dev',
      tracesSampleRate: 0.1,
      // Privacy: do not capture request bodies / headers verbatim
      beforeSend(event: any) {
        if (event.request?.headers) {
          // Strip Authorization
          const h = event.request.headers as Record<string, string>
          delete h.authorization
          delete h.Authorization
          delete h.cookie
          delete h.Cookie
        }
        return event
      },
    })
    sentryModule = Sentry
    initialized = true
    return Sentry
  } catch (err) {
    console.error('[sentry] init failed:', err)
    initFailed = true
    return null
  }
}

/**
 * Wrap a Deno.serve handler so unhandled exceptions are captured + flushed
 * before the function returns 500. No-op when DSN is not configured.
 */
export function withSentry(
  handler: (req: Request) => Promise<Response> | Response,
  context?: { name?: string },
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const Sentry = await getSentry()
    try {
      return await handler(req)
    } catch (err) {
      if (Sentry) {
        try {
          Sentry.captureException(err, {
            tags: { function: context?.name ?? 'unknown' },
          })
          await Sentry.flush(2000)
        } catch {
          // ignore Sentry transport failures
        }
      }
      const message = err instanceof Error ? err.message : 'Internal error'
      console.error(`[${context?.name ?? 'edge'}] uncaught:`, err)
      return new Response(
        JSON.stringify({ error: message, code: 'INTERNAL_ERROR' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      )
    }
  }
}

/**
 * Manually capture a non-fatal exception (no rethrow).
 * Safe to call without DSN configured.
 */
export async function captureEdgeException(
  err: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const Sentry = await getSentry()
  if (!Sentry) return
  try {
    Sentry.captureException(err, { extra: context })
  } catch {
    // ignore
  }
}
