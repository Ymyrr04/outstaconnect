import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Errors = Partial<Record<"handle" | "content_type" | "leads" | "cost_per_lead", string>>;

const emptyForm = {
  handle: "",
  contentType: "",
  leads: "0",
  costPerLead: "0",
  dateOnboarded: "",
  datePaid: "",
  status: "Pending",
  contentViews: "0",
  engagements: "0",
  linkClicks: "0",
};

const toInt = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

export type InfluencerRecord = {
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
};

const formFrom = (r?: InfluencerRecord) =>
  r
    ? {
        handle: r.influencer_handle,
        contentType: r.content_type,
        leads: String(r.leads ?? 0),
        costPerLead: String(r.cost_per_lead ?? 0),
        dateOnboarded: r.date_onboarded ?? "",
        datePaid: r.date_paid ?? "",
        status: r.status || "Pending",
        contentViews: String(r.content_views ?? 0),
        engagements: String(r.engagements ?? 0),
        linkClicks: String(r.link_clicks ?? 0),
      }
    : { ...emptyForm };

export function AddInfluencerDialog({
  campaignId,
  onCreated,
  influencer,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  campaignId: string;
  onCreated: () => void;
  influencer?: InfluencerRecord;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setUncontrolledOpen(next);
  };
  const isEdit = !!influencer;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => formFrom(influencer));
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(formFrom(influencer));
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!form.handle.trim()) next.handle = "Influencer handle is required";
    if (!form.contentType.trim()) next.content_type = "Content type is required";
    if (form.leads.trim() === "" || Number.isNaN(Number(form.leads)))
      next.leads = "Leads is required";
    if (form.costPerLead.trim() === "" || Number.isNaN(Number(form.costPerLead)))
      next.cost_per_lead = "Cost per lead is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        campaign_id: campaignId,
        influencer_handle: form.handle.trim(),
        content_type: form.contentType.trim(),
        leads: toInt(form.leads),
        cost_per_lead: Number(form.costPerLead) || 0,
        date_onboarded: form.dateOnboarded || null,
        date_paid: form.datePaid || null,
        status: form.status,
        content_views: toInt(form.contentViews),
        engagements: toInt(form.engagements),
        link_clicks: toInt(form.linkClicks),
      };
      const { error } = isEdit
        ? await supabase.from("campaign_influencers").update(payload).eq("id", influencer!.id)
        : await supabase.from("campaign_influencers").insert(payload);
      if (error) throw error;
      toast.success(isEdit ? "Influencer updated" : "Influencer added");
      setOpen(false);
      if (!isEdit) reset();
      onCreated();
    } catch {
      toast.error(
        isEdit
          ? "Couldn't update the influencer. Please try again."
          : "Couldn't add the influencer. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };


  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      {trigger !== undefined ? (
        trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : null
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add influencer
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit influencer" : "Add influencer"}</DialogTitle>
          <DialogDescription>
            Record a creator and their results for this campaign.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="handle">Influencer handle</Label>
              <Input
                id="handle"
                value={form.handle}
                maxLength={80}
                placeholder="@handle"
                onChange={(e) => set("handle", e.target.value)}
              />
              {errors.handle && <p className="text-xs text-destructive">{errors.handle}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="content-type">Content type</Label>
              <Input
                id="content-type"
                value={form.contentType}
                maxLength={80}
                placeholder="Instagram Reel"
                onChange={(e) => set("contentType", e.target.value)}
              />
              {errors.content_type && (
                <p className="text-xs text-destructive">{errors.content_type}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leads">Leads</Label>
              <Input
                id="leads"
                type="number"
                min={0}
                value={form.leads}
                onChange={(e) => set("leads", e.target.value)}
              />
              {errors.leads && <p className="text-xs text-destructive">{errors.leads}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpl">Cost per lead</Label>
              <Input
                id="cpl"
                type="number"
                min={0}
                step="0.01"
                value={form.costPerLead}
                onChange={(e) => set("costPerLead", e.target.value)}
              />
              {errors.cost_per_lead && (
                <p className="text-xs text-destructive">{errors.cost_per_lead}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="onboarded">Date onboarded</Label>
              <Input
                id="onboarded"
                type="date"
                value={form.dateOnboarded}
                onChange={(e) => set("dateOnboarded", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid">Date paid</Label>
              <Input
                id="paid"
                type="date"
                value={form.datePaid}
                onChange={(e) => set("datePaid", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="On Track">On Track</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="views">Content views</Label>
              <Input
                id="views"
                type="number"
                min={0}
                value={form.contentViews}
                onChange={(e) => set("contentViews", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="engagements">Engagements</Label>
              <Input
                id="engagements"
                type="number"
                min={0}
                value={form.engagements}
                onChange={(e) => set("engagements", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clicks">Link clicks</Label>
              <Input
                id="clicks"
                type="number"
                min={0}
                value={form.linkClicks}
                onChange={(e) => set("linkClicks", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add influencer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
