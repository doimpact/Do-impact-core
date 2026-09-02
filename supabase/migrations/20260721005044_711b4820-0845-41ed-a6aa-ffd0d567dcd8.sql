
ALTER TABLE public.shop_floor_lines REPLICA IDENTITY FULL;
ALTER TABLE public.shop_floor_gates REPLICA IDENTITY FULL;
ALTER TABLE public.shop_floor_parts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_floor_lines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_floor_gates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_floor_parts;
