/**
 * Sentry initialization for the React frontend.
 *
 * No-op when VITE_SENTRY_DSN is empty (dev/CI without DSN).
 * Session Replay disabled for privacy. PII scrubbed in beforeSend.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

/**
 * Hash a string with SubtleCrypto (sync fallback to a dumb hash if unavailable).
 * Used to anonymize emails in Sentry events.
 */
function quickHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return `anon_${(h >>> 0).toString(16)}`;
}

function scrubAuthorizationHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === "authorization" || k.toLowerCase() === "cookie") {
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function initSentry(): void {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // No-op in dev/CI without DSN
    return;
  }

  const mode = import.meta.env.MODE;
  const release =
    (import.meta.env.VITE_APP_VERSION as string | undefined) || "dev";

  Sentry.init({
    dsn,
    environment: mode,
    release,
    tracesSampleRate: mode === "production" ? 0.1 : 1.0,
    // Session Replay explicitly disabled for privacy.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      // Scrub user.email
      if (event.user?.email) {
        event.user.email = quickHash(event.user.email);
      }
      // Strip Authorization/Cookie headers from request
      if (event.request?.headers) {
        event.request.headers = scrubAuthorizationHeaders(
          event.request.headers as Record<string, string>,
        );
      }
      return event;
    },
  });

  initialized = true;
}
