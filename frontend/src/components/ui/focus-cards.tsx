"use client";

import React, { useState } from "react";

/** simple cn helper */
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Card
 * - Background image only when showOverlay=false
 * - Optional overlay on hover when showOverlay=true
 */
export const Card = React.memo(function Card({
  card,
  index,
  hovered,
  setHovered,
  showOverlay = true,
}) {
  return (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "relative h-72 md:h-96 w-full overflow-hidden rounded-2xl",
        "bg-neutral-900 ring-1 ring-white/10",
        "transition-all duration-300 ease-out",
        hovered !== null && hovered !== index && "blur-[1px] scale-[0.99] opacity-80"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.src}
        alt={card.title || "card image"}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      {/* Subtle gradient at bottom even without overlay (for depth) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/30" />

      {showOverlay && (
        <div
          className={cn(
            "absolute inset-0 bg-black/50 flex items-end py-6 px-4 transition-opacity duration-300",
            hovered === index ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
            {card.title}
          </div>
        </div>
      )}
    </div>
  );
});

/** FocusCards — responsive grid of hoverable image cards */
export function FocusCards({ cards = [], showOverlay = true }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="grid w-full max-w-6xl mx-auto grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
      {cards.map((card, index) => (
        <Card
          key={`${card.title || "card"}-${index}`}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          showOverlay={showOverlay}
        />
      ))}
    </div>
  );
}
