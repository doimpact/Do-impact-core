CREATE POLICY "Authenticated can read safety photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'safety-photos');
CREATE POLICY "Authenticated can upload safety photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'safety-photos');
CREATE POLICY "Authenticated can update safety photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'safety-photos') WITH CHECK (bucket_id = 'safety-photos');
CREATE POLICY "Authenticated can delete safety photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'safety-photos');