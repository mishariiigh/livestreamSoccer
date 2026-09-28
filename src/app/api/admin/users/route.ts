import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-users-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data, error } = await client.from("profiles").select("id, display_name, role, created_at").order("created_at", { ascending: false }).range(0, 499);
  if (error) return Response.json({ error: "Could not load user profiles" }, { status: 500 });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  const access = await checkAdminRequest(request, "admin-users-write", 20);
  if (access.response) return access.response;
  const body = await request.json().catch(() => null) as { id?: unknown; role?: unknown } | null;
  if (!body || typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id) || !["viewer", "admin"].includes(String(body.role))) return Response.json({ error: "Invalid role change" }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  if (user?.id === body.id && body.role !== "admin") return Response.json({ error: "You cannot remove your own administrator role" }, { status: 400 });
  const { data, error } = await client.from("profiles").update({ role: body.role, updated_at: new Date().toISOString() }).eq("id", body.id).select("id, display_name, role, created_at").maybeSingle();
  if (error) return Response.json({ error: "Could not update user role" }, { status: 400 });
  if (!data) return Response.json({ error: "User profile not found" }, { status: 404 });
  await recordAdminAudit("update_role", "profile", data.id, { role: data.role });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}