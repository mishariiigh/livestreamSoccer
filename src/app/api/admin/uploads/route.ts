import { randomUUID } from "node:crypto";
import { checkAdminRequest, recordAdminAudit } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const acceptedTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);

export async function POST(request: Request) {
  const access = await checkAdminRequest(request, "admin-media-upload", 12);
  if (access.response) return access.response;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Select an image file" }, { status: 400 });
  const extension = acceptedTypes.get(file.type);
  if (!extension || file.size <= 0 || file.size > 5 * 1024 * 1024) return Response.json({ error: "Use a JPEG, PNG, WebP, or AVIF image up to 5 MB" }, { status: 400 });
  const client = await createSupabaseServerClient();
  if (!client) return Response.json({ error: "Database is not configured" }, { status: 503 });
  const path = `events/${randomUUID()}.${extension}`;
  const { data, error } = await client.storage.from("event-media").upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) return Response.json({ error: "Upload failed. Check that the event-media bucket is configured." }, { status: 400 });
  const { data: url } = client.storage.from("event-media").getPublicUrl(data.path);
  await recordAdminAudit("upload", "event_media", data.path, { mime_type: file.type, bytes: file.size });
  return Response.json({ data: { path: data.path, publicUrl: url.publicUrl } }, { status: 201, headers: { "cache-control": "no-store" } });
}