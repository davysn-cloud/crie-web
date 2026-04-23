// auto-adapt/index.ts
// Receives a master post_format_id and target ratios.
// Downloads master image from Storage, crops/resizes to each target ratio,
// uploads variants back to Storage, creates post_formats rows.
// Uses ImageScript (Deno-native) for image processing.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @deno-types="https://deno.land/x/imagescript@1.3.0/mod.ts"
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Canonical IG dimensions
const FORMAT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  'feed_1_1': { width: 1080, height: 1080 },
  'feed_4_5': { width: 1080, height: 1350 },
  'feed_1_91_1': { width: 1080, height: 566 },
  'story': { width: 1080, height: 1920 },
  'reel': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
  '1.91:1': { width: 1080, height: 566 },
}

// Map ratio strings to ig_format enum values
const RATIO_TO_FORMAT: Record<string, string> = {
  '1:1': 'feed_1_1',
  '4:5': 'feed_4_5',
  '9:16': 'story',
  '1.91:1': 'feed_1_91_1',
}

interface FocalPoint {
  x: number // 0.0 - 1.0
  y: number // 0.0 - 1.0
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Auth: validate caller
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authentication required', code: 'AUTH_REQUIRED' }, 401)
  }

  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser()
  if (userErr || !user) {
    return jsonResponse({ error: 'Invalid auth token', code: 'AUTH_INVALID' }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const body = await req.json()
    const {
      post_format_id,
      target_ratios,
      focal_point,
    }: {
      post_format_id: string
      target_ratios: string[]
      focal_point?: FocalPoint
    } = body

    if (!post_format_id || !target_ratios || target_ratios.length === 0) {
      return jsonResponse({ error: 'post_format_id and target_ratios are required', code: 'VALIDATION_ERROR' }, 400)
    }

    console.log(`[auto-adapt] Processing format ${post_format_id}, targets: ${target_ratios.join(', ')}`)

    // 1. Get master post_format
    const { data: masterFormat, error: masterErr } = await supabase
      .from('post_formats')
      .select('id, post_card_id, ig_format, asset_version_id')
      .eq('id', post_format_id)
      .single()

    if (masterErr || !masterFormat) {
      return jsonResponse({ error: 'Master format not found', code: 'NOT_FOUND' }, 404)
    }

    // Verify workspace membership via post_card
    const { data: postCard } = await supabase
      .from('post_cards')
      .select('id, workspace_id')
      .eq('id', masterFormat.post_card_id)
      .single()

    if (!postCard) {
      return jsonResponse({ error: 'Post card not found', code: 'NOT_FOUND' }, 404)
    }

    const { data: wsMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', postCard.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!wsMember) {
      return jsonResponse({ error: 'Not a member of this workspace', code: 'NOT_AUTHORIZED' }, 403)
    }

    // 2. Get the master asset
    let masterStoragePath: string | null = null

    if (masterFormat.asset_version_id) {
      const { data: assetVersion } = await supabase
        .from('asset_versions')
        .select('file_url')
        .eq('id', masterFormat.asset_version_id)
        .single()

      masterStoragePath = assetVersion?.file_url || null
    }

    if (!masterStoragePath) {
      return jsonResponse({ error: 'Master format has no asset', code: 'NO_ASSET' }, 400)
    }

    // 3. Download master image from Storage
    console.log(`[auto-adapt] Downloading master from: ${masterStoragePath}`)

    const { data: imageData, error: downloadErr } = await supabase.storage
      .from('post-assets')
      .download(masterStoragePath)

    if (downloadErr || !imageData) {
      return jsonResponse({ error: `Failed to download master: ${downloadErr?.message}`, code: 'DOWNLOAD_ERROR' }, 500)
    }

    const masterBytes = new Uint8Array(await imageData.arrayBuffer())
    const masterImage = await Image.decode(masterBytes)
    const masterWidth = masterImage.width
    const masterHeight = masterImage.height

    console.log(`[auto-adapt] Master image: ${masterWidth}x${masterHeight}`)

    // 4. For each target ratio: crop + resize + upload
    const variants: Array<{
      format: string
      storage_path: string
      width: number
      height: number
      post_format_id?: string
    }> = []

    for (const ratio of target_ratios) {
      try {
        const igFormat = RATIO_TO_FORMAT[ratio] || ratio
        const dims = FORMAT_DIMENSIONS[ratio] || FORMAT_DIMENSIONS[igFormat]

        if (!dims) {
          console.warn(`[auto-adapt] Unknown target ratio: ${ratio}, skipping`)
          continue
        }

        const targetWidth = dims.width
        const targetHeight = dims.height
        const targetAspect = targetWidth / targetHeight

        // Calculate crop region
        let cropX: number, cropY: number, cropW: number, cropH: number

        if (masterWidth / masterHeight > targetAspect) {
          // Master is wider than target — crop sides
          cropH = masterHeight
          cropW = Math.round(masterHeight * targetAspect)
          cropY = 0
          cropX = focal_point
            ? Math.round(Math.max(0, Math.min(masterWidth - cropW, focal_point.x * masterWidth - cropW / 2)))
            : Math.round((masterWidth - cropW) / 2)
        } else {
          // Master is taller than target — crop top/bottom
          cropW = masterWidth
          cropH = Math.round(masterWidth / targetAspect)
          cropX = 0
          cropY = focal_point
            ? Math.round(Math.max(0, Math.min(masterHeight - cropH, focal_point.y * masterHeight - cropH / 2)))
            : Math.round((masterHeight - cropH) / 2)
        }

        // Crop
        const cropped = masterImage.clone().crop(cropX, cropY, cropW, cropH)

        // Resize to exact target dimensions
        const resized = cropped.resize(targetWidth, targetHeight)

        // Encode to PNG
        const encoded = await resized.encode()

        // Upload to Storage
        const variantPath = `${postCard.workspace_id}/${postCard.id}/${igFormat}_${Date.now()}.png`

        const { error: uploadErr } = await supabase.storage
          .from('post-assets')
          .upload(variantPath, encoded, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadErr) {
          console.error(`[auto-adapt] Upload error for ${igFormat}:`, uploadErr.message)
          continue
        }

        // Create/update post_format row
        const { data: formatRow, error: formatErr } = await supabase
          .from('post_formats')
          .upsert(
            {
              post_card_id: masterFormat.post_card_id,
              ig_format: igFormat,
              is_master: false,
              master_format_id: masterFormat.id,
            },
            { onConflict: 'post_card_id,ig_format' }
          )
          .select('id')
          .single()

        if (formatErr) {
          console.error(`[auto-adapt] Format upsert error for ${igFormat}:`, formatErr.message)
        }

        variants.push({
          format: igFormat,
          storage_path: variantPath,
          width: targetWidth,
          height: targetHeight,
          post_format_id: formatRow?.id,
        })

        console.log(`[auto-adapt] Generated variant ${igFormat}: ${targetWidth}x${targetHeight}`)
      } catch (variantErr) {
        console.error(`[auto-adapt] Error generating variant ${ratio}:`, (variantErr as Error).message)
      }
    }

    console.log(`[auto-adapt] Done: ${variants.length} variants generated`)

    return jsonResponse({ variants })
  } catch (err) {
    const error = err as Error
    console.error('[auto-adapt] Error:', error.message)
    return jsonResponse({ error: error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
