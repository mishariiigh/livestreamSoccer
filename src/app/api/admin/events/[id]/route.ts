import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { eventInput } from "@/lib/validation";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/events/[id]">) {
  const access = await checkAdminRequest(request, "admin-events-write", 30);
  if (access.response) return access.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid event ID" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const parsed = eventInput.partial().safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid event fields", details: parsed.error.flatten() }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data, error } = await client.from("events").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle();
  if (error) return Response.json({ error: "Could not update event" }, { status: 400 });
  if (!data) return Response.json({ error: "Event not found" }, { status: 404 });
  await recordAdminAudit("update", "event", id, { fields: Object.keys(parsed.data) });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}

export async function DELETE(request: Request, context: RouteContext<"/api/admin/events/[id]">) {
  const access = await checkAdminRequest(request, "admin-events-write", 20);
  if (access.response) return access.response;
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Invalid event ID" }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { error } = await client.from("events").delete().eq("id", id);
  if (error) return Response.json({ error: "Could not delete event" }, { status: 400 });
  await recordAdminAudit("delete", "event", id);
  return new Response(null, { status: 204 });
}