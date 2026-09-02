CREATE POLICY "Super admins insert add-ons"
ON public.company_addons FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins update add-ons"
ON public.company_addons FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins delete add-ons"
ON public.company_addons FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));