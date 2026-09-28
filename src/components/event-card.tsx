"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, Eye, Goal } from "lucide-react";
import type { EventItem } from "@/lib/event-types";
import { useLocale } from "@/components/locale-provider";

function formatStart(iso: string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

export default function EventCard({ event, featured = false }: { event: EventItem; featured?: boolean }) {
  const { locale, t } = useLocale();
  const title = event.title[locale];
  const isLive = event.status === "live";

  return (
    <article className={featured ? "event-card event-card-featured" : "event-card"}>
      <Link className="event-image-link" href={`/events/${event.slug}`} aria-label={title}>
        <div className="event-image-wrap">
          {event.image ? <Image src={event.image} alt="" fill sizes={featured ? "(max-width: 700px) 90vw, 55vw" : "(max-width: 700px) 85vw, 30vw"} className="event-image" /> : <div className="event-no-image"><Goal size={25} /><span>{event.category[locale]}</span></div>}
          {isLive && <span className="live-pill"><i /> LIVE</span>}
          {event.status === "upcoming" && <span className="event-time">{formatStart(event.startsAt, locale)}</span>}
          <span className="image-arrow"><ArrowUpLeft size={17} /></span>
        </div>
      </Link>
      <div className="event-card-info">
        <div className="event-card-topline">
          <span className="category-label">{event.category[locale]}</span>
          {isLive && event.viewers && <span className="viewer-count"><Eye size={13} /> {event.viewers.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}</span>}
        </div>
        <Link href={`/events/${event.slug}`} className="event-title">{title}</Link>
        {event.participants && <p className="event-participants">{event.participants[locale]}</p>}
        {isLive && <Link className="card-watch" href={`/watch/${event.slug}`}>{t("watchLive")} <ArrowUpLeft size={15} /></Link>}
      </div>
    </article>
  );
}