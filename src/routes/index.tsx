import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Calendar,
  ChevronDown,
  ArrowRight,
  PlusCircle,
  Users,
  DollarSign,
  BarChart3,
  CheckCircle,
  Camera,
  MousePointerClick,
  UserCheck,
  FolderPlus,
  Link as LinkIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateCampaignDialog, type CampaignRecord } from "@/components/CreateCampaignDialog";
import { AddInfluencerDialog, type InfluencerRecord } from "@/components/AddInfluencerDialog";
import { supabase } from "@/integrations/supabase/client";
import { getLeadCounts } from "@/lib/leads.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OutSta — Influencer Campaign Tracker" },
      {
        name: "description",
        content:
          "Track how your influencer content drives real leads and revenue with live campaign metrics, a traction funnel and per-influencer details.",
      },
      { property: "og:title", content: "OutSta — Influencer Campaign Tracker" },
      {
        property: "og:description",
        content:
          "Live leads, cost per lead, potential revenue and a content-to-revenue traction funnel for your influencer campaigns.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppPage,
});

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

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-emerald-100 text-emerald-700";
  if (s === "on track") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

async function fetchAppData() {
  const { data: campaigns, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: true });
  if (campaignError) throw campaignError;

  const { data: influencers, error: influencerError } = await supabase
    .from("campaign_influencers")
    .select("*")
    .order("created_at", { ascending: true });
  if (influencerError) throw influencerError;

  return {
    campaigns: (campaigns ?? []) as CampaignRecord[],
    influencers: (influencers ?? []) as InfluencerRecord[],
  };
}

const stats = [
  { label: "Total Leads", icon: Users, iconBg: "bg-blue-50 text-blue-600" },
  { label: "Cost Per Lead", icon: DollarSign, iconBg: "bg-emerald-50 text-emerald-600" },
  { label: "Potential Revenue Value", icon: BarChart3, iconBg: "bg-violet-50 text-violet-600" },
  { label: "Date Onboarded (avg)", icon: Calendar, iconBg: "bg-blue-50 text-blue-600" },
  { label: "Date Paid (avg)", icon: CheckCircle, iconBg: "bg-emerald-50 text-emerald-600" },
];

const tractionSteps = [
  {
    label: "Content Views",
    description: "Total impressions",
    icon: Camera,
    color: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    label: "Engagements",
    description: "Likes, comments, shares",
    icon: Users,
    color: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    label: "Link Clicks",
    description: "Clicks to landing page",
    icon: MousePointerClick,
    color: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    label: "Leads",
    description: "Captured contacts",
    icon: UserCheck,
    color: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    label: "Revenue",
    description: "Estimated value",
    icon: DollarSign,
    color: "bg-rose-50 text-rose-600 ring-rose-100",
  },
];

const thClass = "py-3 pr-4 font-medium";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900";

function AppPage() {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["app-data"] });
  };

  const [activeTab, setActiveTab] = useState("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["app-data"],
    queryFn: async () => {
      try {
        return await fetchAppData();
      } catch (error) {
        toast.error("Couldn't load your campaign data. Please try again.");
        throw error;
      }
    },
  });

  const { data: leadCountsData } = useQuery({
    queryKey: ["app-data", "lead-counts"],
    queryFn: async () => {
      try {
        return await getLeadCounts();
      } catch {
        return {} as Record<string, number>;
      }
    },
  });

  const campaigns = data?.campaigns ?? [];
  const influencers = data?.influencers ?? [];
  const campaign = campaigns[0] ?? null;
  const rows = campaign ? influencers.filter((i) => i.campaign_id === campaign.id) : [];
  const leadCounts = leadCountsData ?? {};
  const rowLeads = (r: InfluencerRecord) => (r.leads ?? 0) + (leadCounts[r.id] ?? 0);

  const totalLeads = rows.reduce((sum, r) => sum + rowLeads(r), 0);
  const costPerLead = rows.find((r) => r.cost_per_lead != null)?.cost_per_lead ?? 0;
  const revenue = rows.reduce((sum, r) => sum + rowLeads(r) * (r.cost_per_lead ?? 0), 0);
  const views = rows.reduce((sum, r) => sum + (r.content_views ?? 0), 0);
  const engagements = rows.reduce((sum, r) => sum + (r.engagements ?? 0), 0);
  const clicks = rows.reduce((sum, r) => sum + (r.link_clicks ?? 0), 0);

  const statValues = [
    totalLeads.toLocaleString(),
    currency(costPerLead),
    currency(revenue),
    averageDate(rows.map((r) => r.date_onboarded)),
    averageDate(rows.map((r) => r.date_paid)),
  ];

  const tractionValues = [
    views.toLocaleString(),
    engagements.toLocaleString(),
    clicks.toLocaleString(),
    totalLeads.toLocaleString(),
    currency(revenue),
  ];

  const [campaignFilter, setCampaignFilter] = useState("all");
  const [editCampaign, setEditCampaign] = useState<CampaignRecord | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<CampaignRecord | null>(null);
  const [editInfluencer, setEditInfluencer] = useState<InfluencerRecord | null>(null);
  const [deleteInfluencer, setDeleteInfluencer] = useState<InfluencerRecord | null>(null);
  const [busy, setBusy] = useState(false);

  const campaignName = (id: string) => campaigns.find((c) => c.id === id)?.name ?? "—";

  const filteredInfluencers = useMemo(
    () =>
      campaignFilter === "all"
        ? influencers
        : influencers.filter((i) => i.campaign_id === campaignFilter),
    [influencers, campaignFilter],
  );

  const confirmDeleteCampaign = async () => {
    if (!deleteCampaign) return;
    setBusy(true);
    try {
      const { error: childError } = await supabase
        .from("campaign_influencers")
        .delete()
        .eq("campaign_id", deleteCampaign.id);
      if (childError) throw childError;
      const { error } = await supabase.from("campaigns").delete().eq("id", deleteCampaign.id);
      if (error) throw error;
      toast.success("Campaign deleted");
      setDeleteCampaign(null);
      refresh();
    } catch {
      toast.error("Couldn't delete the campaign. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDeleteInfluencer = async () => {
    if (!deleteInfluencer) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("campaign_influencers")
        .delete()
        .eq("id", deleteInfluencer.id);
      if (error) throw error;
      toast.success("Influencer deleted");
      setDeleteInfluencer(null);
      refresh();
    } catch {
      toast.error("Couldn't delete the influencer. Please try again.");
    } finally {
      setBusy(false);
    }
  };

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
          <div className="flex items-center gap-4">
            <Link
              to="/portal"
              className="text-sm text-slate-500 underline underline-offset-4 hover:text-slate-900"
            >
              Creator portal
            </Link>
            {campaign && (
              <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 md:self-auto">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>
                  {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-6">
          <TabsList className="bg-slate-50">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="influencers">Influencers</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {isLoading ? (
              <div className="py-20 text-center text-sm text-slate-500">Loading dashboard…</div>
            ) : !campaign ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <PlusCircle className="h-12 w-12 text-slate-300" />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">
                  No campaign found. Create one to get started.
                </h2>
                <div className="mt-6">
                  <CreateCampaignDialog onCreated={refresh} />
                </div>
              </div>
            ) : (
              <div className="space-y-12">
                <section className="overflow-hidden rounded-xl border border-slate-200 md:grid md:grid-cols-5">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className={`flex flex-col items-center justify-center gap-3 py-6 text-center ${
                          index < 4 ? "border-b border-slate-200 md:border-b-0 md:border-r" : ""
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.iconBg}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                            {stat.label}
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-slate-900">
                            {statValues[index]}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </section>

                <section>
                  <div className="mb-4">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Traction flow
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      From content to leads to revenue.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-6 py-8">
                    <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:justify-between">
                      {tractionSteps.map((step, index) => {
                        const Icon = step.icon;
                        const isLast = index === tractionSteps.length - 1;
                        return (
                          <div key={step.label} className="flex flex-1 items-center gap-4">
                            <div className="flex flex-1 items-center gap-4 md:flex-col md:text-center">
                              <div className="relative">
                                <div
                                  className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 ${step.color}`}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex flex-col text-left md:items-center md:text-center">
                                <p className="text-2xl font-semibold text-slate-900">
                                  {tractionValues[index]}
                                </p>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                                  {step.label}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                            {!isLast && (
                              <div className="flex items-center justify-center md:w-8">
                                <ArrowRight className="hidden h-5 w-5 text-slate-400 md:block" />
                                <ArrowRight className="block h-5 w-5 rotate-90 text-slate-400 md:hidden" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      Campaign details
                    </p>
                    <AddInfluencerDialog campaignId={campaign.id} onCreated={refresh} />
                  </div>
                  {rows.length === 0 ? (
                    <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 py-16 text-center">
                      <Users className="h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-600">
                        No influencers added yet
                      </p>
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
                              className={`${
                                rowIndex < rows.length - 1 ? "border-b border-slate-100" : ""
                              }`}
                            >
                              <td className="px-6 py-4 font-medium text-slate-900">
                                {row.influencer_handle}
                              </td>
                              <td className="px-6 py-4 text-slate-600">{row.content_type}</td>
                              <td className="px-6 py-4 text-slate-900">
                                {rowLeads(row).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {currency(row.cost_per_lead)}
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-900">
                                {currency(rowLeads(row) * row.cost_per_lead)}
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {formatDate(row.date_onboarded)}
                              </td>
                              <td className="px-6 py-4 text-slate-600">
                                {formatDate(row.date_paid)}
                              </td>
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
            )}
          </TabsContent>

          <TabsContent value="campaigns">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Campaigns</h2>
                <CreateCampaignDialog
                  onCreated={refresh}
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New campaign
                    </Button>
                  }
                />
              </div>
              {isLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FolderPlus className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No campaigns yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className={thClass}>Campaign Name</th>
                        <th className={thClass}>Date Range</th>
                        <th className={thClass}>Influencers</th>
                        <th className={thClass}>Total Leads</th>
                        <th className={thClass}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c) => {
                        const rowsForCampaign = influencers.filter((i) => i.campaign_id === c.id);
                        const leads = rowsForCampaign.reduce((sum, r) => sum + rowLeads(r), 0);
                        return (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-4 pr-4 font-medium text-slate-900">{c.name}</td>
                            <td className="py-4 pr-4 text-slate-600">
                              {formatDate(c.start_date)} – {formatDate(c.end_date)}
                            </td>
                            <td className="py-4 pr-4 text-slate-900">{rowsForCampaign.length}</td>
                            <td className="py-4 pr-4 text-slate-900">{leads.toLocaleString()}</td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`Edit ${c.name}`}
                                  className={iconBtn}
                                  onClick={() => setEditCampaign(c)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Delete ${c.name}`}
                                  className={`${iconBtn} hover:text-red-600`}
                                  onClick={() => setDeleteCampaign(c)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="influencers">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Influencers</h2>
                <div className="max-w-xs">
                  <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All campaigns</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isLoading ? (
                <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
              ) : filteredInfluencers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">No influencers yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className={thClass}>Influencer Handle</th>
                        <th className={thClass}>Campaign Name</th>
                        <th className={thClass}>Content Type</th>
                        <th className={thClass}>Leads</th>
                        <th className={thClass}>Status</th>
                        <th className={thClass}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInfluencers.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-4 pr-4 font-medium text-slate-900">
                            {row.influencer_handle}
                          </td>
                          <td className="py-4 pr-4 text-slate-600">
                            {campaignName(row.campaign_id)}
                          </td>
                          <td className="py-4 pr-4 text-slate-600">{row.content_type}</td>
                          <td className="py-4 pr-4 text-slate-900">
                            {rowLeads(row).toLocaleString()}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusPill(row.status)}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Copy landing page link for ${row.influencer_handle}`}
                                title="Copy link"
                                className={iconBtn}
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(
                                      `${window.location.origin}/lp/${row.slug}`,
                                    );
                                    toast.success("Link copied");
                                  } catch {
                                    toast.error("Couldn't copy the link. Please try again.");
                                  }
                                }}
                              >
                                <LinkIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Edit ${row.influencer_handle}`}
                                className={iconBtn}
                                onClick={() => setEditInfluencer(row)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${row.influencer_handle}`}
                                className={`${iconBtn} hover:text-red-600`}
                                onClick={() => setDeleteInfluencer(row)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>

      {editCampaign && (
        <CreateCampaignDialog
          key={editCampaign.id}
          campaign={editCampaign}
          trigger={null}
          open
          onOpenChange={(next) => {
            if (!next) setEditCampaign(null);
          }}
          onCreated={refresh}
        />
      )}

      {editInfluencer && (
        <AddInfluencerDialog
          key={editInfluencer.id}
          campaignId={editInfluencer.campaign_id}
          influencer={editInfluencer}
          trigger={null}
          open
          onOpenChange={(next) => {
            if (!next) setEditInfluencer(null);
          }}
          onCreated={refresh}
        />
      )}

      <AlertDialog
        open={!!deleteCampaign}
        onOpenChange={(next) => {
          if (!next) setDeleteCampaign(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteCampaign?.name}? This will also delete all its
              influencer records. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteCampaign();
              }}
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteInfluencer}
        onOpenChange={(next) => {
          if (!next) setDeleteInfluencer(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete influencer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this influencer record? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDeleteInfluencer();
              }}
            >
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
