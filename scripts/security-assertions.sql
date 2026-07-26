-- Regression checks for previously fixed security findings.
-- Each block appends to `regressions` when a fix regresses. At the end we emit
-- one `REGRESSION <internal_id>: <message>` NOTICE per failure and RAISE so
-- psql exits non-zero and CI can parse the notices to build a PR comment.
--
-- IMPORTANT: keep the `-- ASSERT: <internal_id>` marker on the line
-- immediately above each check. `.github/workflows/security-scan.yml` scans
-- this file for those markers to build deep links back to failing assertions.

\set ON_ERROR_STOP on

DO $$
DECLARE
  n int;
  regressions text[] := ARRAY[]::text[];
BEGIN
  ----------------------------------------------------------------------------
  -- ASSERT: SUPA_anon_security_definer_function_executable
  -- No SECURITY DEFINER function in `public` may be EXECUTE-able by anon/PUBLIC.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prosecdef
    AND (
      has_function_privilege('anon',   p.oid, 'EXECUTE')
      OR has_function_privilege('public', p.oid, 'EXECUTE')
    );
  IF n > 0 THEN
    regressions := regressions || format(
      'REGRESSION SUPA_anon_security_definer_function_executable: %s SECURITY DEFINER function(s) executable by anon/PUBLIC', n);
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: SUPA_function_search_path_mutable
  -- Every public function must pin search_path via SET search_path=...
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname IN ('public','private')
    AND p.prokind IN ('f','p')
    AND NOT EXISTS (
      SELECT 1 FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) c
      WHERE c LIKE 'search_path=%'
    );
  IF n > 0 THEN
    regressions := regressions || format(
      'REGRESSION SUPA_function_search_path_mutable: %s public function(s) without pinned search_path', n);
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: SUPA_rls_policy_always_true
  -- No PUBLIC-schema write policy may use `true` as its USING or WITH CHECK.
  -- SELECT policies with `true` are intentional public-read tables.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd <> 'SELECT'
    AND (
      btrim(coalesce(qual, ''))       IN ('true','(true)')
      OR btrim(coalesce(with_check,'')) IN ('true','(true)')
    );
  IF n > 0 THEN
    regressions := regressions || format(
      'REGRESSION SUPA_rls_policy_always_true: %s write policy/policies use always-true qual or with_check', n);
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: chatbot_messages_session_spoofing
  -- Visitors must not be able to insert chatbot messages directly; only the
  -- server (service_role) writes them, so no anon/authenticated INSERT grant
  -- and no client-facing INSERT policy may exist.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name   = 'chatbot_messages'
    AND privilege_type = 'INSERT'
    AND grantee IN ('anon','authenticated','PUBLIC');
  IF n > 0 THEN
    regressions := regressions ||
      'REGRESSION chatbot_messages_session_spoofing: client roles can INSERT into chatbot_messages';
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: report_downloads_arbitrary_report_id
  -- Download logs must be written server-side only.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name   = 'report_downloads'
    AND privilege_type = 'INSERT'
    AND grantee IN ('anon','authenticated','PUBLIC');
  IF n > 0 THEN
    regressions := regressions ||
      'REGRESSION report_downloads_arbitrary_report_id: client roles can INSERT into report_downloads';
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: SUPA_authenticated_security_definer_function_executable
  -- No SECURITY DEFINER function in the API-exposed `public` schema may be
  -- callable by authenticated users (role helpers live in `private`).
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND p.prosecdef
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE');
  IF n > 0 THEN
    regressions := regressions || format(
      'REGRESSION SUPA_authenticated_security_definer_function_executable: %s SECURITY DEFINER function(s) in public executable by authenticated', n);
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: exports_bucket_missing_write_policies
  -- storage.objects must have owner-scoped INSERT/UPDATE/DELETE for `exports`.
  ----------------------------------------------------------------------------
  SELECT count(DISTINCT cmd) INTO n
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename  = 'objects'
    AND cmd IN ('INSERT','UPDATE','DELETE')
    AND (qual ILIKE '%exports%' OR with_check ILIKE '%exports%');
  IF n < 3 THEN
    regressions := regressions || format(
      'REGRESSION exports_bucket_missing_write_policies: exports bucket missing INSERT/UPDATE/DELETE owner policies (found %s of 3)', n);
  END IF;

  ----------------------------------------------------------------------------
  -- ASSERT: BROKEN_AUTHORIZATION_FUNCTION
  -- is_staff() body must filter on `role` (not just row-existence).
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname IN ('public','private')
    AND p.proname  = 'is_staff'
    AND (pg_get_functiondef(p.oid) ILIKE '%role%=%'
         OR pg_get_functiondef(p.oid) ILIKE '%role = ANY%');
  IF n = 0 THEN
    regressions := regressions ||
      'REGRESSION BROKEN_AUTHORIZATION_FUNCTION: is_staff no longer filters by specific staff roles';
  END IF;

  IF array_length(regressions, 1) IS NOT NULL THEN
    -- Emit one NOTICE per regression so CI can parse and post a PR comment.
    FOR n IN 1..array_length(regressions, 1) LOOP
      RAISE NOTICE '%', regressions[n];
    END LOOP;
    RAISE EXCEPTION 'Security regression(s) detected: % finding(s)', array_length(regressions, 1);
  END IF;

  RAISE NOTICE 'All security regression checks passed.';
END $$;
