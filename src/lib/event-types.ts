export type EventStatus = "live" | "upcoming" | "ended";

export type StreamReference = {
  provider: string;
  playbackUrl: string;
  status: "live" | "offline" | "scheduled";
  captions?: string;
};

export type EventItem = {
  id: string;
  slug: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  category: { ar: string; en: string };
  categoryKey: string;
  image: string;
  startsAt: string;
  status: EventStatus;
  viewers?: number;
  participants?: { ar: string; en: string };
  stream?: StreamReference;
};

export const categories = [
  { id: "football", ar: "كرة القدم", en: "Football", icon: "◉" },
  { id: "women-football", ar: "كرة القدم النسائية", en: "Women's football", icon: "◎" },
  { id: "futsal", ar: "كرة الصالات", en: "Futsal", icon: "◌" },
  { id: "youth-football", ar: "كرة القدم للشباب", en: "Youth football", icon: "⌁" },
  { id: "football-shows", ar: "برامج كرة القدم", en: "Football shows", icon: "✳" },
];