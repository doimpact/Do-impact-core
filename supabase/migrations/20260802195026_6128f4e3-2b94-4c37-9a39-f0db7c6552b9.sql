ALTER TABLE public.employees DISABLE TRIGGER trg_prevent_template_employees;
ALTER TABLE public.employees DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.restructuring_members DISABLE TRIGGER trg_prevent_template_write;

UPDATE public.employees
SET first_name = 'Adrian',
    last_name = 'Vance',
    email = 'adrian.vance@titanscale.example'
WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
  AND (email = 'operator@example.com' OR (first_name = 'David' AND last_name = 'Orth'));

UPDATE public.restructuring_members
SET name = 'Adrian Vance',
    email = 'adrian.vance@titanscale.example'
WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
  AND (email = 'operator@example.com' OR name = 'Alex Miller');

ALTER TABLE public.employees ENABLE TRIGGER trg_prevent_template_employees;
ALTER TABLE public.employees ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.restructuring_members ENABLE TRIGGER trg_prevent_template_write;