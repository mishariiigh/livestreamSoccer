import type { EventItem, StreamReference } from "@/lib/event-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DatabaseEvent = {
  id: string;
  slug: string;
  title: { ar?: string; en?: string } | string;
  description: { ar?: string; en?: string } | string | null;
  category_id: string | null;
  starts_at: string;
  thumbnail_url: string | null;
  participants: { ar?: string; en?: string } | null;
  status: EventItem["status"];
  categories: { name: { ar?: string; en?: string } } | null;
  streams: { provider: string; playback_url: string; stream_status: StreamReference["status"]; enabled: boolean; captions_url: string | null }[];
};

function localize(value: DatabaseEvent["title"] | DatabaseEvent["description"], fallback: string) {
  if (typeof value === "string") return { ar: value, en: value };
  return { ar: value?.ar ?? fallback, en: value?.en ?? value?.ar ?? fallback };
}

function mapEvent(row: DatabaseEvent): EventItem {
  const stream = row.streams?.find((item) => item.enabled);
  const categoryName = row.categories?.name;
  const title = localize(row.title, row.slug);
  const description = localize(row.description, "");
  return {
    id: row.id,
    slug: row.slug,
    title,
    description,
    category: { ar: categoryName?.ar ?? "أخرى", en: categoryName?.en ?? "Other" },
    categoryKey: row.category_id ?? "other",
    image: row.thumbnail_url ?? "",
    startsAt: row.starts_at,
    status: row.status,
    participants: row.participants ? localize(row.participants, "") : undefined,
    stream: stream ? { provider: stream.provider, playbackUrl: stream.playback_url, status: stream.stream_status, captions: stream.captions_url ?? undefined } : undefined,
  };
}

export async function getPublicEvents(): Promise<EventItem[]> {
  const client = await createSupabaseServerClient();
  if (!client) return [];
  const { data, error } = await client.from("events").select("*, categories(name), streams(provider, playback_url, stream_status, enabled, captions_url)").eq("published", true).order("starts_at", { ascending: true }).range(0, 99);
  if (error) return [];
  return (data as unknown as DatabaseEvent[]).map(mapEvent);
}

export async function getPublicEventBySlug(slug: string) {
  const client = await createSupabaseServerClient();
  if (!client) return undefined;
  const { data, error } = await client.from("events").select("*, categories(name), streams(provider, playback_url, stream_status, enabled, captions_url)").eq("slug", slug).eq("published", true).maybeSingle();
  if (error || !data) return undefined;
  return mapEvent(data as unknown as DatabaseEvent);
}