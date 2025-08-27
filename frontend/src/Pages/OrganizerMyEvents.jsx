// frontend/src/Pages/OrganizerMyEvents.jsx
"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  Users as UsersIcon,
  PencilLine,
  Trash2,
  Search,
  ArrowUp01,
  ArrowDown10,
  Plus,
} from "lucide-react";

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
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Request failed: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/* fallback if backend returns empty during early dev */
const SAMPLE_EVENTS = [
  {
    id: "org-201",
    title: "Open Source Summit",
    date: "2025-09-18",
    location: "IUT Auditorium",
    imageUrl:
      "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=1600&auto=format&fit=crop",
    status: "Published",
  },
  {
    id: "org-202",
    title: "DevOps Day",
    date: "2025-07-12",
    location: "BRACU UB3",
    imageUrl:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1600&auto=format&fit=crop",
    status: "Published",
  },
  {
    id: "org-203",
    title: "AI Bootcamp (Spring)",
    date: "2025-03-03",
    location: "NSU SAC",
    imageUrl:
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1600&auto=format&fit=crop",
    status: "Archived",
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function OrganizerMyEvents({ initialEvents, className }) {
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [events, setEvents] = React.useState(() => {
    const arr =
      Array.isArray(initialEvents) && initialEvents.length ? initialEvents : SAMPLE_EVENTS;
    return [...arr];
  });

  // Load organizer’s events from backend
  React.useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        // returns events created by logged-in organizer
        const data = await apiJSON("/api/events/mine");
        if (!abort && Array.isArray(data) && data.length) setEvents(data);
      } catch (e) {
        console.warn("Failed to load organizer events, using fallback:", e);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  // UI: search + sort
  const [query, setQuery] = React.useState("");
  const [sortAsc, setSortAsc] = React.useState(true);

  // Filter + sort
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q
      ? events
      : events.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            (e.location || "").toLowerCase().includes(q)
        );

    list = list.sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      return sortAsc ? diff : -diff;
    });

    return list;
  }, [events, query, sortAsc]);

  // Slice into upcoming/past
  const now = new Date();
  const startToday = startOfDay(now);
  const upcoming = filtered.filter((e) => new Date(e.date) >= startToday);
  const past = filtered.filter((e) => new Date(e.date) < startToday);

  async function handleDelete(id) {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await apiJSON(`/api/events/${id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== id && e._id !== id));
    } catch (e) {
      alert(e.message || "Failed to delete.");
    }
  }

  const goManage = (ev) =>
    navigate(`/organizers/event/${ev.id || ev._id}`, { state: { event: ev } });

  return (
    <div className={cn("mx-auto w-full max-w-7xl p-4 md:p-8", className)}>
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Posted Events</h1>
          <p className="text-sm text-white/60">Upcoming are editable. Past events are locked.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
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

          {/* Sort */}
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
            title={sortAsc ? "Oldest → Newest" : "Newest → Oldest"}
          >
            {sortAsc ? <ArrowUp01 className="h-4 w-4" /> : <ArrowDown10 className="h-4 w-4" />}
            {sortAsc ? "Date ↑" : "Date ↓"}
          </button>

          {/* Create */}
          <button
            type="button"
            onClick={() => navigate("/organizers/create-event")}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          Loading…
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <SectionTitle title="Upcoming" count={upcoming.length} />
          {upcoming.length ? (
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                <EventCard
                  key={ev.id || ev._id}
                  ev={ev}
                  editable
                  onEdit={() => goManage(ev)}
                  onDelete={() => handleDelete(ev.id || ev._id)}
                  onParticipants={() =>
                    openParticipants({ id: ev.id || ev._id, title: ev.title })
                  }
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
                  key={ev.id || ev._id}
                  ev={ev}
                  editable={false}
                  onEdit={() => {}}
                  onDelete={() => handleDelete(ev.id || ev._id)}
                  onParticipants={() =>
                    openParticipants({ id: ev.id || ev._id, title: ev.title })
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyRow text="No past events." />
          )}
        </>
      )}

      {/* Participants Drawer */}
      <ParticipantsDrawer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Event Card                                                          */
/* ------------------------------------------------------------------ */
function EventCard({ ev, editable, onEdit, onDelete, onParticipants }) {
  const timeLeft = useCountdown(ev.date);

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
      className={cn(
        "group isolate overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
      )}
    >
      <div className="relative">
        <img
          src={ev.imageUrl || "https://img.freepik.com/premium-vector/trendy-event-banner-template_85212-590.jpg"}
          alt={ev.title}
          loading="lazy"
          className="h-40 w-full bg-neutral-900 object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white ring-1 ring-white/10">
          {formatDate(ev.date)}
        </div>
        {timeLeft && (
          <div className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-[11px] text-white ring-1 ring-white/10">
            ⏳ {timeLeft}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start gap-2">
          <h3 className="line-clamp-1 text-base font-semibold text-white">{ev.title}</h3>
          <span
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[11px] ring-1",
              editable
                ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
                : "bg-white/10 text-white/70 ring-white/15"
            )}
          >
            {editable ? "Upcoming" : "Past"}
          </span>
        </div>

        <div className="text-xs text-white/70">{ev.location}</div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onParticipants();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            <UsersIcon className="h-4 w-4" />
            Participants
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (editable) onEdit();
            }}
            disabled={!editable}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ring-1",
              editable
                ? "bg-white/10 text-white ring-white/10 hover:bg-white/15"
                : "cursor-not-allowed bg-white/5 text-white/40 ring-white/10"
            )}
          >
            <PencilLine className="h-4 w-4" />
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1.5 text-sm text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Participants Drawer (fetches live list per event)                   */
/* ------------------------------------------------------------------ */
function ParticipantsDrawer() {
  const [open, setOpen] = React.useState(false);
  const [eventId, setEventId] = React.useState(null);
  const [eventTitle, setEventTitle] = React.useState("");
  const [list, setList] = React.useState([]);
  const [selected, setSelected] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    window.__openParticipants = ({ id, title }) => {
      setEventId(id);
      setEventTitle(title);
      setSelected(new Set());
      setOpen(true);
      load(id);
    };
    return () => {
      delete window.__openParticipants;
    };
  }, []);

  async function apiJSON(path, options = {}) {
    const res = await fetch(path, {
      credentials: "include",
      headers: { Accept: "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `Request failed: ${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function load(id) {
    try {
      setLoading(true);
      // your backend uses /attendees
      const data = await apiJSON(`/api/events/${id}/attendees`);
      // Normalize shape
      const rows = Array.isArray(data)
        ? data.map((u) => ({
            id: u._id || u.id,
            name: u.name || u.username,
            username: u.username,
            avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`,
            status: u.status || "registered",
          }))
        : [];
      setList(rows);
    } catch (e) {
      console.warn("Failed to load participants:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  if (!open || !eventId) return null;

  const allIds = list.map((p) => p.id);
  const allSelected = selected.size === allIds.length && allIds.length > 0;

  function toggle(id) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  async function doBatch(action) {
    if (selected.size === 0) return;
    try {
      await apiJSON(`/api/events/${eventId}/participants/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userIds: [...selected] }),
      });
      await load(eventId);
      setSelected(new Set());
    } catch (e) {
      alert(e.message || "Failed to update participants.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-sm">
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="h-full w-full max-w-lg overflow-y-auto border-l border-white/10 bg-neutral-950/95 p-5 shadow-2xl"
      >
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Participants — {eventTitle}</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            Close
          </button>
        </header>

        {/* Bulk actions */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white ring-1 ring-white/10 hover:bg-white/15"
          >
            {allSelected ? "Unselect All" : "Select All"}
          </button>
          <button
            type="button"
            onClick={() => doBatch("ban")}
            className="inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
          >
            Ban
          </button>
          <button
            type="button"
            onClick={() => doBatch("complete")}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
          >
            Mark Completed
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
            Loading participants…
          </div>
        ) : (
          <ul className="space-y-2">
            {list.length ? (
              list.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-white"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                  <img src={p.avatar} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-white">{p.name}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60 ring-1 ring-white/15">
                        {p.status}
                      </span>
                    </div>
                    <div className="truncate text-xs text-white/60">@{p.username}</div>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/70">
                No participants yet.
              </li>
            )}
          </ul>
        )}
      </motion.aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small utilities                                                     */
/* ------------------------------------------------------------------ */
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
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d)}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
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

/* ------------------------------------------------------------------ */
/* UI bits                                                             */
/* ------------------------------------------------------------------ */
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

// open drawer helper
function openParticipants({ id, title }) {
  if (typeof window !== "undefined" && window.__openParticipants) {
    window.__openParticipants({ id, title });
  }
}
