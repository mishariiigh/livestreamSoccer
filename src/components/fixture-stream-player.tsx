"use client";

import { useCallback, useMemo, useState } from "react";
import HlsPlayer from "@/components/hls-player";
import type { AuthorizedFixtureStream, AuthorizedFixtureStreams } from "@/lib/streaming/fixture-stream-types";

export default function FixtureStreamPlayer({ streams, title }: { streams: AuthorizedFixtureStreams; title: string }) {
  const sources = useMemo(() => [streams.primary, ...streams.fallbacks].filter((source): source is AuthorizedFixtureStream => Boolean(source)), [streams]);
  const [selectedId, setSelectedId] = useState(sources[0]?.id ?? "");
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

  if (!activeSource) return null;

  return (
    <div className="fixture-stream-player">
      {activeSource.stream_type === "hls" ? (
        <HlsPlayer key={activeSource.id} src={activeSource.stream_url} title={title} onFatalError={moveToFallback} />
      ) : (
        <div className="player-frame">
          <iframe
            key={activeSource.id}
            src={activeSource.stream_url}
            title={`${title} · ${activeSource.provider_name}`}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            loading="eager"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            onError={moveToFallback}
          />
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
    </div>
  );
}