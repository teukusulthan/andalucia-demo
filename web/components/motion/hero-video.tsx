"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

/**
 * Fullscreen background video, muted and looped, as the brief specifies.
 *
 * Under `prefers-reduced-motion` the video is never mounted and the poster frame is shown
 * instead: autoplaying footage is exactly what that preference exists to suppress. The poster
 * is also what renders before the video has buffered, so the hero is never empty.
 */
export function HeroVideo({
  src,
  poster,
  alt,
}: {
  src: string;
  poster: string;
  alt: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <Image src={poster} alt={alt} fill priority sizes="100vw" className="object-cover" />;
  }

  return (
    <video
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={alt}
      className="size-full object-cover"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

/**
 * Scroll indicator: a line that travels down its rail, per the brief. Decorative and
 * aria-hidden, but it is a real anchor link so keyboard users get the same shortcut.
 */
export function ScrollCue({ href = "#main", inline = false }: { href?: string; inline?: boolean }) {
  const reduce = useReducedMotion();

  /* Inline sits in the hero's own meta row and runs horizontally, so nothing is positioned over
     the copy. Absolute is the original centred column, kept for the stacked hero layout. */
  const rail = inline ? "h-px w-14" : "h-12 w-px";
  const travel = inline ? { x: ["-100%", "100%"] } : { y: ["-100%", "100%"] };

  return (
    <a
      href={href}
      className={
        inline
          ? "inline-flex min-h-11 items-center gap-4 text-[10px] font-medium uppercase tracking-[0.22em] text-on-deep/85 transition-colors hover:text-on-deep"
          : "absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[10px] font-medium uppercase tracking-[0.22em] text-on-deep/85 transition-opacity hover:text-on-deep"
      }
    >
      <span className="sr-only">Skip to the page content</span>
      <span aria-hidden="true">Scroll</span>
      <span
        aria-hidden="true"
        className={`relative block overflow-hidden bg-on-deep/25 ${rail}`}
      >
        {reduce ? null : (
          <motion.span
            className={`absolute block bg-on-deep ${inline ? "inset-y-0 w-14" : "inset-x-0 h-12"}`}
            initial={false}
            animate={travel}
            transition={{ duration: 2.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.35 }}
          />
        )}
      </span>
    </a>
  );
}
