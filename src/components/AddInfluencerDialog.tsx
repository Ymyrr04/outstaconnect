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
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slug";
import { createInfluencerAccount } from "@/lib/influencer-account.functions";

type Errors = Partial<Record<"handle" | "email", string>>;

const emptyForm = {
  handle: "",
  slug: "",
  email: "",
  dateOnboarded: "",
};

export type InfluencerRecord = {
  id: string;
  campaign_id: string;
  influencer_handle: string;
  slug: string;
  email?: string | null;
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
        email: r.email ?? "",
        dateOnboarded: r.date_onboarded ?? "",
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
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      next.email = "Enter a valid email";
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
        date_onboarded: form.dateOnboarded || null,
        ...(isEdit ? {} : { content_type: "Not set" }),
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
              <Label htmlFor="onboarded">Date onboarded</Label>
              <Input
                id="onboarded"
                type="date"
                value={form.dateOnboarded}
                onChange={(e) => set("dateOnboarded", e.target.value)}
              />
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
