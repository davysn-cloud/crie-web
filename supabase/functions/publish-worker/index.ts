// publish-worker/index.ts
// Cron-triggered worker that publishes scheduled posts to Instagram via Meta Graph API.
// Auth: CRON_SECRET header. Rate limit: max 20 publications per tick.
// Uses FOR UPDATE SKIP LOCKED to prevent duplicate processing.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_JOBS_PER_TICK = 20
const MAX_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 5

const META_GRAPH_URL = 'https://graph.facebook.com/v19.0'

// Known Meta error codes
const PERMANENT_ERRORS = new Set(['190', '463', '100', '200'])
const RETRYABLE_ERRORS = new Set(['4', '17', '32', '500', '503'])

interface PublishJob {
  id: string
  post_card_id: string
  workspace_id: string
  ig_format: string
  caption_snapshot: string | null
  first_comment_snapshot: string | null
  media_snapshot_json: Record<string, unknown>
  ig_business_account_id: string | null
  attempts_count: number
  cross_post_fb: boolean
  cross_post_story: boolean
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth: validate CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET')
  const authHeader = req.headers.get('Authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[publish-worker] Unauthorized: invalid CRON_SECRET')
    return new Response(
      JSON.stringify({ error: 'unauthorized', code: 'CRON_AUTH_FAILED' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const stats = { picked: 0, published: 0, failed: 0, retried: 0 }

  try {
    // 1. Pick jobs with FOR UPDATE SKIP LOCKED
    const workerId = crypto.randomUUID()
    const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000).toISOString()

    const { data: jobs, error: pickError } = await supabase.rpc('pick_publish_jobs', {
      p_worker_id: workerId,
      p_lock_until: lockUntil,
      p_limit: MAX_JOBS_PER_TICK,
    })

    // Fallback: if RPC doesn't exist, use direct query approach
    let jobList: PublishJob[] = jobs || []

    if (pickError) {
      console.warn('[publish-worker] RPC pick_publish_jobs not found, using direct query', pickError.message)
      // Direct approach: select and update in sequence
      const { data: directJobs } = await supabase
        .from('publish_queue')
        .select('*')
        .eq('status', 'queued')
        .lte('scheduled_at', new Date().toISOString())
        .is('locked_by_worker', null)
        .order('scheduled_at', { ascending: true })
        .limit(MAX_JOBS_PER_TICK)

      if (directJobs && directJobs.length > 0) {
        const ids = directJobs.map((j: PublishJob) => j.id)
        await supabase
          .from('publish_queue')
          .update({ locked_by_worker: workerId, locked_until: lockUntil, status: 'publishing' })
          .in('id', ids)
        jobList = directJobs
      }
    }

    stats.picked = jobList.length
    console.log(`[publish-worker] Picked ${stats.picked} jobs (worker: ${workerId})`)

    // 2. Process each job
    for (const job of jobList) {
      try {
        await processJob(supabase, job)
        stats.published++
      } catch (err) {
        const error = err as Error
        console.error(`[publish-worker] Job ${job.id} error:`, error.message)

        const isPermanent = isPermanentError(error)
        const newAttempts = job.attempts_count + 1

        if (isPermanent || newAttempts >= MAX_ATTEMPTS) {
          // Mark as failed
          await supabase
            .from('publish_queue')
            .update({
              status: 'failed',
              last_error: error.message,
              attempts_count: newAttempts,
              locked_by_worker: null,
              locked_until: null,
            })
            .eq('id', job.id)
          stats.failed++
        } else {
          // Mark for retry with exponential backoff
          const backoffMs = 60_000 * Math.pow(2, newAttempts)
          const nextTry = new Date(Date.now() + backoffMs).toISOString()
          await supabase
            .from('publish_queue')
            .update({
              status: 'queued',
              scheduled_at: nextTry,
              last_error: error.message,
              attempts_count: newAttempts,
              locked_by_worker: null,
              locked_until: null,
            })
            .eq('id', job.id)
          stats.retried++
        }

        // Record attempt
        await recordAttempt(supabase, job.id, newAttempts, 'error', error)
      }
    }

    console.log(`[publish-worker] Done:`, stats)
    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const error = err as Error
    console.error('[publish-worker] Fatal error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function processJob(supabase: ReturnType<typeof createClient>, job: PublishJob) {
  console.log(`[publish-worker] Processing job ${job.id}, format: ${job.ig_format}`)

  // 1. Get access token for this workspace's Meta integration
  const { data: integration } = await supabase
    .from('agency_integrations_public')
    .select('id, external_account_id, status, expires_at')
    .eq('workspace_id', job.workspace_id)
    .eq('provider', 'meta_graph')
    .eq('status', 'active')
    .single()

  if (!integration) {
    throw new PermanentError('No active Meta integration found for workspace')
  }

  // Decrypt the access token
  const { data: secrets, error: decryptErr } = await supabase.rpc('decrypt_integration_secret', {
    p_integration_id: integration.id,
  })

  if (decryptErr || !secrets?.[0]?.secret) {
    throw new PermanentError(`Failed to decrypt Meta token: ${decryptErr?.message || 'no secret'}`)
  }

  const accessToken = secrets[0].secret
  const igAccountId = integration.external_account_id || job.ig_business_account_id

  if (!igAccountId) {
    throw new PermanentError('No IG Business Account ID configured')
  }

  // 2. Create media container(s)
  const media = job.media_snapshot_json as { items?: Array<{ storage_path: string; mime: string }> }
  const mediaItems = media?.items || []
  let creationId: string

  if (job.ig_format === 'carousel' && mediaItems.length > 1) {
    // Carousel: create children first, then carousel container
    const childIds: string[] = []
    for (const item of mediaItems) {
      const childId = await createMediaContainer(accessToken, igAccountId, {
        image_url: item.storage_path,
        is_carousel_item: true,
      })
      childIds.push(childId)
    }
    creationId = await createCarouselContainer(accessToken, igAccountId, childIds, job.caption_snapshot)
  } else if (job.ig_format === 'reel') {
    creationId = await createMediaContainer(accessToken, igAccountId, {
      video_url: mediaItems[0]?.storage_path,
      caption: job.caption_snapshot,
      media_type: 'REELS',
    })
  } else if (job.ig_format === 'story') {
    const isVideo = mediaItems[0]?.mime?.startsWith('video/')
    creationId = await createMediaContainer(accessToken, igAccountId, {
      [isVideo ? 'video_url' : 'image_url']: mediaItems[0]?.storage_path,
      media_type: 'STORIES',
    })
  } else {
    // Feed image (1:1, 4:5, 1.91:1)
    creationId = await createMediaContainer(accessToken, igAccountId, {
      image_url: mediaItems[0]?.storage_path,
      caption: job.caption_snapshot,
    })
  }

  // 3. Publish the container
  const publishResult = await publishContainer(accessToken, igAccountId, creationId)
  const igMediaId = publishResult.id

  // 4. Update publish_queue with success
  await supabase
    .from('publish_queue')
    .update({
      status: 'published',
      ig_creation_id: creationId,
      ig_media_id: igMediaId,
      published_url: `https://www.instagram.com/p/${igMediaId}`,
      locked_by_worker: null,
      locked_until: null,
      attempts_count: job.attempts_count + 1,
    })
    .eq('id', job.id)

  // 5. Update post_card with ig_media_id and published_at
  await supabase
    .from('post_cards')
    .update({
      ig_media_id: igMediaId,
      published_at: new Date().toISOString(),
      stage: 'publicado',
    })
    .eq('id', job.post_card_id)

  // 6. Record successful attempt
  await recordAttempt(supabase, job.id, job.attempts_count + 1, 'success', null, {
    ig_media_id: igMediaId,
  })

  // 7. First comment (best-effort, non-blocking)
  if (job.first_comment_snapshot) {
    try {
      await new Promise((r) => setTimeout(r, 2000))
      await postComment(accessToken, igMediaId, job.first_comment_snapshot)
      console.log(`[publish-worker] First comment posted for ${job.id}`)
    } catch (commentErr) {
      console.warn(`[publish-worker] First comment failed for ${job.id}:`, (commentErr as Error).message)
    }
  }

  console.log(`[publish-worker] Job ${job.id} published successfully: ${igMediaId}`)
}

// -- Meta Graph API helpers --

async function createMediaContainer(
  accessToken: string,
  igAccountId: string,
  params: Record<string, unknown>
): Promise<string> {
  const url = `${META_GRAPH_URL}/${igAccountId}/media`
  const body = { ...params, access_token: accessToken }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    handleMetaError(data)
  }

  return data.id
}

async function createCarouselContainer(
  accessToken: string,
  igAccountId: string,
  childIds: string[],
  caption: string | null
): Promise<string> {
  const url = `${META_GRAPH_URL}/${igAccountId}/media`
  const body: Record<string, unknown> = {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    access_token: accessToken,
  }
  if (caption) body.caption = caption

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) handleMetaError(data)
  return data.id
}

async function publishContainer(
  accessToken: string,
  igAccountId: string,
  creationId: string
): Promise<{ id: string }> {
  const url = `${META_GRAPH_URL}/${igAccountId}/media_publish`
  const body = { creation_id: creationId, access_token: accessToken }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) handleMetaError(data)
  return data
}

async function postComment(accessToken: string, mediaId: string, message: string) {
  const url = `${META_GRAPH_URL}/${mediaId}/comments`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: accessToken }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(`Comment failed: ${JSON.stringify(data)}`)
  }
}

function handleMetaError(data: Record<string, unknown>): never {
  const error = data.error as Record<string, unknown> | undefined
  const code = String(error?.code || '')
  const subcode = String(error?.error_subcode || '')
  const message = String(error?.message || 'Unknown Meta API error')

  if (PERMANENT_ERRORS.has(code)) {
    throw new PermanentError(`Meta API permanent error [${code}/${subcode}]: ${message}`)
  }
  if (RETRYABLE_ERRORS.has(code) || (data as Record<string, unknown>).status === 429) {
    throw new RetryableError(`Meta API retryable error [${code}]: ${message}`)
  }
  // Default: treat unknown errors as retryable
  throw new RetryableError(`Meta API error [${code}]: ${message}`)
}

class PermanentError extends Error {
  isPermanent = true
}
class RetryableError extends Error {
  isPermanent = false
}

function isPermanentError(err: Error): boolean {
  return (err as PermanentError).isPermanent === true
}

async function recordAttempt(
  supabase: ReturnType<typeof createClient>,
  publishQueueId: string,
  attemptNumber: number,
  outcome: string,
  error: Error | null,
  meta?: Record<string, unknown>
) {
  await supabase.from('publish_attempts').insert({
    publish_queue_id: publishQueueId,
    attempt_number: attemptNumber,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    outcome: outcome === 'success' ? 'success' : (error as PermanentError)?.isPermanent ? 'permanent_error' : 'retryable_error',
    error_message: error?.message || null,
    response_payload: meta || null,
  })
}
