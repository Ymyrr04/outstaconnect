import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { createInfluencerAccount } from "@/lib/influencer-account.functions";

type Errors = Partial<Record<keyof typeof emptyForm, string>>;

const emptyForm = {
  handle: "",
  slug: "",
  username: "",
  email: "",
  primaryEmail: "",
  dateOnboarded: "",
  contentType: "",
  leads: "0",
  costPerLead: "0",
  status: "Pending",
  datePaid: "",
  contentViews: "0",
  engagements: "0",
  linkClicks: "0",
};

export type InfluencerRecord = {
  id: string;
  campaign_id: string;
  influencer_handle: string;
  slug: string;
  username?: string | null;
  email?: string | null;
  primary_email?: string | null;
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
        slug: r.slug ?? "",
        username: r.username ?? "",
        email: r.email ?? "",
        primaryEmail: r.primary_email ?? "",
        dateOnboarded: r.date_onboarded ?? "",
        contentType: r.content_type ?? "",
        leads: String(r.leads ?? 0),
        costPerLead: String(r.cost_per_lead ?? 0),
        status: r.status ?? "Pending",
        datePaid: r.date_paid ?? "",
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
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setForm(formFrom(influencer));
    setErrors({});
    setCredentials(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!form.handle.trim()) next.handle = "Name is required";
    if (!form.contentType.trim()) next.contentType = "Content type is required";
    if (!form.status.trim()) next.status = "Status is required";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email";
    if (form.primaryEmail.trim() && !/^\S+@\S+\.\S+$/.test(form.primaryEmail.trim()))
      next.primaryEmail = "Enter a valid email";
    if (form.username.trim() && !/^[a-zA-Z0-9._-]{3,30}$/.test(form.username.trim()))
      next.username = "3-30 letters, numbers, dots, dashes or underscores";


    const numFields = [
      { key: "leads" as const, label: "Leads" },
      { key: "costPerLead" as const, label: "Cost per lead" },
      { key: "contentViews" as const, label: "Content views" },
      { key: "engagements" as const, label: "Engagements" },
      { key: "linkClicks" as const, label: "Link clicks" },
    ];

    for (const { key, label } of numFields) {
      const value = Number(form[key]);
      if (Number.isNaN(value) || value < 0) {
        next[key] = `${label} must be 0 or greater`;
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const email = form.email.trim().toLowerCase() || null;
      const payload = {
        campaign_id: campaignId,
        influencer_handle: form.handle.trim(),
        slug: slugify(form.slug.trim() || form.handle.trim()) || "influencer",
        email,
        username: form.username.trim() || null,
        primary_email: form.primaryEmail.trim().toLowerCase() || null,
        date_onboarded: form.dateOnboarded || null,
        content_type: form.contentType.trim(),

        leads: Math.max(0, Number(form.leads) || 0),
        cost_per_lead: Math.max(0, Number(form.costPerLead) || 0),
        status: form.status,
        date_paid: form.datePaid || null,
        content_views: Math.max(0, Number(form.contentViews) || 0),
        engagements: Math.max(0, Number(form.engagements) || 0),
        link_clicks: Math.max(0, Number(form.linkClicks) || 0),
      };
      const { error } = isEdit
        ? await supabase.from("campaign_influencers").update(payload).eq("id", influencer!.id)
        : await supabase.from("campaign_influencers").insert(payload as never);
      if (error) throw error;

      let madeAccount: { email: string; password: string } | null = null;
      if (email && email !== (influencer?.email ?? null)) {
        try {
          const res = await createInfluencerAccount({ data: { email } });
          if (res.created && res.password) madeAccount = { email, password: res.password };
        } catch {
          toast.error("Saved, but the login account couldn't be created.");
        }
      }

      toast.success(isEdit ? "Influencer updated" : "Influencer added");
      onCreated();
      if (madeAccount) {
        setCredentials(madeAccount);
      } else {
        setOpen(false);
        if (!isEdit) reset();
      }
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit influencer" : "Add influencer"}</DialogTitle>
          <DialogDescription>
            {credentials
              ? "Share these sign-in details with the creator."
              : "Add a creator and their login for this campaign."}
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4">
            <div className="rounded-md border p-4 text-sm">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Email</p>
              <p className="font-medium">{credentials.email}</p>
              <p className="text-muted-foreground mt-3 text-xs uppercase tracking-wide">Password</p>
              <p className="font-mono font-medium">{credentials.password}</p>
            </div>
            <p className="text-muted-foreground text-xs">
              This password is shown only once. Copy it now.
            </p>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    `Email: ${credentials.email}\nPassword: ${credentials.password}`,
                  );
                  toast.success("Login details copied");
                }}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="handle">Name</Label>
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
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                maxLength={80}
                placeholder="auto from name"
                onChange={(e) => set("slug", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="influencer-username">Username (optional login)</Label>
              <Input
                id="influencer-username"
                value={form.username}
                maxLength={30}
                placeholder="creatorname"
                onChange={(e) => set("username", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                They can sign in with this username or their login email.
              </p>
              {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="influencer-email">Email login</Label>
              <Input
                id="influencer-email"
                type="email"
                value={form.email}
                maxLength={120}
                placeholder="creator@email.com"
                onChange={(e) => set("email", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A password is generated automatically and shown after saving.
              </p>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="influencer-primary-email">Primary email</Label>
              <Input
                id="influencer-primary-email"
                type="email"
                value={form.primaryEmail}
                maxLength={120}
                placeholder="contact@email.com"
                onChange={(e) => set("primaryEmail", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Main contact address. The creator confirms this at first sign in.
              </p>
              {errors.primaryEmail && (
                <p className="text-xs text-destructive">{errors.primaryEmail}</p>
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
              <Label htmlFor="content-type">Content Type</Label>
              <Input
                id="content-type"
                value={form.contentType}
                maxLength={80}
                placeholder="Instagram Reel"
                onChange={(e) => set("contentType", e.target.value)}
              />
              {errors.contentType && <p className="text-xs text-destructive">{errors.contentType}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="cost-per-lead">Cost Per Lead</Label>
                <Input
                  id="cost-per-lead"
                  type="number"
                  min={0}
                  value={form.costPerLead}
                  onChange={(e) => set("costPerLead", e.target.value)}
                />
                {errors.costPerLead && <p className="text-xs text-destructive">{errors.costPerLead}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value) => set("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="On Track">On Track</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date-paid">Date Paid</Label>
                <Input
                  id="date-paid"
                  type="date"
                  value={form.datePaid}
                  onChange={(e) => set("datePaid", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="content-views">Content Views</Label>
                <Input
                  id="content-views"
                  type="number"
                  min={0}
                  value={form.contentViews}
                  onChange={(e) => set("contentViews", e.target.value)}
                />
                {errors.contentViews && <p className="text-xs text-destructive">{errors.contentViews}</p>}
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
                {errors.engagements && <p className="text-xs text-destructive">{errors.engagements}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="link-clicks">Link Clicks</Label>
                <Input
                  id="link-clicks"
                  type="number"
                  min={0}
                  value={form.linkClicks}
                  onChange={(e) => set("linkClicks", e.target.value)}
                />
                {errors.linkClicks && <p className="text-xs text-destructive">{errors.linkClicks}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : isEdit ? "Save changes" : "Add influencer"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
