
-- 1. Platform-wide monthly AI ceiling
ALTER TABLE public.ai_usage_limits DROP CONSTRAINT IF EXISTS ai_usage_limits_scope_check;
ALTER TABLE public.ai_usage_limits ADD CONSTRAINT ai_usage_limits_scope_check
  CHECK (scope = ANY (ARRAY['global'::text, 'company'::text, 'user'::text, 'platform'::text]));

INSERT INTO public.ai_usage_limits (scope, company_id, user_id, monthly_credits)
SELECT 'platform', NULL, NULL, 500
WHERE NOT EXISTS (SELECT 1 FROM public.ai_usage_limits WHERE scope = 'platform');

-- 2. Per-company storage caps
CREATE TABLE IF NOT EXISTS public.storage_limits (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  max_bytes bigint NOT NULL DEFAULT 536870912,
  max_uploads_per_day integer NOT NULL DEFAULT 200,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.storage_limits TO authenticated;
GRANT ALL ON public.storage_limits TO service_role;
ALTER TABLE public.storage_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read their company storage limits" ON public.storage_limits;
CREATE POLICY "Members read their company storage limits"
  ON public.storage_limits FOR SELECT TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

INSERT INTO public.storage_limits (company_id, max_bytes, max_uploads_per_day)
SELECT id, 0, 0 FROM public.companies WHERE is_template = true
ON CONFLICT (company_id) DO UPDATE SET max_bytes = 0, max_uploads_per_day = 0;

-- 3. Storage guard used by the bucket upload policies
CREATE OR REPLACE FUNCTION public.company_storage_under_limit(_company uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_bytes bigint;
  v_max_day integer;
  v_used bigint;
  v_today integer;
BEGIN
  IF _company IS NULL THEN RETURN false; END IF;

  SELECT max_bytes, max_uploads_per_day INTO v_max_bytes, v_max_day
  FROM public.storage_limits WHERE company_id = _company;

  IF NOT FOUND THEN
    v_max_bytes := 536870912;
    v_max_day := 200;
  END IF;

  IF v_max_bytes <= 0 OR v_max_day <= 0 THEN RETURN false; END IF;

  SELECT COALESCE(SUM(COALESCE((metadata->>'size')::bigint, 0)), 0),
         COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))
    INTO v_used, v_today
  FROM storage.objects
  WHERE (storage.foldername(name))[1] = _company::text;

  RETURN v_used < v_max_bytes AND v_today < v_max_day;
END $$;

REVOKE ALL ON FUNCTION public.company_storage_under_limit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.company_storage_under_limit(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.company_storage_under_limit(uuid) TO authenticated, service_role;

-- 4. Apply the cap to both upload policies
DROP POLICY IF EXISTS "Members upload own company safety photos" ON storage.objects;
CREATE POLICY "Members upload own company safety photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'safety-photos'
    AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
    AND public.company_storage_under_limit(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Company members can upload pfmea drawings" ON storage.objects;
CREATE POLICY "Company members can upload pfmea drawings"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'pfmea-drawings'
    AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
    AND public.company_storage_under_limit(((storage.foldername(name))[1])::uuid)
  );

-- 5. Storage usage readout for the settings screen
CREATE OR REPLACE FUNCTION public.company_storage_usage(_company uuid)
RETURNS TABLE (used_bytes bigint, max_bytes bigint, uploads_today integer, max_uploads_per_day integer)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_company_member(_company, auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE((SELECT SUM(COALESCE((o.metadata->>'size')::bigint, 0))
              FROM storage.objects o
              WHERE (storage.foldername(o.name))[1] = _company::text), 0)::bigint,
    COALESCE((SELECT sl.max_bytes FROM public.storage_limits sl WHERE sl.company_id = _company), 536870912)::bigint,
    COALESCE((SELECT COUNT(*) FROM storage.objects o2
              WHERE (storage.foldername(o2.name))[1] = _company::text
                AND o2.created_at >= date_trunc('day', now())), 0)::integer,
    COALESCE((SELECT sl2.max_uploads_per_day FROM public.storage_limits sl2 WHERE sl2.company_id = _company), 200)::integer;
END $$;

REVOKE ALL ON FUNCTION public.company_storage_usage(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.company_storage_usage(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.company_storage_usage(uuid) TO authenticated, service_role;
