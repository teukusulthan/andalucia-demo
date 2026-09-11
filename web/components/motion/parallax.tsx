"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Slow-drift parallax for hero photography.
 *
 * Driven entirely by motion values: `useScroll` feeds `useTransform`, which writes to the
 * element outside React's render cycle. Nothing here calls useState, so the tree does not
 * re-render while the reader scrolls, and there is no scroll event listener.
 *
 * Only `transform` and `opacity` animate, both compositor properties.
 */
export function ParallaxLayer({
  children,
  distance = 90,
  scaleTo = 1.12,
  className,
}: {
  children: ReactNode;
  distance?: number;
  scaleTo?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, distance]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, scaleTo]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y, scale }} className="absolute inset-0 will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Hero copy that drifts up and fades as the reader leaves the section. Gives the hero a sense
 * of depth against the parallaxing photograph behind it.
 */
export function HeroCopyDrift({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y, opacity }} className={className}>
      {children}
    </motion.div>
  );
}
