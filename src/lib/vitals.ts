/**
 * Web Vitals collector → Supabase telemetry_vitals.
 *
 * Buffers metrics, flushes every 5s or on pagehide via sendBeacon.
 * Sanitizes route to avoid leaking UUIDs / magic-link tokens / numeric IDs.
 */
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type Metric,
} from "web-vitals";
import { supabase } from "@/lib/supabase";

interface VitalRow {
  metric: "CLS" | "LCP" | "INP" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor" | null;
  route: string;
  session_id: string;
  user_agent: string;
  viewport_width: number;
  nav_type: string | null;
}

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Replace UUIDs, long opaque tokens, and numeric IDs in path with `:token`.
 * Keeps the route shape coarse so dashboards can group meaningfully.
 */
function sanitizeRoute(pathname: string): string {
  let out = pathname.replace(UUID_RE, ":token");
  // Magic-link / opaque tokens: long alphanumeric segments
  out = out.replace(/\/[A-Za-z0-9_-]{20,}/g, "/:token");
  // Pure numeric segments (likely IDs)
  out = out.replace(/\/\d+(?=\/|$)/g, "/:id");
  return out;
}

function getOrCreateSessionId(): string {
  try {
    const KEY = "crie.vitals.sid";
    let sid = sessionStorage.getItem(KEY);
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return `sid_${Date.now().toString(36)}`;
  }
}

const buffer: VitalRow[] = [];
let flushTimer: number | null = null;
let started = false;

function snapshot(): VitalRow[] {
  const drained = buffer.splice(0, buffer.length);
  return drained;
}

async function flush(useBeacon = false): Promise<void> {
  const rows = snapshot();
  if (rows.length === 0) return;

  if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    // Best-effort beacon to Supabase REST endpoint with anon key
    const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
    const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
    if (url && anon) {
      const endpoint = `${url}/rest/v1/telemetry_vitals`;
      const blob = new Blob([JSON.stringify(rows)], {
        type: "application/json",
      });
      // sendBeacon doesn't support custom headers; use a Blob with type and
      // include keys via URL params is not supported either. As a fallback,
      // POST via fetch with keepalive.
      try {
        navigator.sendBeacon(`${endpoint}?apikey=${encodeURIComponent(anon)}`, blob);
        return;
      } catch {
        // fall through to fetch keepalive
      }
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: anon,
            Authorization: `Bearer ${anon}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify(rows),
          keepalive: true,
        });
        return;
      } catch {
        return;
      }
    }
  }

  // Background INSERT — fire and forget
  try {
    await supabase.from("telemetry_vitals").insert(rows);
  } catch {
    // swallow — telemetry must not break app
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flush(false);
  }, 5000);
}

function record(metric: Metric): void {
  const row: VitalRow = {
    metric: metric.name as VitalRow["metric"],
    value: metric.value,
    rating: (metric.rating as VitalRow["rating"]) ?? null,
    route: sanitizeRoute(window.location.pathname),
    session_id: getOrCreateSessionId(),
    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    nav_type: metric.navigationType ?? null,
  };
  buffer.push(row);
  scheduleFlush();
}

export function reportVitals(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  onCLS(record);
  onLCP(record);
  onINP(record);
  onFCP(record);
  onTTFB(record);

  // Flush on tab hide / unload
  const flushOnHide = () => {
    if (document.visibilityState === "hidden") {
      void flush(true);
    }
  };
  document.addEventListener("visibilitychange", flushOnHide);
  window.addEventListener("pagehide", () => void flush(true));
}
