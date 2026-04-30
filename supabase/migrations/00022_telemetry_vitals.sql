-- 00022_telemetry_vitals.sql
-- Web Vitals telemetry. Append-only, write-by-anyone, read-by-service-role-only.
-- Retention: a pg_cron job (see 06_deploy/observabilidade.md) deletes rows
-- older than 90 days. No partitioning in this iteration — table grows slowly
-- (5 metrics * sessions/day) and a simple DELETE WHERE created_at < ... is enough.

CREATE TABLE telemetry_vitals (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metric TEXT NOT NULL CHECK (metric IN ('CLS','LCP','INP','FCP','TTFB')),
  value DOUBLE PRECISION NOT NULL,
  rating TEXT CHECK (rating IN ('good','needs-improvement','poor')),
  route TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  viewport_width INT,
  nav_type TEXT
);

CREATE INDEX idx_telemetry_vitals_metric_created
  ON telemetry_vitals (metric, created_at DESC);

CREATE INDEX idx_telemetry_vitals_route_metric
  ON telemetry_vitals (route, metric);

ALTER TABLE telemetry_vitals ENABLE ROW LEVEL SECURITY;

-- Telemetria pública: anon e authenticated podem inserir.
CREATE POLICY "anyone can insert vitals"
  ON telemetry_vitals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- SELECT/UPDATE/DELETE: sem policy → bloqueado para anon/authenticated.
-- service_role bypassa RLS por padrão (queries de dashboard / retention).

COMMENT ON TABLE telemetry_vitals IS
  'Web Vitals (CLS/LCP/INP/FCP/TTFB) capturados no cliente. '
  'Append-only. Retenção 90d via pg_cron (ver 06_deploy/observabilidade.md). '
  'PII em route é sanitizado no cliente antes do INSERT.';
