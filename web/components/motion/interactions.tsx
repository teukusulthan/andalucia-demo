"use client";

import { useCallback, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Reading progress, drawn as a hairline across the very top of the viewport.
 *
 * `useScroll` gives a motion value, and `scaleX` is written straight to it, so the bar never
 * causes a React render and never lays out: the compositor handles the whole thing. A spring
 * takes the edge off the raw scroll value so it glides rather than tracking every pixel.
 *
 * Decorative and `aria-hidden`: the scrollbar already tells assistive technology where the
 * reader is, and a second live announcement of that would be noise.
 */
export function ScrollProgress() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="no-print pointer-events-none fixed inset-x-0 top-0 z-[60] h-px origin-left bg-gold-deep"
    />
  );
}

/**
 * A control that leans very slightly towards the pointer, and settles back when it leaves.
 *
 * The pull is capped at a few pixels on purpose. Enough that the button feels alive under the
 * cursor, small enough that it never moves out from under the click — a magnetic effect with a
 * large radius is a genuine usability problem, not just a strong one.
 *
 * Pointer-only: it is driven by `onPointerMove`, so keyboard and touch users get the ordinary
 * control, and `useReducedMotion` disables it outright.
 */
function useMagnetic(strength = 5) {
  const ref = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.4 });

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reduce || e.pointerType !== "mouse") return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // -1..1 from the centre of the control, scaled to a few pixels
      x.set(((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) * strength);
      y.set(((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) * strength);
    },
    [reduce, strength, x, y],
  );

  const reset = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { ref, style: { x: sx, y: sy }, onPointerMove, onPointerLeave: reset, onBlur: reset };
}

/** The primary call to action: magnetic, with a sheen that crosses it on hover. */
export function MagneticLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const { ref, style, onPointerMove, onPointerLeave, onBlur } = useMagnetic(6);
  const reduce = useReducedMotion();

  return (
    <motion.span
      ref={ref as React.Ref<HTMLSpanElement>}
      style={style}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onBlur={onBlur}
      className="inline-block"
    >
      <Link
        href={href}
        className={cn(
          "group/mag relative inline-flex min-h-13 items-center overflow-hidden rounded-full bg-brand px-9 text-[15px] font-medium text-on-deep",
          "shadow-[0_2px_18px_rgb(10_32_54/0.35)] transition-[background-color,box-shadow] duration-300",
          "hover:bg-brand-hi hover:shadow-[0_10px_34px_rgb(10_32_54/0.45)]",
          className,
        )}
      >
        {!reduce ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-full w-full skew-x-[-18deg] bg-[linear-gradient(90deg,transparent,rgb(250_250_248/0.22),transparent)] transition-[left] duration-[900ms] ease-out-expo group-hover/mag:left-full"
          />
        ) : null}
        <span className="relative">{children}</span>
      </Link>
    </motion.span>
  );
}

/**
 * A text link whose underline wipes in from the left rather than appearing all at once.
 *
 * The rule is a child element rather than `text-decoration`, so it can be animated; the link
 * still carries a visible underline at rest for anyone who needs one to identify it as a link
 * (1.4.1, which asks that colour is never the only signal). Hover and focus both trigger it, so
 * a keyboard reaches the same state a pointer does.
 */
export function WipeLink({
  href,
  children,
  className,
  external = false,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-100 bg-current opacity-45 transition-opacity duration-300 group-hover/wipe:opacity-0"
      />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-current transition-transform duration-[450ms] ease-out-expo group-hover/wipe:scale-x-100 group-focus-visible/wipe:scale-x-100"
      />
    </>
  );
  const cls = cn(
    "group/wipe relative inline-flex min-h-11 items-center pb-0.5 text-brand",
    className,
  );

  return external ? (
    <a href={href} rel="noopener" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

/**
 * Section band that lifts its contents a little as it scrolls through the viewport.
 *
 * Driven entirely by `useScroll` on a ref plus `useTransform`, so like the progress bar it
 * writes to a motion value rather than re-rendering per frame. The range is small; this is
 * meant to be felt rather than noticed.
 */
export function Drift({
  children,
  className,
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/**
 * A hairline that draws itself across the width of its container when it scrolls into view.
 * Used to separate major sections without a static border doing it flatly.
 */
export function DrawRule({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={cn("block h-px w-full origin-left bg-border", className)}
      initial={reduce ? false : { scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 1.1, ease: EASE }}
    />
  );
}

/** Cursor-tracked glow, for the dark feature panels. Pointer-only and purely decorative. */
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const background = useMotionTemplate`radial-gradient(circle at ${mx}% ${my}%, rgb(250 250 248 / 0.14), transparent 55%)`;

  return (
    <div
      className={cn("relative", className)}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 100);
        my.set(((e.clientY - r.top) / r.height) * 100);
      }}
    >
      {!reduce ? (
        <motion.span
          aria-hidden="true"
          style={{ background }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      ) : null}
      {children}
    </div>
  );
}
