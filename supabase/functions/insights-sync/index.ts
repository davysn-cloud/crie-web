// insights-sync/index.ts
// Cron-triggered worker that syncs Instagram insights from Meta Graph API.
// Auth: CRON_SECRET header.
// Lists active meta_graph integrations, pulls insights for last 7 days, upserts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_GRAPH_URL = 'https://graph.facebook.com/v19.0'
const MAX_POSTS_PER_TICK = 50

const INSIGHT_METRICS = [
  'impressions',
  'reach',
  'engagement',
  'saved',
  'shares',
  'likes',
  'comments',
  'video_views',
  'plays',
  'profile_visits',
  'follows',
].join(',')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Auth: validate CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET')
  const authHeader = req.headers.get('Authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[insights-sync] Unauthorized: invalid CRON_SECRET')
    return jsonResponse({ error: 'unauthorized', code: 'CRON_AUTH_FAILED' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const stats = { fetched: 0, skipped: 0, errors: 0, integrations_processed: 0 }

  try {
    // 1. List active Meta integrations
    const { data: integrations, error: intError } = await supabase
      .from('agency_integrations_public')
      .select('id, agency_id, workspace_id, external_account_id, status')
      .eq('provider', 'meta_graph')
      .eq('status', 'active')

    if (intError) {
      console.error('[insights-sync] Error fetching integrations:', intError.message)
      return jsonResponse({ error: intError.message, code: 'DB_ERROR' }, 500)
    }

    if (!integrations || integrations.length === 0) {
      console.log('[insights-sync] No active Meta integrations found')
      return jsonResponse({ ...stats, message: 'No active integrations' })
    }

    console.log(`[insights-sync] Found ${integrations.length} active Meta integrations`)

    // 2. For each integration, sync insights
    for (const integration of integrations) {
      try {
        stats.integrations_processed++

        // Decrypt access token
        const { data: secrets, error: decryptErr } = await supabase.rpc('decrypt_integration_secret', {
          p_integration_id: integration.id,
        })

        if (decryptErr || !secrets?.[0]?.secret) {
          console.error(`[insights-sync] Failed to decrypt token for integration ${integration.id}`)
          stats.errors++
          continue
        }

        const accessToken = secrets[0].secret
        const igAccountId = integration.external_account_id

        if (!igAccountId) {
          console.warn(`[insights-sync] No IG account ID for integration ${integration.id}`)
          stats.skipped++
          continue
        }

        // Get published posts for this workspace from last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()
        const { data: posts } = await supabase
          .from('post_cards')
          .select('id, ig_media_id, published_at, workspace_id')
          .eq('workspace_id', integration.workspace_id)
          .not('ig_media_id', 'is', null)
          .gte('published_at', thirtyDaysAgo)
          .order('published_at', { ascending: false })
          .limit(MAX_POSTS_PER_TICK)

        if (!posts || posts.length === 0) {
          console.log(`[insights-sync] No published posts for workspace ${integration.workspace_id}`)
          stats.skipped++
          continue
        }

        // For each post, check if we need to fetch insights
        for (const post of posts) {
          try {
            // Check last fetch time
            const { data: lastInsight } = await supabase
              .from('insights')
              .select('fetched_at')
              .eq('ig_media_id', post.ig_media_id)
              .order('fetched_at', { ascending: false })
              .limit(1)
              .single()

            const publishedAt = new Date(post.published_at!)
            const daysSincePublish = (Date.now() - publishedAt.getTime()) / (24 * 3600_000)
            const hoursSinceLastFetch = lastInsight
              ? (Date.now() - new Date(lastInsight.fetched_at).getTime()) / 3600_000
              : Infinity

            // Determine if eligible for fetch based on age
            let eligible = false
            if (daysSincePublish < 7 && hoursSinceLastFetch > 6) eligible = true
            else if (daysSincePublish < 30 && hoursSinceLastFetch > 24) eligible = true
            else if (daysSincePublish >= 30 && hoursSinceLastFetch > 168) eligible = true
            // First fetch ever
            if (!lastInsight) eligible = true

            if (!eligible) {
              stats.skipped++
              continue
            }

            // Fetch insights from Meta
            const insightData = await fetchInsights(accessToken, post.ig_media_id!)
            if (!insightData) {
              stats.errors++
              continue
            }

            // Upsert into insights table
            const now = new Date().toISOString()
            const { error: upsertErr } = await supabase.from('insights').insert({
              workspace_id: post.workspace_id,
              post_card_id: post.id,
              ig_media_id: post.ig_media_id,
              fetched_at: now,
              impressions: insightData.impressions || null,
              reach: insightData.reach || null,
              engagement: insightData.engagement || null,
              saves: insightData.saved || null,
              shares: insightData.shares || null,
              comments_count: insightData.comments || null,
              likes_count: insightData.likes || null,
              video_views: insightData.video_views || null,
              plays: insightData.plays || null,
              profile_visits: insightData.profile_visits || null,
              follows: insightData.follows || null,
              raw_json: insightData.raw,
            })

            if (upsertErr) {
              console.error(`[insights-sync] Upsert error for ${post.ig_media_id}:`, upsertErr.message)
              stats.errors++
            } else {
              stats.fetched++
            }
          } catch (postErr) {
            console.error(`[insights-sync] Error processing post ${post.id}:`, (postErr as Error).message)
            stats.errors++
          }
        }
      } catch (intErr) {
        const error = intErr as Error
        console.error(`[insights-sync] Integration ${integration.id} error:`, error.message)

        // If token is expired, mark integration
        if (error.message.includes('expired') || error.message.includes('190')) {
          await supabase
            .from('agency_integrations')
            .update({ status: 'expired', last_error: error.message })
            .eq('id', integration.id)
          console.warn(`[insights-sync] Marked integration ${integration.id} as expired`)
        }

        stats.errors++
      }
    }

    console.log('[insights-sync] Done:', stats)
    return jsonResponse(stats)
  } catch (err) {
    const error = err as Error
    console.error('[insights-sync] Fatal error:', error.message)
    return jsonResponse({ error: error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

interface InsightValues {
  impressions?: number
  reach?: number
  engagement?: number
  saved?: number
  shares?: number
  comments?: number
  likes?: number
  video_views?: number
  plays?: number
  profile_visits?: number
  follows?: number
  raw: Record<string, unknown>
}

async function fetchInsights(accessToken: string, igMediaId: string): Promise<InsightValues | null> {
  const url = `${META_GRAPH_URL}/${igMediaId}/insights?metric=${INSIGHT_METRICS}&access_token=${accessToken}`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok) {
    const error = data.error as Record<string, unknown> | undefined
    const code = String(error?.code || '')
    const message = String(error?.message || 'Unknown error')

    // Token expired
    if (code === '190' || code === '463') {
      throw new Error(`Token expired [${code}]: ${message}`)
    }

    // Rate limit — skip but don't crash
    if (code === '4' || code === '17' || res.status === 429) {
      console.warn(`[insights-sync] Rate limited for ${igMediaId}, skipping`)
      return null
    }

    // Media not found or not eligible for insights
    if (code === '100') {
      console.warn(`[insights-sync] Media ${igMediaId} not eligible for insights`)
      return null
    }

    console.error(`[insights-sync] Meta API error for ${igMediaId}: [${code}] ${message}`)
    return null
  }

  // Parse the insights response
  const metrics: Record<string, number> = {}
  if (data.data && Array.isArray(data.data)) {
    for (const item of data.data) {
      const name = item.name as string
      const value = item.values?.[0]?.value
      if (typeof value === 'number') {
        metrics[name] = value
      }
    }
  }

  return {
    impressions: metrics.impressions,
    reach: metrics.reach,
    engagement: metrics.engagement,
    saved: metrics.saved,
    shares: metrics.shares,
    comments: metrics.comments,
    likes: metrics.likes,
    video_views: metrics.video_views,
    plays: metrics.plays,
    profile_visits: metrics.profile_visits,
    follows: metrics.follows,
    raw: data,
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
