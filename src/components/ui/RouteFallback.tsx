/**
 * RouteFallback — minimal Suspense fallback for lazy-loaded routes.
 *
 * Intentionally lightweight: zero heavy deps, no layout/icons imports,
 * so it does not bloat the initial chunk. Renders a centered skeleton
 * placeholder while the route bundle is being fetched.
 */
export function RouteFallback() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-[60vh] w-full items-center justify-center p-6"
    >
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="h-4 w-1/3 animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded-md bg-muted" />
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
