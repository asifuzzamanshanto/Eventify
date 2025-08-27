// src/pages/MyEvents.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** ------------------------------------------------------------------
 * Dummy data (frontend-only). Replace with real API data later.
 * Add `completed` to indicate the organizer marked completion.
 * ------------------------------------------------------------------*/
const SAMPLE_EVENTS = [
  {
    id: "e-101",
    name: "HackFest 2025",
    university: "North South University",
    club: "NSU ACM",
    date: "2025-10-12",
    status: "Registered",
    completed: false,
    cover:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "e-102",
    name: "AI Bootcamp",
    university: "BRAC University",
    club: "AI Society",
    date: "2025-06-28",
    status: "Completed",
    completed: true,
    cover:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "e-103",
    name: "Frontend Fiesta",
    university: "Dhaka University",
    club: "DU Dev Circle",
    date: "2025-09-05",
    status: "Ongoing",
    completed: false,
    cover:
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "e-104",
    name: "DevOps Day",
    university: "IUT",
    club: "IUT Programming Club",
    date: "2025-08-30",
    status: "Registered",
    completed: false,
    cover:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "e-105",
    name: "UI Marathon",
    university: "BRAC University",
    club: "Design Guild",
    date: "2025-11-21",
    status: "Planned",
    completed: false,
    cover:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function MyEvents({ initialEvents, className }) {
  const navigate = useNavigate();

  // Current user (dummy). Replace with your auth context later.
  const currentUser = { fullName: "Tahmid Khan", institution: "AUST" };

  // choose data: prop or fallback
  const initial = React.useMemo(
    () =>
      Array.isArray(initialEvents) && initialEvents.length
        ? initialEvents
        : SAMPLE_EVENTS,
    [initialEvents]
  );

  const [events, setEvents] = React.useState(() =>
    [...initial].sort((a, b) => new Date(a.date) - new Date(b.date))
  );
  const [query, setQuery] = React.useState("");

  // search filter
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => {
      return (
        e.name.toLowerCase().includes(q) ||
        (e.university || "").toLowerCase().includes(q) ||
        (e.club || "").toLowerCase().includes(q)
      );
    });
  }, [query, events]);

  // split into upcoming & past
  const now = new Date();
  const { upcoming, past } = React.useMemo(() => {
    const up = [];
    const pa = [];
    for (const e of filtered) {
      (new Date(e.date) >= startOfDay(now) ? up : pa).push(e);
    }
    return {
      upcoming: up.sort((a, b) => new Date(a.date) - new Date(b.date)),
      past: pa.sort((a, b) => new Date(b.date) - new Date(a.date)),
    };
  }, [filtered]);

  function onUnenroll(id) {
    // Frontend-only removal
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function onView(ev) {
    // Navigate to a shared details page route (adjust path to your router)
    navigate(`/student/event/${ev.id}`, { state: { event: ev } });
  }

  async function onGenerateCertificate(ev) {
    // Simple client-side PNG certificate
    const dataUrl = await createCertificatePNG({
      studentName: currentUser.fullName,
      institution: currentUser.institution,
      eventName: ev.name,
      eventDate: formatDate(ev.date),
    });
    download(dataUrl, `${slugify(ev.name)}-certificate.png`);
  }

  return (
    <div className="min-h-dvh bg-transparent">
      <div
        className={cn(
          "relative z-10 mx-auto w-full max-w-7xl bg-transparent p-4 md:p-8",
          className
        )}
      >
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">My Events</h1>
            <p className="text-sm text-white/60">
              Search by event, university, or club.
            </p>
          </div>

          {/* Search */}
          <div className="w-full sm:w-96">
            <label className="sr-only">Search</label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events, universities, clubs…"
                className={cn(
                  "w-full rounded-xl bg-white/5 px-10 py-2.5 text-sm text-white",
                  "placeholder-white/50 outline-none ring-1 ring-white/10",
                  "focus:ring-2 focus:ring-[#7d9dd2]/40"
                )}
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <SectionTitle title="Upcoming" count={upcoming.length} />
        {upcoming.length ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                onView={() => onView(ev)}
                onUnenroll={() => onUnenroll(ev.id)}
                onGenerateCertificate={() => onGenerateCertificate(ev)}
                showCertificate={Boolean(ev.completed)} // completed => visible
                isPast={false}
              />
            ))}
          </div>
        ) : (
          <EmptyRow text="No upcoming events." />
        )}

        {/* Past */}
        <SectionTitle title="Past" count={past.length} />
        {past.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                onView={() => onView(ev)}
                onUnenroll={() => onUnenroll(ev.id)}
                onGenerateCertificate={() => onGenerateCertificate(ev)}
                showCertificate={Boolean(ev.completed)} // only if organizer marked completed
                isPast
              />
            ))}
          </div>
        ) : (
          <EmptyRow text="No past events yet." />
        )}
      </div>
    </div>
  );
}

/* ========================= components ========================= */

function SectionTitle({ title, count }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70 ring-1 ring-white/10">
        {count}
      </span>
    </div>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
      {text}
    </div>
  );
}

function EventCard({
  ev,
  onView,
  onUnenroll,
  onGenerateCertificate,
  showCertificate,
  isPast,
}) {
  const timeLeft = useCountdown(ev.date);

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
      className={cn(
        "group/isolate isolate overflow-hidden rounded-2xl border border-white/10 bg-white/5",
        "hover:bg-white/10 transition-colors"
      )}
    >
      {/* Cover */}
      <div className="relative">
        <img
          src={ev.cover}
          alt={ev.name}
          className="h-40 w-full bg-neutral-900 object-cover"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white ring-1 ring-white/10">
          {formatDate(ev.date)}
        </div>
        {!isPast && timeLeft && (
          <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-[11px] text-white ring-1 ring-white/10">
            ⏳ {timeLeft}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative z-[1] flex flex-col gap-2 p-4">
        <h3 className="truncate text-base font-semibold text-white">
          {ev.name}
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span className="rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10">
            {ev.university}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-1 ring-1 ring-white/10">
            {ev.club}
          </span>
          <span className="ml-auto rounded-full bg-[#5fc3b1]/20 px-2 py-1 text-xs text-[#5fc3b1] ring-1 ring-[#5fc3b1]/30">
            {ev.status}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={onView}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            View Details
          </button>

          {!isPast && (
            <button
              onClick={onUnenroll}
              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-sm text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
            >
              Unenroll
            </button>
          )}

          {isPast && showCertificate && (
            <button
              onClick={onGenerateCertificate}
              className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
            >
              Generate Certificate
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ========================= helpers ========================= */

function useCountdown(targetISO) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(targetISO);
  if (isNaN(target.getTime()) || target <= now) return null;
  const diff = target - now;
  const d = Math.floor(diff / (24 * 60 * 60 * 1000));
  const h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((diff % (60 * 1000)) / 1000);
  return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function download(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function createCertificatePNG({ studentName, institution, eventName, eventDate }) {
  const W = 1600, H = 1131; // 16:11 (looks nice on A4-ish)
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a"); // slate-900
    grad.addColorStop(1, "#1f2937"); // gray-800
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Border
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    // Heading
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "700 72px 'Sora', sans-serif";
    ctx.fillText("Certificate of Participation", W / 2, 220);

    // line
    ctx.globalAlpha = 0.25;
    ctx.fillRect(W * 0.2, 250, W * 0.6, 3);
    ctx.globalAlpha = 1;

    // Awarded to
    ctx.font = "400 36px 'Sora', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("This is to certify that", W / 2, 360);

    ctx.font = "700 64px 'Sora', sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(studentName, W / 2, 440);

    ctx.font = "400 32px 'Sora', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(`from ${institution}`, W / 2, 500);

    ctx.font = "400 34px 'Sora', sans-serif";
    ctx.fillText("has successfully participated in", W / 2, 570);

    ctx.font = "700 50px 'Sora', sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(eventName, W / 2, 630);

    ctx.font = "400 30px 'Sora', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(`held on ${eventDate}`, W / 2, 690);

    // Footer signatures (decorative)
    ctx.font = "400 24px 'Sora', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "left";
    ctx.fillText("Organizer Signature", 220, 900);
    ctx.textAlign = "right";
    ctx.fillText("Club/Dept Seal", W - 220, 900);

    resolve(canvas.toDataURL("image/png"));
  });
}
