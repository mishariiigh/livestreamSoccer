import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OfficialWatchLink = {
  id: string;
  fixture_id: string;
  country_region: string;
  broadcaster_name: string;
  official_watch_url: string;
};

export async function getOfficialWatchLinks(fixtureId: string): Promise<OfficialWatchLink[]> {
  const client = await createSupabaseServerClient();
  if (!client) return [];

  const { data, error } = await client
    .from("official_watch_links")
    .select("id, fixture_id, country_region, broadcaster_name, official_watch_url")
    .eq("fixture_id", fixtureId)
    .eq("active", true)
    .order("country_region", { ascending: true })
    .order("broadcaster_name", { ascending: true });

  if (error || !data) return [];
  return data as OfficialWatchLink[];
}