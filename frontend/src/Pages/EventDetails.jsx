// frontend/src/Pages/EventDetails.jsx
"use client";

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, MapPin, Users as UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
export default function EventDetails({ className }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  const [role] = React.useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw)?.role : null;
    } catch {
      return null;
    }
  });
  const isStudent = role === "Student";

  const [alreadyEnrolled, setAlreadyEnrolled] = React.useState(false);

  React.useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const ev = await apiJSON(`/api/events/${id}`);
        if (!abort) setEvent(ev);
      } catch (e) {
        if (!abort) setErr(e.message || "Failed to load event.");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [id]);

  // Check if this event is already in my registrations (upcoming)
  React.useEffect(() => {
    if (!isStudent) return;
    let abort = false;
    (async () => {
      try {
        const regs = await apiJSON("/api/registrations/mine?scope=upcoming");
        if (abort || !Array.isArray(regs)) return;
        const found = regs.some(r => (r?.event?._id || r?._id || r?.event?.id) === id);
        setAlreadyEnrolled(found);
      } catch {
        // ignore
      }
    })();
    return () => { abort = true; };
  }, [id, isStudent]);

  async function enroll() {
    try {
      if (!isStudent) {
        navigate("/login");
        return;
      }
      await apiJSON(`/api/events/${id}/register`, { method: "POST" });
      // ship to My Events immediately
      navigate("/student/myevents");
    } catch (e) {
      alert(e.message || "Failed to enroll.");
    }
  }

  if (loading) {
    return <div className="grid min-h-[40vh] place-items-center text-white/70">Loading…</div>;
  }
  if (err || !event) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-white/70">
        {err || "Event not found."}
      </div>
    );
  }

  const isPast = new Date(event.date) < new Date();

  return (
    <div className={cn("mx-auto w-full max-w-5xl p-4 md:p-8 text-white", className)}>
      <div className="mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <img
          src={event.imageUrl || "https://placehold.co/1600x900?text=Event+Banner"}
          alt={event.title}
          className="h-[260px] w-full object-cover sm:h-[360px]"
        />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6"
      >
        <h1 className="mb-2 text-2xl font-semibold">{event.title}</h1>

        <div className="mb-4 flex flex-wrap gap-3 text-sm text-white/80">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDateTime(event.date)}
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location}
          </span>
        </div>

        <p className="mb-6 whitespace-pre-line text-white/85">{event.description}</p>

        {/* Actions: Show only ENROLL for students, when not past & not already enrolled */}
        {!isPast && isStudent && !alreadyEnrolled && (
          <div className="mt-2">
            <button
              type="button"
              onClick={enroll}
              className="inline-flex items-center gap-2 rounded-xl bg-[#7d9dd2]/20 px-4 py-2 text-sm text-white ring-1 ring-white/10 hover:bg-[#7d9dd2]/30"
            >
              <UsersIcon className="h-4 w-4" />
              Enroll
            </button>
          </div>
        )}
      </motion.section>
    </div>
  );
}

/* ------------------------------ Utils ------------------------------ */
function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
