"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Headline that rises word by word.
 *
 * The words are wrapped in spans with `overflow: clip` so each one slides up from behind its
 * own mask. The whole string stays in the accessibility tree as one heading, because the
 * spans carry no roles and screen readers read the text content straight through. Descenders
 * need real line-height here, hence leading-[1.06] plus vertical padding on the mask, or the
 * clip cuts the tails off g, y and j.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  as: Tag = "h1",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p";
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  if (reduce) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="inline-block overflow-clip pb-[0.12em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: "110%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 0.9, delay: delay + i * 0.055, ease: EASE }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
