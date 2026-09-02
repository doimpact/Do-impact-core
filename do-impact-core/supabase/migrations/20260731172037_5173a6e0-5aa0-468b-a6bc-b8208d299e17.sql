ALTER TABLE public.business_settings ALTER COLUMN support_email SET DEFAULT 'hello@example.com';

UPDATE public.business_settings
SET support_email = 'hello@example.com'
WHERE support_email = 'operator@example.com';