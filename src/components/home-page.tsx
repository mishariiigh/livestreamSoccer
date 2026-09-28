"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpLeft, CalendarDays, Radio, Search } from "lucide-react";
import { useMemo, useState } from "react";
import EventCard from "@/components/event-card";
import { useLocale } from "@/components/locale-provider";
import { categories, type EventItem } from "@/lib/event-types";

export default function HomePage({ initialEvents }: { initialEvents: EventItem[] }) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const live = initialEvents.filter((event) => event.status === "live");
  const upcoming = initialEvents.filter((event) => event.status === "upcoming");
  const hero = live[0];
  const searchResults = useMemo(() => initialEvents.filter((event) => `${event.title.ar} ${event.title.en}`.toLowerCase().includes(query.toLowerCase())), [initialEvents, query]);

  return (
    <main>
      <section className="home-intro page-width reveal">
        <div className="intro-copy">
          <span className="intro-kicker"><span className="kicker-dot" /> {locale === "ar" ? "كرة قدم مباشرة من مصادر مصرح بها" : "Live soccer from authorized sources"}</span>
          <h1>{locale === "ar" ? <>كرة القدم،<br /><em>مباشرة.</em></> : <>Soccer,<br /><em>live.</em></>}</h1>
          <p>{locale === "ar" ? "تابع مباريات وبرامج كرة القدم المنشورة من جهات تملك حقوق التوزيع." : "Watch soccer matches and shows published by rights-authorized broadcasters."}</p>
          <form className="home-search" role="search" onSubmit={(event) => { event.preventDefault(); router.push(`/search?q=${encodeURIComponent(query.trim())}`); }}>
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} aria-label={t("search")} />
            <button aria-label={t("search")} type="submit"><ArrowLeft size={17} /></button>
          </form>
          {query && <div className="quick-results">{searchResults.slice(0, 3).map((event) => <Link key={event.id} href={`/events/${event.slug}`}>{event.title[locale]} <ArrowUpLeft size={14} /></Link>)}</div>}
        </div>
        {hero ? <Link href={`/watch/${hero.slug}`} className="hero-feature">
          {hero.image && <Image src={hero.image} alt="" fill priority sizes="(max-width: 760px) 100vw, 54vw" />}
          <div className="hero-scrim" />
          <span className="live-pill hero-live"><i /> LIVE <b>{hero.viewers?.toLocaleString(locale === "ar" ? "ar-SA" : "en-US")}</b></span>
          <div className="hero-feature-copy">
            <span className="hero-category">{hero.category[locale]}</span>
            <h2>{hero.title[locale]}</h2>
            <p>{hero.participants?.[locale]}</p>
            <span className="hero-cta">{t("watchLive")} <ArrowUpLeft size={17} /></span>
          </div>
          <span className="hero-index">01 <span>/ 05</span></span>
        </Link> : <div className="hero-empty"><Image src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1400&q=85" alt="" fill priority sizes="(max-width: 760px) 100vw, 54vw" /><span className="hero-empty-label">{locale === "ar" ? "منصة كرة القدم" : "SOCCER NETWORK"}</span><div><Radio size={17} /><strong>{locale === "ar" ? "لا توجد مباريات منشورة حالياً" : "No published matches right now"}<small>{locale === "ar" ? "ستظهر المواعيد المعتمدة هنا." : "Authorized fixtures will appear here."}</small></strong></div></div>}
      </section>

      <section className="content-section page-width">
        <div className="section-heading"><div><span className="eyebrow">01 / ON AIR</span><h2>{t("liveNow")}</h2></div><Link href="/live">{t("browseAll")} <ArrowLeft size={15} /></Link></div>
        {live.length ? <div className="event-grid live-grid">{live.map((event) => <EventCard event={event} key={event.id} featured />)}<Link href="/live" className="live-note"><span className="note-symbol">↗</span><span className="eyebrow">{locale === "ar" ? "كل المباريات المباشرة" : "ALL LIVE MATCHES"}</span><strong>{locale === "ar" ? "كرة القدم\nفي وقتها" : "Soccer in\nreal time"}<ArrowUpLeft /></strong><span>{locale === "ar" ? "اكتشف البث المباشر" : "Explore live streams"} <ArrowLeft size={14} /></span></Link></div> : <div className="catalog-empty"><Radio size={18} /><span>{locale === "ar" ? "لا توجد مباريات مباشرة الآن." : "No matches are live right now."}</span><Link href="/upcoming">{locale === "ar" ? "عرض الجدول" : "View schedule"}<ArrowLeft size={14} /></Link></div>}
      </section>

      <section className="content-section page-width">
        <div className="section-heading"><div><span className="eyebrow">02 / NEXT UP</span><h2>{t("startingSoon")}</h2></div><Link href="/upcoming">{t("schedule")} <CalendarDays size={15} /></Link></div>
        {upcoming.length ? <div className="event-grid three-grid">{upcoming.slice(0, 3).map((event) => <EventCard event={event} key={event.id} />)}</div> : <div className="catalog-empty"><CalendarDays size={18} /><span>{locale === "ar" ? "لا توجد مباريات قادمة منشورة." : "No upcoming matches have been published."}</span><Link href="/upcoming">{locale === "ar" ? "جدول المباريات" : "Match schedule"}<ArrowLeft size={14} /></Link></div>}
      </section>

      <section className="category-section">
        <div className="page-width">
          <div className="section-heading"><div><span className="eyebrow">03 / FIND YOUR THING</span><h2>{t("categories")}</h2></div></div>
          <div className="category-grid">{categories.map((category, index) => <Link className="category-tile" href={`/search?category=${category.id}`} key={category.id}><span className={`category-icon category-icon-${index}`}>{category.icon}</span><span>{category[locale]}</span><ArrowUpLeft size={16} /></Link>)}</div>
        </div>
      </section>

      <section className="content-section page-width final-section">
        <div className="section-heading"><div><span className="eyebrow">04 / MARK YOUR CALENDAR</span><h2>{t("upcomingEvents")}</h2></div><Link href="/upcoming">{t("browseAll")} <ArrowLeft size={15} /></Link></div>
        <div className="upcoming-list">{upcoming.slice(3).map((event) => <EventCard event={event} key={event.id} />)}
          <div className="schedule-empty"><span>FIXTURES</span><p>{locale === "ar" ? "ستظهر هنا المباريات التي تنشرها الجهات المالكة للحقوق." : "Matches published by rights holders will appear here."}</p><Link href="/upcoming">{locale === "ar" ? "جدول المباريات" : "Match schedule"}<ArrowLeft size={14} /></Link></div>
        </div>
      </section>
    </main>
  );
}