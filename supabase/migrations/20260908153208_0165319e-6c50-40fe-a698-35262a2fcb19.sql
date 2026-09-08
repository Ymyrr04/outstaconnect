CREATE TABLE public.campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE public.campaign_influencers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    influencer_handle text NOT NULL,
    content_type text NOT NULL,
    leads integer NOT NULL DEFAULT 0,
    cost_per_lead numeric NOT NULL DEFAULT 0,
    date_onboarded date,
    date_paid date,
    status text NOT NULL DEFAULT 'Pending',
    content_views integer NOT NULL DEFAULT 0,
    engagements integer NOT NULL DEFAULT 0,
    link_clicks integer NOT NULL DEFAULT 0,
    created_at timestamp NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_influencers TO authenticated;
GRANT ALL ON public.campaign_influencers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_influencers TO anon;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to campaigns" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to campaign_influencers" ON public.campaign_influencers FOR ALL USING (true) WITH CHECK (true);