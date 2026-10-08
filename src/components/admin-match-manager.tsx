"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  LogOut,
  Minus,
  Pencil,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { COMPETITIONS } from "@/lib/sports/competitions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FixtureStreamType } from "@/lib/streaming/fixture-stream-types";

/**
 * The single admin surface: create and manage a match together with its stream.
 *
 * Everything is stored in Supabase (`public.matches` and `public.fixture_streams`).
 * No external football API is used anywhere, and no match or stream URL is
 * hard-coded in this component.
 */

type ManagedMatch = {
  id: string;
  fixtureId: string;
  matchDate: string;
  kickoffTime: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

type ManagedStream = {
  id: string;
  fixtureId: string;
  streamType: FixtureStreamType;
  streamUrl: string;
  providerName: string;
  active: boolean;
  priority: number;
};

const EMPTY_STREAM = {
  streamType: "hls" as FixtureStreamType,
  streamUrl: "",
  providerName: "",
  active: true,
  priority: "1",
};

/** Calendar date (YYYY-MM-DD) in the project timezone. */
function scheduleDate(offsetDays = 0) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = formatter.formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const base = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offsetDays));
  return base.toISOString().slice(0, 10);
}

function mapMatch(row: Record<string, unknown>): ManagedMatch {
  return {
    id: String(row.id),
    fixtureId: String(row.fixture_id),
    matchDate: String(row.match_date),
    kickoffTime: String(row.kickoff_time).slice(0, 5),
    competition: String(row.competition),
    homeTeam: String(row.home_team),
    awayTeam: String(row.away_team),
    homeTeamLogo: String(row.home_team_logo ?? ""),
    awayTeamLogo: String(row.away_team_logo ?? ""),
    published: Boolean(row.published),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapStream(row: Record<string, unknown>): ManagedStream {
  return {
    id: String(row.id),
    fixtureId: String(row.fixture_id),
    streamType: String(row.stream_type) as FixtureStreamType,
    streamUrl: String(row.stream_url),
    providerName: String(row.provider_name),
    active: Boolean(row.active),
    priority: Number(row.priority),
  };
}

/** Newest/upcoming first: date, then kickoff time. */
function compareMatches(first: ManagedMatch, second: ManagedMatch) {
  return (
    first.matchDate.localeCompare(second.matchDate) ||
    first.kickoffTime.localeCompare(second.kickoffTime) ||
    first.createdAt.localeCompare(second.createdAt)
  );
}

/** Highest priority first, so the preferred source is listed and selected first. */
function compareStreams(first: ManagedStream, second: ManagedStream) {
  return second.priority - first.priority || first.streamUrl.localeCompare(second.streamUrl);
}

export default function AdminConsole() {
  const router = useRouter();
  const [matches, setMatches] = useState<ManagedMatch[]>([]);
  const [streams, setStreams] = useState<ManagedStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [draft, setDraft] = useState({
    matchDate: scheduleDate(),
    kickoffTime: "19:30",
    competition: COMPETITIONS[0] as string,
    homeTeam: "",
    awayTeam: "",
    homeTeamLogo: "",
    awayTeamLogo: "",
    published: true,
    ...EMPTY_STREAM,
  });

  useEffect(() => {
    void Promise.all(
      ["matches", "fixture-streams"].map((resource) =>
        fetch(`/api/admin/${resource}`, { cache: "no-store" }).then(async (response) => ({
          resource,
          ok: response.ok,
          result: await response.json().catch(() => ({})),
        })),
      ),
    )
      .then((results) => {
        for (const { resource, ok, result } of results) {
          if (!ok) throw new Error("Could not load the schedule.");
          const rows = Array.isArray(result.data) ? (result.data as Record<string, unknown>[]) : [];
          if (resource === "matches") setMatches(rows.map(mapMatch).sort(compareMatches));
          if (resource === "fixture-streams") setStreams(rows.map(mapStream));
        }
        setLoadError("");
      })
      .catch(() => setLoadError("تعذر تحميل المباريات من قاعدة البيانات."))
      .finally(() => setLoading(false));
  }, []);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  async function signOut() {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) {
      flash("تعذر تسجيل الخروج.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  async function requestAdmin(path: string, method: string, body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(typeof result.error === "string" ? result.error : "تعذر تنفيذ العملية.");
    }
    return result.data as Record<string, unknown> | undefined;
  }

  function resetDraft() {
    setEditingMatch(null);
    setEditingStreamId(null);
    setDraft((current) => ({
      ...current,
      homeTeam: "",
      awayTeam: "",
      homeTeamLogo: "",
      awayTeamLogo: "",
      ...EMPTY_STREAM,
    }));
  }

  /** Validates the stream half of the form and returns the API payload. */
  function readStreamFields(fixtureId: string) {
    const rawUrl = draft.streamUrl.trim();
    if (!rawUrl) return { fields: null, hasStream: false } as const;

    let url: URL;
    try {
      url = new URL(rawUrl);
      if (url.protocol !== "https:") throw new Error();
    } catch {
      throw new Error("أدخل رابط بث آمن يبدأ بـ https://.");
    }
    if (draft.streamType === "hls" && !url.pathname.toLowerCase().endsWith(".m3u8")) {
      throw new Error("روابط HLS يجب أن تنتهي بـ .m3u8.");
    }

    const priority = Number(draft.priority);
    if (!Number.isInteger(priority) || priority < 0 || priority > 10000) {
      throw new Error("الأولوية يجب أن تكون رقماً بين 0 و10000.");
    }
    if (!draft.providerName.trim()) {
      throw new Error("أدخل اسم مزود البث.");
    }

    return {
      hasStream: true,
      fields: {
        fixture_id: fixtureId,
        stream_type: draft.streamType,
        stream_url: url.toString(),
        provider_name: draft.providerName.trim(),
        active: draft.active,
        priority,
      },
    } as const;
  }

  async function saveStream(fixtureId: string) {
    let parsed: ReturnType<typeof readStreamFields>;
    try {
      parsed = readStreamFields(fixtureId);
    } catch (error) {
      flash(error instanceof Error ? error.message : "تحقق من إعدادات البث.");
      return;
    }
    if (!parsed.fields) return;

    const row = await requestAdmin(
      "/api/admin/fixture-streams",
      editingStreamId ? "PATCH" : "POST",
      editingStreamId ? { id: editingStreamId, ...parsed.fields } : parsed.fields,
    );
    if (!row) throw new Error("تعذر حفظ مصدر البث.");
    const item = mapStream(row);
    setStreams((current) => [...current.filter((stream) => stream.id !== item.id), item]);
  }

  async function submitMatch(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    if (!draft.matchDate || !draft.kickoffTime || !draft.homeTeam.trim() || !draft.awayTeam.trim()) {
      flash("أكمل التاريخ ووقت البداية والفريقين.");
      return;
    }

    setSaving(true);
    try {
      const matchFields = {
        match_date: draft.matchDate,
        kickoff_time: draft.kickoffTime,
        competition: draft.competition,
        home_team: draft.homeTeam.trim(),
        away_team: draft.awayTeam.trim(),
        home_team_logo: draft.homeTeamLogo.trim() || null,
        away_team_logo: draft.awayTeamLogo.trim() || null,
        published: draft.published,
      };

      // Validate the stream before writing anything, so a bad URL cannot leave a
      // match saved without the stream the administrator intended to attach.
      if (draft.streamUrl.trim()) readStreamFields(editingMatch ?? "PENDING");

      const row = await requestAdmin(
        editingMatch ? `/api/admin/matches/${editingMatch}` : "/api/admin/matches",
        editingMatch ? "PATCH" : "POST",
        matchFields,
      );
      if (!row) throw new Error("تعذر حفظ المباراة.");
      const item = mapMatch(row);

      setMatches((current) =>
        (editingMatch
          ? current.map((match) => (match.fixtureId === item.fixtureId ? item : match))
          : [...current, item]
        ).sort(compareMatches),
      );

      await saveStream(item.fixtureId);

      flash(
        editingMatch
          ? `تم تحديث المباراة (${item.fixtureId}).`
          : `تمت إضافة المباراة (${item.fixtureId}).`,
      );
      resetDraft();
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حفظ المباراة.");
    } finally {
      setSaving(false);
    }
  }

  function editMatch(match: ManagedMatch) {
    const stream = streams
      .filter((entry) => entry.fixtureId === match.fixtureId)
      .sort(compareStreams)[0];

    setEditingMatch(match.fixtureId);
    setEditingStreamId(stream?.id ?? null);
    setDraft({
      matchDate: match.matchDate,
      kickoffTime: match.kickoffTime,
      competition: match.competition,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeTeamLogo: match.homeTeamLogo,
      awayTeamLogo: match.awayTeamLogo,
      published: match.published,
      streamType: stream?.streamType ?? "hls",
      streamUrl: stream?.streamUrl ?? "",
      providerName: stream?.providerName ?? "",
      active: stream?.active ?? true,
      priority: String(stream?.priority ?? 1),
    });
    document.getElementById("match-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteMatch(match: ManagedMatch) {
    if (!window.confirm(`حذف مباراة ${match.homeTeam} ضد ${match.awayTeam}؟`)) return;
    try {
      await requestAdmin(`/api/admin/matches/${match.fixtureId}`, "DELETE");
      setMatches((current) => current.filter((entry) => entry.fixtureId !== match.fixtureId));
      setStreams((current) => current.filter((stream) => stream.fixtureId !== match.fixtureId));
      if (editingMatch === match.fixtureId) resetDraft();
      flash("تم حذف المباراة.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حذف المباراة.");
    }
  }

  async function togglePublished(match: ManagedMatch) {
    try {
      const row = await requestAdmin(`/api/admin/matches/${match.fixtureId}`, "PATCH", {
        published: !match.published,
      });
      if (!row) throw new Error("تعذر تحديث حالة النشر.");
      const item = mapMatch(row);
      setMatches((current) =>
        current.map((entry) => (entry.fixtureId === item.fixtureId ? item : entry)),
      );
      flash(item.published ? "تم نشر المباراة." : "تم إلغاء نشر المباراة.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر تحديث حالة النشر.");
    }
  }

  async function updateStream(id: string, updates: { active?: boolean; priority?: number }) {
    try {
      const row = await requestAdmin("/api/admin/fixture-streams", "PATCH", { id, ...updates });
      if (!row) throw new Error("تعذر تحديث مصدر البث.");
      const item = mapStream(row);
      setStreams((current) => current.map((stream) => (stream.id === id ? item : stream)));
      flash("تم تحديث مصدر البث.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر تحديث مصدر البث.");
    }
  }

  async function deleteStream(id: string) {
    if (!window.confirm("حذف مصدر البث؟")) return;
    try {
      await requestAdmin("/api/admin/fixture-streams", "DELETE", { id });
      setStreams((current) => current.filter((stream) => stream.id !== id));
      if (editingStreamId === id) setEditingStreamId(null);
      flash("تم حذف مصدر البث.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حذف مصدر البث.");
    }
  }

  const streamsByFixture = useMemo(() => {
    const map = new Map<string, ManagedStream[]>();
    for (const stream of streams) {
      const list = map.get(stream.fixtureId) ?? [];
      list.push(stream);
      map.set(stream.fixtureId, list);
    }
    for (const list of map.values()) list.sort(compareStreams);
    return map;
  }, [streams]);

  const today = scheduleDate();
  const tomorrow = scheduleDate(1);
  const visibleMatches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return matches;
    return matches.filter((match) =>
      `${match.fixtureId} ${match.competition} ${match.homeTeam} ${match.awayTeam} ${match.matchDate}`
        .toLowerCase()
        .includes(term),
    );
  }, [matches, search]);

  return (
    <main className="admin-page page-width">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <Link href="/admin" className="admin-brand">
            <span className="brand-mark">
              <span />
            </span>
            <span>
              مدى <small>CONTROL ROOM</small>
            </span>
          </Link>
          <span className="admin-nav-caption">مساحة العمل</span>
          <nav>
            <Link href="/admin" className="admin-nav-link active">
              <CalendarDays size={17} />
              المباريات
            </Link>
          </nav>
          <div className="admin-legal">
            <ShieldCheck size={16} />
            <span>إدارة المحتوى المصرح به فقط</span>
          </div>
        </aside>

        <section className="admin-content">
          <header className="admin-topbar">
            <div>
              <span className="eyebrow">MADA / CONTROL ROOM</span>
              <h1>إدارة المباريات</h1>
            </div>
            <div className="admin-top-actions">
              <span className="connected-badge">Supabase</span>
              <button type="button" title="تسجيل الخروج" aria-label="تسجيل الخروج" onClick={() => void signOut()}>
                <LogOut size={17} />
              </button>
              <Link href="/" aria-label="العودة إلى الموقع">
                <ArrowLeft size={17} />
              </Link>
            </div>
          </header>

          {notice && (
            <div className="admin-toast" role="status">
              <Check size={15} />
              {notice}
            </div>
          )}

          <section className="admin-section">
            <div className="admin-block-heading">
              <div>
                <span className="eyebrow">MATCH + STREAM</span>
                <h2>{editingMatch ? `تعديل مباراة · ${editingMatch}` : "إضافة مباراة وبثها"}</h2>
              </div>
            </div>
            <div className="stream-warning">
              <ShieldCheck size={17} />
              <span>
                تُحفظ المباراة ومصدر البث في Supabase. الفيديو يبث من مزودك وCDN مباشرة، وليس من خادم Next.js.
                يظهر اليوم والغد تلقائياً حسب التاريخ الفعلي بتوقيت الرياض.
              </span>
            </div>

            <form id="match-form" className="admin-form" onSubmit={submitMatch}>
              <AdminField label="التاريخ" required>
                <input type="date" value={draft.matchDate} onChange={(event) => setDraft({ ...draft, matchDate: event.target.value })} required />
              </AdminField>
              <AdminField label="وقت البداية" required>
                <input type="time" value={draft.kickoffTime} onChange={(event) => setDraft({ ...draft, kickoffTime: event.target.value })} required />
              </AdminField>
              <AdminField label="البطولة" required>
                <select value={draft.competition} onChange={(event) => setDraft({ ...draft, competition: event.target.value })} required>
                  {COMPETITIONS.map((competition) => (
                    <option key={competition} value={competition}>{competition}</option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="الفريق المضيف" required>
                <input value={draft.homeTeam} onChange={(event) => setDraft({ ...draft, homeTeam: event.target.value })} required />
              </AdminField>
              <AdminField label="الفريق الضيف" required>
                <input value={draft.awayTeam} onChange={(event) => setDraft({ ...draft, awayTeam: event.target.value })} required />
              </AdminField>
              <AdminField label="شعار الفريق المضيف">
                <input type="url" value={draft.homeTeamLogo} onChange={(event) => setDraft({ ...draft, homeTeamLogo: event.target.value })} placeholder="https://…" />
              </AdminField>
              <AdminField label="شعار الفريق الضيف">
                <input type="url" value={draft.awayTeamLogo} onChange={(event) => setDraft({ ...draft, awayTeamLogo: event.target.value })} placeholder="https://…" />
              </AdminField>

              <AdminField label="نوع البث" required>
                <select value={draft.streamType} onChange={(event) => setDraft({ ...draft, streamType: event.target.value as FixtureStreamType })}>
                  <option value="hls">HLS (.m3u8)</option>
                  <option value="embed">Embed / iframe</option>
                </select>
              </AdminField>
              <AdminField label="رابط البث الآمن HTTPS">
                <input
                  type="url"
                  value={draft.streamUrl}
                  onChange={(event) => setDraft({ ...draft, streamUrl: event.target.value })}
                  placeholder={draft.streamType === "hls" ? "https://provider.example/live/index.m3u8" : "https://provider.example/embed/match"}
                />
              </AdminField>
              <AdminField label="اسم مزود البث">
                <input value={draft.providerName} onChange={(event) => setDraft({ ...draft, providerName: event.target.value })} placeholder="مثال: مزود البث الخاص بك" />
              </AdminField>
              <AdminField label="أولوية المصدر (الأعلى يبدأ أولاً)" required>
                <input type="number" min="0" max="10000" step="1" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })} required />
              </AdminField>
              <label className="checkbox-field">
                <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} /> تفعيل مصدر البث
              </label>
              <label className="checkbox-field">
                <input type="checkbox" checked={draft.published} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /> نشر المباراة
              </label>

              <div className="admin-form-actions">
                <button className="primary-action" type="submit" disabled={saving}>
                  <Plus size={16} />
                  {saving ? "جارٍ الحفظ…" : editingMatch ? "حفظ التعديلات" : "حفظ المباراة"}
                </button>
                {editingMatch && (
                  <button className="secondary-action" type="button" onClick={resetDraft}>إلغاء</button>
                )}
              </div>
            </form>

            <div className="admin-block-heading fixture-stream-heading">
              <div>
                <span className="eyebrow">ALL MATCHES</span>
                <h2>المباريات ({visibleMatches.length})</h2>
              </div>
            </div>
            <div className="fixture-browser-filters">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث بالفريق أو البطولة أو معرّف المباراة"
                aria-label="بحث في المباريات"
              />
            </div>

            {loading ? (
              <div className="live-api-message" role="status">جارٍ تحميل المباريات…</div>
            ) : loadError ? (
              <div className="fixture-list-error" role="alert"><span>{loadError}</span></div>
            ) : (
              <div className="admin-table-block">
                <div className="admin-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>البطولة</th>
                        <th>المضيف</th>
                        <th>الضيف</th>
                        <th>نوع البث</th>
                        <th>الأولوية</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleMatches.length ? (
                        visibleMatches.map((match) => {
                          const matchStreams = streamsByFixture.get(match.fixtureId) ?? [];
                          const preferred = matchStreams.find((stream) => stream.active) ?? matchStreams[0];
                          const day = match.matchDate === today ? "اليوم" : match.matchDate === tomorrow ? "الغد" : "";
                          return (
                            <tr key={match.fixtureId}>
                              <td>
                                <strong>{match.matchDate}</strong>
                                <small>{day || match.fixtureId}</small>
                              </td>
                              <td>{match.kickoffTime}</td>
                              <td>{match.competition}</td>
                              <td>
                                <div className="fixture-admin-match">
                                  <span><i aria-hidden="true" style={match.homeTeamLogo ? { backgroundImage: `url("${match.homeTeamLogo}")` } : undefined} />{match.homeTeam}</span>
                                </div>
                              </td>
                              <td>
                                <div className="fixture-admin-match">
                                  <span><i aria-hidden="true" style={match.awayTeamLogo ? { backgroundImage: `url("${match.awayTeamLogo}")` } : undefined} />{match.awayTeam}</span>
                                </div>
                              </td>
                              <td>
                                {preferred ? (
                                  <span>{preferred.streamType === "hls" ? "HLS" : "Embed"}<small>{matchStreams.length > 1 ? ` +${matchStreams.length - 1}` : ""}</small></span>
                                ) : (
                                  <span className="status-tag">لا يوجد</span>
                                )}
                              </td>
                              <td className="fixture-stream-priority">
                                {preferred ? (
                                  <>
                                    <button type="button" aria-label="رفع الأولوية" title="رفع الأولوية" onClick={() => void updateStream(preferred.id, { priority: Math.min(10000, preferred.priority + 1) })}><Plus size={13} /></button>
                                    <span>{preferred.priority}</span>
                                    <button type="button" aria-label="خفض الأولوية" title="خفض الأولوية" disabled={preferred.priority === 0} onClick={() => void updateStream(preferred.id, { priority: Math.max(0, preferred.priority - 1) })}><Minus size={13} /></button>
                                  </>
                                ) : "—"}
                              </td>
                              <td>
                                <button type="button" className={match.published ? "status-tag online" : "status-tag"} onClick={() => void togglePublished(match)}>
                                  {match.published ? "منشورة" : "مسودة"}
                                </button>
                              </td>
                              <td className="table-actions">
                                <Link href={`/match/${match.fixtureId}`} target="_blank" aria-label="معاينة صفحة المباراة">معاينة</Link>
                                <button type="button" onClick={() => editMatch(match)} aria-label="تعديل المباراة"><Pencil size={14} /></button>
                                <button type="button" onClick={() => void deleteMatch(match)} aria-label="حذف المباراة"><Trash2 size={15} /></button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={9} className="fixture-list-empty">
                            لا توجد مباريات بعد. أضف أول مباراة من النموذج أعلاه.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="admin-block-heading fixture-stream-heading">
              <div>
                <span className="eyebrow">STREAM SOURCES</span>
                <h2>مصادر البث ({streams.length})</h2>
              </div>
            </div>
            <div className="stream-warning">
              <Radio size={17} />
              <span>يبدأ المصدر النشط الأعلى أولوية، وتبقى المصادر الأخرى احتياطية عند تعذر التشغيل.</span>
            </div>
            <div className="admin-table-block">
              <div className="admin-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>معرّف المباراة</th>
                      <th>المزود</th>
                      <th>النوع</th>
                      <th>الأولوية</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streams.length ? (
                      streams
                        .slice()
                        .sort((first, second) => first.fixtureId.localeCompare(second.fixtureId) || compareStreams(first, second))
                        .map((stream) => (
                          <tr key={stream.id}>
                            <td><Link className="fixture-stream-link" href={`/match/${stream.fixtureId}`} target="_blank">{stream.fixtureId}</Link></td>
                            <td>{stream.providerName}</td>
                            <td>{stream.streamType === "hls" ? "HLS" : "Embed"}</td>
                            <td>{stream.priority}</td>
                            <td>
                              <button type="button" className={stream.active ? "status-tag online" : "status-tag"} onClick={() => void updateStream(stream.id, { active: !stream.active })}>
                                {stream.active ? "نشط" : "متوقف"}
                              </button>
                            </td>
                            <td className="table-actions">
                              <button type="button" onClick={() => void deleteStream(stream.id)} aria-label="حذف مصدر البث"><Trash2 size={15} /></button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="fixture-list-empty">لا توجد مصادر بث بعد.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function AdminField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="admin-field">
      {label}
      {required && <b> *</b>}
      {children}
    </label>
  );
}