CREATE TABLE public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_influencer_id uuid NOT NULL REFERENCES public.campaign_influencers(id) ON DELETE CASCADE,
  post_url text NOT NULL,
  views integer NOT NULL DEFAULT 0,
  engagements integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_posts TO authenticated;
GRANT ALL ON public.content_posts TO service_role;

CREATE INDEX content_posts_influencer_idx ON public.content_posts (campaign_influencer_id);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage their own content posts"
ON public.content_posts
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    WHERE ci.id = content_posts.campaign_influencer_id
      AND ci.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.campaign_influencers ci
    WHERE ci.id = content_posts.campaign_influencer_id
      AND ci.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated can read all content posts"
ON public.content_posts
FOR SELECT
TO authenticated
USING (true);