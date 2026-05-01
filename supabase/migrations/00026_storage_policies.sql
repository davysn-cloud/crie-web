-- =============================================================================
-- 00026_storage_policies.sql
-- Configura buckets de Storage e policies RLS em storage.objects.
--
-- Contexto: os 4 buckets (post-assets, asset-library, brand-assets,
-- agency-assets) existiam sem policies de storage, causando erros
-- "new row violates row-level security policy" em uploads/downloads.
--
-- Decisão de design: policies simples auth.role() = 'authenticated'.
-- O controle de acesso fino (quem pode ver/editar o quê) já é imposto
-- pelas policies RLS das tabelas de domínio que guardam o storage_path
-- (asset_library, asset_versions, brand_profiles, agencies).
-- Duplicar workspace/agency checks aqui criaria acoplamento frágil entre
-- path conventions e RLS, sem ganho real de segurança dado que os paths
-- nunca são expostos diretamente ao cliente sem passar por uma query
-- nas tabelas com RLS.
--
-- Buckets: todos privados (public = false).
-- Padrão: DROP POLICY IF EXISTS + CREATE POLICY (PG não suporta IF NOT EXISTS
-- para policies em storage.objects).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Garantir existência dos buckets (idempotente via ON CONFLICT DO NOTHING)
-- ---------------------------------------------------------------------------

-- post-assets: artes/assets de um post_card específico
-- Path: {postCardId}/{timestamp}.{ext}
--    ou {workspaceId}/{postCardId}/{timestamp}.{ext}
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-assets',
  'post-assets',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- asset-library: biblioteca de assets reutilizáveis por workspace
-- Path: workspace-assets/{workspaceId}/{timestamp}-{filename}
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-library',
  'asset-library',
  false,
  104857600,  -- 100 MB (suporta vídeos de biblioteca)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
    'image/svg+xml',
    'video/mp4', 'video/quicktime', 'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- brand-assets: logos e assets de marca (brand_profiles)
-- Path: logos/{workspaceId}/logo-{timestamp}.{ext}
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  false,
  10485760,  -- 10 MB (logos não precisam ser grandes)
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- agency-assets: assets de nível de agência (white-label logos, etc.)
-- Path: livre — escopo de agência, sem workspace específico
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agency-assets',
  'agency-assets',
  false,
  10485760,  -- 10 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Policies para o bucket: post-assets
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "post-assets: authenticated select" ON storage.objects;
CREATE POLICY "post-assets: authenticated select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'post-assets');

DROP POLICY IF EXISTS "post-assets: authenticated insert" ON storage.objects;
CREATE POLICY "post-assets: authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-assets');

DROP POLICY IF EXISTS "post-assets: authenticated update" ON storage.objects;
CREATE POLICY "post-assets: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'post-assets');

DROP POLICY IF EXISTS "post-assets: authenticated delete" ON storage.objects;
CREATE POLICY "post-assets: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-assets');

-- ---------------------------------------------------------------------------
-- 3. Policies para o bucket: asset-library
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "asset-library: authenticated select" ON storage.objects;
CREATE POLICY "asset-library: authenticated select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'asset-library');

DROP POLICY IF EXISTS "asset-library: authenticated insert" ON storage.objects;
CREATE POLICY "asset-library: authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'asset-library');

DROP POLICY IF EXISTS "asset-library: authenticated update" ON storage.objects;
CREATE POLICY "asset-library: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'asset-library');

DROP POLICY IF EXISTS "asset-library: authenticated delete" ON storage.objects;
CREATE POLICY "asset-library: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'asset-library');

-- ---------------------------------------------------------------------------
-- 4. Policies para o bucket: brand-assets
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "brand-assets: authenticated select" ON storage.objects;
CREATE POLICY "brand-assets: authenticated select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "brand-assets: authenticated insert" ON storage.objects;
CREATE POLICY "brand-assets: authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "brand-assets: authenticated update" ON storage.objects;
CREATE POLICY "brand-assets: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'brand-assets');

DROP POLICY IF EXISTS "brand-assets: authenticated delete" ON storage.objects;
CREATE POLICY "brand-assets: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'brand-assets');

-- ---------------------------------------------------------------------------
-- 5. Policies para o bucket: agency-assets
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "agency-assets: authenticated select" ON storage.objects;
CREATE POLICY "agency-assets: authenticated select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "agency-assets: authenticated insert" ON storage.objects;
CREATE POLICY "agency-assets: authenticated insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "agency-assets: authenticated update" ON storage.objects;
CREATE POLICY "agency-assets: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'agency-assets');

DROP POLICY IF EXISTS "agency-assets: authenticated delete" ON storage.objects;
CREATE POLICY "agency-assets: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'agency-assets');
