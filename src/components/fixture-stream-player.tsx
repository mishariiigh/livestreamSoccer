"use client";

import { useCallback, useMemo, useState } from "react";
import EmbedPlayer from "@/components/embed-player";
import HlsPlayer from "@/components/hls-player";
import type { AuthorizedFixtureStream, AuthorizedFixtureStreams } from "@/lib/streaming/fixture-stream-types";
import { resolvePlayerForStoredStream } from "@/lib/streaming/stream-source";

export default function FixtureStreamPlayer({ streams, title }: { streams: AuthorizedFixtureStreams; title: string }) {
  const allSources = useMemo(
    () => [streams.primary, ...streams.fallbacks].filter((source): source is AuthorizedFixtureStream => Boolean(source)),
    [streams],
  );

  // Official external links are never loaded in a player. They are separated out
  // here so the internal player keeps working exactly as before, with the links
  // offered as an additional viewing option.
  const externalSources = useMemo(
    () => allSources.filter((source) => source.stream_type === "external"),
    [allSources],
  );
  const sources = useMemo(
    () => allSources.filter((source) => source.stream_type !== "external"),
    [allSources],
  );

  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const activeIndex = Math.max(0, sources.findIndex((source) => source.id === selectedId));
  const activeSource = sources[activeIndex];

  const moveToFallback = useCallback(() => {
    if (activeIndex + 1 < sources.length) {
      setSelectedId(sources[activeIndex + 1].id);
      setNotice("تعذر تشغيل المصدر الحالي؛ تم التبديل إلى المصدر الاحتياطي.");
    } else {
      setNotice("تعذر تشغيل مصدر البث. جرّب إعادة المحاولة أو اختر مصدراً آخر.");
    }
  }, [activeIndex, sources]);

  // Nothing playable, but an official link exists: show the link instead of a
  // broken player.
  if (!activeSource) {
    return (
      <div className="fixture-stream-player">
        {externalSources.length === 0 ? (
          <div className="fixture-stream-unavailable" role="status">
            <p>البث غير متاح حالياً</p>
          </div>
        ) : (
          <div className="fixture-stream-external-only">
            <p>لا يتوفر بث مباشر داخل الموقع لهذه المباراة، ويمكنك المشاهدة عبر الناقل الرسمي.</p>
          </div>
        )}
        {externalSources.length > 0 && <ExternalLinks sources={externalSources} />}
      </div>
    );
  }

  // The stored `stream_type` is a hint, not the final word. Detection decides the
  // actual player, so a YouTube link stored as "hls" still gets the embed player.
  const routed = resolvePlayerForStoredStream(activeSource.stream_type, activeSource.stream_url);

  return (
    <div className="fixture-stream-player">
      {routed.player === "hls" ? (
        <HlsPlayer key={activeSource.id} src={routed.url} title={title} onFatalError={moveToFallback} />
      ) : routed.player === "embed" ? (
        <EmbedPlayer
          key={activeSource.id}
          src={routed.url}
          title={`${title} · ${activeSource.provider_name}`}
          onFatalError={moveToFallback}
        />
      ) : (
        <div className="fixture-stream-unavailable" role="status">
          <p>
            هذا الرابط يبدو صفحة ويب عادية وليس مصدر بث أو تضمين مدعوم. الرجاء إدخال رابط بث HLS
            أو رابط تضمين مصرح به من الإدارة.
          </p>
        </div>
      )}
      {notice && <p className="fixture-stream-notice" role="status">{notice}</p>}
      {sources.length > 1 && (
        <div className="fixture-stream-fallbacks" aria-label="مصادر البث الاحتياطية">
          <span>مصادر البث:</span>
          {sources.map((source, index) => (
            <button
              key={source.id}
              type="button"
              className={source.id === activeSource.id ? "active" : ""}
              onClick={() => { setSelectedId(source.id); setNotice(""); }}
            >
              {index === 0 ? "أساسي" : `احتياطي ${index}`} · {source.provider_name}
            </button>
          ))}
        </div>
      )}
      {externalSources.length > 0 && <ExternalLinks sources={externalSources} />}
    </div>
  );
}

/**
 * Official external viewing options.
 *
 * These open in a new tab with `rel="noopener noreferrer"`. The page is never
 * proxied or framed, so the broadcaster's own security policies apply.
 */
function ExternalLinks({ sources }: { sources: AuthorizedFixtureStream[] }) {
  return (
    <section className="fixture-stream-external" aria-label="خيارات المشاهدة الرسمية">
      <p className="fixture-stream-external-heading">خيارات المشاهدة</p>
      <div className="fixture-stream-external-list">
        {sources.map((source) => (
          <a
            key={source.id}
            className="fixture-stream-external-link"
            href={source.stream_url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            <span aria-hidden="true">📺</span>
            <span>
              <strong>مشاهدة البث الرسمي</strong>
              <small>{source.provider_name}</small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}