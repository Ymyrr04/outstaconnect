-- Revoke anon access on the two internal tables
REVOKE ALL ON public.campaigns FROM anon;
REVOKE ALL ON public.campaign_influencers FROM anon;

-- Drop the old permissive policies if they still exist
DROP POLICY IF EXISTS "Allow full access" ON public.campaigns;
DROP POLICY IF EXISTS "Allow full access" ON public.campaign_influencers;

-- Ensure authenticated-only policies on campaigns
DROP POLICY IF EXISTS "Authenticated can read campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Authenticated can delete campaigns" ON public.campaigns;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert campaigns" ON public.campaigns
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete campaigns" ON public.campaigns
  FOR DELETE TO authenticated USING (true);

-- Ensure authenticated-only policies on campaign_influencers
DROP POLICY IF EXISTS "Authenticated can read influencers" ON public.campaign_influencers;
DROP POLICY IF EXISTS "Authenticated can insert influencers" ON public.campaign_influencers;
DROP POLICY IF EXISTS "Authenticated can update influencers" ON public.campaign_influencers;
DROP POLICY IF EXISTS "Authenticated can delete influencers" ON public.campaign_influencers;

ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read influencers" ON public.campaign_influencers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert influencers" ON public.campaign_influencers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update influencers" ON public.campaign_influencers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete influencers" ON public.campaign_influencers
  FOR DELETE TO authenticated USING (true);

-- Public RPC for the landing page (only returns id + handle, no campaign details)
CREATE OR REPLACE FUNCTION public.get_influencer_by_slug(_slug text)
RETURNS TABLE(id uuid, influencer_handle text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ci.id, ci.influencer_handle
  FROM public.campaign_influencers ci
  WHERE ci.slug = _slug
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_influencer_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_influencer_by_slug(text) TO authenticated;