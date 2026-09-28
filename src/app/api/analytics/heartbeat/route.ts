import { checkRequestLimit } from "@/lib/api";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { viewerHeartbeatInput } from "@/lib/validation";

export async function POST(request: Request) {
  const limited = await checkRequestLimit(request, "analytics-heartbeat", 15);
  if (limited) return limited;
  const parsed = viewerHeartbeatInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid analytics event" }, { status: 400 });
  const client = createSupabaseServiceClient();
  if (!client) return Response.json({ tracked: false, mode: "demo" }, { status: 202 });
  const { error } = await client.from("viewer_sessions").update({ last_seen_at: new Date().toISOString(), duration_seconds: parsed.data.durationSeconds }).eq("id", parsed.data.visitId);
  if (error) return Response.json({ error: "Analytics update was not accepted" }, { status: 400 });
  return Response.json({ tracked: true }, { status: 202, headers: { "cache-control": "no-store" } });
}