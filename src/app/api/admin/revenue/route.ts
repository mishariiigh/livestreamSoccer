import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revenueInput } from "@/lib/validation";

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-revenue-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data, error } = await client.from("revenue_entries").select("id, event_id, ad_id, revenue_date, amount, currency, source, created_at").order("revenue_date", { ascending: false }).range(0, 9999);
  if (error) return Response.json({ error: "Could not load revenue data" }, { status: 500 });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await checkAdminRequest(request, "admin-revenue-write", 30);
  if (access.response) return access.response;
  const parsed = revenueInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid revenue entry", details: parsed.error.flatten() }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.from("revenue_entries").insert({ ...parsed.data, uploaded_by: user?.id }).select().single();
  if (error) return Response.json({ error: "Could not save revenue entry" }, { status: 400 });
  await recordAdminAudit("create", "revenue_entry", data.id, { source: data.source, revenue_date: data.revenue_date });
  return Response.json({ data }, { status: 201, headers: { "cache-control": "private, no-store" } });
}