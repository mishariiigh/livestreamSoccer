import type { SupabaseClient } from "@supabase/supabase-js";

export type StreamStatus = "live" | "offline" | "scheduled";

export interface StreamProvider {
  getPlaybackUrl(streamId: string): Promise<string | null>;
  getStreamStatus(streamId: string): Promise<StreamStatus>;
}

export class DatabaseStreamProvider implements StreamProvider {
  constructor(private readonly client: SupabaseClient) {}

  async getPlaybackUrl(streamId: string) {
    const { data, error } = await this.client.from("streams").select("playback_url, enabled, stream_status").eq("id", streamId).maybeSingle();
    if (error || !data?.enabled || data.stream_status !== "live") return null;
    return data.playback_url;
  }

  async getStreamStatus(streamId: string): Promise<StreamStatus> {
    const { data, error } = await this.client.from("streams").select("stream_status, enabled").eq("id", streamId).maybeSingle();
    if (error || !data?.enabled) return "offline";
    return data.stream_status as StreamStatus;
  }
}