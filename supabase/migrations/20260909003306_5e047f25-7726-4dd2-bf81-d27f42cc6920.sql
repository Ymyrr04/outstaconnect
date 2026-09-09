-- Add pipeline stage tracking columns to leads
ALTER TABLE public.leads
  ADD COLUMN stage text NOT NULL DEFAULT 'New'
    CHECK (stage IN ('New','Contacted','Qualified','Matched','Won','Lost')),
  ADD COLUMN hire_start_date date;

-- Allow authenticated users to update lead rows (required for the new UPDATE policy)
GRANT UPDATE ON public.leads TO authenticated;

-- RLS policy: authenticated users can update any lead
CREATE POLICY "Authenticated can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger function: when a lead becomes "Won" with a hire start date, update the influencer
CREATE OR REPLACE FUNCTION public.sync_lead_won_to_influencer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.stage = 'Won' AND NEW.hire_start_date IS NOT NULL THEN
    UPDATE public.campaign_influencers
    SET status = 'On Track',
        date_paid = NEW.hire_start_date + interval '30 days'
    WHERE id = NEW.campaign_influencer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to leads
CREATE TRIGGER sync_lead_won_to_influencer
  AFTER UPDATE ON public.leads
  FOR EACH ROW
  WHEN (
    NEW.stage = 'Won'
    AND NEW.hire_start_date IS NOT NULL
    AND (OLD.stage IS DISTINCT FROM NEW.stage OR OLD.hire_start_date IS DISTINCT FROM NEW.hire_start_date)
  )
  EXECUTE FUNCTION public.sync_lead_won_to_influencer();