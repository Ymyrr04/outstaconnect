import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  TrendingUp,
  Calendar,
  ChevronDown,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle,
  Camera,
  MousePointerClick,
  UserCheck,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
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

const initials = (handle: string) =>
  handle
    .replace(/^@/, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "?";

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

function StatCard({
  tint,
  badge,
  icon,
  label,
  value,
}: {
  tint: string;
  badge: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-2xl border border-black/5 p-5 ${tint}`}>
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${badge}`}>
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function FunnelStep({
  step,
  icon,
  color,
  label,
  value,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="relative">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${color}`}>
          {icon}
        </div>
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
          {step}
        </span>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-emerald-100 text-emerald-700";
  if (s === "on track") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

function Dashboard() {
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading dashboard…</p>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <PlusCircle className="h-12 w-12 text-slate-400" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          No campaign found. Create one to get started.
        </h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="w-full bg-[#0f2544] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-white" />
              <span className="text-lg font-semibold tracking-tight text-white">OutSta</span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
              Influencer marketing campaign tracker
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Track how your influencer content drives real leads and revenue.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-full bg-white/10 px-4 py-2 text-sm text-white md:self-auto">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
            </span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <section className="-mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            tint="bg-blue-50"
            badge="bg-blue-100"
            icon={<Users className="h-4 w-4 text-blue-600" />}
            label="Total Leads"
            value={totalLeads.toLocaleString()}
          />
          <StatCard
            tint="bg-emerald-50"
            badge="bg-emerald-100"
            icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            label="Cost Per Lead"
            value={currency(costPerLead)}
          />
          <StatCard
            tint="bg-purple-50"
            badge="bg-purple-100"
            icon={<BarChart3 className="h-4 w-4 text-purple-600" />}
            label="Potential Revenue Value"
            value={currency(revenue)}
          />
          <StatCard
            tint="bg-blue-50"
            badge="bg-blue-100"
            icon={<Calendar className="h-4 w-4 text-blue-600" />}
            label="Date Onboarded (avg)"
            value={averageDate(rows.map((r) => r.date_onboarded))}
          />
          <StatCard
            tint="bg-emerald-50"
            badge="bg-emerald-100"
            icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
            label="Date Paid (avg)"
            value={averageDate(rows.map((r) => r.date_paid))}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Campaign traction flow</h2>
          <p className="text-sm text-slate-500">From content to leads to revenue.</p>
          <div className="mt-8 flex flex-col items-center gap-6 md:flex-row md:gap-2">
            <FunnelStep
              step={1}
              color="bg-blue-100"
              icon={<Camera className="h-6 w-6 text-blue-600" />}
              label="Content Views"
              value={views.toLocaleString()}
              description="People who saw the content"
            />
            <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-slate-300 md:rotate-0" />
            <FunnelStep
              step={2}
              color="bg-purple-100"
              icon={<Users className="h-6 w-6 text-purple-600" />}
              label="Engagements"
              value={engagements.toLocaleString()}
              description="Likes, comments and shares"
            />
            <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-slate-300 md:rotate-0" />
            <FunnelStep
              step={3}
              color="bg-amber-100"
              icon={<MousePointerClick className="h-6 w-6 text-amber-600" />}
              label="Link Clicks"
              value={clicks.toLocaleString()}
              description="Clicks through to your site"
            />
            <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-slate-300 md:rotate-0" />
            <FunnelStep
              step={4}
              color="bg-emerald-100"
              icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
              label="Leads"
              value={totalLeads.toLocaleString()}
              description="Qualified sign-ups captured"
            />
            <ArrowRight className="h-5 w-5 shrink-0 rotate-90 text-slate-300 md:rotate-0" />
            <FunnelStep
              step={5}
              color="bg-teal-100"
              icon={<DollarSign className="h-6 w-6 text-teal-600" />}
              label="Revenue"
              value={currency(revenue)}
              description="Potential value of those leads"
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Campaign details</h2>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-600">No influencers added yet</p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-3 pr-4 font-medium">Influencer</th>
                    <th className="py-3 pr-4 font-medium">Content</th>
                    <th className="py-3 pr-4 font-medium">Leads</th>
                    <th className="py-3 pr-4 font-medium">Cost Per Lead</th>
                    <th className="py-3 pr-4 font-medium">Potential Revenue Value</th>
                    <th className="py-3 pr-4 font-medium">Date Onboarded</th>
                    <th className="py-3 pr-4 font-medium">Date Paid</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {initials(row.influencer_handle)}
                          </span>
                          <span className="font-medium text-slate-900">
                            {row.influencer_handle}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{row.content_type}</td>
                      <td className="py-4 pr-4 text-slate-900">{row.leads.toLocaleString()}</td>
                      <td className="py-4 pr-4 text-slate-600">{currency(row.cost_per_lead)}</td>
                      <td className="py-4 pr-4 font-medium text-slate-900">
                        {currency(row.leads * row.cost_per_lead)}
                      </td>
                      <td className="py-4 pr-4 text-slate-600">{formatDate(row.date_onboarded)}</td>
                      <td className="py-4 pr-4 text-slate-600">{formatDate(row.date_paid)}</td>
                      <td className="py-4 pr-4">
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
