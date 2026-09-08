CREATE TABLE public.landing_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton),
  headline text NOT NULL DEFAULT 'Hire vetted remote talent, faster',
  subheadline text NOT NULL DEFAULT 'Tell us what you need — we''ll match you with pre-vetted remote professionals.',
  button_label text NOT NULL DEFAULT 'Get matched',
  success_message text NOT NULL DEFAULT 'Thanks! We''ll be in touch within 1 business day.',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.landing_page_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.landing_page_settings TO authenticated;
GRANT ALL ON public.landing_page_settings TO service_role;

ALTER TABLE public.landing_page_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read landing page settings" ON public.landing_page_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert landing page settings" ON public.landing_page_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update landing page settings" ON public.landing_page_settings FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO public.landing_page_settings (singleton) VALUES (true);