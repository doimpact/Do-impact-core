-- Harden internal SECURITY DEFINER functions: remove EXECUTE from authenticated for trigger-only and admin utilities.
-- App-facing helper functions (has_role, is_company_admin, current_company_id, etc.) remain callable.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_write_access() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_seat_limit() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_company_bootstrap() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_company_seed_dm_board() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_company_seed_sic_loss_codes() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_dm_board_seed_metrics() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sync_bridge_workstream() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_sync_waterfall_item_initiative() FROM authenticated;

-- Audit log for security and compliance events.
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read own company audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_company_member(company_id, auth.uid()));

CREATE POLICY "Members can insert audit logs for own company"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_company_member(company_id, auth.uid()));

-- Add a security contact email field to org_settings.
ALTER TABLE public.org_settings
  ADD COLUMN IF NOT EXISTS security_contact_email text;

-- Add retention_days to org_settings for data retention/deletion controls.
ALTER TABLE public.org_settings
  ADD COLUMN IF NOT EXISTS retention_days integer DEFAULT 2555;

-- Ensure updated_at trigger exists on org_settings.
DROP TRIGGER IF EXISTS update_org_settings_updated_at ON public.org_settings;
CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();