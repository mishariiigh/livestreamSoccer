"use client";

import Link from "next/link";
import { ArrowLeft, Radio, Search } from "lucide-react";
import { useMemo, useState } from "react";
import EventCard from "@/components/event-card";
import { useLocale } from "@/components/locale-provider";
import type { EventItem } from "@/lib/event-types";

export default function EventListing({ status, initialEvents }: { status: "live" | "upcoming"; initialEvents: EventItem[] }) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => initialEvents.filter((event) => event.status === status && `${event.title.ar} ${event.title.en} ${event.category.ar} ${event.category.en}`.toLowerCase().includes(query.toLowerCase())), [initialEvents, query, status]);
  const heading = status === "live" ? t("liveNow") : t("upcomingEvents");

  return (
    <main className="page-width listing-page">
      <div className="listing-top reveal">
        <div><span className="eyebrow">MADA / {status === "live" ? "ON AIR" : "COMING UP"}</span><h1>{heading}</h1><p>{locale === "ar" ? "كل الفعاليات المعروضة من مصادر مصرح بها للنشر." : "Every event shown is cleared for distribution."}</p></div>
        <form role="search" className="listing-search" onSubmit={(event) => event.preventDefault()}><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></form>
      </div>
      {status === "live" && <div className="listing-status"><Radio size={16} /><span>{locale === "ar" ? "البث متاح الآن" : "Broadcasts available now"}</span><b>{filtered.length.toString().padStart(2, "0")}</b></div>}
      {filtered.length ? <div className="listing-grid">{filtered.map((event) => <EventCard event={event} key={event.id} />)}</div> : <div className="empty-state"><span>{status === "live" ? "00" : "—"}</span><h2>{t("noResults")}</h2><Link href="/">{locale === "ar" ? "العودة للرئيسية" : "Back home"}<ArrowLeft size={15} /></Link></div>}
    </main>
  );
}