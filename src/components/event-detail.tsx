"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, CalendarDays, Clock3, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import EventCard from "@/components/event-card";
import { useLocale } from "@/components/locale-provider";
import type { EventItem } from "@/lib/event-types";

function remainingTime(startsAt: string, locale: "ar" | "en") {
  const seconds = Math.max(0, Math.floor((new Date(startsAt).getTime() - Date.now()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const nums = (value: number) => value.toString().padStart(2, "0");
  return { days: nums(days), hours: nums(hours), minutes: nums(minutes), label: locale === "ar" ? "يوم" : "days" };
}

export default function EventDetail({ event, relatedEvents }: { event: EventItem; relatedEvents: EventItem[] }) {
  const { locale, t } = useLocale();
  const [countdown, setCountdown] = useState(() => remainingTime(event.startsAt, locale));
  const [shared, setShared] = useState(false);
  const related = relatedEvents.filter((item) => item.id !== event.id && item.categoryKey === event.categoryKey).slice(0, 2);
  const isLive = event.status === "live";
  const date = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(event.startsAt));
  const schema = JSON.stringify({
    "@context": "https://schema.org", "@type": "SportsEvent", name: event.title[locale], startDate: event.startsAt,
    description: event.description[locale], image: event.image, eventStatus: isLive ? "https://schema.org/EventInProgress" : "https://schema.org/EventScheduled",
    location: { "@type": "VirtualLocation", url: `https://mada.live/events/${event.slug}` },
    organizer: { "@type": "Organization", name: "Mada Live" },
  }).replace(/</g, "\\u003c");

  useEffect(() => {
    if (isLive) return;
    const timer = window.setInterval(() => setCountdown(remainingTime(event.startsAt, locale)), 60_000);
    return () => window.clearInterval(timer);
  }, [event.startsAt, isLive, locale]);

  async function shareEvent() {
    if (navigator.share) await navigator.share({ title: event.title[locale], url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); setShared(true); window.setTimeout(() => setShared(false), 1800); }
  }

  return (
    <main className="page-width detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />
      <div className="detail-hero reveal">
        {event.image && <Image src={event.image} alt="" fill priority sizes="100vw" className="detail-cover" />}
        <div className="detail-scrim" />
        <div className="detail-meta"><span>{event.category[locale]}</span><span>·</span><span>{locale === "ar" ? "مصدر مصرح به" : "Authorized source"}</span>{isLive && <span className="live-pill"><i /> LIVE</span>}</div>
        <div className="detail-title-wrap"><h1>{event.title[locale]}</h1>{event.participants && <p>{event.participants[locale]}</p>}</div>
      </div>
      <div className="detail-columns">
        <section className="detail-main">
          <div className="detail-date"><CalendarDays size={17} /><span>{date}</span><span className="date-divider" /><Clock3 size={16} /><span>{locale === "ar" ? "توقيت الرياض" : "Riyadh time"}</span></div>
          <h2>{t("description")}</h2><p className="detail-description">{event.description[locale]}</p>
          <div className="detail-actions"><Link href={isLive ? `/watch/${event.slug}` : `/watch/${event.slug}`} className="primary-action">{isLive ? t("watchLive") : locale === "ar" ? "صفحة المشاهدة" : "Watch page"}<ArrowUpLeft size={17} /></Link><button className="secondary-action" onClick={shareEvent}><Share2 size={16} />{shared ? (locale === "ar" ? "تم النسخ" : "Copied") : t("share")}</button></div>
          {!isLive && <div className="countdown"><div><span>{countdown.days}</span><small>{countdown.label}</small></div><b>:</b><div><span>{countdown.hours}</span><small>{locale === "ar" ? "ساعة" : "hours"}</small></div><b>:</b><div><span>{countdown.minutes}</span><small>{locale === "ar" ? "دقيقة" : "minutes"}</small></div></div>}
        </section>
        <aside className="detail-aside"><span className="eyebrow">{locale === "ar" ? "معلومات الفعالية" : "EVENT INFORMATION"}</span><div><span>{locale === "ar" ? "التصنيف" : "Category"}</span><strong>{event.category[locale]}</strong></div><div><span>{locale === "ar" ? "الحالة" : "Status"}</span><strong className={isLive ? "text-live" : ""}>{isLive ? t("liveNow") : t("upcoming")}</strong></div><div><span>{locale === "ar" ? "المشاهدة" : "Viewing"}</span><strong>{locale === "ar" ? "متاحة للجميع" : "Open to everyone"}</strong></div><button onClick={shareEvent}><Share2 size={15} />{t("share")}</button></aside>
      </div>
      {related.length > 0 && <section className="content-section related-events"><div className="section-heading"><div><span className="eyebrow">MORE FROM {event.categoryKey.toUpperCase()}</span><h2>{t("related")}</h2></div><Link href="/upcoming">{t("browseAll")} <ArrowLeft size={15} /></Link></div><div className="event-grid three-grid">{related.map((item) => <EventCard key={item.id} event={item} />)}</div></section>}
    </main>
  );
}