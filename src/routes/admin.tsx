import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FolderPlus, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { CreateCampaignDialog } from "@/components/CreateCampaignDialog";
import { AddInfluencerDialog, type InfluencerRecord } from "@/components/AddInfluencerDialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Manage Campaigns & Influencers | OutSta" },
      {
        name: "description",
        content:
          "Manage your influencer marketing campaigns and creator records: edit, delete and create campaigns and influencers in one place.",
      },
      { property: "og:title", content: "Admin — Manage Campaigns & Influencers | OutSta" },
      {
        property: "og:description",
        content: "Edit, delete and create campaigns and influencer records for OutSta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Campaign = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
};

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function statusPill(status: string) {
  const s = status.toLowerCase();
  if (s === "paid") return "bg-emerald-100 text-emerald-700";
  if (s === "on track") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

async function fetchAdminData() {
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
    campaigns: (campaigns ?? []) as Campaign[],
    influencers: (influencers ?? []) as InfluencerRecord[],
  };
}

const thClass = "py-3 pr-4 font-medium";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900";

function AdminPage() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const { data, isLoading } = useQuery({
    queryKey: ["admin"],
    queryFn: async () => {
      try {
        return await fetchAdminData();
      } catch (error) {
        toast.error("Couldn't load your records. Please try again.");
        throw error;
      }
    },
  });

  const campaigns = data?.campaigns ?? [];
  const influencers = data?.influencers ?? [];

  const [campaignFilter, setCampaignFilter] = useState("all");
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
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
    <main className="min-h-screen bg-slate-50 pb-16">
      <header className="w-full bg-[#0f2544] px-6 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Admin</h1>
            <p className="mt-1 text-sm text-slate-300">Manage campaigns and influencers.</p>
          </div>
          <CreateCampaignDialog
            onCreated={refresh}
            trigger={
              <Button className="gap-2 self-start md:self-auto">
                <Plus className="h-4 w-4" />
                New campaign
              </Button>
            }
          />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Tabs defaultValue="campaigns" className="-mt-6">
          <TabsList className="bg-white shadow-sm">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="influencers">Influencers</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
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
                        const rows = influencers.filter((i) => i.campaign_id === c.id);
                        const leads = rows.reduce((sum, r) => sum + (r.leads ?? 0), 0);
                        return (
                          <tr key={c.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-4 pr-4 font-medium text-slate-900">{c.name}</td>
                            <td className="py-4 pr-4 text-slate-600">
                              {formatDate(c.start_date)} – {formatDate(c.end_date)}
                            </td>
                            <td className="py-4 pr-4 text-slate-900">{rows.length}</td>
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
              <div className="mb-4 max-w-xs">
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
                          <td className="py-4 pr-4 text-slate-900">{row.leads.toLocaleString()}</td>
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
          <AlertDialogTitle>Delete influencer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this influencer record? This cannot be undone.
          </AlertDialogDescription>
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
