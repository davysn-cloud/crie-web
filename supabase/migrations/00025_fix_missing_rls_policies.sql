-- =============================================================================
-- 00025_fix_missing_rls_policies.sql
-- Restaura TODAS as policies RLS perdidas na migração para o projeto
-- Supabase sa-east-1 (ndrqaymrkrlilxnyfymt).
--
-- Contexto: a migração recriou as tabelas via 00001-00024, mas o novo
-- projeto só recebeu as policies das tabelas core (agencies, agency_members,
-- workspaces, workspace_members, agency_invites, agency_integrations,
-- approval_pins, briefs, publish_attempts, telemetry_vitals).
-- As tabelas abaixo ficaram com RLS ENABLED mas sem nenhuma policy, o que
-- bloqueia 100% dos acessos autenticados.
--
-- Padrão: DROP POLICY IF EXISTS + CREATE POLICY (idempotente).
-- As policies aqui refletem a versão FINAL de cada tabela após todas as
-- migrations anteriores (inclusive 00019 / 00021 que reescreveram algumas).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. AGENCIES (core — 3 policies: INSERT, SELECT, UPDATE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS agency_insert ON public.agencies;
CREATE POLICY agency_insert ON public.agencies FOR INSERT
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS agency_select ON public.agencies;
CREATE POLICY agency_select ON public.agencies FOR SELECT
  USING (public.is_agency_member(id));

DROP POLICY IF EXISTS agency_update ON public.agencies;
CREATE POLICY agency_update ON public.agencies FOR UPDATE
  USING (public.is_agency_member(id));

-- ---------------------------------------------------------------------------
-- 2. AGENCY_MEMBERS (core — 3 policies: SELECT, INSERT, DELETE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS agency_members_select ON public.agency_members;
CREATE POLICY agency_members_select ON public.agency_members FOR SELECT
  USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS agency_members_insert ON public.agency_members;
CREATE POLICY agency_members_insert ON public.agency_members FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS agency_members_delete ON public.agency_members;
CREATE POLICY agency_members_delete ON public.agency_members FOR DELETE
  USING (public.is_agency_member(agency_id));

-- ---------------------------------------------------------------------------
-- 3. WORKSPACES (core — 3 policies: INSERT, SELECT, UPDATE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS workspaces_insert ON public.workspaces;
CREATE POLICY workspaces_insert ON public.workspaces FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS workspaces_select ON public.workspaces;
CREATE POLICY workspaces_select ON public.workspaces FOR SELECT
  USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS workspaces_update ON public.workspaces;
CREATE POLICY workspaces_update ON public.workspaces FOR UPDATE
  USING (public.is_agency_member(agency_id));

-- ---------------------------------------------------------------------------
-- 4. WORKSPACE_MEMBERS (core — 4 policies: SELECT, INSERT, UPDATE, DELETE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS workspace_members_select ON public.workspace_members;
CREATE POLICY workspace_members_select ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS workspace_members_insert ON public.workspace_members;
CREATE POLICY workspace_members_insert ON public.workspace_members FOR INSERT
  WITH CHECK (public.is_agency_member(public.get_agency_id_for_workspace(workspace_id)));

DROP POLICY IF EXISTS workspace_members_update ON public.workspace_members;
CREATE POLICY workspace_members_update ON public.workspace_members FOR UPDATE
  USING (public.is_agency_member(public.get_agency_id_for_workspace(workspace_id)));

DROP POLICY IF EXISTS workspace_members_delete ON public.workspace_members;
CREATE POLICY workspace_members_delete ON public.workspace_members FOR DELETE
  USING (public.is_agency_member(public.get_agency_id_for_workspace(workspace_id)));

-- ---------------------------------------------------------------------------
-- 5. POST_CARDS (00001 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS post_cards_select ON public.post_cards;
CREATE POLICY post_cards_select ON public.post_cards FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS post_cards_insert ON public.post_cards;
CREATE POLICY post_cards_insert ON public.post_cards FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS post_cards_update ON public.post_cards;
CREATE POLICY post_cards_update ON public.post_cards FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS post_cards_delete ON public.post_cards;
CREATE POLICY post_cards_delete ON public.post_cards FOR DELETE
  USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 6. BRAND_PROFILES (00001 — 3 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS brand_profiles_select ON public.brand_profiles;
CREATE POLICY brand_profiles_select ON public.brand_profiles FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS brand_profiles_insert ON public.brand_profiles;
CREATE POLICY brand_profiles_insert ON public.brand_profiles FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS brand_profiles_update ON public.brand_profiles;
CREATE POLICY brand_profiles_update ON public.brand_profiles FOR UPDATE
  USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 7. ASSET_VERSIONS (00001 — 3 policies; resolve workspace via post_cards)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS asset_versions_select ON public.asset_versions;
CREATE POLICY asset_versions_select ON public.asset_versions FOR SELECT
  USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = asset_versions.post_card_id)
    )
  );

DROP POLICY IF EXISTS asset_versions_insert ON public.asset_versions;
CREATE POLICY asset_versions_insert ON public.asset_versions FOR INSERT
  WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = asset_versions.post_card_id)
    )
  );

DROP POLICY IF EXISTS asset_versions_update ON public.asset_versions;
CREATE POLICY asset_versions_update ON public.asset_versions FOR UPDATE
  USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = asset_versions.post_card_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 8. PILLARS (00008 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "pillars_select" ON public.pillars;
CREATE POLICY "pillars_select" ON public.pillars
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "pillars_insert" ON public.pillars;
CREATE POLICY "pillars_insert" ON public.pillars
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "pillars_update" ON public.pillars;
CREATE POLICY "pillars_update" ON public.pillars
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "pillars_delete" ON public.pillars;
CREATE POLICY "pillars_delete" ON public.pillars
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 9. CAMPAIGNS (00008 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "campaigns_select" ON public.campaigns;
CREATE POLICY "campaigns_select" ON public.campaigns
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "campaigns_insert" ON public.campaigns;
CREATE POLICY "campaigns_insert" ON public.campaigns
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "campaigns_update" ON public.campaigns;
CREATE POLICY "campaigns_update" ON public.campaigns
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "campaigns_delete" ON public.campaigns;
CREATE POLICY "campaigns_delete" ON public.campaigns
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 10. BRIEFS (00008 original + 00019 rewrite with deleted_at IS NULL)
-- Final form: select/update/delete filter deleted_at IS NULL;
-- separate policy lets strategists read soft-deleted briefs.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "briefs_select" ON public.briefs;
CREATE POLICY "briefs_select" ON public.briefs
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "briefs_insert" ON public.briefs;
CREATE POLICY "briefs_insert" ON public.briefs
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "briefs_update" ON public.briefs;
CREATE POLICY "briefs_update" ON public.briefs
  FOR UPDATE USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "briefs_delete" ON public.briefs;
CREATE POLICY "briefs_delete" ON public.briefs
  FOR DELETE USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NULL
  );

DROP POLICY IF EXISTS "briefs_select_deleted" ON public.briefs;
CREATE POLICY "briefs_select_deleted" ON public.briefs
  FOR SELECT USING (
    public.is_workspace_member(workspace_id)
    AND deleted_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = briefs.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role = 'strategist'
    )
  );

-- ---------------------------------------------------------------------------
-- 11. HASHTAG_SETS (00009 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "hashtag_sets_select" ON public.hashtag_sets;
CREATE POLICY "hashtag_sets_select" ON public.hashtag_sets
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "hashtag_sets_insert" ON public.hashtag_sets;
CREATE POLICY "hashtag_sets_insert" ON public.hashtag_sets
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "hashtag_sets_update" ON public.hashtag_sets;
CREATE POLICY "hashtag_sets_update" ON public.hashtag_sets
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "hashtag_sets_delete" ON public.hashtag_sets;
CREATE POLICY "hashtag_sets_delete" ON public.hashtag_sets
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 12. HASHTAG_SET_ITEMS (00009 — 4 policies; resolve workspace via hashtag_sets)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "hashtag_set_items_select" ON public.hashtag_set_items;
CREATE POLICY "hashtag_set_items_select" ON public.hashtag_set_items
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );

DROP POLICY IF EXISTS "hashtag_set_items_insert" ON public.hashtag_set_items;
CREATE POLICY "hashtag_set_items_insert" ON public.hashtag_set_items
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );

DROP POLICY IF EXISTS "hashtag_set_items_update" ON public.hashtag_set_items;
CREATE POLICY "hashtag_set_items_update" ON public.hashtag_set_items
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );

DROP POLICY IF EXISTS "hashtag_set_items_delete" ON public.hashtag_set_items;
CREATE POLICY "hashtag_set_items_delete" ON public.hashtag_set_items
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.hashtag_sets WHERE id = hashtag_set_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 13. HOOKS_LIBRARY (00009 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "hooks_library_select" ON public.hooks_library;
CREATE POLICY "hooks_library_select" ON public.hooks_library
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "hooks_library_insert" ON public.hooks_library;
CREATE POLICY "hooks_library_insert" ON public.hooks_library
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "hooks_library_update" ON public.hooks_library;
CREATE POLICY "hooks_library_update" ON public.hooks_library
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "hooks_library_delete" ON public.hooks_library;
CREATE POLICY "hooks_library_delete" ON public.hooks_library
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 14. CTAS_LIBRARY (00009 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "ctas_library_select" ON public.ctas_library;
CREATE POLICY "ctas_library_select" ON public.ctas_library
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "ctas_library_insert" ON public.ctas_library;
CREATE POLICY "ctas_library_insert" ON public.ctas_library
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "ctas_library_update" ON public.ctas_library;
CREATE POLICY "ctas_library_update" ON public.ctas_library
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "ctas_library_delete" ON public.ctas_library;
CREATE POLICY "ctas_library_delete" ON public.ctas_library
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 15. BRAND_VOICE (00010 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "brand_voice_select" ON public.brand_voice;
CREATE POLICY "brand_voice_select" ON public.brand_voice
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "brand_voice_insert" ON public.brand_voice;
CREATE POLICY "brand_voice_insert" ON public.brand_voice
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "brand_voice_update" ON public.brand_voice;
CREATE POLICY "brand_voice_update" ON public.brand_voice
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "brand_voice_delete" ON public.brand_voice;
CREATE POLICY "brand_voice_delete" ON public.brand_voice
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 16. POST_DRAFTS (00011 — 4 policies; resolve workspace via post_cards)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "post_drafts_select" ON public.post_drafts;
CREATE POLICY "post_drafts_select" ON public.post_drafts
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_drafts_insert" ON public.post_drafts;
CREATE POLICY "post_drafts_insert" ON public.post_drafts
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_drafts_update" ON public.post_drafts;
CREATE POLICY "post_drafts_update" ON public.post_drafts
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_drafts_delete" ON public.post_drafts;
CREATE POLICY "post_drafts_delete" ON public.post_drafts
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 17. POST_FORMATS (00011 — 4 policies; resolve workspace via post_cards)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "post_formats_select" ON public.post_formats;
CREATE POLICY "post_formats_select" ON public.post_formats
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_formats_insert" ON public.post_formats;
CREATE POLICY "post_formats_insert" ON public.post_formats
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_formats_update" ON public.post_formats;
CREATE POLICY "post_formats_update" ON public.post_formats
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_formats_delete" ON public.post_formats;
CREATE POLICY "post_formats_delete" ON public.post_formats
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 18. CAROUSEL_SLIDES (00011 — 4 policies; resolve workspace via post_formats → post_cards)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "carousel_slides_select" ON public.carousel_slides;
CREATE POLICY "carousel_slides_select" ON public.carousel_slides
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );

DROP POLICY IF EXISTS "carousel_slides_insert" ON public.carousel_slides;
CREATE POLICY "carousel_slides_insert" ON public.carousel_slides
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );

DROP POLICY IF EXISTS "carousel_slides_update" ON public.carousel_slides;
CREATE POLICY "carousel_slides_update" ON public.carousel_slides
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );

DROP POLICY IF EXISTS "carousel_slides_delete" ON public.carousel_slides;
CREATE POLICY "carousel_slides_delete" ON public.carousel_slides
  FOR DELETE USING (
    public.is_workspace_member(
      (SELECT pc.workspace_id
         FROM public.post_cards pc
         JOIN public.post_formats pf ON pf.post_card_id = pc.id
        WHERE pf.id = post_format_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 19. ASSET_LIBRARY (00012 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "asset_library_select" ON public.asset_library;
CREATE POLICY "asset_library_select" ON public.asset_library
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "asset_library_insert" ON public.asset_library;
CREATE POLICY "asset_library_insert" ON public.asset_library
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "asset_library_update" ON public.asset_library;
CREATE POLICY "asset_library_update" ON public.asset_library
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "asset_library_delete" ON public.asset_library;
CREATE POLICY "asset_library_delete" ON public.asset_library
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 20. TEMPLATES (00012 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "templates_select" ON public.templates;
CREATE POLICY "templates_select" ON public.templates
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "templates_insert" ON public.templates;
CREATE POLICY "templates_insert" ON public.templates
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "templates_update" ON public.templates;
CREATE POLICY "templates_update" ON public.templates
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "templates_delete" ON public.templates;
CREATE POLICY "templates_delete" ON public.templates
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 21. POST_VERSIONS (00013 — 3 policies; no DELETE — immutable)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "post_versions_select" ON public.post_versions;
CREATE POLICY "post_versions_select" ON public.post_versions
  FOR SELECT USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_versions_insert" ON public.post_versions;
CREATE POLICY "post_versions_insert" ON public.post_versions
  FOR INSERT WITH CHECK (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );

DROP POLICY IF EXISTS "post_versions_update_lock" ON public.post_versions;
CREATE POLICY "post_versions_update_lock" ON public.post_versions
  FOR UPDATE USING (
    public.is_workspace_member(
      (SELECT workspace_id FROM public.post_cards WHERE id = post_card_id)
    )
  );
-- No DELETE policy: post_versions are immutable; removal requires service_role.

-- ---------------------------------------------------------------------------
-- 22. MAGIC_LINKS (00014 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "magic_links_select" ON public.magic_links;
CREATE POLICY "magic_links_select" ON public.magic_links
  FOR SELECT USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "magic_links_insert" ON public.magic_links;
CREATE POLICY "magic_links_insert" ON public.magic_links
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "magic_links_update" ON public.magic_links;
CREATE POLICY "magic_links_update" ON public.magic_links
  FOR UPDATE USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "magic_links_delete" ON public.magic_links;
CREATE POLICY "magic_links_delete" ON public.magic_links
  FOR DELETE USING (public.is_agency_member(agency_id));

-- ---------------------------------------------------------------------------
-- 23. APPROVAL_REQUESTS (00014 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "approval_requests_select" ON public.approval_requests;
CREATE POLICY "approval_requests_select" ON public.approval_requests
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "approval_requests_insert" ON public.approval_requests;
CREATE POLICY "approval_requests_insert" ON public.approval_requests
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "approval_requests_update" ON public.approval_requests;
CREATE POLICY "approval_requests_update" ON public.approval_requests
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "approval_requests_delete" ON public.approval_requests;
CREATE POLICY "approval_requests_delete" ON public.approval_requests
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 24. APPROVAL_PINS (00021 hardened form — direct workspace_id, no subquery)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "approval_pins_select" ON public.approval_pins;
CREATE POLICY "approval_pins_select" ON public.approval_pins
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "approval_pins_insert" ON public.approval_pins;
CREATE POLICY "approval_pins_insert" ON public.approval_pins
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "approval_pins_update" ON public.approval_pins;
CREATE POLICY "approval_pins_update" ON public.approval_pins
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "approval_pins_delete" ON public.approval_pins;
CREATE POLICY "approval_pins_delete" ON public.approval_pins
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 25. PUBLISH_QUEUE (00015 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "publish_queue_select" ON public.publish_queue;
CREATE POLICY "publish_queue_select" ON public.publish_queue
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "publish_queue_insert" ON public.publish_queue;
CREATE POLICY "publish_queue_insert" ON public.publish_queue
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "publish_queue_update" ON public.publish_queue;
CREATE POLICY "publish_queue_update" ON public.publish_queue
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "publish_queue_delete" ON public.publish_queue;
CREATE POLICY "publish_queue_delete" ON public.publish_queue
  FOR DELETE USING (
    public.is_workspace_member(workspace_id)
    AND status IN ('queued', 'failed', 'cancelled')
  );

-- ---------------------------------------------------------------------------
-- 26. PUBLISH_ATTEMPTS (00021 hardened form — direct workspace_id; append-only)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "publish_attempts_select" ON public.publish_attempts;
CREATE POLICY "publish_attempts_select" ON public.publish_attempts
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "publish_attempts_insert" ON public.publish_attempts;
CREATE POLICY "publish_attempts_insert" ON public.publish_attempts
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));
-- No UPDATE/DELETE policies: publish_attempts is append-only.

-- ---------------------------------------------------------------------------
-- 27. INSIGHTS (00016 — 4 policies)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "insights_select" ON public.insights;
CREATE POLICY "insights_select" ON public.insights
  FOR SELECT USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "insights_insert" ON public.insights;
CREATE POLICY "insights_insert" ON public.insights
  FOR INSERT WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "insights_update" ON public.insights;
CREATE POLICY "insights_update" ON public.insights
  FOR UPDATE USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "insights_delete" ON public.insights;
CREATE POLICY "insights_delete" ON public.insights
  FOR DELETE USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- 28. AUDIT_LOG (00017 — 2 policies: SELECT + INSERT; no UPDATE/DELETE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));
-- No UPDATE/DELETE: audit_log is immutable.

-- ---------------------------------------------------------------------------
-- 29. AGENCY_INTEGRATIONS (00018 + 00021 — 4 blocking policies for authenticated)
-- All real access goes through the agency_integrations_public view + RPCs.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "integrations_select_service_role_only" ON public.agency_integrations;
CREATE POLICY "integrations_select_service_role_only"
  ON public.agency_integrations FOR SELECT TO authenticated USING (false);

DROP POLICY IF EXISTS "integrations_insert_service_role_only" ON public.agency_integrations;
CREATE POLICY "integrations_insert_service_role_only"
  ON public.agency_integrations FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS "integrations_update_service_role_only" ON public.agency_integrations;
CREATE POLICY "integrations_update_service_role_only"
  ON public.agency_integrations FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "integrations_delete_service_role_only" ON public.agency_integrations;
CREATE POLICY "integrations_delete_service_role_only"
  ON public.agency_integrations FOR DELETE TO authenticated USING (false);

-- ---------------------------------------------------------------------------
-- 30. AGENCY_INVITES (00020 — 3 policies: SELECT, INSERT, DELETE)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "agency_invites_select" ON public.agency_invites;
CREATE POLICY "agency_invites_select" ON public.agency_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "agency_invites_insert" ON public.agency_invites;
CREATE POLICY "agency_invites_insert" ON public.agency_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "agency_invites_delete" ON public.agency_invites;
CREATE POLICY "agency_invites_delete" ON public.agency_invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = agency_invites.agency_id
        AND am.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 31. TELEMETRY_VITALS (00022 — 1 policy: INSERT for anon + authenticated)
-- SELECT/UPDATE/DELETE intentionally blocked (service_role only via RLS bypass).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anyone can insert vitals" ON public.telemetry_vitals;
CREATE POLICY "anyone can insert vitals"
  ON public.telemetry_vitals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
