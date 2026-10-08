export type FixtureStreamType = "hls" | "embed" | "external";

/**
 * `external` is an official broadcaster / streaming link. It is never sent to a
 * player: the public match page renders it as an outbound link instead.
 */
export type PlaybackStreamType = "hls" | "embed";

export type AuthorizedFixtureStream = {
  id: string;
  /** Internal fixture ID of the match this stream belongs to. */
  fixture_id: string;
  stream_type: FixtureStreamType;
  stream_url: string;
  provider_name: string;
  priority: number;
};

export type AuthorizedFixtureStreams = {
  primary: AuthorizedFixtureStream | null;
  fallbacks: AuthorizedFixtureStream[];
};