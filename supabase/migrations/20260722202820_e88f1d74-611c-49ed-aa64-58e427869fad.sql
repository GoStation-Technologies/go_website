
ALTER TABLE public.franchise_applications ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.acquisition_requests   ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE public.contact_messages       ADD COLUMN IF NOT EXISTS assigned_to uuid;

CREATE INDEX IF NOT EXISTS franchise_applications_assigned_to_idx ON public.franchise_applications(assigned_to);
CREATE INDEX IF NOT EXISTS acquisition_requests_assigned_to_idx   ON public.acquisition_requests(assigned_to);
CREATE INDEX IF NOT EXISTS contact_messages_assigned_to_idx       ON public.contact_messages(assigned_to);
