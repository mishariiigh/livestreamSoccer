import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdminResponse } from "@/lib/auth/require-admin";

export async function checkRequestLimit(request: Request, namespace: string, limit = 30) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identity = request.headers.get("x-real-ip") ?? forwarded ?? "unknown";
  const result = await checkRateLimit(identity, namespace, limit);
  if (result.success) return null;
  return Response.json({ error: "Too many requests" }, { status: 429, headers: { "retry-after": Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)).toString() } });
}

export async function checkAdminRequest(request: Request, namespace: string, limit = 60) {
  const limited = await checkRequestLimit(request, namespace, limit);
  if (limited) return { response: limited, user: null };
  const denied = await requireAdminResponse();
  if (denied) return { response: denied, user: null };
  return { response: null, user: null };
}

export async function recordAdminAudit(action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const client = await createSupabaseServerClient();
  if (!client) return;
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;
  await client.from("audit_logs").insert({ actor_id: user.id, action, entity_type: entityType, entity_id: entityId ?? null, metadata });
}
