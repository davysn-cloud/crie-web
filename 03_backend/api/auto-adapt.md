---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: active
confidence: high
---

# API — Auto-adapt (Smart Crop multi-formato)

> Edge Function (ou função serverless invocada) que gera variantes de um layout "master" nos outros formatos IG com smart-crop.

## Contexto
Designer cria arte no formato master (ex: feed_4_5 = 1080×1350). Clica "gerar variantes". Precisamos gerar 4:5, 1:1, 9:16 preservando rosto/logo/texto no quadro.

## Estratégia MVP
Não-ML na fase 1:
- Upload do master → storage.
- Edge Function (Deno) usa `sharp`-like lib (não disponível nativamente em Deno Edge Runtime — vamos precisar avaliar `https://deno.land/x/imagemagick_deno` ou chamar worker externo).
- Smart-crop MVP: **center crop** com heurística de "manter o centro" + margem de safe zone por formato.
- Fase 2: integrar serviço externo (AWS Rekognition detect faces, ou modelo self-hosted via Replicate) para detectar faces/texto e enquadrar.

## Edge Function

### `POST /auto-adapt/run`
**Auth:** workspace member.
**Request:**
```ts
{
  post_card_id: string (uuid),
  master_format_id: string (uuid),
  target_formats: Array<'feed_1_1' | 'feed_4_5' | 'story' | 'reel'>,
  strategy: 'center' | 'face' | 'text' | 'hybrid'    // MVP: só 'center'
}
```
**Response:**
```ts
{
  variants: Array<{
    ig_format: string,
    post_format_id: string,       // criado/atualizado
    asset_version_id: string,
    storage_path: string,
    public_url: string,
    needs_review: boolean          // true se heurística achou ambiguidade (rosto parcialmente cortado)
  }>
}
```

**Side effects:**
- Para cada target_format:
  - UPSERT em `post_formats` com `master_format_id` apontando para o master.
  - Gera imagem (crop + resize para dimensão exata) e faz upload no Storage (bucket `post-assets`).
  - INSERT em `asset_versions` referenciando a nova imagem, versão próxima.
  - Atualiza `post_formats.asset_version_id`.
- `audit_log` action `auto_adapt.generated`.

## Dimensões canônicas
| ig_format | largura | altura |
|---|---|---|
| feed_1_1 | 1080 | 1080 |
| feed_4_5 | 1080 | 1350 |
| feed_1_91_1 | 1080 | 566 |
| story | 1080 | 1920 |
| reel | 1080 | 1920 |
| carousel | 1080 | 1080 ou 1080×1350 (depende do master) |

## Safe zones respeitadas
- Story/Reel: 250px top + 350px bottom ficam sob UI — reserve como "não-crítico".
- Feed 4:5: ~100px top/bottom cortados no grid preview.

## Decisoes resolvidas
- **Runtime:** `imagescript` (Deno-native, ADR 010). Import: `https://deno.land/x/imagescript@1.3.0/mod.ts`.
- **Implementacao:** `supabase/functions/auto-adapt/index.ts` (completa, 2026-04-16). Center crop com focal_point override, resize para dimensoes canonicas IG. Upload variantes de volta ao Storage bucket `post-assets`, upsert em `post_formats`.
- **Pendente fase 2:** smart crop ML (face/text detection via Rekognition/Replicate).
- **Limites:** nao implementado ainda — recomendado configurar rate limit no gateway.

## Contrato frontend → backend
O designer só passa `master_format_id` e `target_formats`. Toda resolução de asset/binary é server-side.

## Links
- [[../schema#post_formats]] · [[../schema#asset_versions]] · [[../schema#asset_library]]
- [[../../01_product/roles/designer]]
- [[../../02_architecture/adr/storage-assets]]
