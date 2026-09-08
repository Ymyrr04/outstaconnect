import { createServerFn } from "@tanstack/react-start";

export type ContentTotals = { views: number; engagements: number; shares: number };

/**
 * Public aggregate: content post views/engagements/shares per campaign influencer.
 * Totals only, no post details.
 */
export const getContentTotals = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("content_posts")
    .select("campaign_influencer_id, views, engagements, shares");
  if (error) throw error;
  const totals: Record<string, ContentTotals> = {};
  for (const row of data ?? []) {
    const key = row.campaign_influencer_id as string;
    const current = totals[key] ?? { views: 0, engagements: 0, shares: 0 };
    current.views += row.views ?? 0;
    current.engagements += row.engagements ?? 0;
    current.shares += row.shares ?? 0;
    totals[key] = current;
  }
  return totals;
});
