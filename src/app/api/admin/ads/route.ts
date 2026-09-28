import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { adInput } from "@/lib/validation";

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-ads-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data, error } = await client.from("ads").select("*").order("created_at", { ascending: false }).range(0, 99);
  if (error) return Response.json({ error: "Could not load advertisements" }, { status: 500 });
  return Response.json({ data }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await checkAdminRequest(request, "admin-ads-write", 30);
  if (access.response) return access.response;
  const parsed = adInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid advertisement fields", details: parsed.error.flatten() }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client.from("ads").insert({ ...parsed.data, created_by: user?.id }).select().single();
  if (error) return Response.json({ error: "Could not create advertisement" }, { status: 400 });
  await recordAdminAudit("create", "ad", data.id, { type: data.type, active: data.active });
  return Response.json({ data }, { status: 201, headers: { "cache-control": "private, no-store" } });
}