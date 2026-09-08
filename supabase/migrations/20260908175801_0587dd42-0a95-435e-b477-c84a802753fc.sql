ALTER TABLE public.campaign_influencers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS campaign_influencers_user_id_idx ON public.campaign_influencers(user_id);
CREATE INDEX IF NOT EXISTS campaign_influencers_email_idx ON public.campaign_influencers(lower(email));

CREATE OR REPLACE FUNCTION public.claim_influencer_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  _count integer := 0;
BEGIN
  IF _uid IS NULL OR _email = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.campaign_influencers
     SET user_id = _uid
   WHERE user_id IS NULL
     AND lower(coalesce(email, '')) = _email;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_influencer_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_influencer_access() TO authenticated;