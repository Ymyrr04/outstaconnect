import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Join OutSta — Creator & Referrer Sign-up" },
      {
        name: "description",
        content:
          "Apply to join OutSta as an influencer creator or as a referrer and start earning from the leads you send.",
      },
      { property: "og:title", content: "Join OutSta — Creator & Referrer Sign-up" },
      {
        property: "og:description",
        content: "Apply as an influencer or referrer and start earning from the leads you send.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApplyPage,
});

type Errors = Partial<Record<"fullName" | "handle" | "email", string>>;

function ApplyPage() {
  const [accountType, setAccountType] = useState<"influencer" | "referrer">("influencer");
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!fullName.trim()) next.fullName = "Your name is required";
    if (!handle.trim()) next.handle = "This is required";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("applications").insert({
        full_name: fullName.trim(),
        handle: handle.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        account_type: accountType,
        message: message.trim() || null,
      } as never);
      if (error) throw error;
      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const choice = (value: "influencer" | "referrer", title: string, desc: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setAccountType(value)}
      className={`rounded-xl border p-4 text-left transition ${
        accountType === value
          ? "border-[#0ABEDF] bg-[#E0F7FC]"
          : "border-slate-200 hover:border-[#B2EEF8]"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          accountType === value ? "text-[#066F85]" : "text-slate-900"
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-500">{desc}</p>
    </button>
  );

  return (
    <main className="min-h-screen bg-[#F0FFFE]">
      <header className="bg-[#07283F] px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <span className="h-6 w-6 rounded-full border-[3.5px] border-[#0ABEDF]" />
          <span className="text-[15px] font-medium text-white">
            Out<span className="text-[#0ABEDF]">Sta</span>
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-slate-900">Join the OutSta programme</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tell us a little about you. We review every application and send your login details once
          you're approved.
        </p>

        {done ? (
          <div className="mt-8 rounded-2xl border border-[#0ABEDF] bg-white p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">Application received</p>
            <p className="mt-2 text-sm text-slate-600">
              Thanks {fullName.trim()}! We'll review it and email you at {email.trim()} with your
              next steps.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="space-y-2">
              <Label>I want to join as</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {choice(
                  "influencer",
                  "Influencer / Creator",
                  "I create content and share it with my audience.",
                )}
                {choice(
                  "referrer",
                  "Referrer",
                  "I refer companies and people directly, no content needed.",
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Cruz"
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="handle">
                  {accountType === "influencer" ? "Social handle" : "Company / referral name"}
                </Label>
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder={accountType === "influencer" ? "@janecreates" : "Jane Cruz"}
                />
                {errors.handle && <p className="text-xs text-destructive">{errors.handle}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Anything else? (optional)</Label>
              <textarea
                id="message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-md border border-slate-200 p-3 text-sm outline-none focus:border-[#0ABEDF]"
                placeholder="Audience size, niche, or how you plan to refer."
              />
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-[#0ABEDF] text-white hover:bg-[#0899B5]"
            >
              {saving ? "Sending…" : "Submit application"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
