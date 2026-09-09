ALTER TABLE public.campaign_influencers
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'influencer';

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  handle text NOT NULL,
  email text NOT NULL,
  phone text,
  account_type text NOT NULL DEFAULT 'influencer',
  message text,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can apply" ON public.applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read applications" ON public.applications
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can update applications" ON public.applications
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete applications" ON public.applications
  FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();