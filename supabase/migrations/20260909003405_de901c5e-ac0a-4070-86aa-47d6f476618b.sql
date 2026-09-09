-- claim_influencer_access only runs after a user is signed in; authenticated RLS already permits the needed SELECT/UPDATE.
-- Switch it to SECURITY INVOKER so it no longer executes with elevated privileges.
CREATE OR REPLACE FUNCTION public.claim_influencer_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
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
$function$;

-- username_available only runs for signed-in users; authenticated SELECT policy covers it.
CREATE OR REPLACE FUNCTION public.username_available(_username text, _self uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    WHERE lower(ci.username) = lower(btrim(_username))
      AND (_self IS NULL OR ci.id <> _self)
  )
$function$;

-- get_public_influencer is no longer used by the app; remove it.
DROP FUNCTION IF EXISTS public.get_public_influencer(_slug text);

-- Tighten execute grants: only signed-in users need claim/username_available.
REVOKE EXECUTE ON FUNCTION public.claim_influencer_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_influencer_access() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.username_available(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.username_available(text, uuid) TO authenticated;

-- get_influencer_by_slug is intentionally public-facing so anonymous landing-page visitors can increment link clicks safely.
GRANT EXECUTE ON FUNCTION public.get_influencer_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_influencer_by_slug(text) TO authenticated;