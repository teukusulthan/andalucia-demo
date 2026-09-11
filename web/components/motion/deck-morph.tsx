"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Aerial photograph dissolving into the deck plan as the reader scrolls, per the brief.
 *
 * The section is taller than the viewport and the frame inside it is sticky, so the crossfade
 * happens in place rather than scrolling past. Both layers are always in the DOM; only opacity
 * and scale animate, and both are driven by motion values, so the tree never re-renders while
 * the reader scrolls.
 *
 * Under reduced motion the two layers are stacked and captioned instead of crossfaded, which
 * shows the same information without the scroll-linked effect.
 */
export function DeckMorph({
  aerialSrc,
  aerialAlt,
  blurDataURL,
}: {
  aerialSrc: string;
  aerialAlt: string;
  blurDataURL: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // the photograph holds, fades out across the middle, and the plan settles in behind it
  const photoOpacity = useTransform(scrollYProgress, [0, 0.32, 0.62], [1, 1, 0]);
  const photoScale = useTransform(scrollYProgress, [0, 0.62], [1, 1.08]);
  const planOpacity = useTransform(scrollYProgress, [0.34, 0.68], [0, 1]);
  const planScale = useTransform(scrollYProgress, [0.34, 0.68], [1.04, 1]);

  if (reduce) {
    return (
      <div className="grid gap-6">
        <figure className="m-0">
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-secondary">
            <Image
              src={aerialSrc}
              alt={aerialAlt}
              fill
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurDataURL}
              className="object-cover"
            />
          </div>
          <figcaption className="pt-2.5 text-[13px] text-muted-foreground">
            Andalucía II from above.
          </figcaption>
        </figure>
        <figure className="m-0">
          <Image
            src="/deck-plan.svg"
            alt="Deck plan of Andalucía II across three decks"
            width={1120}
            height={760}
            className="h-auto w-full bg-background"
          />
          <figcaption className="pt-2.5 text-[13px] text-muted-foreground">
            The deck plan, with every cabin in place.
          </figcaption>
        </figure>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-[230svh]">
      <div className="sticky top-0 flex h-svh items-center">
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-background">
          <motion.div style={{ opacity: photoOpacity, scale: photoScale }} className="absolute inset-0">
            <Image
              src={aerialSrc}
              alt={aerialAlt}
              fill
              sizes="100vw"
              placeholder="blur"
              blurDataURL={blurDataURL}
              className="object-cover"
            />
          </motion.div>

          <motion.div
            style={{ opacity: planOpacity, scale: planScale }}
            className="absolute inset-0 flex items-center justify-center bg-background p-4 sm:p-8"
          >
            <Image
              src="/deck-plan.svg"
              alt="Deck plan of Andalucía II across three decks: upper deck with wheelhouse, two Ocean View cabins and sundeck; main deck with the VIP suite, saloon, dining and galley; lower deck with two Private cabins, the Sharing cabin, crew quarters and engine room."
              width={1120}
              height={760}
              className="max-h-full w-auto object-contain"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
