
CREATE TABLE public.shop_floor_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_floor_lines TO authenticated;
GRANT ALL ON public.shop_floor_lines TO service_role;
ALTER TABLE public.shop_floor_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage lines" ON public.shop_floor_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.shop_floor_gates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id UUID NOT NULL REFERENCES public.shop_floor_lines(id) ON DELETE CASCADE,
  seq INT NOT NULL,
  name TEXT NOT NULL,
  wip_cap INT NOT NULL DEFAULT 3,
  yellow_wait_minutes INT NOT NULL DEFAULT 30,
  red_wait_minutes INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shop_floor_gates_line_seq_idx ON public.shop_floor_gates(line_id, seq);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_floor_gates TO authenticated;
GRANT ALL ON public.shop_floor_gates TO service_role;
ALTER TABLE public.shop_floor_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage gates" ON public.shop_floor_gates FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.shop_floor_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  line_id UUID NOT NULL REFERENCES public.shop_floor_lines(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  current_gate_id UUID REFERENCES public.shop_floor_gates(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','in_progress','ready','completed')),
  status_since TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shop_floor_parts_line_gate_idx ON public.shop_floor_parts(line_id, current_gate_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_floor_parts TO authenticated;
GRANT ALL ON public.shop_floor_parts TO service_role;
ALTER TABLE public.shop_floor_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth manage parts" ON public.shop_floor_parts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER shop_floor_lines_updated BEFORE UPDATE ON public.shop_floor_lines FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER shop_floor_gates_updated BEFORE UPDATE ON public.shop_floor_gates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER shop_floor_parts_updated BEFORE UPDATE ON public.shop_floor_parts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
