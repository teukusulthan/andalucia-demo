"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Expand } from "lucide-react";
import { useLightbox, type LightboxPhoto } from "./lightbox";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Variant = "grid" | "masonry" | "mosaic" | "wide";

/* Each variant is a different shape: masonry packs mixed heights into balanced columns, mosaic
   alternates a panorama with a pair of smaller frames, wide runs one image per row.

   `masonry` is genuine multi-column layout, not a grid. In a CSS grid every cell in a row is as
   tall as the tallest one in it, so mixing a 3:4 cell with two 4:3 cells left the short ones with
   a block of dead space underneath and the gallery read as broken. `grid-auto-flow: dense` does
   not help, because dense packing only has anything to reflow when cells span more than one
   track. Multi-column flows each item under the previous one in its column and balances the
   columns itself, which is what "masonry" actually means. */
const SHELL: Record<Variant, string> = {
  grid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  masonry:
    "columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4 [&>li]:break-inside-avoid",
  mosaic: "grid gap-x-8 gap-y-12 sm:grid-cols-6",
  wide: "grid gap-10",
};

/* Heights for the masonry columns. Mixed ratios are the point of the layout, and because the
   items flow rather than share a row, none of them leaves a hole behind it. */
const MASONRY_RATIOS = [
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[1/1]",
  "aspect-[4/3]",
  "aspect-[4/5]",
  "aspect-[3/2]",
];

function cellShape(variant: Variant, i: number): { wrap?: string; ratio: string } {
  if (variant === "masonry") return { ratio: MASONRY_RATIOS[i % MASONRY_RATIOS.length] };
  if (variant === "mosaic") {
    // a panorama, then two smaller frames; every row fills its tracks exactly, so no holes
    const panorama = i % 3 === 0;
    return panorama
      ? { wrap: "sm:col-span-6", ratio: "aspect-[21/9]" }
      : { wrap: "sm:col-span-3", ratio: "aspect-[4/3]" };
  }
  if (variant === "wide") return { ratio: "aspect-[16/9]" };
  // uniform on purpose: this is the plain grid, and one odd tall cell per row only re-creates
  // the dead space that masonry exists to avoid
  return { ratio: "aspect-[4/3]" };
}

/**
 * Gallery grid with hover-revealed captions and a fullscreen lightbox, per the brief.
 *
 * Each tile is a real button, so the lightbox opens from the keyboard as well as the pointer,
 * and the caption is revealed on focus as well as hover. The caption is also rendered for
 * screen readers regardless of hover state, because a caption that only exists on :hover is a
 * caption a keyboard or touch user never gets.
 */
export function GalleryGrid({
  photos,
  label,
  columns = 3,
  variant = "grid",
}: {
  photos: LightboxPhoto[];
  label: string;
  columns?: 2 | 3;
  variant?: Variant;
}) {
  const { openAt, lightbox } = useLightbox(photos);
  const reduce = useReducedMotion();

  return (
    <>
      <ul
        aria-label={label}
        className={cn(
          SHELL[variant],
          variant === "grid" && columns === 2 && "lg:grid-cols-2",
        )}
      >
        {photos.map((p, i) => (
          <motion.li
            key={p.src + i}
            className={cellShape(variant, i).wrap}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: (i % 3) * 0.06, ease: EASE }}
          >
            <button
              type="button"
              onClick={() => openAt(i)}
              className="group relative block w-full overflow-hidden bg-secondary"
            >
              <span className={cn("relative block w-full", cellShape(variant, i).ratio)}>
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes={
                    variant === "wide" || variant === "mosaic"
                      ? "(max-width: 640px) 100vw, 90vw"
                      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  }
                  placeholder="blur"
                  blurDataURL={p.blurDataURL}
                  className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
                />
              </span>

              {/* caption revealed on hover and on keyboard focus */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-end bg-[linear-gradient(to_top,rgb(10_32_54/0.85)_0%,rgb(10_32_54/0.25)_45%,transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <span className="flex w-full items-end justify-between gap-4 p-5 text-left">
                  <span className="text-[15px] leading-snug text-on-deep">{p.caption}</span>
                  <Expand className="size-5 shrink-0 text-on-deep" />
                </span>
              </span>

              <span className="sr-only">{p.caption}. Open in the image viewer.</span>
            </button>
          </motion.li>
        ))}
      </ul>
      {lightbox}
    </>
  );
}
