import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Returns true only when the signed-in user is listed in admin_users.
// admin_users has no client-readable RLS, so the membership check uses the service role.
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("admin_users")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { isAdmin: (count ?? 0) > 0 };
  });


export const getAdminSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("admin_users")
    .select("user_id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return { configured: (count ?? 0) > 0 };
});

export const createAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => {
    const email = input.email?.trim().toLowerCase() ?? "";
    const password = input.password ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    return { email, password };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("admin_users")
      .select("user_id", { count: "exact", head: true });
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) throw new Error("Admin already configured.");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { password_changed: true },
    });
    if (createError) throw new Error(createError.message);
    const userId = created.user?.id;
    if (!userId) throw new Error("Could not create the admin account.");

    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({ user_id: userId });
    if (insertError) throw new Error(insertError.message);

    return { ok: true };
  });
