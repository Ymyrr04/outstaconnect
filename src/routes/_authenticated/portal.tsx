import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TrendingUp, LogOut, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { supabase } from "@/integrations/supabase/client";
import { getLeadCounts } from "@/lib/leads.functions";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { title: "My results — OutSta creator portal" },
      {
        name: "description",
        content: "Your campaign results: views, engagements, link clicks, leads and payment status.",
      },
      { property: "og:title", content: "My results — OutSta creator portal" },
      {
        property: "og:description",
        content: "Your campaign results: views, engagements, link clicks, leads and payment status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalPage,
});

type Row = {
  id: string;
  influencer_handle: string;
  content_type: string;
  leads: number;
  cost_per_lead: number;
  status: string;
  date_paid: string | null;
  content_views: number;
  engagements: number;
  link_clicks: number;
  campaigns: { name: string } | null;
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const statusClass = (status: string) =>
  status === "Paid"
    ? "bg-emerald-50 text-emerald-700"
    : status === "On Track"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";

function PortalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeadCounts = useServerFn(getLeadCounts);
  const [email, setEmail] = useState<string>("");

  const rowsQuery = useQuery({
    queryKey: ["portal", "rows"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      setEmail(user?.email ?? "");
      // Match any records created for this creator's email address.
      await supabase.rpc("claim_influencer_access");
      const { data, error } = await supabase
        .from("campaign_influencers")
        .select(
          "id, influencer_handle, content_type, leads, cost_per_lead, status, date_paid, content_views, engagements, link_clicks, campaigns(name)",
        )
        .eq("user_id", user?.id ?? "")
        .order("date_onboarded", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const leadCountsQuery = useQuery({
    queryKey: ["portal", "lead-counts"],
    queryFn: async () => (await fetchLeadCounts()) as Record<string, number>,
  });

  useEffect(() => {
    if (rowsQuery.isError) toast.error("Couldn't load your results. Please try again.");
  }, [rowsQuery.isError]);

  const rows = rowsQuery.data ?? [];
  const counts = leadCountsQuery.data ?? {};
  const leadsFor = (r: Row) => (r.leads ?? 0) + (counts[r.id] ?? 0);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        const leads = leadsFor(r);
        acc.views += r.content_views ?? 0;
        acc.engagements += r.engagements ?? 0;
        acc.clicks += r.link_clicks ?? 0;
        acc.leads += leads;
        acc.revenue += leads * (Number(r.cost_per_lead) || 0);
        return acc;
      },
      { views: 0, engagements: 0, clicks: 0, leads: 0, revenue: 0 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, counts]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const stats = [
    { label: "Content views", value: totals.views.toLocaleString() },
    { label: "Engagements", value: totals.engagements.toLocaleString() },
    { label: "Link clicks", value: totals.clicks.toLocaleString() },
    { label: "Leads", value: totals.leads.toLocaleString() },
    { label: "Earnings value", value: money(totals.revenue) },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-900" />
              <span className="text-sm font-semibold tracking-tight text-slate-900">OutSta</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">My results</h1>
            <p className="text-sm text-slate-500">{email || "Your creator account"}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {rowsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading your results…</p>
        ) : rows.length === 0 ? (
          <div className="rounded-md border border-slate-200 p-10 text-center">
            <p className="text-sm font-medium text-slate-900">No results linked to your account yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Ask the campaign team to add {email || "your email address"} to your creator record,
              then refresh this page.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 divide-slate-200 rounded-md border border-slate-200 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x">
              {stats.map((s) => (
                <div key={s.label} className="px-6 py-6">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">{s.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-12 text-[11px] uppercase tracking-wider text-slate-400">
              My content
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-4 font-medium">Campaign</th>
                    <th className="py-3 pr-4 font-medium">Content</th>
                    <th className="py-3 pr-4 font-medium">Views</th>
                    <th className="py-3 pr-4 font-medium">Clicks</th>
                    <th className="py-3 pr-4 font-medium">Leads</th>
                    <th className="py-3 pr-4 font-medium">Value</th>
                    <th className="py-3 pr-4 font-medium">Date paid</th>
                    <th className="py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const leads = leadsFor(r);
                    return (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="py-4 pr-4 text-slate-900">{r.campaigns?.name ?? "—"}</td>
                        <td className="py-4 pr-4 text-slate-600">{r.content_type}</td>
                        <td className="py-4 pr-4 text-slate-600">
                          {(r.content_views ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 pr-4 text-slate-600">
                          {(r.link_clicks ?? 0).toLocaleString()}
                        </td>
                        <td className="py-4 pr-4 text-slate-900">{leads}</td>
                        <td className="py-4 pr-4 text-slate-900">
                          {money(leads * (Number(r.cost_per_lead) || 0))}
                        </td>
                        <td className="py-4 pr-4 text-slate-600">{r.date_paid ?? "—"}</td>
                        <td className="py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
