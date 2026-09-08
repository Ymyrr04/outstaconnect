import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
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

export const Route = createFileRoute("/lp/$slug")({
  head: () => ({
    meta: [
      { title: "Hire vetted remote talent, faster | OutSta" },
      {
        name: "description",
        content:
          "Tell us what you need and we'll match you with pre-vetted remote professionals, usually within one business day.",
      },
      { property: "og:title", content: "Hire vetted remote talent, faster | OutSta" },
      {
        property: "og:description",
        content: "Get matched with pre-vetted remote professionals for the roles you're hiring for.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const companySizes = ["1-10", "11-50", "51-200", "200+"];
const talentOptions = ["English only", "Bilingual - Spanish & English"];

type Errors = Partial<
  Record<"fullName" | "workEmail" | "companyName" | "roles" | "companySize" | "talent", string>
>;

const emptyForm = {
  fullName: "",
  workEmail: "",
  companyName: "",
  roles: "",
  companySize: "",
  talent: "",
  phone: "",
};

function LandingPage() {
  const { slug } = Route.useParams();
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const { data, isLoading } = useQuery({
    queryKey: ["lp", slug],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("campaign_influencers")
          .select("id, influencer_handle")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch {
        toast.error("Couldn't load this page. Please try again.");
        return null;
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const next: Errors = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.workEmail.trim()) next.workEmail = "Work email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail.trim()))
      next.workEmail = "Enter a valid email address";
    if (!form.companyName.trim()) next.companyName = "Company name is required";
    if (!form.roles.trim()) next.roles = "Please tell us the role(s)";
    if (!form.companySize) next.companySize = "Company size is required";
    if (!form.talent) next.talent = "Preferred talent is required";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("leads").insert({
        campaign_influencer_id: data.id,
        full_name: form.fullName.trim(),
        work_email: form.workEmail.trim(),
        company_name: form.companyName.trim(),
        roles_hiring_for: form.roles.trim(),
        company_size: form.companySize,
        talent_preference: form.talent,
        phone: form.phone.trim() || null,
      });
      if (error) throw error;
      setDone(true);
    } catch {
      toast.error("Something went wrong sending your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-center">
        <p className="text-base text-slate-600">This link is no longer active</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Hire vetted remote talent, faster
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Tell us what you need — we'll match you with pre-vetted remote professionals.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="mt-4 text-base font-medium text-slate-900">
                Thanks! We'll be in touch within 1 business day.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  value={form.fullName}
                  maxLength={100}
                  onChange={(e) => set("fullName", e.target.value)}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="work-email">Work email</Label>
                <Input
                  id="work-email"
                  type="email"
                  value={form.workEmail}
                  maxLength={255}
                  onChange={(e) => set("workEmail", e.target.value)}
                />
                {errors.workEmail && <p className="text-xs text-destructive">{errors.workEmail}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-name">Company name</Label>
                <Input
                  id="company-name"
                  value={form.companyName}
                  maxLength={120}
                  onChange={(e) => set("companyName", e.target.value)}
                />
                {errors.companyName && (
                  <p className="text-xs text-destructive">{errors.companyName}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="roles">What role(s) are you hiring for?</Label>
                <Input
                  id="roles"
                  value={form.roles}
                  maxLength={200}
                  onChange={(e) => set("roles", e.target.value)}
                />
                {errors.roles && <p className="text-xs text-destructive">{errors.roles}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-size">Company size</Label>
                <Select value={form.companySize} onValueChange={(v) => set("companySize", v)}>
                  <SelectTrigger id="company-size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companySize && (
                  <p className="text-xs text-destructive">{errors.companySize}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="talent">Preferred talent</Label>
                <Select value={form.talent} onValueChange={(v) => set("talent", v)}>
                  <SelectTrigger id="talent">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {talentOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.talent && <p className="text-xs text-destructive">{errors.talent}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  maxLength={30}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Sending…" : "Get matched"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
