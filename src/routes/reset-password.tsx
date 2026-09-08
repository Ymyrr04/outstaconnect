// ============= Full file contents =============
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import outstaLogoAsset from "@/assets/outsta-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — OutSta" },
      { name: "description", content: "Set a new password for your OutSta account." },
      { property: "og:title", content: "Reset password — OutSta" },
      { property: "og:description", content: "Set a new password for your OutSta account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    const hasRecoveryHash = () =>
      window.location.hash.includes("type=recovery");

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") {
        setValid(true);
        setReady(true);
      }
    });

    // Some clients land with the hash already processed into a session.
    supabase.auth.getSession().then(({ data }) => {
      if (!active || valid) return;
      if (data.session && hasRecoveryHash()) {
        setValid(true);
      }
      setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2">
          <img src={outstaLogoAsset.url} alt="OutSta logo" className="h-8 w-auto" />
          <span className="text-base font-semibold tracking-tight text-[#066F85]">OutSta</span>
        </div>

        {!ready ? (
          <p className="text-sm text-slate-500">Checking your reset link…</p>
        ) : !valid ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Reset link invalid or expired
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Request a new reset link from the sign-in page.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">Back to sign in</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose a new password for your account.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Updating…" : "Update password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
