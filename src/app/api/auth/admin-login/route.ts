import { z } from "zod";
import { checkRequestLimit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginInput = z.object({
  identifier: z.string().trim().min(1).max(254),
  password: z.string().min(8).max(256),
}).superRefine(({ identifier }, context) => {
  if (identifier.toLowerCase() !== "admin" && !z.string().email().safeParse(identifier).success) {
    context.addIssue({ code: "custom", path: ["identifier"], message: "Enter the admin username or a valid email address." });
  }
});

export async function POST(request: Request) {
  const limited = await checkRequestLimit(request, "admin-login", 8);
  if (limited) return limited;

  const parsed = loginInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter admin or a valid email address, and a valid password." }, { status: 400 });

  const identifier = parsed.data.identifier.trim();
  const email = identifier.toLowerCase() === "admin" ? process.env.ADMIN_LOGIN_EMAIL : identifier;
  if (!email) return Response.json({ error: "The admin username has not been configured on the server." }, { status: 503 });

  const supabase = await createSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Supabase authentication is not configured." }, { status: 503 });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: parsed.data.password });
  if (error || !data.user) {
    const message = error?.message.toLowerCase() ?? "";
    if (message.includes("email not confirmed")) {
      return Response.json({ error: "Confirm your email address before signing in." }, { status: 401 });
    }
    return Response.json({ error: "Email/username or password is incorrect." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    await supabase.auth.signOut();
    return Response.json({ error: `Authenticated UID ${data.user.id}, but profile lookup failed (${profileError.code ?? "unknown"}). Check the migration and profile RLS policy.` }, { status: 503 });
  }

  if (!profile) {
    await supabase.auth.signOut();
    return Response.json({ error: `No profiles row exists for authenticated UID ${data.user.id}.` }, { status: 403 });
  }

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return Response.json({ error: `Authenticated UID ${data.user.id} has role "${profile.role}", not "admin".` }, { status: 403 });
  }

  return Response.json({ success: true }, { headers: { "cache-control": "no-store" } });
}