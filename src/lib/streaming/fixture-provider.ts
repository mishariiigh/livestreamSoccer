import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthorizedFixtureStream, AuthorizedFixtureStreams } from "@/lib/streaming/fixture-stream-types";

export interface FixtureStreamProvider {
  getAuthorizedStream(fixtureId: string): Promise<AuthorizedFixtureStreams>;
}

export class DatabaseFixtureStreamProvider implements FixtureStreamProvider {
  constructor(private readonly client: SupabaseClient) {}

  async getAuthorizedStream(fixtureId: string): Promise<AuthorizedFixtureStreams> {
    const { data, error } = await this.client
      .from("fixture_streams")
      .select("id, fixture_id, stream_type, stream_url, provider_name, priority")
      .eq("fixture_id", fixtureId)
      .eq("active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error || !data) return { primary: null, fallbacks: [] };
    const sources = data as AuthorizedFixtureStream[];
    return { primary: sources[0] ?? null, fallbacks: sources.slice(1) };
  }
}