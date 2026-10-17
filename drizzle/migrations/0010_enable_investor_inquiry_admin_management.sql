GRANT SELECT, INSERT, UPDATE, DELETE ON public.ir_inquiries TO authenticated;
GRANT ALL ON public.ir_inquiries TO service_role;
ALTER TABLE public.ir_inquiries ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.ir_inquiries ENABLE ROW LEVEL SECURITY;