"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import EventCard from "@/components/event-card";
import { useLocale } from "@/components/locale-provider";
import { categories, type EventItem } from "@/lib/event-types";

export default function SearchResults({ initialQuery = "", initialCategory = "", initialEvents }: { initialQuery?: string; initialCategory?: string; initialEvents: EventItem[] }) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const results = useMemo(() => initialEvents.filter((event) => {
    const matchesText = `${event.title.ar} ${event.title.en} ${event.description.ar} ${event.description.en}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (!category || event.categoryKey === category);
  }), [category, initialEvents, query]);

  return (
    <main className="page-width listing-page search-page">
      <div className="listing-top"><div><span className="eyebrow">MADA / DISCOVER</span><h1>{t("searchTitle")}</h1><p>{results.length} {t("events")}</p></div><label className="listing-search"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} /></label></div>
      <div className="filter-row"><button className={category === "" ? "filter-chip selected" : "filter-chip"} onClick={() => setCategory("")}>{t("allEvents")}</button>{categories.map((item) => <button key={item.id} className={category === item.id ? "filter-chip selected" : "filter-chip"} onClick={() => setCategory(item.id)}>{item[locale]}</button>)}</div>
      {results.length ? <div className="listing-grid">{results.map((event) => <EventCard event={event} key={event.id} />)}</div> : <div className="empty-state"><span>00</span><h2>{t("noResults")}</h2></div>}
    </main>
  );
}