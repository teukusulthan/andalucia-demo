"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Stars } from "./stars";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Guest review.
 *
 * The brief supplies the full TripAdvisor text and some of it runs to nine lines, which would
 * dominate the carousel. The card clamps to six lines and expands in place, so nothing is cut
 * from the record and the section still reads at a glance. The full text is always in the DOM,
 * so a screen reader and find-in-page get all of it either way.
 */
export function TestimonialCard({
  name,
  country,
  date,
  source,
  rating,
  body,
  lang,
}: {
  name: string;
  country?: string;
  date: string;
  source?: string;
  rating: number;
  body: string;
  lang?: string;
}) {
  const [open, setOpen] = useState(false);
  const [clamped, setClamped] = useState(false);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const id = useId();

  /* Measure rather than guess from character count: 233 characters of Chinese fills eleven
     lines where the same count of English fills four, so a length threshold clamps one and
     not the other. This asks the element whether it actually overflows six lines. */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const check = () => setClamped(el.scrollHeight - el.clientHeight > 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [body]);

  return (
    <figure className="flex h-full flex-col gap-4 border-t border-border pt-5 text-left">
      <p className="m-0">
        <Stars n={rating} />
      </p>

      <blockquote lang={lang} className="m-0 text-[1.0625rem] leading-[1.55] tracking-[-0.01em]">
        <motion.p
          ref={bodyRef}
          id={id}
          layout={reduce ? false : "position"}
          transition={{ duration: 0.35, ease: EASE }}
          className={`m-0 max-w-none ${open ? "" : "line-clamp-6"}`}
        >
          {body}
        </motion.p>
      </blockquote>

      {clamped || open ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={id}
          className="inline-flex min-h-11 w-fit items-center text-[14px] font-medium text-brand underline underline-offset-4"
        >
          {open ? "Show less" : "Read full review"}
          <span className="sr-only"> from {name}</span>
        </button>
      ) : null}

      <figcaption className="mt-auto text-sm text-muted-foreground">
        <span className="mb-0.5 block font-medium text-foreground">
          {name}
          {country ? `, ${country}` : ""}
        </span>
        {date}
        {source ? ` · ${source}` : ""}
      </figcaption>
    </figure>
  );
}
