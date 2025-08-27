"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Building2, Globe, BadgeCheck } from "lucide-react";

/* -------------------------------------------------------
   Club Page with Drawer Popup + Infinite Moving Cards
--------------------------------------------------------*/
export default function Club() {
  // Club data (your provided images + links). Add a few sample events.
  const clubCards = [
    {
      title: "AUST Robotics Club",
      logo: "https://ik.imagekit.io/qlaegzdb2/Adobe%20Express%20-%20file%20(86).png",
      url: "https://austpic.com/",
      university: "Ahsanullah University of Science & Technology",
      city: "Dhaka",
      email: "austrc@example.com",
      phone: "+8801700000000",
      description:
        "Robotics, automation and competitive engineering club fostering innovation through workshops and competitions.",
      events: [
        { title: "Robo Fest 2025", status: "Upcoming", date: "Oct 12, 2025" },
        { title: "IoT Hackday", status: "Completed", date: "Aug 2025" },
        { title: "Line Follower Challenge", status: "Completed", date: "Jul 2025" },
      ],
    },
    {
      title: "AUST Robotics Club 2",
      logo: "https://ik.imagekit.io/qlaegzdb2/Adobe%20Express%20-%20file%20(87).png",
      url: "https://aust.edu/austrc",
      university: "Ahsanullah University of Science & Technology",
      city: "Dhaka",
      email: "contact@austrc.edu",
      phone: "+8801711111111",
      description:
        "Hands-on robotics and embedded systems enthusiasts community. Learn, build and compete together.",
      events: [
        { title: "Embedded Bootcamp", status: "Ongoing", date: "Sep 02–05, 2025" },
        { title: "Automation 101", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "BUET Club",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/271756523_109469641627057_2744856006829852045_n_1_removebg_preview.png",
      url: "http://www.buet.ac.bd/clubs",
      university: "Bangladesh University of Engineering and Technology",
      city: "Dhaka",
      email: "club@buet.ac.bd",
      phone: "+8801722222222",
      description:
        "BUET students’ multi-disciplinary club organizing tech talks, fests and research showcases.",
      events: [
        { title: "TechTalks: AI Edge", status: "Upcoming", date: "Oct 2025" },
        { title: "Research Expo", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "RUET Club",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/476816991_1031997955634005_5751634906524642340_n_removebg_preview.png",
      url: "https://www.ruet.ac.bd/clubs",
      university: "Rajshahi University of Engineering & Technology",
      city: "Rajshahi",
      email: "info@ruetclub.ac.bd",
      phone: "+8801733333333",
      description:
        "Community for bridging engineering practice and leadership through events and competitions.",
      events: [
        { title: "Innovators’ Meet", status: "Upcoming", date: "Nov 2025" },
        { title: "Project Showcase", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "CUET Club",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/495506446_1085555516933852_7516840257830876744_n_removebg_preview.png",
      url: "https://www.cuet.ac.bd/clubs",
      university: "Chittagong University of Engineering & Technology",
      city: "Chattogram",
      email: "hello@cuetclub.ac.bd",
      phone: "+8801744444444",
      description:
        "CUET’s tech and culture hub hosting hackathons, art nights and leadership workshops.",
      events: [
        { title: "Hack CUET", status: "Upcoming", date: "Dec 2025" },
        { title: "Culture Night", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "Dhaka University Club",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/526631485_782085651020538_1352053436245588455_n_removebg_preview.png",
      url: "https://www.du.ac.bd/clubs",
      university: "University of Dhaka",
      city: "Dhaka",
      email: "club@du.ac.bd",
      phone: "+8801755555555",
      description:
        "DU community club promoting debate, innovation and social impact through year-round programs.",
      events: [
        { title: "Policy Debate Open", status: "Upcoming", date: "Nov 2025" },
        { title: "Social Impact Summit", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "NSU Club",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/austpic%20new%20logo%20(light%20theme)-01%20(1)%20(2).png?updatedAt=1756048907819",
      url: "https://www.northsouth.edu/clubs",
      university: "North South University",
      city: "Dhaka",
      email: "hello@nsuclub.edu",
      phone: "+8801766666666",
      description:
        "NSU’s interdisciplinary student club powering competitions, research and career development.",
      events: [
        { title: "NSU Innovate", status: "Ongoing", date: "Sep 2025" },
        { title: "Career Bootcamp", status: "Completed", date: "Jul 2025" },
      ],
    },
    {
      title: "BRAC University Club",
      logo: "https://ik.imagekit.io/qlaegzdb2/Adobe%20Express%20-%20file%20(87).png",
      url: "https://www.bracu.ac.bd/clubs",
      university: "BRAC University",
      city: "Dhaka",
      email: "contact@bracuclub.edu",
      phone: "+8801777777777",
      description:
        "Community of builders and storytellers at BRACU—events across tech, arts and entrepreneurship.",
      events: [
        { title: "Entrepreneurs’ Jam", status: "Upcoming", date: "Oct 2025" },
        { title: "Design Sprint", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "United International University (UIU) Clubs",
      logo: "https://ik.imagekit.io/qlaegzdb2/Adobe%20Express%20-%20file%20(86).png",
      url: "https://www.uiu.ac.bd/clubs",
      university: "United International University",
      city: "Dhaka",
      email: "uiuclub@uiu.ac.bd",
      phone: "+8801788888888",
      description:
        "Driving industry-ready skills via tech fests, seminars and community projects.",
      events: [
        { title: "Industry Connect", status: "Upcoming", date: "Nov 2025" },
        { title: "UIU Tech Fest", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "RU Club",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/271756523_109469641627057_2744856006829852045_n_1_removebg_preview.png",
      url: "https://www.ru.ac.bd/clubs",
      university: "University of Rajshahi",
      city: "Rajshahi",
      email: "club@ru.ac.bd",
      phone: "+8801799999999",
      description:
        "RU student club promoting leadership, research and community service.",
      events: [
        { title: "Leadership Workshop", status: "Upcoming", date: "Dec 2025" },
        { title: "RU Research Day", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "Chittagong University Club (CU)",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/476816991_1031997955634005_5751634906524642340_n_removebg_preview.png",
      url: "https://www.cu.ac.bd/clubs",
      university: "University of Chittagong",
      city: "Chattogram",
      email: "club@cu.ac.bd",
      phone: "+8801701234567",
      description:
        "Building collaboration across disciplines—tech, arts, literature and sports.",
      events: [
        { title: "CU Lit Fest", status: "Upcoming", date: "Oct 2025" },
        { title: "Sports Carnival", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "Khulna University of Engineering & Technology (KUET)",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/495506446_1085555516933852_7516840257830876744_n_removebg_preview.png",
      url: "https://www.kuet.ac.bd/clubs",
      university: "KUET",
      city: "Khulna",
      email: "club@kuet.ac.bd",
      phone: "+8801702345678",
      description:
        "Engineering excellence through contests, workshops and community growth.",
      events: [
        { title: "KUET DevCon", status: "Upcoming", date: "Nov 2025" },
        { title: "Makers’ Day", status: "Completed", date: "Aug 2025" },
      ],
    },
    {
      title: "Shahjalal University of Science and Technology (SUST) Clubs",
      logo:
        "https://ik.imagekit.io/qlaegzdb2/526631485_782085651020538_1352053436245588455_n_removebg_preview.png",
      url: "https://www.sust.edu/clubs",
      university: "SUST",
      city: "Sylhet",
      email: "club@sust.edu",
      phone: "+8801703456789",
      description:
        "SUST club empowering students with research culture and collaborative events.",
      events: [
        { title: "Data Science Day", status: "Upcoming", date: "Dec 2025" },
        { title: "SUST Innovators", status: "Completed", date: "Aug 2025" },
      ],
    },
  ];

  // Search + pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [clubsPerPage] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClubs = useMemo(
    () =>
      clubCards.filter((club) =>
        club.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const indexOfLastClub = currentPage * clubsPerPage;
  const indexOfFirstClub = indexOfLastClub - clubsPerPage;
  const currentClubs = filteredClubs.slice(indexOfFirstClub, indexOfLastClub);

  const totalPages = Math.ceil(filteredClubs.length / clubsPerPage);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  // Drawer state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const openDrawer = (club) => {
    setSelected(club);
    setOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Layout>
        <BackgroundFX />

        <section className="relative z-10 mx-auto w-[min(1200px,92%)] pt-12 sm:pt-16 md:pt-20 pb-20 sm:pb-24 md:pb-28">
          {/* Title */}
          <h1 className="text-center text-5xl font-extrabold tracking-tight">
            Explore University Clubs
          </h1><br />

          {/* Search */}
          <div className="flex justify-center mt-8 mb-10">
            <input
              type="text"
              placeholder="Search for a club..."
              className="rounded-lg py-2 px-4 text-white bg-neutral-800 border border-neutral-600 placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400 w-full max-w-md"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div><br />

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {currentClubs.map((club) => (
              <button
                key={club.title}
                onClick={() => openDrawer(club)}
                className="group rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-900 transition p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={club.logo}
                      alt={club.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold">{club.title}</h3>
                      <BadgeCheck className="h-4 w-4 text-teal-400 shrink-0" />
                    </div>
                    <p className="mt-1 text-sm text-white/70 flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span className="truncate">{club.university}</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-white/70">
                  {club.description}
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {club.city}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {club.email}
                  </span>
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
                    className="px-4 py-2 rounded-lg text-white bg-neutral-700 hover:bg-teal-400 transition-colors"
                  >
                    &lt;
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 rounded-lg text-white bg-neutral-700 hover:bg-teal-400 transition-colors ${
                        currentPage === i + 1 ? "bg-teal-400 text-black" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={nextPage}
                    className="px-4 py-2 rounded-lg text-white bg-neutral-700 hover:bg-teal-400 transition-colors"
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

/* ---------------- Drawer Component ---------------- */
function ClubDrawer({ open, onClose, club }) {
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current) return;
      if (!open) return;
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
    (club?.events || []).map((e, i) => ({
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
                  <img
                    src={club?.logo}
                    alt={club?.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                      {club?.title}
                    </h2>
                    <BadgeCheck className="h-5 w-5 text-teal-400 shrink-0" />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {club?.university}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {club?.city}
                    </span>
                  </div>
                </div>
              </div>

              {club?.description && (
                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  {club.description}
                </p>
              )}
              <div>
                <div className="mt-4 flex items-center gap-3">
                  {club?.phone && (
                    <a
                      href={`tel:${club?.phone}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 transition"
                    >
                      <Phone className="h-4 w-4" />
                      {club.phone}
                    </a>
                  )}
                  {club?.email && (
                    <a
                      href={`mailto:${club?.email}`}
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
                  <span className="text-xs leading-[1.6] text-gray-400">
                    {item.name}
                  </span>
                  <span className="text-xs leading-[1.6] text-gray-400">
                    {item.title}
                  </span>
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

      <style>{`
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
      {/* base gradient wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,#7d9dd2_12%,transparent_60%),radial-gradient(1000px_600px_at_90%_-10%,#3fc3b1_12%,transparent_60%)] opacity-30" />
      {/* soft moving blobs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[#7d9dd2]/25 blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#3fc3b1]/25 blur-3xl" />
    </>
  );
}
