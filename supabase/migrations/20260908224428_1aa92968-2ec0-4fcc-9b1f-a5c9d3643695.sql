-- Remove open access
DROP POLICY IF EXISTS "Allow full access to campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow full access to campaign_influencers" ON public.campaign_influencers;

REVOKE ALL ON public.campaigns FROM anon;
REVOKE ALL ON public.campaign_influencers FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_influencers TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
GRANT ALL ON public.campaign_influencers TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read campaigns" ON public.campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert campaigns" ON public.campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update campaigns" ON public.campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete campaigns" ON public.campaigns FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can read influencers" ON public.campaign_influencers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert influencers" ON public.campaign_influencers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update influencers" ON public.campaign_influencers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete influencers" ON public.campaign_influencers FOR DELETE TO authenticated USING (true);

-- Public landing page lookup: exposes only id, influencer_handle, slug
CREATE OR REPLACE FUNCTION public.get_public_influencer(_slug text)
RETURNS TABLE (id uuid, influencer_handle text, slug text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ci.id, ci.influencer_handle, ci.slug
  FROM public.campaign_influencers ci
  WHERE ci.slug = _slug
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.get_public_influencer(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_influencer(text) TO anon, authenticated;