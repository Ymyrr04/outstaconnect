ALTER TABLE public.campaign_influencers
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS primary_email text;

CREATE UNIQUE INDEX IF NOT EXISTS campaign_influencers_username_lower_idx
  ON public.campaign_influencers (lower(username))
  WHERE username IS NOT NULL AND btrim(username) <> '';

CREATE OR REPLACE FUNCTION public.username_available(_username text, _self uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    WHERE lower(ci.username) = lower(btrim(_username))
      AND (_self IS NULL OR ci.id <> _self)
  )
$$;

GRANT EXECUTE ON FUNCTION public.username_available(text, uuid) TO authenticated;