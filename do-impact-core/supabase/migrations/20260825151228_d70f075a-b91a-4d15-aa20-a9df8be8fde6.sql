DROP POLICY IF EXISTS "Authenticated can read pfmea drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload pfmea drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update pfmea drawings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete pfmea drawings" ON storage.objects;

CREATE POLICY "Company members can read pfmea drawings"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'pfmea-drawings'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Company members can upload pfmea drawings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pfmea-drawings'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Company members can update pfmea drawings"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'pfmea-drawings'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'pfmea-drawings'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Company members can delete pfmea drawings"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'pfmea-drawings'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);