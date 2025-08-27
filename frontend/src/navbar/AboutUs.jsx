"use client";

import React from "react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { ShieldCheck, BarChart3, Users } from "lucide-react";
import { FocusCards } from "@/components/ui/focus-cards";

export default function AboutUs() {
  // Developer images (updated URLs)
  const devCards = [
    {
      title: "Asifuzzaman Shanto",
      src: "https://ik.imagekit.io/vutfc4tgw/474081583_963415272382587_924419950208268647_n.jpg?updatedAt=1756265987344",
    },
    {
      title: "Ma-Huan Sheikh Meem",
      src: "https://ik.imagekit.io/vutfc4tgw/480890573_1714097362795612_6046324438614651367_n.jpg?updatedAt=1756266177221",
    },
    {
      title: "Tahmid Khan",
      // Keeping the existing Tahmid link you shared earlier
      src: "https://ik.imagekit.io/vutfc4tgw/518981234_2437074706676917_3469959992435743569_n.jpg?updatedAt=1756265988273",
    },
  ];

  const devInfo = [
    {
      name: "Asifuzzaman Shanto",
      role: "Frontend Developer",
      id: "20220204008",
      semester: "3.1",
      dept: "Computer Science and Engineering",
    },
    {
      name: "Ma-Huan Sheikh Meem",
      role: "Frontend Developer",
      id: "20220204070",
      semester: "3.1",
      dept: "Computer Science and Engineering",
    },
    {
      name: "Tahmid Khan",
      role: "Backend Developer",
      id: "20220204086",
      semester: "3.1",
      dept: "Computer Science and Engineering",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <Layout>
        <BackgroundFX />

        <section className="relative z-10 mx-auto w-[min(1200px,92%)] pt-12 sm:pt-16 md:pt-20 pb-20 sm:pb-24 md:pb-28">
          {/* HERO */}
          <div className="text-center mb-14 sm:mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl font-bold mb-5"
            >
              <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
                Welcome to Eventify
              </span>
            </motion.h1>

            {/* Short description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mx-auto max-w-2xl text-base sm:text-lg text-white/80"
            >
              Eventify is a modern platform to <span className="text-white">discover</span>,{" "}
              <span className="text-white">plan</span>, and{" "}
              <span className="text-white">manage</span> university events. Clubs and organizers
              can showcase activities, while students quickly find workshops, fests, hackathons,
              and more — all in one place.
            </motion.p>
          </div>

          {/* Feature badges */}
          <div className="mx-auto mb-16 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
            <FeatureBadge
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Role-based Access"
              desc="Admin, Organizer, and Attendee flows keep things secure and simple."
            />
            <FeatureBadge
              icon={<BarChart3 className="h-5 w-5" />}
              title="Event Insights"
              desc="Track performance and engagement to grow your community."
            />
            <FeatureBadge
              icon={<Users className="h-5 w-5" />}
              title="Community First"
              desc="Clubs, meetups, and collaborations — unified under one hub."
            />
          </div>

          {/* Developers — image cards (no text overlay) */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold">Meet the Developers</h2>
            <p className="mt-2 text-white/70">
              Team: <span className="text-white">If_it_works_it_works</span> • Semester:{" "}
              <span className="text-white">3.1</span> • Department:{" "}
              <span className="text-white">Computer Science and Engineering</span>
            </p>
          </div>

          {/* Images only */}
          <FocusCards cards={devCards} showOverlay={false} />

          {/* Names & details OUTSIDE the cards */}
          <div className="mt-6 grid w-full max-w-6xl mx-auto grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {devInfo.map((dev) => (
              <div
                key={dev.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left"
              >
                <h3 className="text-lg font-semibold">{dev.name}</h3>
                <p className="text-sm text-white/80 mt-1">{dev.role}</p>
                <p className="text-sm text-white/70 mt-1">ID: {dev.id}</p>
                <p className="text-sm text-white/70">
                  Semester: {dev.semester} • Dept: {dev.dept}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Layout>
    </main>
  );
}

/* ---------- Local bits ---------- */
function FeatureBadge({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-teal-300 ring-1 ring-white/10">
        {icon}
      </div>
      <div className="text-left">
        <h3 className="text-base font-medium text-white">{title}</h3>
        <p className="text-sm text-white/70 leading-6">{desc}</p>
      </div>
    </div>
  );
}

/* Soft radial blobs */
function BackgroundFX() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,#7d9dd2_12%,transparent_60%),radial-gradient(1000px_600px_at_90%_-10%,#3fc3b1_12%,transparent_60%)] opacity-30" />
      <div className="pointer-events-none absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[#7d9dd2]/25 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-[32rem] w-[32rem] rounded-full bg-[#3fc3b1]/25 blur-3xl animate-float-slower" />
    </>
  );
}
