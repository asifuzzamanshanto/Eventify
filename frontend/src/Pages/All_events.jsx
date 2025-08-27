// frontend/src/Pages/All_events.jsx
"use client";

import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Users as UsersIcon, Calendar, MapPin } from "lucide-react";

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
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || `Request failed: ${res.status}`);
  return text ? JSON.parse(text) : null;
}

/* ------------------------------ Page ------------------------------ */
export default function AllEvents({ className }) {
  const navigate = useNavigate();

  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  // role (App saves user in localStorage already)
  const [role] = React.useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw)?.role : null;
    } catch {
      return null;
    }
  });
  const isStudent = role === "Student";

  // registrations for the current student (so we can hide enrolled)
  const [registeredIds, setRegisteredIds] = React.useState(new Set());

  React.useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const list = await apiJSON("/api/events");
        if (!abort) setEvents(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load events.");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, []);

  // load my upcoming registrations if I'm a student, so we exclude them
  React.useEffect(() => {
    if (!isStudent) return;
    let abort = false;
    (async () => {
      try {
        const regs = await apiJSON("/api/registrations/mine?scope=upcoming");
        if (abort || !Array.isArray(regs)) return;
        const ids = new Set(
          regs
            .map(r => r?.event?._id || r?._id || r?.event?.id)
            .filter(Boolean)
        );
        setRegisteredIds(ids);
      } catch {
        // ignore (403 if not student / not logged in)
      }
    })();
    return () => { abort = true; };
  }, [isStudent]);

  async function enroll(eventId) {
    try {
      if (!isStudent) {
        navigate("/login");
        return;
      }
      await apiJSON(`/api/events/${eventId}/register`, { method: "POST" });
      // remove from list immediately
      setEvents(prev => prev.filter(e => (e._id || e.id) !== eventId));
      // also mark enrolled locally
      setRegisteredIds(prev => new Set(prev).add(eventId));
      // ship to My Events (as requested)
      navigate("/student/myevents");
    } catch (e) {
      alert(e.message || "Failed to enroll.");
    }
  }

  // exclude already-enrolled items for students
  const visibleEvents = React.useMemo(() => {
    if (!isStudent) return events;
    return events.filter(ev => !registeredIds.has(ev._id || ev.id));
  }, [events, isStudent, registeredIds]);

  return (
    <div className={cn("mx-auto w-full max-w-7xl p-4 md:p-8", className)}>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-white">All Events</h1>
        <p className="text-sm text-white/60">Browse and enroll in upcoming events.</p>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          Loading…
        </div>
      ) : err ? (
        <div className="rounded-2xl border border-white/10 bg-red-500/10 p-8 text-center text-red-300">
          {err}
        </div>
      ) : visibleEvents.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
          No events found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((ev) => {
            const id = ev._id || ev.id;
            return (
              <motion.article
                key={id}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 250, damping: 22 }}
                className="group isolate overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10"
              >
                <div className="relative">
                  <img
                    src={ev.imageUrl || "https://placehold.co/1600x900?text=Event+Banner"}
                    alt={ev.title}
                    loading="lazy"
                    className="h-40 w-full bg-neutral-900 object-cover"
                    onClick={() => navigate(`/events/${id}`)}
                    style={{ cursor: "pointer" }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white ring-1 ring-white/10">
                    <Calendar className="mr-1 inline-block h-3.5 w-3.5 -translate-y-[1px]" />
                    {formatDate(ev.date)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-4">
                  <h3
                    className="line-clamp-1 cursor-pointer text-base font-semibold text-white"
                    onClick={() => navigate(`/events/${id}`)}
                    title={ev.title}
                  >
                    {ev.title}
                  </h3>

                  <div className="flex items-center gap-1 text-xs text-white/70">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{ev.location}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/events/${id}`)}
                      className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
                    >
                      <UsersIcon className="h-4 w-4" />
                      Details
                    </button>

                    {isStudent && (
                      <button
                        type="button"
                        onClick={() => enroll(id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#7d9dd2]/20 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-[#7d9dd2]/30"
                        title="Enroll in this event"
                      >
                        Enroll
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Utils ------------------------------ */
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
