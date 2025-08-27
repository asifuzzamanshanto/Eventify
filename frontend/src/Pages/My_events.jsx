"use client";

import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Download, Trash2, Search, ArrowUp01, ArrowDown10 } from "lucide-react";

/* ------------------------------ API ------------------------------- */
async function apiJSON(path, options = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    // allow binary (certificate) without forcing JSON parse
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error(`Request failed: ${res.status}`);
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* -------------------------- Page Component ------------------------ */
export default function MyEvents({ className }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState([]); // [{ event: {...}, status: 'registered'|'completed'|'banned' }]

  React.useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        // returns registrations for the logged-in student with event populated
        const data = await apiJSON("/api/registrations/mine?include=event");
        if (!abort && Array.isArray(data)) setItems(data);
      } catch (e) {
        console.warn("Failed to load my registrations:", e);
        if (!abort) setItems([]);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // search & sort
  const [query, setQuery] = React.useState("");
  const [sortAsc, setSortAsc] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q
      ? items
      : items.filter(
          (r) =>
            r.event?.title?.toLowerCase().includes(q) ||
            (r.event?.location || "").toLowerCase().includes(q)
        );

    list = list.sort((a, b) => {
      const diff = new Date(a.event?.date || 0) - new Date(b.event?.date || 0);
      return sortAsc ? diff : -diff;
    });

    return list;
  }, [items, query, sortAsc]);

  // Split into upcoming / past (certificates only for past)
  const now = new Date();
  const startToday = startOfDay(now);
  const upcoming = filtered.filter((r) => new Date(r.event?.date) >= startToday);
  const past = filtered.filter((r) => new Date(r.event?.date) < startToday);

  async function unenroll(eventId) {
    if (!confirm("Unenroll from this event?")) return;
    try {
      // Try the explicit /unregister first; if not found, try DELETE /register
      let ok = false;
      try {
        await apiJSON(`/api/events/${eventId}/unregister`, { method: "DELETE" });
        ok = true;
      } catch {
        await apiJSON(`/api/events/${eventId}/register`, { method: "DELETE" });
        ok = true;
      }
      if (ok) {
        // remove from list
        setItems((prev) => prev.filter((r) => (r.event?._id || r.event?.id) !== eventId));
      }
    } catch (e) {
      alert(e.message || "Failed to unenroll.");
    }
  }

  async function downloadCertificate(eventId, title = "certificate") {
    // Try a couple of conventional endpoints, stop at first success
    const tries = [
      `/api/certificates/${eventId}/my`,
      `/api/certificates/${eventId}/download`,
      `/api/certificates/${eventId}`,
    ];
    for (const url of tries) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) continue;
        const blob = await res.blob();
        const a = document.createElement("a");
        const href = URL.createObjectURL(blob);
        a.href = href;

        const ct = res.headers.get("content-type") || "";
        const ext = ct.includes("pdf") ? "pdf" : ct.includes("png") ? "png" : ct.includes("jpeg") ? "jpg" : "bin";
        a.download = `${slugify(title)}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
        return;
      } catch {
        // try next
      }
    }
    alert("Certificate not available for this event.");
  }

  return (
    <div className={cn("mx-auto w-full max-w-7xl p-4 md:p-8", className)}>
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Events</h1>
          <p className="text-sm text-white/60">
            Unenroll from upcoming events. Certificates are available for past events marked completed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or location…"
              className="w-64 rounded-xl bg-white/5 pl-9 pr-3 py-2 text-sm text-white placeholder-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
          </div>

          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
            title={sortAsc ? "Oldest → Newest" : "Newest → Oldest"}
          >
            {sortAsc ? <ArrowUp01 className="h-4 w-4" /> : <ArrowDown10 className="h-4 w-4" />}
            {sortAsc ? "Date ↑" : "Date ↓"}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          Loading…
        </div>
      ) : (
        <>
          {/* Upcoming — can Unenroll */}
          <SectionTitle title="Upcoming" count={upcoming.length} />
          {upcoming.length ? (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((r) => (
                <StudentEventCard
                  key={r.event?._id || r.event?.id}
                  ev={r.event}
                  status={r.status}
                  actions={
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        unenroll(r.event?._id || r.event?.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1.5 text-sm text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
                    >
                      <Trash2 className="h-4 w-4" />
                      Unenroll
                    </button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyRow text="No upcoming events." />
          )}

          {/* Past — show Download if status === completed */}
          <SectionTitle title="Past" count={past.length} />
          {past.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((r) => {
                const canDownload = (r.status || "").toLowerCase() === "completed";
                return (
                  <StudentEventCard
                    key={r.event?._id || r.event?.id}
                    ev={r.event}
                    status={r.status}
                    actions={
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canDownload) {
                            downloadCertificate(r.event?._id || r.event?.id, r.event?.title || "Certificate");
                          }
                        }}
                        disabled={!canDownload}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1",
                          canDownload
                            ? "bg-white/10 text-white ring-white/10 hover:bg-white/15"
                            : "cursor-not-allowed bg-white/5 text-white/40 ring-white/10"
                        )}
                        title={
                          canDownload
                            ? "Download certificate"
                            : "Certificate not available (not marked completed)"
                        }
                      >
                        <Download className="h-4 w-4" />
                        Download Certificate
                      </button>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <EmptyRow text="No past events." />
          )}
        </>
      )}
    </div>
  );
}

/* ----------------------------- Card -------------------------------- */
function StudentEventCard({ ev = {}, status = "registered", actions = null }) {
  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
      className={cn("group isolate overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10")}
    >
      <div className="relative">
        <img
          src={ev.imageUrl || "https://placehold.co/1600x900?text=Event+Banner"}
          alt={ev.title}
          loading="lazy"
          className="h-40 w-full bg-neutral-900 object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white ring-1 ring-white/10">
          {formatDate(ev.date)}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-white">{ev.title}</h3>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70 ring-1 ring-white/15">
            {status}
          </span>
        </div>
        <div className="text-xs text-white/70">{ev.location}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {actions}
        </div>
      </div>
    </motion.article>
  );
}

/* ----------------------------- UI bits ----------------------------- */
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

/* ----------------------------- Utils ------------------------------ */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return iso;
  }
}
function slugify(s = "") {
  return s.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
