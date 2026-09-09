import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail } from "@/lib/login.functions";
import outstaLogoAsset from "@/assets/outsta-logo.png.asset.json";


export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Creator sign in — OutSta" },
      {
        name: "description",
        content: "Creators sign in to see their own campaign results, leads and payment status.",
      },
      { property: "og:title", content: "Creator sign in — OutSta" },
      {
        property: "og:description",
        content: "Creators sign in to see their own campaign results, leads and payment status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const resolveEmail = useServerFn(resolveLoginEmail);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);


  const redirectByUserType = async (userId: string) => {
    const { data: influencer } = await supabase
      .from("campaign_influencers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    return influencer ? "/portal" : "/";
  };

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      const target = await redirectByUserType(data.session.user.id);
      if (active) navigate({ to: target, replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Enter your username or email and your password.");
      return;
    }
    setBusy(true);
    try {
      const { email: loginEmail } = await resolveEmail({ data: { identifier: email.trim() } });
      if (!loginEmail) throw new Error("We couldn't find an account with that username.");
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) throw error;
      await supabase.rpc("claim_influencer_access");
      const userId = signInData.user?.id;
      const target = userId ? await redirectByUserType(userId) : "/";
      navigate({ to: target, replace: true });
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

        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Creator sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          See your own views, clicks, leads and payment status.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Username or email</Label>
            <Input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : "Sign in"}
          </Button>
          <button
            type="button"
            onClick={async () => {
              const trimmed = email.trim();
              if (!trimmed) {
                toast.error("Enter your username or email first, then tap Forgot password.");
                return;
              }
              setBusy(true);
              try {
                const { email: loginEmail } = await resolveEmail({
                  data: { identifier: trimmed },
                });
                if (!loginEmail) throw new Error("We couldn't find an account with that username.");
                const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                toast.success("Reset link sent. Check your email inbox.");

              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : "Something went wrong. Please try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
            className="block w-full text-center text-xs text-[#066F85] underline-offset-4 hover:underline"
            disabled={busy}
          >
            Forgot password?
          </button>
        </form>

      </div>
    </main>
  );
}

