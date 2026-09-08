import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog";
import { AddInfluencerDialog } from "@/components/AddInfluencerDialog";
import { toast } from "sonner";
import { Calendar, ChevronDown, ArrowRight, PlusCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OutSta — Influencer Campaign Tracker Dashboard" },
      {
        name: "description",
        content:
          "Track how your influencer content drives real leads and revenue with live campaign metrics, a traction funnel and per-influencer details.",
      },
      { property: "og:title", content: "OutSta — Influencer Campaign Tracker Dashboard" },
      {
        property: "og:description",
        content:
          "Live leads, cost per lead, potential revenue and a content-to-revenue traction funnel for your influencer campaigns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type Campaign = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

type Influencer = {
  id: string;
  campaign_id: string;
  influencer_handle: string;
  content_type: string;
  leads: number;
  cost_per_lead: number;
  date_onboarded: string | null;
  date_paid: string | null;
  status: string;
  content_views: number;
  engagements: number;
  link_clicks: number;
  created_at: string;
};

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const averageDate = (dates: (string | null)[]) => {
  const times = dates
    .filter((d): d is string => !!d)
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return "—";
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return formatDate(new Date(avg).toISOString());
};

async function fetchDashboard() {
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  if (campaignError) throw campaignError;

  const campaign = (campaigns?.[0] as Campaign | undefined) ?? null;
  if (!campaign) return { campaign: null, influencers: [] as Influencer[] };

  const { data: influencers, error: influencerError } = await supabase
    .from("campaign_influencers")
    .select("*")
    .eq("campaign_id", campaign.id)
    .order("date_onboarded", { ascending: true });
  if (influencerError) throw influencerError;

  return { campaign, influencers: (influencers ?? []) as Influencer[] };
}

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-emerald-100 text-emerald-700";
  if (s === "on track") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function Dashboard() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await fetchDashboard();
      } catch (error) {
        toast.error("Couldn't load your campaign data. Please try again.");
        throw error;
      }
    },
  });

  const campaign = data?.campaign ?? null;
  const rows = data?.influencers ?? [];

  const totalLeads = rows.reduce((sum, r) => sum + (r.leads ?? 0), 0);
  const costPerLead = rows.find((r) => r.cost_per_lead != null)?.cost_per_lead ?? 0;
  const revenue = rows.reduce((sum, r) => sum + (r.leads ?? 0) * (r.cost_per_lead ?? 0), 0);
  const views = rows.reduce((sum, r) => sum + (r.content_views ?? 0), 0);
  const engagements = rows.reduce((sum, r) => sum + (r.engagements ?? 0), 0);
  const clicks = rows.reduce((sum, r) => sum + (r.link_clicks ?? 0), 0);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <PlusCircle className="h-12 w-12 text-slate-300" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          No campaign found. Create one to get started.
        </h1>
        <div className="mt-6">
          <CreateCampaignDialog onCreated={refresh} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-20">
      <header className="border-b border-slate-200 bg-white px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">
              Influencer marketing campaign tracker
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Track how your influencer content drives real leads and revenue.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 md:self-auto">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-10 md:px-10">
        <section className="overflow-hidden rounded-xl border border-slate-200 md:grid md:grid-cols-5">
          {[
            { label: "Total Leads", value: totalLeads.toLocaleString() },
            { label: "Cost Per Lead", value: currency(costPerLead) },
            { label: "Potential Revenue Value", value: currency(revenue) },
            { label: "Date Onboarded (avg)", value: averageDate(rows.map((r) => r.date_onboarded)) },
            { label: "Date Paid (avg)", value: averageDate(rows.map((r) => r.date_paid)) },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center py-6 text-center ${
                index < 4 ? "border-b border-slate-200 md:border-b-0 md:border-r" : ""
              }`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Traction flow
          </p>
          <div className="mt-4 flex flex-col items-stretch gap-4 rounded-xl border border-slate-200 px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-2">
            {[
              { label: "Content Views", value: views.toLocaleString() },
              { label: "Engagements", value: engagements.toLocaleString() },
              { label: "Link Clicks", value: clicks.toLocaleString() },
              { label: "Leads", value: totalLeads.toLocaleString() },
              { label: "Revenue", value: currency(revenue) },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center gap-4 md:flex-col md:gap-1">
                {index > 0 && (
                  <ArrowRight className="hidden h-4 w-4 text-slate-300 md:block" />
                )}
                {index > 0 && (
                  <ArrowRight className="block h-4 w-4 rotate-90 text-slate-300 md:hidden" />
                )}
                <div className="flex flex-1 flex-col text-left md:text-center">
                  <p className="text-2xl font-semibold text-slate-900">{step.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Campaign details
            </p>
            <AddInfluencerDialog campaignId={campaign.id} onCreated={refresh} />
          </div>
          {rows.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 py-16 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No influencers added yet</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3 font-medium">Influencer</th>
                    <th className="px-6 py-3 font-medium">Content</th>
                    <th className="px-6 py-3 font-medium">Leads</th>
                    <th className="px-6 py-3 font-medium">Cost Per Lead</th>
                    <th className="px-6 py-3 font-medium">Potential Revenue Value</th>
                    <th className="px-6 py-3 font-medium">Date Onboarded</th>
                    <th className="px-6 py-3 font-medium">Date Paid</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={`${rowIndex < rows.length - 1 ? "border-b border-slate-100" : ""}`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {row.influencer_handle}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{row.content_type}</td>
                      <td className="px-6 py-4 text-slate-900">{row.leads.toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-600">{currency(row.cost_per_lead)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {currency(row.leads * row.cost_per_lead)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(row.date_onboarded)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(row.date_paid)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusPill(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
