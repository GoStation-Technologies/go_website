-- Regression checks for previously fixed security findings.
-- Each block RAISES EXCEPTION when the fix regresses. Any failure aborts psql
-- with a non-zero exit code so CI marks the run failed.

\set ON_ERROR_STOP on

DO $$
DECLARE
  n int;
BEGIN
  ----------------------------------------------------------------------------
  -- SUPA_anon_security_definer_function_executable
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
    RAISE EXCEPTION
      'REGRESSION SUPA_anon_security_definer_function_executable: % SECURITY DEFINER function(s) executable by anon/PUBLIC', n;
  END IF;

  ----------------------------------------------------------------------------
  -- SUPA_function_search_path_mutable
  -- Every public function must pin search_path via SET search_path=...
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND p.prokind IN ('f','p')
    AND NOT EXISTS (
      SELECT 1 FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) c
      WHERE c LIKE 'search_path=%'
    );
  IF n > 0 THEN
    RAISE EXCEPTION
      'REGRESSION SUPA_function_search_path_mutable: % public function(s) without pinned search_path', n;
  END IF;

  ----------------------------------------------------------------------------
  -- SUPA_rls_policy_always_true
  -- No PUBLIC-schema policy may use `true` as its USING or WITH CHECK.
  ----------------------------------------------------------------------------
  -- SELECT policies with `true` are intentional public-read tables; only
  -- flag write-side (INSERT/UPDATE/DELETE/ALL) always-true policies.
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd <> 'SELECT'
    AND (
      btrim(coalesce(qual, ''))       IN ('true','(true)')
      OR btrim(coalesce(with_check,'')) IN ('true','(true)')
    );
  IF n > 0 THEN
    RAISE EXCEPTION
      'REGRESSION SUPA_rls_policy_always_true: % write policy/policies use always-true qual or with_check', n;
  END IF;


  ----------------------------------------------------------------------------
  -- chatbot_messages_public_insert_spoofing
  -- INSERT policy on public.chatbot_messages must constrain role and session_id.
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename  = 'chatbot_messages'
    AND cmd        = 'INSERT'
    AND with_check ILIKE '%role%'
    AND with_check ILIKE '%session_id%';
  IF n = 0 THEN
    RAISE EXCEPTION
      'REGRESSION chatbot_messages_public_insert_spoofing: INSERT policy missing role/session_id checks';
  END IF;

  ----------------------------------------------------------------------------
  -- exports_bucket_missing_write_policies
  -- storage.objects must have owner-scoped INSERT/UPDATE/DELETE for `exports`.
  ----------------------------------------------------------------------------
  SELECT count(DISTINCT cmd) INTO n
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename  = 'objects'
    AND cmd IN ('INSERT','UPDATE','DELETE')
    AND (qual ILIKE '%exports%' OR with_check ILIKE '%exports%');
  IF n < 3 THEN
    RAISE EXCEPTION
      'REGRESSION exports_bucket_missing_write_policies: exports bucket missing INSERT/UPDATE/DELETE owner policies (found % of 3)', n;
  END IF;

  ----------------------------------------------------------------------------
  -- BROKEN_AUTHORIZATION_FUNCTION (is_staff)
  -- is_staff() body must filter on `role` (not just row-existence).
  ----------------------------------------------------------------------------
  SELECT count(*) INTO n
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public'
    AND p.proname  = 'is_staff'
    AND pg_get_functiondef(p.oid) ILIKE '%role%=%'
    OR (ns.nspname='public' AND p.proname='is_staff' AND pg_get_functiondef(p.oid) ILIKE '%role = ANY%');
  IF n = 0 THEN
    RAISE EXCEPTION
      'REGRESSION is_staff: function no longer filters by specific staff roles';
  END IF;

  RAISE NOTICE 'All security regression checks passed.';
END $$;
