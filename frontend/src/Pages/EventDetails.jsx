// frontend/src/Pages/EventDetails.jsx
"use client";

import React from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** -------------------------------------------------------------
 * Helpers reused from MyEvents for consistency
 * ------------------------------------------------------------- */
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
function createCertificatePNG({ studentName, institution, eventName, eventDate }) {
  const W = 1600, H = 1131;
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1f2937");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 12;
    ctx.strokeRect(30, 30, W - 60, H - 60);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.font = "700 72px 'Sora', sans-serif";
    ctx.fillText("Certificate of Participation", W / 2, 220);

    ctx.globalAlpha = 0.25;
    ctx.fillRect(W * 0.2, 250, W * 0.6, 3);
    ctx.globalAlpha = 1;

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

    ctx.font = "400 24px 'Sora', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "left";
    ctx.fillText("Organizer Signature", 220, 900);
    ctx.textAlign = "right";
    ctx.fillText("Club/Dept Seal", W - 220, 900);

    resolve(canvas.toDataURL("image/png"));
  });
}

/** -------------------------------------------------------------
 * Component
 * ------------------------------------------------------------- */
export default function EventDetails({ className }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation(); // expect { event }
  const [event, setEvent] = React.useState(state?.event ?? null);
  const [loading, setLoading] = React.useState(!state?.event);
  const [error, setError] = React.useState("");

  // Dummy current user (replace with auth context)
  const currentUser = { fullName: "Tahmid Khan", institution: "AUST" };

  // If we didn't receive event via router state, do a light fetch as fallback.
  React.useEffect(() => {
    if (state?.event) return;
    let abort = false;
    (async () => {
      try {
        const res = await fetch(`/api/events/${id}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Failed to fetch event.");
        const data = await res.json();
        if (!abort) setEvent(data);
      } catch (err) {
        if (!abort) setError(err.message || "Something went wrong.");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [id, state?.event]);

  const isPast = React.useMemo(() => {
    if (!event?.date) return false;
    return new Date(event.date) < startOfDay(new Date());
  }, [event?.date]);

  const countdown = useCountdown(event?.date);

  const canGenerateCertificate =
    Boolean(event?.completed) && isPast; // visible only if organizer marked completed AND event is past

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-white/70">
        Loading…
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-white/70">
        {error || "Event not found."}
      </div>
    );
  }

  return (
    <div className={cn("relative z-10 mx-auto w-full max-w-5xl p-4 md:p-8", className)}>
      {/* Top actions */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to={-1}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
        >
          ← Back
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {!isPast && (
            <button
              onClick={() => navigate(-1)} // front-end only; wire API later
              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-sm text-red-200 ring-1 ring-red-400/30 hover:bg-red-500/25"
            >
              Unenroll
            </button>
          )}

          {canGenerateCertificate && (
            <button
              onClick={async () => {
                const dataUrl = await createCertificatePNG({
                  studentName: currentUser.fullName,
                  institution: currentUser.institution,
                  eventName: event.title || event.name,
                  eventDate: formatDate(event.date),
                });
                download(dataUrl, `${slugify(event.title || event.name)}-certificate.png`);
              }}
              className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25"
            >
              Generate Certificate
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <img
          src={event.imageUrl || event.cover || "https://placehold.co/1200x675?text=Event"}
          alt={event.title || event.name}
          className="h-[260px] w-full object-cover sm:h-[360px]"
        />
        {countdown && (
          <div className="absolute right-6 top-6 rounded-lg bg-black/60 px-3 py-1 text-xs text-white ring-1 ring-white/10">
            ⏳ {countdown}
          </div>
        )}
      </div>

      {/* Title + Meta */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-white">
          {event.title || event.name}
        </h1>

        <Link
          to="/student/myevents"
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/10 hover:bg-white/15"
        >
          My Events
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {event.category && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white ring-1 ring-white/10">
            {event.category}
          </span>
        )}
        {event.location && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white ring-1 ring-white/10">
            {event.location}
          </span>
        )}
        {event.date && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white ring-1 ring-white/10">
            {formatDateTime(event.date)}
          </span>
        )}
        {(event?.university || event?.createdBy?.clubName || event?.createdBy?.username) && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white ring-1 ring-white/10">
            {event.university || event?.createdBy?.clubName || event?.createdBy?.username}
          </span>
        )}
        {event.club && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white ring-1 ring-white/10">
            {event.club}
          </span>
        )}
        {event.status && (
          <span className="rounded-full bg-white/5 px-3 py-1 text-white ring-1 ring-white/10">
            {event.status}
          </span>
        )}
      </div>

      {/* Description card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-6 text-white/90"
      >
        <h2 className="mb-2 text-lg font-semibold text-white">About this event</h2>
        <p className="whitespace-pre-line text-sm leading-6 text-white/80">
          {event.description || "No description provided."}
        </p>

        {/* Extra info grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {event.venue && (
            <InfoRow label="Venue" value={event.venue} />
          )}
          {event.capacity && (
            <InfoRow label="Capacity" value={String(event.capacity)} />
          )}
          {event.registrationDeadline && (
            <InfoRow label="Registration Deadline" value={formatDateTime(event.registrationDeadline)} />
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      <div className="text-sm text-white/90">{value}</div>
    </div>
  );
}
