import Link from "next/link";
import { ArrowLeft, ExternalLink, Radio } from "lucide-react";
import { notFound } from "next/navigation";
import FixtureStreamPlayer from "@/components/fixture-stream-player";
import { getAuthorizedStream } from "@/lib/streaming/fixture-service";
import { getOfficialWatchLinks } from "@/lib/streaming/official-watch-links";
import { getPublicMatchByFixtureId } from "@/lib/sports/matches";
import { formatKickoffTime, formatMatchDate } from "@/lib/sports/match-types";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: PageProps<"/match/[fixtureId]">) {
  const { fixtureId } = await params;
  const match = await getPublicMatchByFixtureId(fixtureId);
  if (!match) notFound();

  const [officialWatchLinks, authorizedStreams] = await Promise.all([
    getOfficialWatchLinks(match.fixtureId).catch(() => []),
    getAuthorizedStream(match.fixtureId).catch(() => ({ primary: null, fallbacks: [] })),
  ]);

  return (
    <main className="page-width live-match-page">
      <Link className="live-match-back" href="/"><ArrowLeft size={15} /> العودة إلى المباريات</Link>
      <section className="live-match-panel">
        <div className="live-match-heading">
          <div><span className="eyebrow">FIXTURE {match.fixtureId}</span><h1>{match.competition}</h1></div>
          <span className="live-match-status">{formatMatchDate(match.matchDate)}</span>
        </div>
        <div className="live-match-scoreboard">
          <div className="live-match-team">
            <span className="live-match-logo" aria-hidden="true" style={match.home.logo ? { backgroundImage: `url("${match.home.logo}")` } : undefined} />
            <strong>{match.home.name}</strong>
          </div>
          <div className="live-match-versus">VS</div>
          <div className="live-match-team">
            <span className="live-match-logo" aria-hidden="true" style={match.away.logo ? { backgroundImage: `url("${match.away.logo}")` } : undefined} />
            <strong>{match.away.name}</strong>
          </div>
        </div>
        <p className="live-match-date">{formatKickoffTime(match.kickoffTime)} · توقيت الرياض</p>
        {officialWatchLinks.length > 0 && (
          <section className="official-watch-links" aria-label="Official broadcaster links">
            <h2>Official broadcasters by country/region</h2>
            <div className="official-watch-link-list">
              {officialWatchLinks.map((link) => (
                <div className="official-watch-link" key={link.id}>
                  <div>
                    <span className="eyebrow">{link.country_region}</span>
                    <strong>{link.broadcaster_name}</strong>
                  </div>
                  <a className="primary-action official-watch-action" href={link.official_watch_url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
                    Watch on Official Broadcaster <ExternalLink size={15} />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
        {authorizedStreams.primary ? (
          <FixtureStreamPlayer streams={authorizedStreams} title={`${match.home.name} vs ${match.away.name}`} />
        ) : officialWatchLinks.length === 0 ? (
          <div className="fixture-stream-empty" role="status">
            <Radio size={17} />
            <span>البث غير متاح حالياً</span>
          </div>
        ) : null}
      </section>
    </main>
  );
}