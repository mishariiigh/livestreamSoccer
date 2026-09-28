import { checkRequestLimit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adTrackingInput } from "@/lib/validation";

export async function POST(request: Request, context: RouteContext<"/api/ads/[action]">) {
  const { action } = await context.params;
  if (action !== "impression" && action !== "click") return Response.json({ error: "Unknown tracking action" }, { status: 404 });
  const limited = await checkRequestLimit(request, `ad-${action}`, 40);
  if (limited) return limited;
  const parsed = adTrackingInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid tracking data" }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ tracked: false, mode: "demo" }, { status: 202 });
  const table = action === "impression" ? "ad_impressions" : "ad_clicks";
  const { error } = await client.from(table).insert({ ad_id: parsed.data.adId, event_id: parsed.data.eventId ?? null, viewer_session_id: parsed.data.sessionId ?? null });
  if (error) return Response.json({ error: "Tracking event was not accepted" }, { status: 400 });
  return Response.json({ tracked: true }, { status: 202, headers: { "cache-control": "no-store" } });
}