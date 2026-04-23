---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: medium
decided_on: 2026-04-15
---

# ADR 010 — Runtime de processamento de imagem (auto-adapt multi-formato)

## Contexto
Feature **Designer F2 — Auto-adapt** ([[../../01_product/roles/designer]]): designer cria no formato master → sistema gera variantes nos demais formatos IG (1:1, 4:5, 9:16, 1.91:1) com **smart crop** (manter logo/texto no quadro).

Operações necessárias:
- Carregar imagem original (até 20MB, até 8000×8000).
- Redimensionar mantendo proporção.
- Crop inteligente baseado em heurística (bounding box de elementos importantes).
- Adicionar safe zones vazias (story) ou recortar (feed).
- Output JPG/PNG sRGB <8MB.

**Fora de escopo MVP:** face detection / saliency detection (fica pra Fase 2 com API externa).

## Decisão
**Supabase Edge Function + `imagescript` (Deno puro) para MVP.** Smart crop via heurística **layout-only** (sem ML): centraliza o crop, permite override manual do designer por ponto focal.

Fluxo:
1. Frontend faz upload do master para Storage bucket `post-assets`.
2. Frontend chama Edge Function `auto-adapt` com `{post_format_master_id, target_formats: [...]}`.
3. Edge Function baixa master, gera N variantes, faz upload no bucket, cria rows em `post_formats`.
4. Retorna URLs assinadas das variantes.

## Justificativa
- **imagescript** é Deno-native (sem Node shims), roda bem em Edge Functions.
- Sem dependência externa, sem worker extra, sem custo adicional.
- Heurística layout-only entrega 80% do valor (a maioria dos designs do cliente tem o elemento principal centralizado).
- **Override manual** (ponto focal arrastável no canvas) cobre os 20% restantes.

## Consequências
- Edge Function `auto-adapt` tem timeout de 150s — processa até ~5 variantes/chamada. Para carrossel 10 slides × 4 formatos = 40 operações → batch em múltiplas chamadas.
- Bundle size da Edge Function fica pequeno (imagescript ~200KB).
- Qualidade de smart crop: **aceitável**, não excelente. Ponto focal manual fica como hard feature no designer.

## Caminho de evolução (Fase 2)
Se a qualidade do auto-adapt virar reclamação recorrente:
- Adicionar API externa de saliency: **Replicate** (`salesforce/blip-2` ou modelo específico de saliency) ou **Google Cloud Vision `objectLocalization`**.
- Contrato da Edge Function **não muda** — só troca a implementação interna.

## Alternativas consideradas
- **Sharp em worker externo (Vercel Edge Function)** — performance melhor, adiciona infra.
- **Supabase Storage Transformations** — limitado a resize/crop estático, não faz smart crop.
- **Cloudinary / imgix** — ótimos mas custo alto e lock-in.
- **ImageMagick via Deno FFI** — complexo em Edge Function.

## Links
- [[../../03_backend/api/auto-adapt|api/auto-adapt]]
- [[../../01_product/roles/designer#F2]]
- [[../../01_product/user-stories/US-032-auto-adapt-multiformato|US-032]] (se existe com esse ID)
