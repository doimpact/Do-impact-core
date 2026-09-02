ALTER TABLE public.eol_gate_checklist DISABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_gate_checklist DISABLE TRIGGER trg_enforce_write_access;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY program_id, phase ORDER BY sort_order, id) AS rn
  FROM public.eol_gate_checklist
  WHERE company_id = '9d12cf46-98e4-40ca-aed4-bcc95257d8b5'
    AND ((program_id = '5b1c0a10-1111-4a10-9f01-e01a00000001' AND phase = 3)
      OR (program_id = '5b1c0a10-1111-4a10-9f01-e01a00000002' AND phase = 4))
)
UPDATE public.eol_gate_checklist c
SET completed = true, completed_at = now() - interval '20 days'
FROM ranked r
WHERE c.id = r.id AND r.rn <= 2;

ALTER TABLE public.eol_gate_checklist ENABLE TRIGGER trg_prevent_template_write;
ALTER TABLE public.eol_gate_checklist ENABLE TRIGGER trg_enforce_write_access;