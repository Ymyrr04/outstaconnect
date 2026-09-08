import { createServerFn } from "@tanstack/react-start";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/**
 * Creates (or reports) a creator login account for the given email and
 * returns the generated password so the admin can share it.
 */
export const createInfluencerAccount = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email) return { created: false as const, password: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = generatePassword();
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return { created: false as const, password: null };
      }
      throw error;
    }
    return { created: true as const, password };
  });

/**
 * Generates a fresh password for an existing creator login (or creates the
 * account when it doesn't exist yet) and returns it so the admin can share it.
 */
export const resetInfluencerPassword = createServerFn({ method: "POST" })
  .inputValidator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email) throw new Error("This creator has no login email yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = generatePassword();

    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data: list, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (error) throw error;
      const found = list.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) userId = found.id;
      if (list.users.length < 200) break;
    }

    if (!userId) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      return { email, password };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    return { email, password };
  });
