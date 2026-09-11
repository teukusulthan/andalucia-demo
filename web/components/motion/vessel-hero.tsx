"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Vessel opener, as the brief describes it: the photograph holds, dims, and then the name
 * fades in smoothly at the centre of the frame with its tagline beneath.
 *
 * This is the one page where the composition is centred rather than left-aligned. That is
 * deliberate and scoped: it is the vessel's title card, not a section header, and the rest of
 * the site keeps its left-aligned grid.
 *
 * Under reduced motion the whole sequence resolves immediately to its final state.
 */
export function VesselHero({
  src,
  blurDataURL,
  alt,
  eyebrow,
  name,
  tagline,
  actions,
}: {
  src: string;
  blurDataURL: string;
  alt: string;
  eyebrow?: string;
  name: string;
  tagline?: string;
  actions?: ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[88svh] items-center justify-center overflow-hidden bg-deep text-on-deep">
      {/* the photograph settles, then dims so the name can take the frame */}
      <motion.div
        className="absolute inset-0 -z-20"
        initial={reduce ? false : { opacity: 1, scale: 1.06 }}
        animate={{ opacity: 0.72, scale: 1 }}
        transition={{ opacity: { duration: 1.6, delay: 0.9, ease: "easeInOut" }, scale: { duration: 2.4, ease: EASE } }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={blurDataURL}
          className="object-cover"
        />
      </motion.div>

      {/* The photo settles to 72% over --deep, so this overlay is the second half of the scrim:
          together they leave roughly a quarter of the photograph showing through, which is what
          holds the centred tagline at 7:1 (1.4.6) on the bright water in this frame. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-deep/70" />

      <div className="relative mx-auto w-full max-w-[1120px] px-5 py-24 text-center sm:px-8">
        {eyebrow ? (
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
            className="mb-6 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-deep"
          >
            {eyebrow}
          </motion.p>
        ) : null}

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.5, delay: 1.15, ease: EASE }}
          className="mx-auto max-w-[16ch] font-display text-[clamp(2.6rem,1.2rem+5vw,5.2rem)] font-normal leading-[1.04] text-on-deep"
        >
          {name}
        </motion.h1>

        {tagline ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 1.75, ease: EASE }}
            className="mx-auto mt-6 max-w-[44ch] text-[1.0625rem] text-on-deep sm:text-lg"
          >
            {tagline}
          </motion.p>
        ) : null}

        {actions ? (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 2.05, ease: EASE }}
            className="mx-auto mt-9 flex max-w-none flex-wrap items-center justify-center gap-3"
          >
            {actions}
          </motion.p>
        ) : null}
      </div>
    </section>
  );
}
