"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Scroll-entry reveal. Motion's `whileInView` uses IntersectionObserver underneath, so there
 * is no scroll listener and nothing re-renders per frame.
 *
 * The visible state is the initial state when the reader prefers reduced motion, so content
 * can never be stranded at opacity 0.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "figure" | "span";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

const groupVariants: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  shown: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
};

/**
 * Staggered group. Parent and children must live in the same client tree for
 * `staggerChildren` to orchestrate them, which is why both are exported from this file.
 */
export function RevealGroup({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "dl";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={groupVariants}
      initial={reduce ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "figure";
}) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={itemVariants}>
      {children}
    </Tag>
  );
}
