SET LOCAL session_replication_role = 'replica';

-- 1. Copy existing lines into value streams (same ids so children keep pointing at them)
INSERT INTO public.aps_value_streams (id, company_id, name, description, sort_order, archived_at, created_at, updated_at)
SELECT l.id, l.company_id, l.name, l.notes,
       (row_number() OVER (PARTITION BY l.company_id ORDER BY l.created_at))::int - 1,
       CASE WHEN l.archived THEN l.updated_at ELSE NULL END,
       l.created_at, l.updated_at
FROM public.shop_floor_lines l
ON CONFLICT (id) DO NOTHING;

-- 2. Repoint foreign keys
ALTER TABLE public.shop_floor_gates DROP CONSTRAINT shop_floor_gates_line_id_fkey;
ALTER TABLE public.shop_floor_gates
  ADD CONSTRAINT shop_floor_gates_line_id_fkey FOREIGN KEY (line_id)
  REFERENCES public.aps_value_streams(id) ON DELETE CASCADE;

ALTER TABLE public.shop_floor_parts DROP CONSTRAINT shop_floor_parts_line_id_fkey;
ALTER TABLE public.shop_floor_parts
  ADD CONSTRAINT shop_floor_parts_line_id_fkey FOREIGN KEY (line_id)
  REFERENCES public.aps_value_streams(id) ON DELETE CASCADE;

ALTER TABLE public.sic_shifts DROP CONSTRAINT sic_shifts_line_id_fkey;
ALTER TABLE public.sic_shifts
  ADD CONSTRAINT sic_shifts_line_id_fkey FOREIGN KEY (line_id)
  REFERENCES public.aps_value_streams(id) ON DELETE SET NULL;

-- 3. Drop the old lines table
DROP TABLE public.shop_floor_lines;