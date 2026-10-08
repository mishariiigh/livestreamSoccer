/**
 * Stream source detection and normalization.
 *
 * Administrators paste a URL; this module works out what it actually is and how
 * it should be played, so nobody has to know whether a link is an HLS manifest,
 * a provider embed, or just an ordinary web page.
 *
 * Design rules:
 * - Nothing here fetches the URL. Detection is purely URL-shape based, so it can
 *   run in the browser (admin preview) and on the server (playback routing).
 * - We never bypass framing restrictions. Some sites refuse to be embedded via
 *   `X-Frame-Options` or `Content-Security-Policy: frame-ancestors`; that is
 *   respected and surfaced to the user as an "unsupported" outcome, never
 *   circumvented by proxying or scraping.
 * - URLs are not rewritten unless the rewrite is a documented, safe equivalent
 *   (for example YouTube's `watch?v=ID` -> `embed/ID`).
 */

import type { FixtureStreamType } from "@/lib/streaming/fixture-stream-types";

export type StreamSourceKind =
  | "hls" // HLS manifest or a direct progressive media file
  | "youtube"
  | "vimeo"
  | "embed" // a URL explicitly shaped like an embeddable player
  | "ambiguous" // no extension and no media markers: let the player try it
  | "webpage"; // an ordinary page: not playable and not guaranteed embeddable

export type StreamSource = {
  kind: StreamSourceKind;
  /** Where the player should load media from. May differ from the input. */
  url: string;
  /** The URL exactly as the administrator entered it. */
  originalUrl: string;
  /** True when `url` differs from `originalUrl`. */
  normalized: boolean;
  /** The source is something we can attempt to play. */
  playable: boolean;
  /** Host name, for display and warning messages. */
  host: string;
  /** Human-readable explanation, in Arabic, of the detection result. */
  reason: string;
};

/** The administrator's explicit choice in the admin form. */
export type StreamTypePreference = "auto" | "hls" | "embed" | "external";

const VIDEO_FILE_EXTENSIONS = [".mp4", ".m4v", ".webm", ".ogv", ".mov", ".mkv", ".mpd"];
const EMBED_PATH_SEGMENTS = ["/embed", "/embed/", "/player", "/player/", "/iframe", "/e/", "/v/", "/video/"];

/** Extracts and validates the host, tolerating missing protocol for detection. */
function parse(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    // A bare "youtube.com/watch?v=x" is a common paste; retry with a scheme so
    // detection can still recognize it. The caller decides whether that is
    // acceptable for storage.
    try {
      return new URL(`https://${rawUrl}`);
    } catch {
      return null;
    }
  }
}

export function isValidHttpsUrl(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).protocol === "https:";
  } catch {
    return false;
  }
}

/** YouTube video IDs are exactly 11 URL-safe characters. */
function isYouTubeId(value: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(value);
}

function normalizeYouTube(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && isYouTubeId(id) ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "music.youtube.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const [first, second] = segments;

  // /embed/ID and /live/ID
  if ((first === "embed" || first === "live" || first === "shorts" || first === "v") && second && isYouTubeId(second)) {
    return `https://www.youtube.com/embed/${second}`;
  }

  // /watch?v=ID
  if (first === "watch") {
    const id = url.searchParams.get("v");
    if (id && isYouTubeId(id)) return `https://www.youtube.com/embed/${id}`;
  }

  return null;
}

function normalizeVimeo(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host !== "vimeo.com" && host !== "player.vimeo.com" && host !== "m.vimeo.com") return null;

  const segments = url.pathname.split("/").filter(Boolean);

  // player.vimeo.com/video/ID — already an embed URL.
  if (host === "player.vimeo.com" && segments[0] === "video" && /^\d+$/.test(segments[1] ?? "")) {
    return url.toString();
  }

  // vimeo.com/ID  (also tolerate vimeo.com/channels/x/ID and /groups/x/videos/ID)
  const numeric = [...segments].reverse().find((segment) => /^\d{6,}$/.test(segment));
  if (numeric) {
    // Preserve the unlisted-video hash (?h=...) which Vimeo requires for embeds.
    const hash = url.searchParams.get("h");
    return `https://player.vimeo.com/video/${numeric}${hash ? `?h=${encodeURIComponent(hash)}` : ""}`;
  }

  return null;
}

function hasVideoExtension(pathname: string) {
  const lower = pathname.toLowerCase();
  return VIDEO_FILE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function hasHlsExtension(pathname: string) {
  return pathname.toLowerCase().endsWith(".m3u8");
}

function looksLikeEmbed(url: URL) {
  const path = url.pathname.toLowerCase();
  if (EMBED_PATH_SEGMENTS.some((segment) => path.includes(segment))) return true;
  // Player URLs frequently carry these query parameters.
  return url.searchParams.has("embed") || url.searchParams.has("iframe");
}

const PAGE_EXTENSIONS = [".html", ".htm", ".php", ".asp", ".aspx", ".jsp", ".cgi"];

/** Path/host markers that indicate a media delivery endpoint rather than a page. */
const STREAM_PATH_MARKERS = ["hls", "dash", "live", "stream", "manifest", "playlist", "m3u8", "media", "cdn", "edge", "vod", "seg"];

/** Hosts that serve media by convention. */
const STREAM_HOST_MARKERS = ["cdn", "stream", "live", "media", "edge", "video", "hls"];

/**
 * True only for URLs that clearly represent an ordinary web page rather than a
 * media source.
 *
 * This is the hardest judgement in the module, so it is deliberately explicit:
 *  - a bare domain or root path  -> page
 *  - an explicit document extension (.html, .php, ...)  -> page
 *  - everything else, if the host or path carries media markers (cdn, hls, live,
 *    stream, manifest, ...) -> stream candidate
 *
 * A URL with neither markers nor an extension is ambiguous. We must not mark it
 * unplayable, because generated stream URLs look exactly like that; but we also
 * must not claim it is a stream. It is returned as `ambiguous` so the caller can
 * let the player try it and surface a clear playback error if it fails.
 */
function looksLikeOrdinaryWebpage(url: URL) {
  const path = url.pathname.toLowerCase();
  if (path === "/" || path === "") return true;
  if (PAGE_EXTENSIONS.some((extension) => path.endsWith(extension))) return true;
  return false;
}

function hasStreamMarkers(url: URL) {
  const path = url.pathname.toLowerCase();
  const host = url.hostname.toLowerCase();
  const hostLabel = host.split(".")[0];
  return (
    STREAM_PATH_MARKERS.some((marker) => path.includes(marker)) ||
    STREAM_HOST_MARKERS.some((marker) => hostLabel.includes(marker) || host.includes(marker))
  );
}

/**
 * Classifies a URL. `preference` is the administrator's dropdown choice:
 * - "auto"   — trust the detection
 * - "hls"    — force the HLS/video player
 * - "embed"  — force the iframe player
 *
 * A preference never silently overrides an obvious mismatch; callers should
 * surface `warnings` instead. See `detectStreamSource`.
 */
export function classifyStreamSource(rawUrl: string): StreamSource {
  const trimmed = rawUrl.trim();
  const base: Omit<StreamSource, "kind" | "url" | "playable" | "reason" | "normalized"> = {
    originalUrl: trimmed,
    host: "",
  };

  const url = parse(trimmed);
  if (!url) {
    return { ...base, kind: "webpage", url: trimmed, normalized: false, playable: false, reason: "الرابط غير صالح." };
  }

  const host = url.hostname.replace(/^www\./, "");

  const youtube = normalizeYouTube(url);
  if (youtube) {
    return {
      ...base,
      host,
      kind: "youtube",
      url: youtube,
      normalized: youtube !== trimmed,
      playable: true,
      reason: "رابط يوتيوب تم تحويله إلى صيغة العرض المضمّن.",
    };
  }

  const vimeo = normalizeVimeo(url);
  if (vimeo) {
    return {
      ...base,
      host,
      kind: "vimeo",
      url: vimeo,
      normalized: vimeo !== trimmed,
      playable: true,
      reason: "رابط فيميو تم تحويله إلى صيغة العرض المضمّن.",
    };
  }

  if (hasHlsExtension(url.pathname)) {
    return {
      ...base,
      host,
      kind: "hls",
      url: trimmed,
      normalized: false,
      playable: true,
      reason: "ملف HLS (m3u8).",
    };
  }

  if (hasVideoExtension(url.pathname)) {
    return {
      ...base,
      host,
      kind: "hls",
      url: trimmed,
      normalized: false,
      playable: true,
      reason: "ملف فيديو مباشر.",
    };
  }

  // A stream URL can hide behind query parameters or a generated path with no
  // file extension at all. Those are accepted as direct stream candidates.
  if (looksLikeEmbed(url)) {
    return {
      ...base,
      host,
      kind: "embed",
      url: trimmed,
      normalized: false,
      playable: true,
      reason: "رابط تضمين (embed/player).",
    };
  }

  // Only flag an ordinary web page when the URL really looks like one: a bare
  // domain root or an explicit document extension.
  if (looksLikeOrdinaryWebpage(url)) {
    return {
      ...base,
      host,
      kind: "webpage",
      url: trimmed,
      normalized: false,
      playable: false,
      reason: "يبدو أنه رابط صفحة ويب عادية وليس مصدر بث أو تضمين مدعوم.",
    };
  }

  // Clear media markers in the host or path: a direct stream candidate.
  if (hasStreamMarkers(url)) {
    return {
      ...base,
      host,
      kind: "hls",
      url: trimmed,
      normalized: false,
      playable: true,
      reason: "رابط بث مباشر.",
    };
  }

  // No extension and no media markers. This could be a generated stream URL or a
  // clean-looking page that we cannot tell apart from one. We do not reject it —
  // the player decides — but we label it honestly as ambiguous.
  return {
    ...base,
    host,
    kind: "ambiguous",
    url: trimmed,
    normalized: false,
    playable: true,
    reason: "لم يتم التعرف على صيغة الرابط؛ سيحاول المشغّل تشغيله وسيظهر خطأ واضح إن فشل.",
  };
}

export type DetectedStream = {
  /** What the URL actually is. */
  source: StreamSource;
  /** Which player the UI should render. */
  player: "hls" | "embed" | "external" | "unsupported";
  /** The `fixture_streams.stream_type` value to persist (keeps the DB contract). */
  persistedType: "hls" | "embed" | "external";
  /** Arabic warnings shown in the admin form. Empty when everything agrees. */
  warnings: string[];
};

/**
 * Full detection result, including the administrator's manual preference.
 * Conflicts produce warnings; the manual choice still wins for storage so the
 * behavior stays predictable and the administrator stays in control.
 */
export function detectStreamSource(rawUrl: string, preference: StreamTypePreference = "auto"): DetectedStream {
  const source = classifyStreamSource(rawUrl);
  const warnings: string[] = [];

  // An explicit "official external link" is never played. It is an outbound
  // reference to a broadcaster, so detection is deliberately skipped: a link to
  // a broadcast page must not be mistaken for an embeddable stream.
  if (preference === "external") {
    return {
      source: { ...source, playable: false, reason: "رابط رسمي خارجي — يُفتح في نافذة جديدة ولا يُشغّل داخل المشغّل." },
      player: "external",
      persistedType: "external",
      warnings: [],
    };
  }

  const forced = preference !== "auto";

  // Whether this URL wants the media player or the iframe player.
  // `ambiguous` follows the administrator's choice, defaulting to the player.
  const naturalType: "hls" | "embed" =
    source.kind === "hls" || source.kind === "ambiguous" ? "hls" : "embed";

  if (forced && preference !== naturalType) {
    if (preference === "embed" && source.kind === "hls") {
      warnings.push("يبدو أن هذا رابط بث HLS وليس رابط تضمين. سيتم استخدام مشغّل البث.");
    } else if (preference === "hls" && source.kind === "youtube") {
      warnings.push("يبدو أن هذا رابط يوتيوب. سيتم استخدام مشغّل العرض المضمّن.");
    } else if (preference === "hls" && source.kind === "vimeo") {
      warnings.push("يبدو أن هذا رابط فيميو. سيتم استخدام مشغّل العرض المضمّن.");
    } else if (preference === "hls" && source.kind === "embed") {
      warnings.push("يبدو أن هذا رابط تضمين وليس بثاً مباشراً.");
    } else if (preference === "hls" && source.kind === "webpage") {
      warnings.push("يبدو أن هذا رابط صفحة ويب عادية وليس مصدر بث مدعوم.");
    } else if (preference === "embed" && source.kind === "webpage") {
      warnings.push("يبدو أن هذا رابط صفحة ويب عادية. قد لا يسمح الموقع بالتضمين.");
    }
  }

  if (!source.playable) {
    return { source, player: "unsupported", persistedType: forced && preference === "hls" ? "hls" : "embed", warnings };
  }

  // Auto detect, or an agreed manual choice, routes by what the URL really is.
  // When the URL is a provider embed (YouTube/Vimeo) or an explicit embed URL, the
  // embed player always wins. Otherwise an explicit manual choice is honored, and
  // `auto` falls back to what the URL shape suggests.
  const providerOrExplicitEmbed = source.kind === "youtube" || source.kind === "vimeo" || source.kind === "embed";
  const player: "hls" | "embed" = providerOrExplicitEmbed
    ? "embed"
    : source.kind === "ambiguous" && forced
      ? preference
      : naturalType;

  return {
    source,
    player,
    persistedType: player === "hls" ? "hls" : "embed",
    warnings,
  };
}

/** Convenience helper for playback: which player should render this stored source? */
export function resolvePlayerForStoredStream(
  storedType: FixtureStreamType,
  rawUrl: string
): { player: "hls" | "embed" | "external" | "unsupported"; url: string; source: StreamSource } {
  const source = classifyStreamSource(rawUrl);

  // An official external link is never loaded in a player. It is rendered as an
  // outbound link by the match page, regardless of how the URL is shaped.
  if (storedType === "external") {
    return { player: "external", url: rawUrl, source };
  }

  // Provider URLs are always embedded, regardless of what was stored.
  if (source.kind === "youtube" || source.kind === "vimeo") {
    return { player: "embed", url: source.url, source };
  }

  if (source.kind === "webpage") {
    // An ordinary page cannot be played. Honor an explicit embed choice only
    // when the URL is genuinely shaped like an embed.
    return { player: "unsupported", url: source.url, source };
  }

  if (storedType === "embed") {
    return { player: "embed", url: source.normalized ? source.url : rawUrl, source };
  }

  return { player: "hls", url: rawUrl, source };
}