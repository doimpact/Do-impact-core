DROP POLICY IF EXISTS "Authenticated can read safety photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload safety photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update safety photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete safety photos" ON storage.objects;

CREATE POLICY "Members read own company safety photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'safety-photos'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Members upload own company safety photos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'safety-photos'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Members update own company safety photos" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'safety-photos'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'safety-photos'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);

CREATE POLICY "Members delete own company safety photos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'safety-photos'
  AND public.is_company_member(((storage.foldername(name))[1])::uuid, auth.uid())
);