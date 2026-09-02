INSERT INTO public.ai_usage_limits (scope, company_id, monthly_credits)
VALUES ('company', '9d12cf46-98e4-40ca-aed4-bcc95257d8b5', 0)
ON CONFLICT DO NOTHING;