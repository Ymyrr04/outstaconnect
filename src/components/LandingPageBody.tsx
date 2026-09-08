import { useState } from "react";
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
import outstaLogoAsset from "@/assets/outsta-logo.png.asset.json";

export type LandingSettings = {
  headline: string;
  subheadline: string;
  button_label: string;
  success_message: string;
};

export const defaultLandingSettings: LandingSettings = {
  headline: "Hire vetted remote talent, faster",
  subheadline:
    "Tell us what you need — we'll match you with pre-vetted remote professionals.",
  button_label: "Get matched",
  success_message: "Thanks! We'll be in touch within 1 business day.",
};

export type LandingFormValues = {
  fullName: string;
  workEmail: string;
  companyName: string;
  roles: string;
  companySize: string;
  talent: string;
  phone: string;
};

export type LandingErrors = Partial<
  Record<"fullName" | "workEmail" | "companyName" | "roles" | "companySize" | "talent", string>
>;

const companySizes = ["1-10", "11-50", "51-200", "200+"];
const talentOptions = ["English only", "Bilingual - Spanish & English"];

const emptyForm: LandingFormValues = {
  fullName: "",
  workEmail: "",
  companyName: "",
  roles: "",
  companySize: "",
  talent: "",
  phone: "",
};

export function validateLanding(form: LandingFormValues): LandingErrors {
  const next: LandingErrors = {};
  if (!form.fullName.trim()) next.fullName = "Full name is required";
  if (!form.workEmail.trim()) next.workEmail = "Work email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.workEmail.trim()))
    next.workEmail = "Enter a valid email address";
  if (!form.companyName.trim()) next.companyName = "Company name is required";
  if (!form.roles.trim()) next.roles = "Please tell us the role(s)";
  if (!form.companySize) next.companySize = "Company size is required";
  if (!form.talent) next.talent = "Preferred talent is required";
  return next;
}

type Props = {
  settings: LandingSettings;
  /** Return true when the submission succeeded. */
  onSubmit?: (values: LandingFormValues) => Promise<boolean>;
  /** Preview mode: form is inert. */
  readOnly?: boolean;
};

export function LandingPageBody({ settings, onSubmit, readOnly = false }: Props) {
  const [form, setForm] = useState<LandingFormValues>({ ...emptyForm });
  const [errors, setErrors] = useState<LandingErrors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof LandingFormValues, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly || !onSubmit) return;
    const next = validateLanding(form);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      const ok = await onSubmit(form);
      if (ok) setDone(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 flex items-center gap-2">
        <img src={outstaLogoAsset.url} alt="OutSta logo" className="h-8 w-auto" />
        <span className="text-base font-semibold tracking-tight text-[#066F85]">OutSta</span>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {settings.headline}
      </h1>
      <p className="mt-2 text-sm text-slate-500">{settings.subheadline}</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        {done ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-[#0ABEDF]" />
            <p className="mt-4 text-base font-medium text-slate-900">
              {settings.success_message}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
                onChange={(e) => set("roles", e.target.value)}
              />
              {errors.roles && <p className="text-xs text-destructive">{errors.roles}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-size">Company size</Label>
              <Select
                value={form.companySize}
                disabled={readOnly}
                onValueChange={(v) => set("companySize", v)}
              >
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
              <Select
                value={form.talent}
                disabled={readOnly}
                onValueChange={(v) => set("talent", v)}
              >
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
                disabled={readOnly}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving || readOnly}>
              {saving ? "Sending…" : settings.button_label}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
