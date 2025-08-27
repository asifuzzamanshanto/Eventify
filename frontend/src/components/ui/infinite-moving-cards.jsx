"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}) => {
  const containerRef = React.useRef(null);
  const scrollerRef = React.useRef(null);
  const [start, setStart] = React.useState(false);

  React.useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // duplicate children to create the infinite loop
    const scrollerContent = Array.from(scrollerRef.current.children);
    scrollerContent.forEach((item) => {
      const duplicated = item.cloneNode(true);
      scrollerRef.current.appendChild(duplicated);
    });

    // direction & speed
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

  const isImageItem = (it) => it.image || it.img || it.src;

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_18%,white_82%,transparent)]",
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
        {items.map((item, idx) => {
          if (isImageItem(item)) {
            const src = item.image || item.img || item.src;
            const alt = item.alt || item.name || `image-${idx + 1}`;
            return (
              <li
                key={`img-${idx}`}
                className="relative w-[300px] max-w-full shrink-0 rounded-2xl border border-zinc-200 px-0 py-0 dark:border-zinc-700 overflow-hidden bg-white dark:bg-neutral-900"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={alt} className="h-48 w-full object-contain bg-transparent p-4" />
                {item.caption ? (
                  <div className="px-4 pb-4 text-center text-sm text-neutral-700 dark:text-neutral-300">
                    {item.caption}
                  </div>
                ) : null}
              </li>
            );
          }

          // text/testimonial mode
          return (
            <li
              key={`${item.name ?? "card"}-${idx}`}
              className="relative w-[350px] max-w-full shrink-0 rounded-2xl border border-b-0 border-zinc-200 bg-[linear-gradient(180deg,#fafafa,#f5f5f5)] px-8 py-6 md:w-[450px] dark:border-zinc-700 dark:bg-[linear-gradient(180deg,#27272a,#18181b)]"
            >
              <blockquote>
                <span className="relative z-20 text-sm font-normal leading-[1.6] text-neutral-800 dark:text-gray-100">
                  {item.quote}
                </span>
                <div className="relative z-20 mt-6 flex flex-row items-center">
                  <span className="flex flex-col gap-1">
                    <span className="text-sm font-semibold leading-[1.6] text-neutral-800 dark:text-gray-100">
                      {item.name}
                    </span>
                    <span className="text-sm font-normal leading-[1.6] text-neutral-500 dark:text-gray-400">
                      {item.title}
                    </span>
                  </span>
                </div>
              </blockquote>
            </li>
          );
        })}
      </ul>

      {/* keyframes & animation */}
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
};
