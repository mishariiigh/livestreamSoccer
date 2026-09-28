"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, Eye, Radio, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import HlsPlayer from "@/components/hls-player";
import { useLocale } from "@/components/locale-provider";
import EventCard from "@/components/event-card";
import type { EventItem } from "@/lib/event-types";

type LocalAd = { id: string; name: string; type: string; imageUrl?: string; videoUrl?: string; destinationUrl?: string; htmlCode?: string; active: boolean; startDate?: string; endDate?: string };
type ApiAd = { id: string; name: string; type: string; image_url?: string; video_url?: string; destination_url?: string; html_code?: string; start_date?: string; end_date?: string };

function isCurrent(ad: LocalAd) {
  const now = Date.now();
  return ad.active && (!ad.startDate || new Date(ad.startDate).getTime() <= now) && (!ad.endDate || new Date(ad.endDate).getTime() >= now);
}

export default function WatchPage({ event, relatedEvents }: { event: EventItem; relatedEvents: EventItem[] }) {
  const { locale, t } = useLocale();
  const [activeAd, setActiveAd] = useState<LocalAd | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [adResolved, setAdResolved] = useState(false);
  const [shared, setShared] = useState(false);
  const related = relatedEvents.filter((item) => item.id !== event.id).slice(0, 2);
  const stream = event.stream?.status === "live" ? event.stream : undefined;
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  useEffect(() => {
    const startedAt = Date.now();
    let visitorId = window.localStorage.getItem("mada-visitor-id");
    if (!visitorId || !/^[0-9a-f-]{36}$/i.test(visitorId)) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem("mada-visitor-id", visitorId);
    }
    const visitId = crypto.randomUUID();
    const userAgent = navigator.userAgent;
    const deviceType = /ipad|tablet/i.test(userAgent) ? "tablet" : /mobile|iphone|android/i.test(userAgent) ? "mobile" : "desktop";
    const browser = /firefox/i.test(userAgent) ? "Firefox" : /edg/i.test(userAgent) ? "Edge" : /chrome|chromium/i.test(userAgent) ? "Chromium" : /safari/i.test(userAgent) ? "Safari" : "Other";
    let referrerHost = "";
    try { referrerHost = document.referrer ? new URL(document.referrer).host : ""; } catch { referrerHost = ""; }
    const eventId = /^[0-9a-f-]{36}$/i.test(event.id) ? event.id : undefined;
    void fetch("/api/analytics/view", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visitId, visitorId, eventId, deviceType, browser, referrerHost }) }).catch(() => undefined);
    const heartbeat = () => {
      const durationSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      void fetch("/api/analytics/heartbeat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ visitId, durationSeconds }), keepalive: true }).catch(() => undefined);
    };
    window.addEventListener("pagehide", heartbeat, { once: true });
    return () => { window.removeEventListener("pagehide", heartbeat); heartbeat(); };
  }, [event.id]);

  useEffect(() => {
    const seenKey = `mada-ad-seen:${event.slug}`;
    const activate = (ad: LocalAd | null) => {
      if (ad && isCurrent(ad) && !window.sessionStorage.getItem(seenKey)) {
        setActiveAd(ad);
        setShowAd(true);
        window.sessionStorage.setItem(seenKey, "1");
        void fetch("/api/ads/impression", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ adId: ad.id }) }).catch(() => undefined);
      }
      setAdResolved(true);
    };
    if (hasSupabase) {
      void fetch("/api/ads/active?type=pre-roll", { cache: "no-store" }).then((response) => response.json()).then(({ data }: { data: ApiAd | null }) => activate(data ? { id: data.id, name: data.name, type: data.type, imageUrl: data.image_url, videoUrl: data.video_url, destinationUrl: data.destination_url, htmlCode: data.html_code, active: true, startDate: data.start_date, endDate: data.end_date } : null)).catch(() => setAdResolved(true));
    } else {
      window.setTimeout(() => activate(null), 0);
    }
  }, [event.id, event.slug, hasSupabase]);

  async function share() {
    if (navigator.share) await navigator.share({ title: event.title[locale], url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); setShared(true); window.setTimeout(() => setShared(false), 1600); }
  }

  function recordClick() {
    if (!activeAd) return;
    void fetch("/api/ads/click", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ adId: activeAd.id, eventId: event.id }) }).catch(() => undefined);
  }

  return (
    <main className="page-width watch-page">
      <div className="watch-heading"><div><span className="eyebrow">MADA / LIVE ROOM</span><h1>{event.title[locale]}</h1></div><span className="watch-live"><i /> {t("liveNow")}</span></div>
      <div className="watch-layout">
        <section className="watch-main">
          {!adResolved ? <div className="ad-checking" role="status">{locale === "ar" ? "جارٍ التحقق من الإعلان…" : "Checking ad placement…"}</div> : showAd && activeAd ? <div className="ad-gate">
            <div className="ad-gate-top"><span className="ad-label">{t("ad")}</span><span>{locale === "ar" ? "إعلان واحد قبل البث" : "One ad before the stream"}</span></div>
            <div className="ad-creative">
              {activeAd.imageUrl && <a className="ad-image-link" href={activeAd.destinationUrl || undefined} target={activeAd.destinationUrl ? "_blank" : undefined} rel="sponsored noreferrer" onClick={activeAd.destinationUrl ? recordClick : undefined} aria-label={activeAd.name} style={{ backgroundImage: `url("${activeAd.imageUrl}")` }} />}
              {activeAd.videoUrl && <video controls playsInline preload="metadata" src={activeAd.videoUrl} aria-label={activeAd.name} />}
              {!activeAd.imageUrl && !activeAd.videoUrl && !activeAd.htmlCode && <div className="ad-empty"><span>AD</span><strong>{activeAd.name}</strong></div>}
              {activeAd.htmlCode && <iframe className="ad-code-frame" title={activeAd.name} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; script-src https: 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'"><meta name="viewport" content="width=device-width,initial-scale=1">${activeAd.htmlCode}`} />}
              {activeAd.destinationUrl && <a className="ad-destination" href={activeAd.destinationUrl} target="_blank" rel="sponsored noreferrer" onClick={recordClick}>{locale === "ar" ? "زيارة المعلن" : "Visit advertiser"}<ArrowUpLeft size={14} /></a>}
            </div>
            <div className="ad-gate-bottom"><p>{locale === "ar" ? "بعد مشاهدة الإعلان أو تجاوزه، يمكنك متابعة البث." : "Continue to the live stream whenever you’re ready."}</p><button className="primary-action" onClick={() => setShowAd(false)}>{locale === "ar" ? "متابعة إلى البث" : "Continue to live stream"}<ArrowUpLeft size={17} /></button></div>
          </div> : stream?.playbackUrl ? <HlsPlayer src={stream.playbackUrl} title={event.title[locale]} captions={stream.captions} /> : <div className="stream-offline"><Radio size={24} /><h2>{locale === "ar" ? "البث غير متاح حالياً" : "The stream is not available yet"}</h2><p>{locale === "ar" ? "لا يوجد مصدر بث مصرح به ومفعّل لهذه المباراة." : "No authorized and enabled stream is configured for this match."}</p><Link href={`/events/${event.slug}`}>{t("details")} <ArrowLeft size={15} /></Link></div>}
          <div className="watch-event-info"><div className="watch-event-title"><h2>{event.title[locale]}</h2><span className="watch-live"><i /> LIVE</span></div><div className="watch-meta"><span><Eye size={15} /> {event.viewers?.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")} {t("minutes")}</span><span>{event.category[locale]}</span><button onClick={share}><Share2 size={15} />{shared ? (locale === "ar" ? "تم النسخ" : "Copied") : t("share")}</button></div><p>{event.description[locale]}</p></div>
          <section className="watch-related"><div className="section-heading"><div><span className="eyebrow">MORE TO WATCH</span><h2>{t("related")}</h2></div><Link href="/live">{t("browseAll")} <ArrowLeft size={15} /></Link></div><div className="event-grid two-grid">{related.map((item) => <EventCard key={item.id} event={item} />)}</div></section>
        </section>
        <aside className="watch-side"><div className="watch-event-aside"><span className="eyebrow">{locale === "ar" ? "معلومات المباراة" : "MATCH DETAILS"}</span><strong>{event.title[locale]}</strong><span>{event.category[locale]}</span></div><Link href={`/events/${event.slug}`} className="watch-event-link">{locale === "ar" ? "صفحة المباراة" : "Match page"}<ArrowLeft size={15} /></Link></aside>
      </div>
    </main>
  );
}