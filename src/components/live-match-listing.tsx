"use client";

import Link from "next/link";
import { CalendarDays, Radio, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { formatMatchDate, type PublicMatch } from "@/lib/sports/match-types";

/**
 * Live matches listing.
 *
 * Shows only published matches that have an active authorized stream. There is
 * no score feed and no polling: the data comes from Supabase on each request.
 */
export default function LiveMatchListing({ matches, error }: { matches: PublicMatch[]; error: boolean }) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      matches.filter((match) =>
        `${match.home.name} ${match.away.name} ${match.competition} ${match.fixtureId}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [matches, query],
  );

  return (
    <main className="page-width listing-page">
      <div className="listing-top reveal">
        <div>
          <span className="eyebrow">MADA / ON AIR</span>
          <h1>{t("liveNow")}</h1>
          <p>{locale === "ar" ? "المباريات المنشورة التي يتوفر لها بث مصرح به." : "Published matches with an authorized stream available."}</p>
        </div>
        <form role="search" className="listing-search" onSubmit={(event) => event.preventDefault()}>
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("search")} />
        </form>
      </div>
      <div className="listing-status">
        <Radio size={16} />
        <span>{locale === "ar" ? "البث متاح الآن" : "Streams available now"}</span>
        <b>{filtered.length.toString().padStart(2, "0")}</b>
      </div>
      {error ? (
        <div className="empty-state">
          <span>!</span>
          <h2>{locale === "ar" ? "تعذر تحميل المباريات حالياً." : "Matches are temporarily unavailable."}</h2>
          <Link href="/">{locale === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
        </div>
      ) : filtered.length ? (
        <div className="listing-grid">
          {filtered.map((match) => (
            <Link className="public-fixture-card" href={`/match/${match.fixtureId}`} key={match.fixtureId}>
              <div className="public-fixture-card-top">
                <span className="public-fixture-competition">{match.competition}</span>
                <span className="public-fixture-status live"><i />{locale === "ar" ? "البث متاح" : "Stream ready"}</span>
              </div>
              <div className="public-fixture-teams">
                <div className="public-fixture-team">
                  <span aria-hidden="true" style={match.home.logo ? { backgroundImage: `url("${match.home.logo}")` } : undefined} />
                  <strong>{match.home.name}</strong>
                </div>
                <span className="public-fixture-versus">VS</span>
                <div className="public-fixture-team">
                  <span aria-hidden="true" style={match.away.logo ? { backgroundImage: `url("${match.away.logo}")` } : undefined} />
                  <strong>{match.away.name}</strong>
                </div>
              </div>
              <div className="public-fixture-kickoff">
                <CalendarDays size={13} />
                {formatMatchDate(match.matchDate, locale)} · {match.kickoffLabel}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>00</span>
          <h2>{locale === "ar" ? "لا توجد مباريات ببث متاح حالياً." : "No matches with an available stream right now."}</h2>
          <Link href="/">{locale === "ar" ? "العودة للرئيسية" : "Back home"}</Link>
        </div>
      )}
    </main>
  );
}