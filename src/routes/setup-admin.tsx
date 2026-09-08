import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminSetupStatus, createAdminAccount } from "@/lib/admin-setup.functions";

export const Route = createFileRoute("/setup-admin")({
  head: () => ({
    meta: [
      { title: "Admin setup — OutSta" },
      {
        name: "description",
        content: "One-time setup of the OutSta business owner admin account.",
      },
      { property: "og:title", content: "Admin setup — OutSta" },
      {
        property: "og:description",
        content: "One-time setup of the OutSta business owner admin account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SetupAdminPage,
});

function SetupAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const status = useQuery({
    queryKey: ["admin-setup-status"],
    queryFn: () => getAdminSetupStatus(),
  });

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
      await createAdminAccount({ data: { email: email.trim(), password } });
      setDone(true);
      toast.success("Admin account created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <h1 className="text-lg font-semibold text-foreground">Admin setup</h1>

        {status.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Checking setup status…</p>
        ) : status.isError ? (
          <p className="mt-4 text-sm text-destructive">Could not check setup status.</p>
        ) : done ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-foreground">Admin account created</p>
            <Link to="/auth" className="text-sm font-medium text-primary underline">
              Go to sign in
            </Link>
          </div>
        ) : status.data?.configured ? (
          <p className="mt-4 text-sm text-muted-foreground">Admin already configured.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-confirm">Confirm password</Label>
              <Input
                id="admin-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Creating…" : "Create admin account"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
