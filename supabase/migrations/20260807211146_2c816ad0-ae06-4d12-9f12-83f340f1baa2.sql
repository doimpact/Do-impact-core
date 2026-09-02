ALTER TABLE public.restructuring_items DROP CONSTRAINT restructuring_items_kind_check;
ALTER TABLE public.restructuring_items ADD CONSTRAINT restructuring_items_kind_check CHECK (kind = ANY (ARRAY['governance_entity','value_driver','kpi','phase','milestone','risk','change_request','note','objective','workstream']));
ALTER TABLE public.restructuring_items DROP CONSTRAINT restructuring_items_section_check;
ALTER TABLE public.restructuring_items ADD CONSTRAINT restructuring_items_section_check CHECK (section = ANY (ARRAY['governance','workstreams','objectives','roadmap','risks','scope_control']));
ALTER TABLE public.restructuring_items ADD COLUMN IF NOT EXISTS workstream_id uuid REFERENCES public.restructuring_items(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS restructuring_items_workstream_id_idx ON public.restructuring_items(workstream_id);