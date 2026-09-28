import { checkRequestLimit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const placements = new Set(["top-banner", "sidebar-banner", "in-content", "pre-roll", "mid-roll", "post-roll", "sponsored-event", "interstitial"]);

export async function GET(request: Request) {
  const limited = await checkRequestLimit(request, "active-ad", 60);
  if (limited) return limited;
  const type = new URL(request.url).searchParams.get("type") ?? "pre-roll";
  if (!placements.has(type)) return Response.json({ error: "Unknown placement" }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ data: null }, { headers: { "cache-control": "no-store" } });
  const { data, error } = await client.from("ads").select("id, name, type, image_url, video_url, destination_url, html_code, start_date, end_date").eq("active", true).eq("type", type).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) return Response.json({ error: "Could not load placement" }, { status: 503 });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}