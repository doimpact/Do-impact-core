ALTER TABLE public.capex_value_realization DROP CONSTRAINT capex_value_realization_created_by_fkey;
ALTER TABLE public.capex_value_realization ADD CONSTRAINT capex_value_realization_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.siop_cycles DROP CONSTRAINT siop_cycles_owner_id_fkey;
ALTER TABLE public.siop_cycles ADD CONSTRAINT siop_cycles_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.siop_cycles DROP CONSTRAINT siop_cycles_created_by_fkey;
ALTER TABLE public.siop_cycles ADD CONSTRAINT siop_cycles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.siop_decisions DROP CONSTRAINT siop_decisions_owner_id_fkey;
ALTER TABLE public.siop_decisions ADD CONSTRAINT siop_decisions_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;