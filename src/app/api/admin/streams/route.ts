import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { streamInput } from "@/lib/validation";

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-streams-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data, error } = await client.from("streams").select("*, events(id, slug, title)").order("created_at", { ascending: false }).range(0, 99);
  if (error) return Response.json({ error: "Could not load streams" }, { status: 500 });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await checkAdminRequest(request, "admin-streams-write", 20);
  if (access.response) return access.response;
  const parsed = streamInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid stream configuration", details: parsed.error.flatten() }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.from("streams").upsert({ ...parsed.data, created_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: "event_id" }).select().single();
  if (error) return Response.json({ error: "Could not save stream" }, { status: 400 });
  await recordAdminAudit("upsert", "stream", data.id, { event_id: data.event_id, provider: data.provider });
  return Response.json({ data }, { status: 201, headers: { "cache-control": "private, no-store" } });
}