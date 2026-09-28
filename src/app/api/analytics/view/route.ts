import { checkRequestLimit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { viewerInput } from "@/lib/validation";

export async function POST(request: Request) {
  const limited = await checkRequestLimit(request, "analytics-view", 15);
  if (limited) return limited;
  const parsed = viewerInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ tracked: false, mode: "demo" }, { status: 202 });
  const { visitId, visitorId, eventId, ...metadata } = parsed.data;
  const { error } = await client.from("viewer_sessions").insert({ id: visitId, visitor_id: visitorId, event_id: eventId ?? null, referrer_host: metadata.referrerHost ?? null, device_type: metadata.deviceType ?? null, browser: metadata.browser ?? null });
  if (error?.code === "23505") return Response.json({ tracked: true, unique: false }, { status: 202, headers: { "cache-control": "no-store" } });
  if (error) return Response.json({ error: "Analytics event was not accepted" }, { status: 400 });
  return Response.json({ tracked: true, unique: true }, { status: 202, headers: { "cache-control": "no-store" } });
}