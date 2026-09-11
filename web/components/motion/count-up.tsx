"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/**
 * Metric that counts up once, when it first scrolls into view.
 *
 * The running value is written straight to the DOM node from Motion's animate loop rather than
 * held in state, so counting does not re-render the tree sixty times a second. The final value
 * is rendered on the server too, so it is correct before hydration and for reduced motion.
 */
export function CountUp({
  to,
  suffix = "",
  className,
}: {
  to: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView || reduce) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = `${Math.round(v).toLocaleString("en-US")}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, reduce]);

  return (
    <span ref={ref} className={className}>
      {to.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
