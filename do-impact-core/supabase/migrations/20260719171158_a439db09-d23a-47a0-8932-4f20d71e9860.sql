
CREATE TYPE public.hoshin_kind AS ENUM ('long_term', 'annual', 'priority', 'kpi');
CREATE TYPE public.hoshin_correlation AS ENUM ('strong', 'weak');

CREATE TABLE public.hoshin_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind public.hoshin_kind NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_value TEXT,
  current_value TEXT,
  horizon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoshin_items TO authenticated;
GRANT ALL ON public.hoshin_items TO service_role;
ALTER TABLE public.hoshin_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hoshin_items all" ON public.hoshin_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER hoshin_items_updated_at BEFORE UPDATE ON public.hoshin_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.hoshin_correlations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id UUID NOT NULL REFERENCES public.hoshin_items(id) ON DELETE CASCADE,
  to_id UUID NOT NULL REFERENCES public.hoshin_items(id) ON DELETE CASCADE,
  strength public.hoshin_correlation NOT NULL DEFAULT 'strong',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_id, to_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hoshin_correlations TO authenticated;
GRANT ALL ON public.hoshin_correlations TO service_role;
ALTER TABLE public.hoshin_correlations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hoshin_correlations all" ON public.hoshin_correlations FOR ALL TO authenticated USING (true) WITH CHECK (true);
