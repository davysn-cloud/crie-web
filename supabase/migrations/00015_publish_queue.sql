-- ============================================
-- 00015 — Publish queue + Publish attempts
-- Social F1 — fila Meta Graph API + retry/histórico
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.publish_status AS ENUM (
  'queued', 'publishing', 'published', 'failed', 'cancelled'
);

CREATE TYPE public.attempt_outcome AS ENUM (
  'success', 'retryable_error', 'permanent_error'
);

-- ============================================
-- PUBLISH_QUEUE
-- ============================================
CREATE TABLE public.publish_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_card_id uuid NOT NULL REFERENCES public.post_cards(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ig_format public.ig_format NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status public.publish_status NOT NULL DEFAULT 'queued',
  caption_snapshot text,
  first_comment_snapshot text,
  media_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ig_business_account_id text,
  ig_creation_id text,
  ig_media_id text,
  published_url text,
  cross_post_fb boolean NOT NULL DEFAULT false,
  cross_post_story boolean NOT NULL DEFAULT false,
  last_error text,
  attempts_count int NOT NULL DEFAULT 0,
  locked_by_worker text,
  locked_until timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_publish_queue_workspace ON public.publish_queue(workspace_id);
CREATE INDEX idx_publish_queue_card ON public.publish_queue(post_card_id);
CREATE INDEX idx_publish_queue_status_sched ON public.publish_queue(status, scheduled_at);
CREATE INDEX idx_publish_queue_scheduled ON public.publish_queue(scheduled_at);
CREATE INDEX idx_publish_queue_ig_media ON public.publish_queue(ig_media_id);

CREATE TRIGGER publish_queue_updated_at
  BEFORE UPDATE ON public.publish_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.publish_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publish_queue_select" ON public.publish_queue
  FOR SELECT USING (public.is_workspace_member(workspace_id));
CREATE POLICY "publish_queue_insert" ON public.publish_queue
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
-- UPDATE restrito a "não está publicando agora" via guard de aplicação
-- (policy poderia checar status, mas workers atualizam via service_role).
CREATE POLICY "publish_queue_update" ON public.publish_queue
  FOR UPDATE USING (public.is_workspace_member(workspace_id));
CREATE POLICY "publish_queue_delete" ON public.publish_queue
  FOR DELETE USING (
    public.is_workspace_member(workspace_id) AND status IN ('queued', 'failed', 'cancelled')
  );

-- ============================================
-- PUBLISH_ATTEMPTS (append-only)
-- ============================================
CREATE TABLE public.publish_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_queue_id uuid NOT NULL REFERENCES public.publish_queue(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  outcome public.attempt_outcome,
  http_status int,
  meta_api_code text,
  error_message text,
  request_payload jsonb,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publish_queue_id, attempt_number)
);

CREATE INDEX idx_publish_attempts_queue ON public.publish_attempts(publish_queue_id);
CREATE INDEX idx_publish_attempts_outcome ON public.publish_attempts(publish_queue_id, outcome);

ALTER TABLE public.publish_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "publish_attempts_select" ON public.publish_attempts
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.publish_queue WHERE id = publish_queue_id)
    )
  );
CREATE POLICY "publish_attempts_insert" ON public.publish_attempts
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.publish_queue WHERE id = publish_queue_id)
    )
  );
-- Append-only: sem UPDATE/DELETE policies.
