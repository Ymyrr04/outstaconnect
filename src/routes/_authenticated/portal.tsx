import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { LogOut, Pencil, Trash2, Plus } from "lucide-react";
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

type ContentPost = {
  id: string;
  campaign_influencer_id: string;
  post_url: string;
  views: number;
  engagements: number;
  shares: number;
  created_at: string;
};

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

  const influencerIds = rows.map((r) => r.id);
  const primaryInfluencerId = influencerIds[0] ?? null;

  const postsQuery = useQuery({
    queryKey: ["portal", "content-posts", influencerIds.join(",")],
    enabled: influencerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_posts")
        .select("*")
        .in("campaign_influencer_id", influencerIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContentPost[];
    },
  });

  useEffect(() => {
    if (postsQuery.isError) toast.error("Couldn't load your content. Please try again.");
  }, [postsQuery.isError]);

  const posts = postsQuery.data ?? [];
  const contentTotals = posts.reduce(
    (acc, p) => ({
      views: acc.views + (p.views ?? 0),
      engagements: acc.engagements + (p.engagements ?? 0),
      shares: acc.shares + (p.shares ?? 0),
    }),
    { views: 0, engagements: 0, shares: 0 },
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const [deleting, setDeleting] = useState<ContentPost | null>(null);
  const [form, setForm] = useState({ post_url: "", views: "0", engagements: "0", shares: "0" });
  const [formError, setFormError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const refreshContent = () =>
    queryClient.invalidateQueries({ queryKey: ["portal", "content-posts"] });

  const openAdd = () => {
    setEditing(null);
    setForm({ post_url: "", views: "0", engagements: "0", shares: "0" });
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (post: ContentPost) => {
    setEditing(post);
    setForm({
      post_url: post.post_url,
      views: String(post.views ?? 0),
      engagements: String(post.engagements ?? 0),
      shares: String(post.shares ?? 0),
    });
    setFormError("");
    setFormOpen(true);
  };

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = form.post_url.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(url)) {
      setFormError("Enter a valid link starting with http:// or https://");
      return;
    }
    if (!editing && !primaryInfluencerId) return;
    setSaving(true);
    try {
      const values = {
        post_url: url,
        views: Number(form.views) || 0,
        engagements: Number(form.engagements) || 0,
        shares: Number(form.shares) || 0,
      };
      if (editing) {
        const { error } = await supabase
          .from("content_posts")
          .update(values)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Content updated");
      } else {
        const { error } = await supabase
          .from("content_posts")
          .insert({ ...values, campaign_influencer_id: primaryInfluencerId! });
        if (error) throw error;
        toast.success("Content added");
      }
      setFormOpen(false);
      refreshContent();
    } catch {
      toast.error("Couldn't save your content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("content_posts").delete().eq("id", deleting.id);
      if (error) throw error;
      toast.success("Content deleted");
      setDeleting(null);
      refreshContent();
    } catch {
      toast.error("Couldn't delete this content. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
      <header className="bg-[#0ABEDF]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              {/* Replace the placeholder <div> below with an <img src="/logo.png" alt="OutSta logo" className="h-8 w-auto" /> */}
              <div className="h-8 w-8 min-w-[2rem] rounded bg-gray-200" />
              <span className="text-sm font-semibold tracking-tight text-white">OutSta</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold tracking-tight text-white">My results</h1>
            <p className="text-sm text-white/80">{email || "Your creator account"}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-[#066F85] text-white hover:border-[#0899B5] hover:bg-[#0899B5]"
            onClick={signOut}
          >
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
              {stats.map((s) => {
                const isLeads = s.label === "Leads";
                return (
                  <div
                    key={s.label}
                    className={`px-6 py-6 ${isLeads ? "bg-[#0ABEDF]" : "border-l-4 border-l-[#0ABEDF]"}`}
                  >
                    <p
                      className={`text-[11px] uppercase tracking-wider ${isLeads ? "text-white/80" : "text-slate-400"}`}
                    >
                      {s.label}
                    </p>
                    <p
                      className={`mt-2 text-2xl font-semibold tracking-tight ${isLeads ? "text-white" : "text-slate-900"}`}
                    >
                      {s.value}
                    </p>
                  </div>
                );
              })}
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

            <section className="mt-14">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Your content</p>
                <Button
                  size="sm"
                  className="gap-2 bg-[#0ABEDF] text-white hover:bg-[#0899B5]"
                  onClick={openAdd}
                >
                  <Plus className="h-4 w-4" />
                  Add content
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-1 divide-slate-200 rounded-md border border-[#0ABEDF] sm:grid-cols-3 sm:divide-x">
                {[
                  { n: "01", label: "Total views", value: contentTotals.views },
                  { n: "02", label: "Total engagements", value: contentTotals.engagements },
                  { n: "03", label: "Total shares", value: contentTotals.shares },
                ].map((s) => (
                  <div key={s.label} className="px-6 py-6">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400">
                      <span className="rounded bg-[#E0F7FC] px-1.5 py-0.5 text-[#066F85]">
                        {s.n}
                      </span>
                      {" · "}
                      {s.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {s.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {posts.length === 0 ? (
                <div className="mt-4 rounded-md border border-slate-200 p-10 text-center">
                  <p className="text-sm font-medium text-slate-900">No content added yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Use “Add content” to submit the link to your first post and its numbers.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-400">
                        <th className="py-3 pr-4 font-medium">Post link</th>
                        <th className="py-3 pr-4 font-medium">Views</th>
                        <th className="py-3 pr-4 font-medium">Engagements</th>
                        <th className="py-3 pr-4 font-medium">Shares</th>
                        <th className="py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((p) => (
                        <tr key={p.id} className="border-b border-slate-100">
                          <td className="max-w-xs truncate py-4 pr-4">
                            <a
                              href={p.post_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-slate-900 underline underline-offset-4"
                            >
                              {p.post_url}
                            </a>
                          </td>
                          <td className="py-4 pr-4 text-slate-600">
                            {(p.views ?? 0).toLocaleString()}
                          </td>
                          <td className="py-4 pr-4 text-slate-600">
                            {(p.engagements ?? 0).toLocaleString()}
                          </td>
                          <td className="py-4 pr-4 text-slate-600">
                            {(p.shares ?? 0).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label="Edit content post"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Delete content post"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                                onClick={() => setDeleting(p)}
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

            <Dialog open={formOpen} onOpenChange={setFormOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit content" : "Add content"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submitPost} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="post-url">Post link</Label>
                    <Input
                      id="post-url"
                      type="url"
                      placeholder="https://instagram.com/p/…"
                      value={form.post_url}
                      onChange={(e) => setForm({ ...form, post_url: e.target.value })}
                    />
                    {formError && <p className="text-xs text-destructive">{formError}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="post-views">Views</Label>
                      <Input
                        id="post-views"
                        type="number"
                        min={0}
                        value={form.views}
                        onChange={(e) => setForm({ ...form, views: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="post-engagements">Engagements</Label>
                      <Input
                        id="post-engagements"
                        type="number"
                        min={0}
                        value={form.engagements}
                        onChange={(e) => setForm({ ...form, engagements: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="post-shares">Shares</Label>
                      <Input
                        id="post-shares"
                        type="number"
                        min={0}
                        value={form.shares}
                        onChange={(e) => setForm({ ...form, shares: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving…" : editing ? "Save changes" : "Add content"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this content post?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} disabled={saving}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>

        )}
      </main>
    </div>
  );
}
