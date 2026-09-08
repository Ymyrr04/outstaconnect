CREATE OR REPLACE FUNCTION public.get_influencer_by_slug(_slug text)
RETURNS TABLE(id uuid, influencer_handle text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.campaign_influencers
  SET link_clicks = link_clicks + 1
  WHERE slug = _slug
  RETURNING campaign_influencers.id, campaign_influencers.influencer_handle;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_influencer_by_slug(text) TO anon, authenticated;