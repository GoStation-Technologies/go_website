CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  recipients text[] NOT NULL DEFAULT '{}',
  cc_recipients text[] NOT NULL DEFAULT '{}',
  from_name text NOT NULL DEFAULT 'GoStation',
  reply_to text,
  subject_prefix text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read notification settings"
ON public.notification_settings FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert notification settings"
ON public.notification_settings FOR INSERT TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update notification settings"
ON public.notification_settings FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER notification_settings_set_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.notification_settings (category, recipients, subject_prefix) VALUES
  ('franchise', '{}', '[Franchise]'),
  ('acquisition', '{}', '[Acquisition]'),
  ('contact', '{}', '[Contact]'),
  ('careers', '{}', '[Careers]'),
  ('investor', '{}', '[Investors]');