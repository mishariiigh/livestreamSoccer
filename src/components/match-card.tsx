"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { useLocale } from "@/components/locale-provider";
import { CompetitionBadge, LiveBadge, StreamBadge, TeamDisplay } from "@/components/ui/primitives";
import type { PublicMatch } from "@/lib/sports/match-types";

/**
 * A single match card, used on the homepage, /live, /upcoming and the admin
 * preview. All data comes from Supabase — nothing here is hard-coded.
 *
 * `variant`:
 *  - "default" — standard grid card
 *  - "featured" — larger hero card
 *  - "compact" — dense row style
 */
export default function MatchCard({
  match,
  variant = "default",
  live = false,
}: {
  match: PublicMatch;
  variant?: "default" | "featured" | "compact";
  live?: boolean;
}) {
  const { locale } = useLocale();

  const dateLabel =
    locale === "ar"
      ? new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeZone: "UTC" }).format(
          new Date(`${match.matchDate}T00:00:00Z`),
        )
      : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(
          new Date(`${match.matchDate}T00:00:00Z`),
        );

  if (variant === "compact") {
    return (
      <Link className="match-row" href={`/match/${match.fixtureId}`}>
        <span className="match-row-time">{match.kickoffLabel}</span>
        <span className="match-row-teams">
          <TeamDisplay name={match.home.name} logo={match.home.logo} size="sm" />
          <TeamDisplay name={match.away.name} logo={match.away.logo} size="sm" />
        </span>
        <span className="match-row-competition">{match.competition}</span>
        {live && <LiveBadge label={locale === "ar" ? "مباشر" : "Live"} />}
        <ArrowUpRight size={15} aria-hidden="true" className="match-row-arrow" />
      </Link>
    );
  }

  return (
    <Link
      className={`match-card match-card-${variant}`}
      href={`/match/${match.fixtureId}`}
      aria-label={`${match.home.name} ${locale === "ar" ? "ضد" : "vs"} ${match.away.name}`}
    >
      <div className="match-card-head">
        <CompetitionBadge competition={match.competition} />
        {live ? <LiveBadge label={locale === "ar" ? "مباشر" : "Live"} /> : <StreamBadge kind={match.hasActiveStream ? "hls" : "external"} />}
      </div>
      <div className="match-card-body">
        <TeamDisplay name={match.home.name} logo={match.home.logo} size={variant === "featured" ? "lg" : "md"} />
        <span className="match-card-versus" aria-hidden="true">
          {locale === "ar" ? "ضد" : "VS"}
        </span>
        <TeamDisplay name={match.away.name} logo={match.away.logo} size={variant === "featured" ? "lg" : "md"} />
      </div>

      <div className="match-card-foot">
        <span className="match-card-kickoff">
          <CalendarDays size={13} aria-hidden="true" />
          <span className="ltr">{match.kickoffLabel}</span>
          <span className="match-card-date">{dateLabel}</span>
        </span>
        <span className="match-card-cta">
          {match.hasActiveStream
            ? locale === "ar" ? "مشاهدة الآن" : "Watch now"
            : locale === "ar" ? "التفاصيل" : "Details"}
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
