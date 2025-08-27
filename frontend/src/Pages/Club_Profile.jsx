"use client";

import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "@/components/ui/animated-modal";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import {
  MapPin,
  Phone,
  Mail,
  Building2,
  Globe,
  BadgeCheck,
} from "lucide-react";

/**
 * Usage (inside your Club.jsx where you render each card):
 *
 * <ClubProfileTrigger club={clubObject}>
 *   <YourCardComponent ... />
 * </ClubProfileTrigger>
 *
 * Where clubObject looks like:
 * {
 *   logo: "https://link.to/logo.png",
 *   name: "AUST Robotics Club",
 *   university: "Ahsanullah University of Science & Technology",
 *   city: "Dhaka",
 *   email: "contact@austrc.com",
 *   phone: "+8801XXXXXXXXX",
 *   website: "https://aust.edu/austrc",
 *   description: "Short description about the club...",
 *   events: [
 *     { title: "Robo Fest 2025", status: "Upcoming", date: "Oct 12, 2025" },
 *     { title: "IoT Hackday", status: "Ongoing", date: "Sep 02–05, 2025" },
 *     { title: "Automation 101", status: "Completed", date: "Aug 2025" },
 *   ]
 * }
 */

export default function Club_Profile() {
  // This default export is optional to avoid import errors if you accidentally import the file directly.
  return null;
}

export function ClubProfileTrigger({ club, children }) {
  const data = withDefaults(club);

  // Map events to InfiniteMovingCards format
  const items = (data.events || []).map((e) => ({
    quote: `${e.title} — ${e.status}`,
    name: data.name,
    title: e.date || "",
  }));

  return (
    <Modal>
      <ModalTrigger className="!bg-transparent !border-none !p-0 !rounded-none !text-inherit">
        {/* Whatever you pass as children (the club card) becomes the trigger */}
        {children}
      </ModalTrigger>

      <ModalBody>
        <ModalContent className="p-0">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-neutral-800">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.logo}
                  alt={data.name}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
                    {data.name}
                  </h2>
                  <BadgeCheck className="h-5 w-5 text-teal-400" />
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {data.university}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {data.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {data.description && (
              <p className="mt-4 text-sm md:text-[15px] leading-relaxed text-white/80">
                {data.description}
              </p>
            )}

            {/* Contact + Website */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {data.phone && (
                <a
                  href={`tel:${data.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 transition"
                >
                  <Phone className="h-4 w-4" />
                  {data.phone}
                </a>
              )}
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 transition"
                >
                  <Mail className="h-4 w-4" />
                  {data.email}
                </a>
              )}

              {data.website && (
                <a
                  href={data.website}
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

          {/* Events scroller */}
          <div className="p-6 md:p-8">
            <h3 className="text-base md:text-lg font-semibold mb-3">
              Club Events
            </h3>

            {items.length > 0 ? (
              <InfiniteMovingCards
                items={items}
                direction="right"
                speed="slow"
                pauseOnHover
                className="mt-2"
              />
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-sm text-white/70">
                No events to show right now.
              </div>
            )}
          </div>
        </ModalContent>

        <ModalFooter>
          <button
            className="px-3 py-2 rounded-lg border border-neutral-800 bg-neutral-900 text-sm hover:bg-neutral-800 transition"
            onClick={() => window.history.back?.()}
          >
            Close
          </button>
          {data.website && (
            <a
              href={data.website}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-lg bg-teal-400 text-black text-sm font-medium hover:bg-teal-300 transition"
            >
              Visit Website
            </a>
          )}
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}

/* ---------- helpers ---------- */

function withDefaults(club = {}) {
  return {
    logo:
      club.logo ||
      "https://dummyimage.com/200x200/111111/ffffff&text=Club+Logo",
    name: club.name || "Club Name",
    university: club.university || "University",
    city: club.city || "City",
    email: club.email || "",
    phone: club.phone || "",
    website: club.website || "",
    description:
      club.description ||
      "This is a short description about the club. Add mission, activities, and why students should join.",
    events:
      club.events ||
      [
        { title: "Welcome Orientation", status: "Upcoming", date: "Oct 2025" },
        { title: "Tech Talk Series", status: "Ongoing", date: "Sep 2025" },
        { title: "Alumni Meetup", status: "Completed", date: "Aug 2025" },
      ],
  };
}
