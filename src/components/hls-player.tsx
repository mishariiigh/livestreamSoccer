"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

export default function HlsPlayer({ src, title, captions, onFatalError }: { src: string; title: string; captions?: string; onFatalError?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let disposed = false;
    setMessage("");

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const handleNativeError = () => {
        setMessage("تعذر تحميل البث. حاول إعادة الاتصال.");
        onFatalError?.();
      };
      video.addEventListener("error", handleNativeError, { once: true });
      void video.play().catch(() => undefined);
      return () => { video.pause(); video.removeEventListener("error", handleNativeError); video.removeAttribute("src"); video.load(); };
    }

    if (!Hls.isSupported()) {
      window.setTimeout(() => setMessage("هذا المتصفح لا يدعم تشغيل HLS."), 0);
      return;
    }

    const hls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 30, backBufferLength: 30 });
    hlsRef.current = hls;
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!disposed) void video.play().catch(() => undefined); });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (disposed || !data.fatal) return;
      setMessage("انقطع الاتصال بالبث. جارٍ إعادة المحاولة…");
      onFatalError?.();
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
      else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      else {
        hls.destroy();
        hlsRef.current = null;
        window.setTimeout(() => { if (!disposed) setRetry((value) => value + 1); }, 1800);
      }
    });

    return () => { disposed = true; hls.destroy(); hlsRef.current = null; };
  }, [onFatalError, src, retry]);

  return (
    <div className="player-frame">
      <video ref={videoRef} controls playsInline preload="metadata" aria-label={title}>
        {captions && <track kind="captions" src={captions} srcLang="ar" label="العربية" default />}
      </video>
      {message && <div className="player-message" role="status"><span>{message}</span><button onClick={() => setRetry((value) => value + 1)}>إعادة المحاولة</button></div>}
    </div>
  );
}