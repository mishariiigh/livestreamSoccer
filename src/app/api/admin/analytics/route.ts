import { checkAdminRequest } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-analytics-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayIso = today.toISOString();
  const [visitors, todayViews, views, activeViewers, eventCount, upcomingCount, activeStreams, ads, revenue, monthImpressions, monthClicks] = await Promise.all([
    client.from("viewer_sessions").select("visitor_id").gte("started_at", todayIso).range(0, 9999),
    client.from("viewer_sessions").select("id", { count: "exact", head: true }).gte("started_at", todayIso),
    client.from("viewer_sessions").select("id", { count: "exact", head: true }),
    client.from("viewer_sessions").select("id", { count: "exact", head: true }).gte("last_seen_at", new Date(Date.now() - 120_000).toISOString()),
    client.from("events").select("id", { count: "exact", head: true }).eq("published", true),
    client.from("events").select("id", { count: "exact", head: true }).eq("published", true).eq("status", "upcoming"),
    client.from("streams").select("id", { count: "exact", head: true }).eq("enabled", true).eq("stream_status", "live"),
    client.from("ads").select("impressions, clicks"),
    client.from("revenue_entries").select("event_id, revenue_date, amount, currency, source").gte("revenue_date", monthStart.toISOString().slice(0, 10)).range(0, 9999),
    client.from("ad_impressions").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
    client.from("ad_clicks").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
  ]);

  if (visitors.error || views.error || revenue.error || monthImpressions.error || monthClicks.error) return Response.json({ error: "Analytics data unavailable" }, { status: 503 });
  const adRows = ads.data ?? [];
  const revenueRows = revenue.data ?? [];
  const sumRevenue = (from: Date) => revenueRows.filter((row) => row.revenue_date >= from.toISOString().slice(0, 10)).reduce((sum, row) => sum + Number(row.amount), 0);
  return Response.json({
    visitors: new Set((visitors.data ?? []).map((row) => row.visitor_id)).size,
    todayViews: todayViews.count ?? 0,
    totalViews: views.count ?? 0,
    currentViewers: activeViewers.count ?? 0,
    eventCount: eventCount.count ?? 0,
    upcomingEvents: upcomingCount.count ?? 0,
    activeStreams: activeStreams.count ?? 0,
    adImpressions: adRows.reduce((sum, ad) => sum + Number(ad.impressions), 0),
    adClicks: adRows.reduce((sum, ad) => sum + Number(ad.clicks), 0),
    monthlyImpressions: monthImpressions.count ?? 0,
    monthlyClicks: monthClicks.count ?? 0,
    revenue: { today: sumRevenue(today), week: sumRevenue(weekStart), month: sumRevenue(monthStart), currency: revenueRows[0]?.currency ?? "USD", reported: revenueRows.length > 0 },
    revenueByEvent: revenueRows.reduce<Record<string, number>>((totals, row) => { const key = row.event_id ?? "unassigned"; totals[key] = (totals[key] ?? 0) + Number(row.amount); return totals; }, {}),
  }, { headers: { "cache-control": "private, no-store" } });
}