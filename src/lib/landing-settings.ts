import { supabase } from "@/integrations/supabase/client";
import {
  defaultLandingSettings,
  type LandingSettings,
} from "@/components/LandingPageBody";

export async function fetchLandingSettings(): Promise<LandingSettings> {
  const { data, error } = await supabase
    .from("landing_page_settings")
    .select("headline, subheadline, button_label, success_message")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? defaultLandingSettings;
}

export async function saveLandingSettings(values: LandingSettings) {
  const { data, error } = await supabase
    .from("landing_page_settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (data?.id) {
    const { error: updateError } = await supabase
      .from("landing_page_settings")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase
    .from("landing_page_settings")
    .insert({ ...values });
  if (insertError) throw insertError;
}
