"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Check,
  CircleDollarSign,
  Clapperboard,
  Eye,
  LayoutDashboard,
  Megaphone,
  Plus,
  Radio,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { categories } from "@/lib/event-types";
import EventImageUpload from "@/components/event-image-upload";

type Section =
  | "overview"
  | "events"
  | "streams"
  | "ads"
  | "users"
  | "analytics"
  | "settings";
type ManagedEvent = {
  id: string;
  slug: string;
  title: string;
  category: string;
  startsAt: string;
  status: string;
  published: boolean;
  thumbnailUrl: string;
  description: string;
};
type ManagedStream = {
  id: string;
  eventId: string;
  provider: string;
  playbackUrl: string;
  status: string;
  enabled: boolean;
};
type ManagedAd = {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  videoUrl: string;
  destinationUrl: string;
  htmlCode: string;
  active: boolean;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
};
type AnalyticsData = {
  visitors: number;
  todayViews: number;
  totalViews: number;
  currentViewers: number;
  eventCount: number;
  upcomingEvents: number;
  activeStreams: number;
  adImpressions: number;
  adClicks: number;
  monthlyImpressions: number;
  monthlyClicks: number;
  revenue: {
    today: number;
    week: number;
    month: number;
    currency: string;
    reported: boolean;
  };
};

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] =
  [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "events", label: "الفعاليات", icon: CalendarDays },
    { id: "streams", label: "البث", icon: Radio },
    { id: "ads", label: "الإعلانات", icon: Megaphone },
    { id: "users", label: "المستخدمون", icon: Users },
    { id: "analytics", label: "التحليلات والإيرادات", icon: BarChart3 },
    { id: "settings", label: "الإعدادات", icon: Settings2 },
  ];
const defaultEvents: ManagedEvent[] = [];
const adTypes = [
  "top-banner",
  "sidebar-banner",
  "in-content",
  "pre-roll",
  "mid-roll",
  "post-roll",
  "sponsored-event",
  "interstitial",
];

export default function AdminConsole({ section }: { section: string }) {
  const activeSection = (navItems.find((item) => item.id === section)?.id ??
    "overview") as Section;
  const [managedEvents, setManagedEvents] = useState(defaultEvents);
  const [streams, setStreams] = useState<ManagedStream[]>([]);
  const [ads, setAds] = useState<ManagedAd[]>([]);
  const [revenue, setRevenue] = useState<
    { date: string; amount: number; source: string; currency?: string }[]
  >([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<
    {
      id: string;
      display_name: string | null;
      role: string;
      created_at: string;
    }[]
  >([]);
  const [notice, setNotice] = useState("");
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState({
    title: "",
    slug: "",
    category: "football",
    startsAt: "",
    thumbnailUrl: "",
    description: "",
  });
  const [streamDraft, setStreamDraft] = useState({
    eventId: defaultEvents[0]?.id ?? "",
    provider: "",
    playbackUrl: "",
    status: "offline",
    enabled: true,
  });
  const [adDraft, setAdDraft] = useState({
    name: "",
    type: "top-banner",
    imageUrl: "",
    videoUrl: "",
    destinationUrl: "",
    htmlCode: "",
    active: false,
    startDate: "",
    endDate: "",
  });
  const [revenueDraft, setRevenueDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    source: "",
  });

  useEffect(() => {
    void Promise.all(
      ["events", "streams", "ads", "revenue", "analytics", "users"].map(
        (resource) =>
          fetch(`/api/admin/${resource}`, { cache: "no-store" }).then(
            async (response) => ({
              resource,
              response,
              result: await response.json(),
            }),
          ),
      ),
    )
      .then((results) => {
        for (const { resource, response, result } of results) {
          if (!response.ok) continue;
          const rows = Array.isArray(result.data)
            ? (result.data as Record<string, unknown>[])
            : [];
          if (resource === "events")
            setManagedEvents(
              rows.map((row) => {
                const title = row.title as { ar?: string } | null;
                const description = row.description as { ar?: string } | null;
                return {
                  id: String(row.id),
                  slug: String(row.slug),
                  title: title?.ar ?? String(row.slug),
                  category: String(row.category_id ?? ""),
                  startsAt: String(row.starts_at),
                  status: String(row.status),
                  published: Boolean(row.published),
                  thumbnailUrl: String(row.thumbnail_url ?? ""),
                  description: description?.ar ?? "",
                };
              }),
            );
          if (resource === "streams")
            setStreams(
              rows.map((row) => ({
                id: String(row.id),
                eventId: String(row.event_id),
                provider: String(row.provider),
                playbackUrl: String(row.playback_url),
                status: String(row.stream_status),
                enabled: Boolean(row.enabled),
              })),
            );
          if (resource === "ads")
            setAds(
              rows.map((row) => ({
                id: String(row.id),
                name: String(row.name),
                type: String(row.type),
                imageUrl: String(row.image_url ?? ""),
                videoUrl: String(row.video_url ?? ""),
                destinationUrl: String(row.destination_url ?? ""),
                htmlCode: String(row.html_code ?? ""),
                active: Boolean(row.active),
                startDate: String(row.start_date ?? ""),
                endDate: String(row.end_date ?? ""),
                impressions: Number(row.impressions),
                clicks: Number(row.clicks),
              })),
            );
          if (resource === "revenue")
            setRevenue(
              rows.map((row) => ({
                date: String(row.revenue_date),
                amount: Number(row.amount),
                source: String(row.source),
                currency: String(row.currency ?? "USD"),
              })),
            );
          if (resource === "analytics") setAnalytics(result as AnalyticsData);
          if (resource === "users") setUsers(rows as unknown as typeof users);
        }
      })
      .catch(() => setNotice("تعذر تحميل بعض بيانات الإدارة."));
  }, []);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  async function requestAdmin(path: string, method: string, body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        typeof result.error === "string" ? result.error : "تعذر تنفيذ العملية.",
      );
    return result.data as Record<string, unknown> | undefined;
  }

  async function submitEvent(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    const title = eventDraft.title.trim();
    const slug = eventDraft.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    if (!title || !slug || !eventDraft.startsAt) {
      flash("أكمل عنوان الفعالية والاسم اللطيف والموعد.");
      return;
    }
    const current = managedEvents.find((event) => event.id === editingEvent);
    const fields = {
      slug,
      title: { ar: title, en: title },
      description: { ar: eventDraft.description, en: eventDraft.description },
      category_id: eventDraft.category,
      starts_at: new Date(eventDraft.startsAt).toISOString(),
      thumbnail_url: eventDraft.thumbnailUrl || null,
      status: current?.status ?? "upcoming",
      published: current?.published ?? false,
    };
    try {
      const row = await requestAdmin(
        editingEvent
          ? `/api/admin/events/${editingEvent}`
          : "/api/admin/events",
        editingEvent ? "PATCH" : "POST",
        fields,
      );
      if (!row) throw new Error("تعذر حفظ الفعالية.");
      const item: ManagedEvent = {
        id: String(row.id),
        slug: String(row.slug),
        title,
        category: String(row.category_id ?? ""),
        startsAt: String(row.starts_at),
        status: String(row.status),
        published: Boolean(row.published),
        thumbnailUrl: String(row.thumbnail_url ?? ""),
        description: eventDraft.description,
      };
      const next = editingEvent
        ? managedEvents.map((event) =>
            event.id === editingEvent ? item : event,
          )
        : [item, ...managedEvents];
      setManagedEvents(next);
      setEventDraft({
        title: "",
        slug: "",
        category: "football",
        startsAt: "",
        thumbnailUrl: "",
        description: "",
      });
      setEditingEvent(null);
      flash(editingEvent ? "تم تحديث الفعالية." : "تمت إضافة الفعالية.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حفظ الفعالية.");
    }
  }

  function editEvent(item: ManagedEvent) {
    setEditingEvent(item.id);
    setEventDraft({
      title: item.title,
      slug: item.slug,
      category: item.category,
      startsAt: new Date(item.startsAt).toISOString().slice(0, 16),
      thumbnailUrl: item.thumbnailUrl,
      description: item.description,
    });
    document
      .getElementById("event-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteEvent(id: string) {
    if (!window.confirm("حذف هذه الفعالية؟")) return;
    try {
      await requestAdmin(`/api/admin/events/${id}`, "DELETE");
      setManagedEvents((current) => current.filter((event) => event.id !== id));
      flash("تم حذف الفعالية.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حذف الفعالية.");
    }
  }

  async function togglePublished(id: string) {
    const item = managedEvents.find((event) => event.id === id);
    if (!item) return;
    const published = !item.published;
    try {
      await requestAdmin(`/api/admin/events/${id}`, "PATCH", { published });
      setManagedEvents((current) =>
        current.map((event) =>
          event.id === id ? { ...event, published } : event,
        ),
      );
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر تحديث النشر.");
    }
  }

  async function submitStream(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    try {
      const url = new URL(streamDraft.playbackUrl);
      if (url.protocol !== "https:") throw new Error();
    } catch {
      flash("أدخل رابط HLS آمن يبدأ بـ https://.");
      return;
    }
    try {
      const row = await requestAdmin("/api/admin/streams", "POST", {
        event_id: streamDraft.eventId,
        provider: streamDraft.provider,
        playback_url: streamDraft.playbackUrl,
        stream_status: streamDraft.status,
        enabled: streamDraft.enabled,
      });
      if (!row) throw new Error("تعذر حفظ إعداد البث.");
      const item: ManagedStream = {
        id: String(row.id),
        eventId: String(row.event_id),
        provider: String(row.provider),
        playbackUrl: String(row.playback_url),
        status: String(row.stream_status),
        enabled: Boolean(row.enabled),
      };
      const next = [
        item,
        ...streams.filter((stream) => stream.eventId !== streamDraft.eventId),
      ];
      setStreams(next);
      flash("تم حفظ إعداد البث.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حفظ إعداد البث.");
    }
  }

  async function submitAd(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    if (adDraft.destinationUrl) {
      try {
        const url = new URL(adDraft.destinationUrl);
        if (!["https:", "http:"].includes(url.protocol)) throw new Error();
      } catch {
        flash("رابط الوجهة غير صالح.");
        return;
      }
    }
    try {
      const row = await requestAdmin("/api/admin/ads", "POST", {
        name: adDraft.name,
        type: adDraft.type,
        image_url: adDraft.imageUrl || null,
        video_url: adDraft.videoUrl || null,
        destination_url: adDraft.destinationUrl || null,
        html_code: adDraft.htmlCode || null,
        active: adDraft.active,
        start_date: adDraft.startDate
          ? new Date(adDraft.startDate).toISOString()
          : null,
        end_date: adDraft.endDate
          ? new Date(adDraft.endDate).toISOString()
          : null,
      });
      if (!row) throw new Error("تعذر إنشاء الإعلان.");
      const item: ManagedAd = {
        id: String(row.id),
        name: String(row.name),
        type: String(row.type),
        imageUrl: String(row.image_url ?? ""),
        videoUrl: String(row.video_url ?? ""),
        destinationUrl: String(row.destination_url ?? ""),
        htmlCode: String(row.html_code ?? ""),
        active: Boolean(row.active),
        startDate: String(row.start_date ?? ""),
        endDate: String(row.end_date ?? ""),
        impressions: Number(row.impressions),
        clicks: Number(row.clicks),
      };
      const next = [item, ...ads];
      setAds(next);
      flash("تم إنشاء موضع الإعلان.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر إنشاء الإعلان.");
      return;
    }
    setAdDraft({
      name: "",
      type: "top-banner",
      imageUrl: "",
      videoUrl: "",
      destinationUrl: "",
      htmlCode: "",
      active: false,
      startDate: "",
      endDate: "",
    });
  }

  async function updateAd(id: string, changes: Partial<ManagedAd>) {
    try {
      await requestAdmin(`/api/admin/ads/${id}`, "PATCH", {
        active: changes.active,
      });
      setAds((current) =>
        current.map((ad) => (ad.id === id ? { ...ad, ...changes } : ad)),
      );
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر تحديث الإعلان.");
    }
  }

  async function submitRevenue(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault();
    const amount = Number(revenueDraft.amount);
    if (!Number.isFinite(amount) || amount < 0 || !revenueDraft.source.trim()) {
      flash("أدخل مبلغاً ومصدر بيانات الإيراد.");
      return;
    }
    const entry = {
      date: revenueDraft.date,
      amount,
      source: revenueDraft.source.trim(),
    };
    try {
      const row = await requestAdmin("/api/admin/revenue", "POST", {
        revenue_date: entry.date,
        amount: entry.amount,
        source: entry.source,
        currency: "USD",
      });
      if (!row) throw new Error("تعذر حفظ الإيراد.");
      setRevenue((current) => [
        {
          date: String(row.revenue_date),
          amount: Number(row.amount),
          source: String(row.source),
          currency: String(row.currency ?? "USD"),
        },
        ...current,
      ]);
      flash("تم حفظ الإيراد المُدخل.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر حفظ الإيراد.");
      return;
    }
    setRevenueDraft({
      date: new Date().toISOString().slice(0, 10),
      amount: "",
      source: "",
    });
  }

  async function changeUserRole(userId: string, role: "admin" | "viewer") {
    try {
      await requestAdmin("/api/admin/users", "PATCH", { id: userId, role });
      setUsers((current) =>
        current.map((user) => (user.id === userId ? { ...user, role } : user)),
      );
      flash("تم تحديث صلاحية المستخدم.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "تعذر تحديث الصلاحية.");
    }
  }

  const sectionTitle =
    navItems.find((item) => item.id === activeSection)?.label ?? "نظرة عامة";
  const selectedStreamEvent = managedEvents.find(
    (item) => item.id === streamDraft.eventId,
  );
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
            {navItems.map(({ id, label, icon: Icon }) => (
              <Link
                key={id}
                href={id === "overview" ? "/admin" : `/admin/${id}`}
                className={
                  activeSection === id
                    ? "admin-nav-link active"
                    : "admin-nav-link"
                }
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
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
              <h1>{sectionTitle}</h1>
            </div>
            <div className="admin-top-actions">
              <span className="connected-badge">Supabase</span>
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
          {activeSection === "overview" && (
            <section className="admin-overview">
              <div className="admin-metrics">
                <Metric
                  icon={Eye}
                  label="زوار اليوم"
                  value={
                    analytics ? analytics.visitors.toLocaleString("ar-SA") : "—"
                  }
                  note="معرّفات مجهولة"
                />
                <Metric
                  icon={Radio}
                  label="المشاهدون الآن"
                  value={
                    analytics?.currentViewers.toLocaleString("ar-SA") ?? "—"
                  }
                  note="جلسات آخر دقيقتين"
                />
                <Metric
                  icon={CalendarDays}
                  label="مشاهدات اليوم"
                  value={analytics?.todayViews.toLocaleString("ar-SA") ?? "—"}
                  note={
                    analytics
                      ? `إجمالي ${analytics.totalViews.toLocaleString("ar-SA")}`
                      : "إحصاءات الزيارات"
                  }
                />
                <Metric
                  icon={Clapperboard}
                  label="بث نشط"
                  value={
                    analytics?.activeStreams.toString() ??
                    streams
                      .filter(
                        (stream) => stream.enabled && stream.status === "live",
                      )
                      .length.toString()
                  }
                  note="مراجع البث النشطة"
                />
                <Metric
                  icon={Megaphone}
                  label="مرات ظهور الإعلان"
                  value={
                    analytics?.adImpressions.toLocaleString("ar-SA") ??
                    ads
                      .reduce((sum, ad) => sum + ad.impressions, 0)
                      .toLocaleString("ar-SA")
                  }
                  note="مرات ظهور مسجلة"
                />
                <Metric
                  icon={CircleDollarSign}
                  label="إيراد الشهر"
                  value={
                    analytics?.revenue.reported
                      ? `${analytics.revenue.month.toFixed(2)} ${analytics.revenue.currency}`
                      : "—"
                  }
                  note={
                    analytics?.revenue.reported
                      ? "بيانات شبكة مُدخلة"
                      : "لا توجد بيانات إيراد موثقة"
                  }
                />
              </div>
              <div className="admin-table-block">
                <div className="admin-block-heading">
                  <div>
                    <span className="eyebrow">LATEST SCHEDULE</span>
                    <h2>الفعاليات القادمة</h2>
                  </div>
                  <Link href="/admin/events">
                    إدارة الفعاليات <ArrowLeft size={14} />
                  </Link>
                </div>
                <div className="admin-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>الفعالية</th>
                        <th>التصنيف</th>
                        <th>الموعد</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managedEvents.slice(0, 5).map((item) => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>
                            {categories.find(
                              (category) => category.id === item.category,
                            )?.ar ?? item.category}
                          </td>
                          <td>
                            {new Date(item.startsAt).toLocaleDateString(
                              "ar-SA",
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                item.published
                                  ? "status-tag online"
                                  : "status-tag"
                              }
                            >
                              {item.published ? "منشورة" : "مسودة"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
          {activeSection === "events" && (
            <section className="admin-section">
              <div className="admin-block-heading">
                <div>
                  <span className="eyebrow">EVENT MANAGEMENT</span>
                  <h2>{editingEvent ? "تعديل الفعالية" : "إضافة فعالية"}</h2>
                </div>
              </div>
              <form
                id="event-form"
                className="admin-form"
                onSubmit={submitEvent}
              >
                <AdminField label="عنوان الفعالية" required>
                  <input
                    value={eventDraft.title}
                    onChange={(event) =>
                      setEventDraft({
                        ...eventDraft,
                        title: event.target.value,
                      })
                    }
                    required
                  />
                </AdminField>
                <AdminField label="الرابط اللطيف (slug)" required>
                  <input
                    value={eventDraft.slug}
                    onChange={(event) =>
                      setEventDraft({ ...eventDraft, slug: event.target.value })
                    }
                    required
                    pattern="[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*"
                  />
                </AdminField>
                <AdminField label="التصنيف">
                  <select
                    value={eventDraft.category}
                    onChange={(event) =>
                      setEventDraft({
                        ...eventDraft,
                        category: event.target.value,
                      })
                    }
                  >
                    {categories.map((category) => (
                      <option value={category.id} key={category.id}>
                        {category.ar}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="تاريخ ووقت البداية" required>
                  <input
                    type="datetime-local"
                    value={eventDraft.startsAt}
                    onChange={(event) =>
                      setEventDraft({
                        ...eventDraft,
                        startsAt: event.target.value,
                      })
                    }
                    required
                  />
                </AdminField>
                <AdminField label="رابط صورة الغلاف" required>
                  <input
                    type="url"
                    value={eventDraft.thumbnailUrl}
                    onChange={(event) =>
                      setEventDraft({
                        ...eventDraft,
                        thumbnailUrl: event.target.value,
                      })
                    }
                    required
                  />
                </AdminField>
                <EventImageUpload
                  onUploaded={(url) =>
                    setEventDraft((current) => ({
                      ...current,
                      thumbnailUrl: url,
                    }))
                  }
                />
                <AdminField label="الوصف">
                  <textarea
                    rows={3}
                    value={eventDraft.description}
                    onChange={(event) =>
                      setEventDraft({
                        ...eventDraft,
                        description: event.target.value,
                      })
                    }
                  />
                </AdminField>
                <div className="admin-form-actions">
                  <button className="primary-action" type="submit">
                    <Plus size={16} />
                    {editingEvent ? "حفظ التعديلات" : "إنشاء فعالية"}
                  </button>
                  {editingEvent && (
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => {
                        setEditingEvent(null);
                        setEventDraft({
                          title: "",
                          slug: "",
                          category: "football",
                          startsAt: "",
                          thumbnailUrl: "",
                          description: "",
                        });
                      }}
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
              <AdminTable
                title="الفعاليات"
                headers={["الفعالية", "التصنيف", "النشر", "الإجراءات"]}
              >
                <tbody>
                  {managedEvents.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <small>/{item.slug}</small>
                      </td>
                      <td>
                        {categories.find(
                          (category) => category.id === item.category,
                        )?.ar ?? item.category}
                      </td>
                      <td>
                        <button
                          className={
                            item.published ? "status-tag online" : "status-tag"
                          }
                          onClick={() => togglePublished(item.id)}
                        >
                          {item.published ? "منشورة" : "مسودة"}
                        </button>
                      </td>
                      <td className="table-actions">
                        <button
                          onClick={() => editEvent(item)}
                          aria-label="تعديل الفعالية"
                        >
                          {" "}
                          تعديل
                        </button>
                        <button
                          onClick={() => deleteEvent(item.id)}
                          aria-label="حذف الفعالية"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </section>
          )}
          {activeSection === "streams" && (
            <section className="admin-section">
              <div className="admin-block-heading">
                <div>
                  <span className="eyebrow">STREAM CONFIGURATION</span>
                  <h2>إضافة مصدر بث مرخص</h2>
                </div>
              </div>
              <div className="stream-warning">
                <ShieldCheck size={17} />
                <span>
                  أدخل روابط تشغيل تملك حقوق توزيعها. الفيديو يبث من مزودك وCDN
                  مباشرة، وليس من خادم Next.js.
                </span>
              </div>
              <form className="admin-form" onSubmit={submitStream}>
                <AdminField label="الفعالية">
                  <select
                    value={streamDraft.eventId}
                    onChange={(event) =>
                      setStreamDraft({
                        ...streamDraft,
                        eventId: event.target.value,
                      })
                    }
                  >
                    {managedEvents.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="المزود">
                  <input
                    value={streamDraft.provider}
                    onChange={(event) =>
                      setStreamDraft({
                        ...streamDraft,
                        provider: event.target.value,
                      })
                    }
                    required
                    placeholder="مثال: مزود البث الخاص بك"
                  />
                </AdminField>
                <AdminField label="رابط HLS للتشغيل" required>
                  <input
                    type="url"
                    value={streamDraft.playbackUrl}
                    onChange={(event) =>
                      setStreamDraft({
                        ...streamDraft,
                        playbackUrl: event.target.value,
                      })
                    }
                    required
                    placeholder="https://cdn.example.com/event/index.m3u8"
                  />
                </AdminField>
                <AdminField label="الحالة">
                  <select
                    value={streamDraft.status}
                    onChange={(event) =>
                      setStreamDraft({
                        ...streamDraft,
                        status: event.target.value,
                      })
                    }
                  >
                    <option value="offline">غير متصل</option>
                    <option value="scheduled">مجدول</option>
                    <option value="live">مباشر</option>
                  </select>
                </AdminField>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={streamDraft.enabled}
                    onChange={(event) =>
                      setStreamDraft({
                        ...streamDraft,
                        enabled: event.target.checked,
                      })
                    }
                  />{" "}
                  تفعيل هذا المصدر
                </label>
                <div className="admin-form-actions">
                  <button className="primary-action" type="submit">
                    <Plus size={16} />
                    حفظ إعداد البث
                  </button>
                  {selectedStreamEvent ? (
                    <Link
                      className="secondary-action"
                      href={`/watch/${selectedStreamEvent.slug}`}
                      target="_blank"
                    >
                      معاينة صفحة المباراة <ArrowLeft size={14} />
                    </Link>
                  ) : (
                    <span className="secondary-action" aria-disabled="true">
                      أنشئ مباراة أولاً
                    </span>
                  )}
                </div>
              </form>
              <AdminTable
                title="مصادر البث"
                headers={["الفعالية", "المزود", "الحالة", "رابط التشغيل"]}
              >
                <tbody>
                  {streams.map((stream) => (
                    <tr key={stream.id}>
                      <td>
                        {managedEvents.find(
                          (item) => item.id === stream.eventId,
                        )?.title ?? "فعالية محذوفة"}
                      </td>
                      <td>{stream.provider}</td>
                      <td>
                        <span
                          className={
                            stream.enabled && stream.status === "live"
                              ? "status-tag online"
                              : "status-tag"
                          }
                        >
                          {stream.enabled ? stream.status : "معطل"}
                        </span>
                      </td>
                      <td>
                        <code className="truncate-cell">
                          {stream.playbackUrl}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </section>
          )}
          {activeSection === "ads" && (
            <section className="admin-section">
              <div className="admin-block-heading">
                <div>
                  <span className="eyebrow">AD INVENTORY</span>
                  <h2>إنشاء موضع إعلاني</h2>
                </div>
              </div>
              <div className="stream-warning">
                <ShieldCheck size={17} />
                <span>
                  استخدم المواد المعتمدة من شبكة الإعلان فقط. الروابط تفتح
                  مباشرة مع rel=sponsored، ولا توجد نوافذ منبثقة أو إعادة توجيه.
                </span>
              </div>
              <form className="admin-form" onSubmit={submitAd}>
                <AdminField label="اسم الإعلان" required>
                  <input
                    value={adDraft.name}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, name: event.target.value })
                    }
                    required
                  />
                </AdminField>
                <AdminField label="الموضع">
                  <select
                    value={adDraft.type}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, type: event.target.value })
                    }
                  >
                    {adTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </AdminField>
                <AdminField label="رابط الصورة">
                  <input
                    type="url"
                    value={adDraft.imageUrl}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, imageUrl: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="رابط فيديو الإعلان">
                  <input
                    type="url"
                    value={adDraft.videoUrl}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, videoUrl: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="رابط وجهة المعلن">
                  <input
                    type="url"
                    value={adDraft.destinationUrl}
                    onChange={(event) =>
                      setAdDraft({
                        ...adDraft,
                        destinationUrl: event.target.value,
                      })
                    }
                  />
                </AdminField>
                <AdminField label="كود شبكة إعلان معتمد">
                  <textarea
                    rows={4}
                    value={adDraft.htmlCode}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, htmlCode: event.target.value })
                    }
                    placeholder="يُحفظ للمراجعة قبل اعتماده وتشغيله في موضع الإعلان."
                  />
                </AdminField>
                <AdminField label="بداية العرض">
                  <input
                    type="datetime-local"
                    value={adDraft.startDate}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, startDate: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="نهاية العرض">
                  <input
                    type="datetime-local"
                    value={adDraft.endDate}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, endDate: event.target.value })
                    }
                  />
                </AdminField>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={adDraft.active}
                    onChange={(event) =>
                      setAdDraft({ ...adDraft, active: event.target.checked })
                    }
                  />{" "}
                  تفعيل بعد المراجعة
                </label>
                <div className="admin-form-actions">
                  <button className="primary-action" type="submit">
                    <Plus size={16} />
                    إنشاء إعلان
                  </button>
                </div>
              </form>
              <AdminTable
                title="الإعلانات"
                headers={[
                  "الإعلان",
                  "الموضع",
                  "الظهور",
                  "النقرات",
                  "CTR",
                  "الحالة",
                  "الإجراءات",
                ]}
              >
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id}>
                      <td>{ad.name}</td>
                      <td>
                        <code>{ad.type}</code>
                      </td>
                      <td>{ad.impressions.toLocaleString("ar-SA")}</td>
                      <td>{ad.clicks.toLocaleString("ar-SA")}</td>
                      <td>
                        {ad.impressions
                          ? `${((ad.clicks / ad.impressions) * 100).toFixed(2)}%`
                          : "—"}
                      </td>
                      <td>
                        <button
                          className={
                            ad.active ? "status-tag online" : "status-tag"
                          }
                          onClick={() =>
                            updateAd(ad.id, { active: !ad.active })
                          }
                        >
                          {ad.active ? "نشط" : "متوقف"}
                        </button>
                      </td>
                      <td className="table-actions">
                        <button
                          onClick={async () => {
                            try {
                              await requestAdmin(
                                `/api/admin/ads/${ad.id}`,
                                "DELETE",
                              );
                              setAds((current) =>
                                current.filter((item) => item.id !== ad.id),
                              );
                              flash("تم حذف الإعلان.");
                            } catch (error) {
                              flash(
                                error instanceof Error
                                  ? error.message
                                  : "تعذر حذف الإعلان.",
                              );
                            }
                          }}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
            </section>
          )}
          {activeSection === "users" && (
            <section className="admin-section">
              <div className="admin-block-heading">
                <div>
                  <span className="eyebrow">ACCOUNT ACCESS</span>
                  <h2>المستخدمون</h2>
                </div>
              </div>
              <div className="stream-warning">
                <ShieldCheck size={17} />
                <span>
                  تُعرض الحسابات الإدارية والاسم المعروض فقط. لا تُعرض عناوين
                  البريد أو بيانات شخصية غير لازمة.
                </span>
              </div>
              {users.length ? (
                <AdminTable
                  title="الحسابات"
                  headers={["الاسم", "تاريخ الإنشاء", "الصلاحية", "إجراء"]}
                >
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.display_name ?? "بدون اسم"}</td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString(
                            "ar-SA",
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              user.role === "admin"
                                ? "status-tag online"
                                : "status-tag"
                            }
                          >
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <button
                            className="status-tag"
                            onClick={() =>
                              changeUserRole(
                                user.id,
                                user.role === "admin" ? "viewer" : "admin",
                              )
                            }
                          >
                            {user.role === "admin"
                              ? "إزالة الإدارة"
                              : "منح الإدارة"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              ) : (
                <div className="empty-state">
                  <Users size={24} />
                  <h2>لا توجد حسابات بعد</h2>
                </div>
              )}
            </section>
          )}
          {activeSection === "analytics" && (
            <section className="admin-section">
              <div className="admin-block-heading">
                <div>
                  <span className="eyebrow">FIRST-PARTY METRICS</span>
                  <h2>التحليلات والإيرادات</h2>
                </div>
              </div>
              <div className="stream-warning">
                <Activity size={17} />
                <span>
                  لا تُعرض أرقام تقديرية على أنها إيرادات فعلية. أدخل بيانات
                  شبكة الإعلان أو استوردها يدوياً.
                </span>
              </div>
              <div className="analytics-cards">
                <Metric
                  icon={Eye}
                  label="مرات الظهور هذا الشهر"
                  value={(
                    analytics?.monthlyImpressions ??
                    ads.reduce((sum, ad) => sum + ad.impressions, 0)
                  ).toLocaleString("ar-SA")}
                  note="عدادات العرض المسجلة"
                />
                <Metric
                  icon={Activity}
                  label="نقرات هذا الشهر"
                  value={(
                    analytics?.monthlyClicks ??
                    ads.reduce((sum, ad) => sum + ad.clicks, 0)
                  ).toLocaleString("ar-SA")}
                  note="النقرات المقصودة فقط"
                />
                <Metric
                  icon={BarChart3}
                  label="CTR هذا الشهر"
                  value={
                    analytics?.monthlyImpressions
                      ? `${((analytics.monthlyClicks / analytics.monthlyImpressions) * 100).toFixed(2)}%`
                      : "—"
                  }
                  note="النقرات / مرات الظهور"
                />
                <Metric
                  icon={CircleDollarSign}
                  label="إيراد اليوم"
                  value={
                    analytics?.revenue.reported
                      ? `${analytics.revenue.today.toFixed(2)} ${analytics.revenue.currency}`
                      : "—"
                  }
                  note="إيراد مُدخل من المصدر"
                />
                <Metric
                  icon={CircleDollarSign}
                  label="إيراد آخر 7 أيام"
                  value={
                    analytics?.revenue.reported
                      ? `${analytics.revenue.week.toFixed(2)} ${analytics.revenue.currency}`
                      : "—"
                  }
                  note="إيراد مُدخل من المصدر"
                />
                <Metric
                  icon={CircleDollarSign}
                  label="إيراد هذا الشهر"
                  value={
                    analytics?.revenue.reported
                      ? `${analytics.revenue.month.toFixed(2)} ${analytics.revenue.currency}`
                      : "—"
                  }
                  note="إيراد مُدخل من المصدر"
                />
                <Metric
                  icon={BarChart3}
                  label="إيراد لكل ألف ظهور"
                  value={
                    analytics?.revenue.reported && analytics.monthlyImpressions
                      ? `${((analytics.revenue.month / analytics.monthlyImpressions) * 1000).toFixed(2)} ${analytics.revenue.currency}`
                      : "—"
                  }
                  note="بيانات الشهر الحالي المُدخلة"
                />
              </div>
              <form
                className="admin-form revenue-form"
                onSubmit={submitRevenue}
              >
                <div className="admin-block-heading">
                  <div>
                    <span className="eyebrow">REVENUE IMPORT</span>
                    <h2>تسجيل إيراد موثق</h2>
                  </div>
                  <ArrowDownToLine size={17} />
                </div>
                <AdminField label="التاريخ">
                  <input
                    type="date"
                    value={revenueDraft.date}
                    onChange={(event) =>
                      setRevenueDraft({
                        ...revenueDraft,
                        date: event.target.value,
                      })
                    }
                    required
                  />
                </AdminField>
                <AdminField label="المبلغ">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={revenueDraft.amount}
                    onChange={(event) =>
                      setRevenueDraft({
                        ...revenueDraft,
                        amount: event.target.value,
                      })
                    }
                    required
                  />
                </AdminField>
                <AdminField label="المصدر (شبكة / تقرير)">
                  <input
                    value={revenueDraft.source}
                    onChange={(event) =>
                      setRevenueDraft({
                        ...revenueDraft,
                        source: event.target.value,
                      })
                    }
                    required
                  />
                </AdminField>
                <button className="primary-action" type="submit">
                  حفظ الإيراد
                </button>
              </form>
              {revenue.length > 0 && (
                <AdminTable
                  title="الإيرادات المدخلة"
                  headers={["التاريخ", "المبلغ", "المصدر"]}
                >
                  <tbody>
                    {revenue.map((item, index) => (
                      <tr key={`${item.date}-${index}`}>
                        <td>{item.date}</td>
                        <td>
                          {item.amount.toFixed(2)} {item.currency ?? ""}
                        </td>
                        <td>{item.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              )}
            </section>
          )}
          {activeSection === "settings" && (
            <section className="admin-section">
              <div className="admin-block-heading">
                <div>
                  <span className="eyebrow">PLATFORM SETTINGS</span>
                  <h2>إعدادات المنصة</h2>
                </div>
              </div>
              <div className="settings-list">
                <div>
                  <div>
                    <strong>مصدر البث</strong>
                    <span>مراجع تشغيل HLS من مزود خارجي وCDN</span>
                  </div>
                  <span className="connected-badge">Provider agnostic</span>
                </div>
                <div>
                  <div>
                    <strong>التخزين</strong>
                    <span>لا تحفظ ملفات الفيديو في قاعدة البيانات</span>
                  </div>
                  <span className="connected-badge">External CDN</span>
                </div>
                <div>
                  <div>
                    <strong>حالة Supabase</strong>
                    <span>مفاتيح الخدمة لا ترسل إلى المتصفح</span>
                  </div>
                  <span className="connected-badge">Supabase Auth</span>
                </div>
                <div>
                  <div>
                    <strong>إعدادات الإعلان</strong>
                    <span>المواد الإعلانية تحتاج إلى اعتماد قبل التنشيط</span>
                  </div>
                  <span className="connected-badge">Policy enabled</span>
                </div>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="admin-metric">
      <div>
        <span>{label}</span>
        <Icon size={16} />
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
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

function AdminTable({
  title,
  headers,
  children,
}: {
  title: string;
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="admin-table-block">
      <div className="admin-block-heading">
        <h2>{title}</h2>
      </div>
      <div className="admin-table-scroll">
        <table>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          {children}
        </table>
      </div>
    </div>
  );
}
