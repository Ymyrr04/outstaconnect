import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LandingPageBody,
  defaultLandingSettings,
  type LandingFormValues,
} from "@/components/LandingPageBody";
import { fetchLandingSettings } from "@/lib/landing-settings";

export const Route = createFileRoute("/lp/$slug")({
  head: () => ({
    meta: [
      { title: "Hire vetted remote talent, faster | OutSta" },
      {
        name: "description",
        content:
          "Tell us what you need and we'll match you with pre-vetted remote professionals, usually within one business day.",
      },
      { property: "og:title", content: "Hire vetted remote talent, faster | OutSta" },
      {
        property: "og:description",
        content: "Get matched with pre-vetted remote professionals for the roles you're hiring for.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const { slug } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["lp", slug],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("campaign_influencers")
          .select("id, influencer_handle")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch {
        toast.error("Couldn't load this page. Please try again.");
        return null;
      }
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["landing-settings"],
    queryFn: fetchLandingSettings,
  });

  const handleSubmit = async (form: LandingFormValues) => {
    if (!data) return false;
    try {
      const { error } = await supabase.from("leads").insert({
        campaign_influencer_id: data.id,
        full_name: form.fullName.trim(),
        work_email: form.workEmail.trim(),
        company_name: form.companyName.trim(),
        roles_hiring_for: form.roles.trim(),
        company_size: form.companySize,
        talent_preference: form.talent,
        phone: form.phone.trim() || null,
      });
      if (error) throw error;
      return true;
    } catch {
      toast.error("Something went wrong sending your details. Please try again.");
      return false;
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <p className="text-base text-slate-600">This link is no longer active</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <LandingPageBody
        settings={settings ?? defaultLandingSettings}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
