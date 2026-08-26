CREATE TABLE public.otp_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  label text,
  fixed_code text,
  mode text NOT NULL DEFAULT 'fixed' CHECK (mode IN ('fixed','sms')),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT otp_whitelist_fixed_code_format CHECK (fixed_code IS NULL OR fixed_code ~ '^[0-9]{6}$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_whitelist TO authenticated;
GRANT ALL ON public.otp_whitelist TO service_role;

ALTER TABLE public.otp_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage otp whitelist"
ON public.otp_whitelist FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE TRIGGER otp_whitelist_set_updated_at
BEFORE UPDATE ON public.otp_whitelist
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.otp_whitelist (phone, label, fixed_code, mode, is_active)
VALUES ('966508527863', 'awab.yahia@gostation.net', '484690', 'fixed', true)
ON CONFLICT (phone) DO NOTHING;