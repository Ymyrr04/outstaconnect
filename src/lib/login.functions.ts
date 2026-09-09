import { createServerFn } from "@tanstack/react-start";

/**
 * Turns a username into the login email behind it so creators can sign in
 * with either. Emails are passed straight through.
 */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { identifier: string }) => data)
  .handler(async ({ data }) => {
    const identifier = (data.identifier ?? "").trim();
    if (!identifier) return { email: null as string | null };
    if (identifier.includes("@")) return { email: identifier.toLowerCase() };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("campaign_influencers")
      .select("email")
      .ilike("username", identifier)
      .not("email", "is", null)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return { email: (row?.email as string | null) ?? null };
  });
