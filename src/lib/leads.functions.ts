import { createServerFn } from "@tanstack/react-start";

/**
 * Public aggregate: number of submitted leads per campaign influencer.
 * Returns counts only (no lead PII), so it is safe for the public dashboard.
 */
export const getLeadCounts = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.from("leads").select("campaign_influencer_id");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = row.campaign_influencer_id as string;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
});
