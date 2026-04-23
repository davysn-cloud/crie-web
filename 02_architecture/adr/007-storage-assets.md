---
created: 2026-04-15
updated: 2026-04-15
owner: backend
status: accepted
confidence: medium
---

# ADR 007 — Storage de assets (buckets, naming, RLS, CDN)

## Contexto
Temos assets de dois tipos:
- **Brand kit** (logos, cores, moodboards) — por workspace, relativamente estáticos.
- **Post assets** (imagens/vídeos dos posts) — alto volume, diferentes versões, variantes por formato.

Hoje (migration 00001) existem 2 buckets públicos (`brand-assets`, `post-assets`) com policy `TO public` para leitura. Falta estratégia definitiva para: (a) naming, (b) separação por workspace, (c) controle de acesso, (d) CDN/cache, (e) asset library (F6).

## Opções avaliadas

### Privacidade
**A) Buckets públicos com URLs não-adivinháveis (como hoje)**
Prós: zero config, Supabase Storage já distribui via CDN.
Contras: URLs vazadas podem ser acessadas por qualquer um. Para MVP de aprovação (URLs partilhadas via e-mail), **é aceitável** — URL é efêmera e não expõe nada que o aprovador já não deveria ver.

**B) Buckets privados + signed URLs**
Prós: controle total, expiração de URL.
Contras: toda renderização no frontend precisa gerar signed URL (mais chamadas, mais complexidade). Preview em aprovação via magic link fica mais complexa.

### Naming
**A) Hash-based** `{agency_id}/{workspace_id}/{uuid}_{filename}`
Prós: determinístico, não colide, fácil listar por workspace.
Contras: nome menos human-readable.

**B) Semantic** `{agency_slug}/{workspace_slug}/posts/{post_card_id}/{version}/{filename}`
Prós: inspecionável no Storage UI.
Contras: slug da workspace muda se renomeia — gera rotas quebradas se não atualizar. Vincula naming a mutable state.

## Decisões

### Privacidade
**Opção A para MVP** (buckets públicos com URLs via uuid não-adivinháveis). Aceitamos a exposição por URL conhecida porque:
- Os assets são conteúdo que JÁ vai público no Instagram.
- O fluxo de aprovação compartilha URLs por e-mail — signed URLs adicionariam fricção (precisa gerar no envio do magic link com TTL longo, contorna a proteção).

**Quando migrar para privado:** quando adicionarmos "rascunhos confidenciais antes da aprovação" como feature paga, ou quando white-label enterprise exigir.

### Naming
**Opção A (hash-based):**
- `post-assets/{agency_id}/{workspace_id}/{post_card_id}/{asset_version_id}_{format}_{original_filename}`
- `brand-assets/{agency_id}/{workspace_id}/{asset_kind}/{uuid}_{original_filename}`
- `templates/{agency_id}/{workspace_id}/{template_id}_{type}.ext`
- `asset-library/{agency_id}/{workspace_id}/{uuid}_{filename}`

### Buckets adicionais a criar (migration futura)
Além dos 2 existentes:
- `asset-library` — assets reutilizáveis (imagens/ícones/mockups).
- `templates` — thumbnails e payload de templates.
- `insights-cache` (opcional) — thumbnails de posts publicados para o F7 (se o Meta URL expirar).

Todos públicos para leitura, upload apenas autenticado (igual ao padrão atual).

### CDN e cache
- Supabase Storage fronta por Cloudflare (default). Cache-Control headers configurados no upload (30 dias para brand-assets, 1 dia para post-assets).
- Imagens sob transformação (thumbnails) via **Supabase Storage Image Transformations** (query param `?width=X&height=Y`). Evita gerar nós mesmos.

### RLS Storage
Hoje é policy grosseira (authenticated pode upload). Vamos **estender** com policy baseada em path:
```
-- Upload só se o primeiro segmento do path == agency_id da qual o user é membro.
CREATE POLICY "storage_upload_scoped"
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('brand-assets','post-assets','asset-library','templates')
    AND public.is_agency_member( (split_part(name, '/', 1))::uuid )
  );
```

(Essa policy entra em migration futura de saneamento — **não incluída neste plano**.)

## Consequências
- Frontend passa a embutir `agency_id/workspace_id/...` em todo path de upload.
- Buckets `asset-library` e `templates` precisam ser criados (SQL `INSERT INTO storage.buckets`) — **pendência de migration**.
- Gastos de Storage escalam linearmente com posts × variantes — monitorar em dashboard admin.
- DX para dev local: sem transformações dinâmicas no Supabase local, usar fallback em Edge Function.

## Pendências
- Usar Supabase Storage Image Transformations ou lib externa (Imgproxy) — depende de plano Supabase.
- Política de retenção: assets de posts `archived` há > 1 ano vão para cold storage? Fora do MVP.

## Links
- [[../../03_backend/schema#asset_library]] · [[../../03_backend/schema#asset_versions]]
- [[../../03_backend/api/auto-adapt]]
- [[../../01_product/roles/designer]]
