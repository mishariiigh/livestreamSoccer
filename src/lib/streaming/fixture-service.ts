import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DatabaseFixtureStreamProvider } from "@/lib/streaming/fixture-provider";
import type { AuthorizedFixtureStreams } from "@/lib/streaming/fixture-stream-types";

export async function getAuthorizedStream(fixtureId: string): Promise<AuthorizedFixtureStreams> {
  const client = await createSupabaseServerClient();
  if (!client) return { primary: null, fallbacks: [] };
  return new DatabaseFixtureStreamProvider(client).getAuthorizedStream(fixtureId);
}