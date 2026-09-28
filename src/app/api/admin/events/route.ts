import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventInput } from "@/lib/validation";

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-events-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data, error } = await client.from("events").select("*, categories(name), streams(id, provider, playback_url, stream_status, enabled)").order("starts_at", { ascending: false }).range(0, 99);
  if (error) return Response.json({ error: "Could not load events" }, { status: 500 });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await checkAdminRequest(request, "admin-events-write", 30);
  if (access.response) return access.response;
  const body = await request.json().catch(() => null);
  const parsed = eventInput.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid event fields", details: parsed.error.flatten() }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.from("events").insert({ ...parsed.data, created_by: user?.id }).select().single();
  if (error) return Response.json({ error: "Could not create event" }, { status: 400 });
  await recordAdminAudit("create", "event", data.id, { slug: data.slug });
  return Response.json({ data }, { status: 201, headers: { "cache-control": "private, no-store" } });
}