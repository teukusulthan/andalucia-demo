"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Expand } from "lucide-react";
import { useLightbox, type LightboxPhoto } from "./lightbox";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type RailPhoto = LightboxPhoto;

/**
 * Horizontal rail.
 *
 * Native overflow scrolling with scroll-snap, not a drag-transform track: native scrolling
 * keeps trackpad, touch, keyboard and screen-reader behaviour intact, and the arrows are a
 * convenience on top rather than the only way through.
 *
 * `position: relative` on the scroller is load-bearing. The .vh spans inside the cards are
 * absolutely positioned; without a positioned ancestor here they resolve against the page at
 * their un-scrolled x and drag the whole document sideways (1.4.10).
 */
export function Rail({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // derived booleans only: identical values bail out of re-render
  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  const nudge = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 520), behavior: "smooth" });
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="mb-4 flex justify-end gap-2">
        <RailButton onClick={() => nudge(-1)} disabled={atStart} label={`Scroll ${label} backwards`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
        </RailButton>
        <RailButton onClick={() => nudge(1)} disabled={atEnd} label={`Scroll ${label} forwards`}>
          <ArrowRight className="size-4" aria-hidden="true" />
        </RailButton>
      </div>
      <ul
        ref={ref}
        onScroll={onScroll}
        tabIndex={0}
        aria-label={label}
        className="rail -mx-5 grid auto-cols-[minmax(min(340px,82%),1fr)] grid-flow-col gap-5 px-5 pb-5 sm:mx-0 sm:px-0"
      >
        {children}
      </ul>
    </div>
  );
}

function RailButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-11 items-center justify-center text-foreground shadow-[inset_0_0_0_1px_var(--input)] transition-[background-color,color,opacity] duration-200 hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
      <span className="vh">{label}</span>
    </button>
  );
}

/**
 * Photo strip used by every article page and by the room showcase. Each frame opens the
 * fullscreen viewer, so the rail is a way through the set rather than the whole of it.
 */
export function PhotoRail({ photos, label }: { photos: RailPhoto[]; label: string }) {
  const reduce = useReducedMotion();
  const { openAt, lightbox } = useLightbox(photos);

  return (
    <>
      <Rail label={label}>
        {photos.map((p, i) => (
          <motion.li
            key={p.src + i}
            initial={reduce ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: EASE }}
          >
            <button
              type="button"
              onClick={() => openAt(i)}
              className="group block w-full text-left"
            >
              <span className="relative block aspect-[5/4] w-full overflow-hidden bg-secondary">
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(max-width: 640px) 82vw, 380px"
                  placeholder="blur"
                  blurDataURL={p.blurDataURL}
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-end bg-[linear-gradient(to_top,rgb(10_32_54/0.8)_0%,transparent_58%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span className="flex w-full items-center gap-2.5 p-4 text-[14px] text-on-deep">
                    <Expand className="size-4 shrink-0" />
                    View
                  </span>
                </span>
              </span>
              <span className="block max-w-[40ch] pt-2.5 text-[13px] text-muted-foreground">
                {p.caption}
              </span>
            </button>
          </motion.li>
        ))}
      </Rail>
      {lightbox}
    </>
  );
}
