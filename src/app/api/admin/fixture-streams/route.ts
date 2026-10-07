import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fixtureStreamDeleteInput, fixtureStreamInput, fixtureStreamUpdateInput } from "@/lib/validation";

const privateHeaders = { "cache-control": "private, no-store" };

export async function GET(request: Request) {
  const access = await checkAdminRequest(request, "admin-fixture-streams-read");
  if (access.response) return access.response;
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured." }, { status: 503 });

  const { data, error } = await client.from("fixture_streams").select("*")
    .order("fixture_id", { ascending: true })
    .order("priority", { ascending: false })
    .range(0, 199);
  if (error) return Response.json({ error: "Could not load fixture streams." }, { status: 500 });
  return Response.json({ data }, { headers: privateHeaders });
}

export async function POST(request: Request) {
  const access = await checkAdminRequest(request, "admin-fixture-streams-write", 30);
  if (access.response) return access.response;
  const parsed = fixtureStreamInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid fixture stream configuration.", details: parsed.error.flatten() }, { status: 400 });

  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured." }, { status: 503 });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return Response.json({ error: "Administrator session expired." }, { status: 401 });

  const { data, error } = await client.from("fixture_streams")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*")
    .single();
  if (error) return Response.json({ error: "Could not save fixture stream." }, { status: 400 });
  await recordAdminAudit("create", "fixture_stream", data.id, { fixture_id: data.fixture_id, provider: data.provider_name, stream_type: data.stream_type });
  return Response.json({ data }, { status: 201, headers: privateHeaders });
}

export async function PATCH(request: Request) {
  const access = await checkAdminRequest(request, "admin-fixture-streams-write", 30);
  if (access.response) return access.response;
  const parsed = fixtureStreamUpdateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid fixture stream update." }, { status: 400 });

  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured." }, { status: 503 });
  const { id, ...updates } = parsed.data;
  const { data, error } = await client.from("fixture_streams")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return Response.json({ error: "Could not update fixture stream." }, { status: 400 });
  if (!data) return Response.json({ error: "Fixture stream not found." }, { status: 404 });
  await recordAdminAudit("update", "fixture_stream", id, updates);
  return Response.json({ data }, { headers: privateHeaders });
}

export async function DELETE(request: Request) {
  const access = await checkAdminRequest(request, "admin-fixture-streams-write", 30);
  if (access.response) return access.response;
  const parsed = fixtureStreamDeleteInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid fixture stream ID." }, { status: 400 });

  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured." }, { status: 503 });
  const { data, error } = await client.from("fixture_streams").delete().eq("id", parsed.data.id).select("id").maybeSingle();
  if (error) return Response.json({ error: "Could not delete fixture stream." }, { status: 400 });
  if (!data) return Response.json({ error: "Fixture stream not found." }, { status: 404 });
  await recordAdminAudit("delete", "fixture_stream", data.id);
  return Response.json({ success: true }, { headers: privateHeaders });
}