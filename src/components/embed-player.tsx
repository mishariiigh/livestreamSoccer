"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders an authorized embed/iframe stream URL.
 *
 * Important: a website can refuse to be embedded at all using `X-Frame-Options`
 * or a `Content-Security-Policy: frame-ancestors` header. Browsers deliberately
 * give the parent page no way to read the framed response, and the `iframe`
 * element does not fire `error` for this case. We therefore do not attempt to
 * detect, proxy, scrape or bypass those restrictions.
 *
 * What we can do is notice that the frame never completed loading and surface a
 * clear message instead of leaving the browser's own error page on screen. Any
 * real navigation inside the authorized embed clears the message immediately.
 */
export default function EmbedPlayer({
  src,
  title,
  onFatalError,
}: {
  src: string;
  title: string;
  onFatalError?: () => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Give a slow authorized embed a generous window before assuming it refused
    // to load. A successful `onLoad` cancels the timer.
    const timer = window.setTimeout(() => {
      if (!cancelled) setBlocked(true);
    }, 12000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [src]);

  return (
    <div className="embed-player">
      <div className="player-frame">
        <iframe
          ref={frameRef}
          src={src}
          title={title}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          loading="eager"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          onLoad={() => setBlocked(false)}
        />
      </div>
      {blocked && (
        <div className="embed-blocked" role="status">
          <p>
            هذا الموقع لا يسمح بالتضمين داخل إطار. الرجاء استخدام رابط تضمين مصرح به أو رابط بث
            مباشر.
          </p>
          <div className="embed-blocked-actions">
            <a href={src} target="_blank" rel="noopener noreferrer">
              فتح الرابط في نافذة جديدة
            </a>
            <button type="button" onClick={() => { setBlocked(false); onFatalError?.(); }}>
              تجربة مصدر آخر
            </button>
          </div>
        </div>
      )}
    </div>
  );
}