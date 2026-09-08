import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LandingPageBody,
  defaultLandingSettings,
  type LandingSettings,
} from "@/components/LandingPageBody";
import { fetchLandingSettings, saveLandingSettings } from "@/lib/landing-settings";
import { publicLandingUrl } from "@/lib/public-url";

export const Route = createFileRoute("/lp-preview")({
  head: () => ({
    meta: [
      { title: "Landing page preview & editor | OutSta" },
      {
        name: "description",
        content:
          "Preview any influencer landing page and edit the shared headline, subheadline, button and thank-you message.",
      },
      { property: "og:title", content: "Landing page preview & editor | OutSta" },
      {
        property: "og:description",
        content: "Preview and edit the shared influencer landing page design.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPreviewPage,
});

function LandingPreviewPage() {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState<string>("");
  const [draft, setDraft] = useState<LandingSettings>(defaultLandingSettings);
  const [saving, setSaving] = useState(false);

  const { data: influencers } = useQuery({
    queryKey: ["preview-influencers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("campaign_influencers")
          .select("id, influencer_handle, slug")
          .order("influencer_handle");
        if (error) throw error;
        return data ?? [];
      } catch {
        toast.error("Couldn't load influencers. Please try again.");
        return [];
      }
    },
  });

  const { data: settings } = useQuery({
    queryKey: ["landing-settings"],
    queryFn: fetchLandingSettings,
  });

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!slug && influencers && influencers.length > 0) setSlug(influencers[0].slug);
  }, [influencers, slug]);

  const set = (key: keyof LandingSettings, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!draft.headline.trim() || !draft.button_label.trim()) {
      toast.error("Headline and button label can't be empty.");
      return;
    }
    setSaving(true);
    try {
      await saveLandingSettings({
        headline: draft.headline.trim(),
        subheadline: draft.subheadline.trim(),
        button_label: draft.button_label.trim(),
        success_message: draft.success_message.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["landing-settings"] });
      toast.success("Landing page updated");
    } catch {
      toast.error("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = slug ? publicLandingUrl(slug) : "";

  return (
    <main className="min-h-screen bg-[#F0FFFE]">
      <header className="bg-[#07283F] px-5 py-5 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-6 w-6 rounded-full border-[3.5px] border-[#0ABEDF]"
              aria-hidden
            />
            <span className="text-[15px] font-medium">
              Out<span className="text-[#0ABEDF]">Sta</span>
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Landing page content
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            These words are shared by every influencer link. Only the link itself changes per
            influencer.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="preview-slug">Preview as</Label>
              <Select value={slug} onValueChange={setSlug}>
                <SelectTrigger id="preview-slug">
                  <SelectValue placeholder="Select an influencer" />
                </SelectTrigger>
                <SelectContent>
                  {(influencers ?? []).map((i) => (
                    <SelectItem key={i.id} value={i.slug}>
                      {i.influencer_handle} · /lp/{i.slug}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 pt-1 text-xs text-[#0ABEDF] hover:text-[#0899B5]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {publicUrl}
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={draft.headline}
                maxLength={120}
                onChange={(e) => set("headline", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subheadline">Subheadline</Label>
              <Textarea
                id="subheadline"
                value={draft.subheadline}
                maxLength={240}
                rows={3}
                onChange={(e) => set("subheadline", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="button-label">Button label</Label>
              <Input
                id="button-label"
                value={draft.button_label}
                maxLength={40}
                onChange={(e) => set("button_label", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="success-message">Thank-you message</Label>
              <Textarea
                id="success-message"
                value={draft.success_message}
                maxLength={240}
                rows={2}
                onChange={(e) => set("success_message", e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDraft(settings ?? defaultLandingSettings)}
                disabled={saving}
              >
                Reset
              </Button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Live preview
            </p>
            <p className="text-xs text-slate-400">Form is inactive in preview</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10">
            <LandingPageBody settings={draft} readOnly />
          </div>
        </section>
      </div>
    </main>
  );
}
