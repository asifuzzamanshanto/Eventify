"use client";

import React, { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Building2, Globe, BadgeCheck } from "lucide-react";

/* -------------------------------------------------------
   Club Page (Organizer users -> club profiles)
   Pulls:
   - Club name: clubName
   - Club logo: clubLogoUrl
   - Club address (city): city
   - Club URL: clubWebsite
   - User details: bio
--------------------------------------------------------*/
export default function Club() {
  // Server data
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Search + pagination (server-driven)
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);

  // Drawer state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  async function fetchClubs() {
    try {
      setLoading(true);
      setErr("");
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/users/organizer-clubs?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Request failed: ${res.status}`);
      }
      const json = await res.json();
      setClubs(Array.isArray(json?.data) ? json.data : []);
      setTotalPages(Math.max(parseInt(json?.totalPages || 1, 10), 1));
    } catch (e) {
      setErr(e.message || "Failed to load clubs");
      setClubs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  const openDrawer = (club) => {
    setSelected(club);
    setOpen(true);
  };

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Layout>
        <BackgroundFX />

        <section className="relative z-10 mx-auto w-[min(1200px,92%)] pt-12 sm:pt-16 md:pt-20 pb-20 sm:pb-24 md:pb-28">
          {/* Title */}
          <h1 className="text-center text-5xl font-extrabold tracking-tight">
            Explore University Clubs
          </h1><br></br>

          {/* Search */}
          <div className="flex justify-center mt-8 mb-10">
            <input
              type="text"
              placeholder="Search by club, university, city…"
              className="rounded-lg py-2 px-4 text-white bg-neutral-800 border border-neutral-600 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400 w-full max-w-md"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div><br></br>

          {/* States */}
          {err && (
            <div className="mx-auto max-w-xl mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              {err}
            </div>
          )}
          {loading && (
            <div className="mx-auto max-w-xl mb-6 rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 text-white/80">
              Loading clubs…
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {!loading && clubs.length === 0 && (
              <div className="sm:col-span-2 md:col-span-3 text-center text-white/70">
                No clubs found.
              </div>
            )}

            {clubs.map((club, idx) => (
              <button
                key={`${club.title || club.clubName || "club"}-${idx}`}
                onClick={() => openDrawer(mapToCard(club))}
                className="group rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-900 transition p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {club.logo || club.clubLogoUrl ? (
                      <img
                        src={club.logo || club.clubLogoUrl}
                        alt={club.title || club.clubName || "Club"}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-xs text-white/40">
                        No Logo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold">
                        {club.title || club.clubName || "Organizer"}
                      </h3>
                      <BadgeCheck className="h-4 w-4 text-teal-400 shrink-0" />
                    </div>
                    <p className="mt-1 text-sm text-white/70 flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{club.university || ""}</span>
                    </p>
                  </div>
                </div>

                {(club.description || club.bio) && (
                  <p className="mt-3 line-clamp-2 text-sm text-white/70">
                    {club.description || club.bio}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-3 text-xs text-white/60">
                  {club.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {club.city}
                    </span>
                  )}
                  {club.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {club.email}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-10">
            <nav>
              <ul className="flex gap-4 items-center">
                <li>
                  <button
                    onClick={prevPage}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg text-white bg-neutral-700 enabled:hover:bg-teal-400 transition-colors disabled:opacity-40"
                  >
                    &lt;
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setPage(i + 1)}
                      className={`px-4 py-2 rounded-lg text-white bg-neutral-700 hover:bg-teal-400 transition-colors ${
                        page === i + 1 ? "bg-teal-400 text-black" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={nextPage}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-lg text-white bg-neutral-700 enabled:hover:bg-teal-400 transition-colors disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </section>

        {/* Drawer Popup */}
        <ClubDrawer open={open} onClose={() => setOpen(false)} club={selected} />
      </Layout>
    </main>
  );
}

/* --------------- Helpers --------------- */
function mapToCard(u) {
  // Normalize Organizer user -> club card fields (strictly as requested)
  return {
    title: u.title || u.clubName || u.fullName || u.username || "Organizer",
    logo: u.logo || u.clubLogoUrl || "",
    url: u.url || u.clubWebsite || "",
    university: u.university || "",
    city: u.city || "",
    email: u.email || "",
    phone: u.phone || u.phoneNumber || "",
    description: u.description || u.bio || "", // <-- User details (bio)
    events: Array.isArray(u.events) ? u.events : [],
  };
}

/* ---------------- Drawer Component ---------------- */
function ClubDrawer({ open, onClose, club }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (!ref.current || !open) return;
      if (!ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open, onClose]);

  const items =
    club?.events?.map((e, i) => ({
      id: i,
      quote: `${e.title} — ${e.status}`,
      name: club?.title || "",
      title: e.date || "",
      raw: e,
    })) || [];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          {/* Panel */}
          <motion.aside
            ref={ref}
            className="fixed right-0 top-0 h-full w-full max-w-[560px] z-50 bg-neutral-950 border-l border-neutral-800 shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-neutral-800">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {club?.logo ? (
                    <img src={club?.logo} alt={club?.title} className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-xs text-white/40">
                      No Logo
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                      {club?.title}
                    </h2>
                    <BadgeCheck className="h-5 w-5 text-teal-400 shrink-0" />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    {club?.university && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {club?.university}
                      </span>
                    )}
                    {club?.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {club?.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {club?.description && (
                <p className="mt-4 text-sm leading-relaxed text-white/80">{club.description}</p>
              )}

              <div>
                <div className="mt-4 flex items-center gap-3">
                  {club?.phone && (
                    <a
                      href={`tel:${club.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 transition"
                    >
                      <Phone className="h-4 w-4" />
                      {club.phone}
                    </a>
                  )}
                  {club?.email && (
                    <a
                      href={`mailto:${club.email}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 transition"
                    >
                      <Mail className="h-4 w-4" />
                      {club.email}
                    </a>
                  )}
                </div>
                <br />
                {club?.url && (
                  <a
                    href={club.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-teal-400 px-4 py-2 text-sm font-medium text-black hover:bg-teal-300 transition"
                  >
                    <Globe className="h-4 w-4" />
                    View Website
                  </a>
                )}
              </div>
            </div>

            {/* Events Moving Cards */}
            <div className="p-6 md:p-8">
              <h3 className="text-base md:text-lg font-semibold mb-3">Club Events</h3>
              {items.length > 0 ? (
                <InfiniteMovingCards
                  items={items}
                  direction="right"
                  speed="slow"
                  pauseOnHover
                  className="mt-2"
                  onView={() => {
                    if (club?.url) window.open(club.url, "_blank", "noopener,noreferrer");
                  }}
                />
              ) : (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-white/70">
                  No events to show right now.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800 flex justify-end gap-3">
              <button
                className="px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-sm hover:bg-neutral-800 transition"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* -------- Infinite Moving Cards (with "View" capsule button) -------- */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
  onView = () => {},
}) {
  const containerRef = React.useRef(null);
  const scrollerRef = React.useRef(null);
  const [start, setStart] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;
    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const duplicatedItem = item.cloneNode(true);
      scrollerRef.current.appendChild(duplicatedItem);
    });
    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );
    containerRef.current.style.setProperty(
      "--animation-duration",
      speed === "fast" ? "20s" : speed === "normal" ? "40s" : "80s"
    );
    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            key={idx}
            className="relative w-[320px] max-w-full shrink-0 rounded-2xl border border-neutral-800 bg-neutral-900 px-6 py-5"
          >
            <blockquote>
              <span className="relative z-20 text-sm leading-[1.6] font-normal text-gray-100">
                {item.quote}
              </span>

              {/* Footer row: meta (left) + View button (right) */}
              <div className="relative z-20 mt-4 flex items-center justify-between">
                <span className="flex flex-col gap-1">
                  <span className="text-xs leading-[1.6] text-gray-400">{item.name}</span>
                  <span className="text-xs leading-[1.6] text-gray-400">{item.title}</span>
                </span>

                <button
                  type="button"
                  onClick={() => onView(item)}
                  className="inline-flex items-center rounded-full bg-teal-400 px-3 py-1 text-xs font-medium text-black hover:bg-teal-300 transition"
                >
                  View
                </button>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .animate-scroll {
          animation: scroll var(--animation-duration, 40s) linear infinite;
          animation-direction: var(--animation-direction, forwards);
        }
        @keyframes scroll {
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------ BackgroundFX (as in your app) ------------------ */
function BackgroundFX() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,#7d9dd2_12%,transparent_60%),radial-gradient(1000px_600px_at_90%_-10%,#3fc3b1_12%,transparent_60%)] opacity-30" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[#7d9dd2]/25 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#3fc3b1]/25 blur-3xl animate-float-slower" />
    </>
  );
}
