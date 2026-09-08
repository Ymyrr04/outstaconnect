-- slug column on campaign_influencers
CREATE OR REPLACE FUNCTION public.slugify_handle(_handle text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT trim(both '-' from regexp_replace(lower(regexp_replace(coalesce(_handle,''), '@', '', 'g')), '[^a-z0-9]+', '-', 'g'))
$$;

ALTER TABLE public.campaign_influencers ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.campaign_influencers ci
SET slug = base.s || CASE WHEN base.rn = 1 THEN '' ELSE '-' || base.rn::text END
FROM (
  SELECT id,
         COALESCE(NULLIF(public.slugify_handle(influencer_handle), ''), 'influencer') AS s,
         row_number() OVER (PARTITION BY COALESCE(NULLIF(public.slugify_handle(influencer_handle), ''), 'influencer') ORDER BY created_at, id) AS rn
  FROM public.campaign_influencers
) base
WHERE ci.id = base.id AND ci.slug IS NULL;

ALTER TABLE public.campaign_influencers ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_influencers_slug_key ON public.campaign_influencers (slug);

CREATE OR REPLACE FUNCTION public.set_influencer_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := COALESCE(NULLIF(public.slugify_handle(NEW.influencer_handle), ''), 'influencer-' || left(replace(gen_random_uuid()::text,'-',''), 8));
  ELSE
    NEW.slug := COALESCE(NULLIF(public.slugify_handle(NEW.slug), ''), NEW.slug);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaign_influencers_set_slug ON public.campaign_influencers;
CREATE TRIGGER campaign_influencers_set_slug
BEFORE INSERT OR UPDATE ON public.campaign_influencers
FOR EACH ROW EXECUTE FUNCTION public.set_influencer_slug();

-- leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_influencer_id uuid NOT NULL REFERENCES public.campaign_influencers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  work_email text NOT NULL,
  company_name text NOT NULL,
  roles_hiring_for text NOT NULL,
  company_size text NOT NULL CHECK (company_size IN ('1-10','11-50','51-200','200+')),
  talent_preference text NOT NULL CHECK (talent_preference IN ('English only','Bilingual - Spanish & English')),
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can read leads" ON public.leads FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS leads_campaign_influencer_id_idx ON public.leads (campaign_influencer_id);
