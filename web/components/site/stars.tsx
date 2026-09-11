import { cn } from "@/lib/utils";

/**
 * Star rating. Two gold values exist because a single gold cannot clear 7:1 against both the
 * light grounds and the dark bands (1.4.6); the glyphs are decorative and the rating is stated
 * in words for assistive technology.
 *
 * Kept in its own module so the client-side testimonial card can import it without pulling the
 * server-only section helpers, and the photo manifest behind them, into the browser bundle.
 */
export function Stars({ n, onDark = false }: { n: number; onDark?: boolean }) {
  return (
    <>
      <span aria-hidden="true" className={cn("tracking-[0.18em]", onDark ? "text-gold-deep" : "text-gold")}>
        {"★".repeat(n)}
        {"☆".repeat(5 - n)}
      </span>
      <span className="sr-only">{n} out of 5 stars</span>
    </>
  );
}
