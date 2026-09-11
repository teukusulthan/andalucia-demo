import { cn } from "@/lib/utils";

/**
 * Loading placeholders.
 *
 * Shaped like the content they stand in for, so the page does not jump when the real thing
 * arrives. The shimmer is a background-position animation on a gradient, which the compositor
 * handles, and it is switched off entirely under `prefers-reduced-motion` by the global guard
 * in globals.css: a pulsing rectangle is exactly the kind of motion that preference suppresses.
 *
 * Every skeleton is `aria-hidden` and sits inside a container that announces the load once, so
 * a screen reader hears "Loading" rather than a description of grey boxes.
 */
export function Shimmer({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-secondary",
        "bg-[linear-gradient(100deg,transparent_20%,rgb(10_32_54/0.06)_42%,rgb(10_32_54/0.12)_50%,rgb(10_32_54/0.06)_58%,transparent_80%)]",
        "bg-[length:220%_100%] bg-no-repeat motion-safe:animate-[shimmer_1.8s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

/**
 * The in-button working indicator. An arc that rotates, drawn in `currentColor` so it inherits
 * whichever button it sits in. It is decoration: the button's label already changes to
 * "Sending…", which is what a screen reader announces, so this carries no text of its own.
 *
 * Under reduced motion the global guard freezes the rotation, leaving a static arc — still a
 * visible change of state next to the changed label, which is the point.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("size-4 shrink-0 motion-safe:animate-spin", className)}
    >
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Wraps a skeleton tree and announces it once, politely. */
export function LoadingRegion({
  label = "Loading",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** A line of text. `w` is a Tailwind width class so lines can be ragged like real copy. */
export function TextLine({ w = "w-full", className }: { w?: string; className?: string }) {
  return <Shimmer className={cn("h-3.5", w, className)} />;
}

/** The shell every page opens with: a full-bleed hero, then a measure of copy. */
export function PageSkeleton({
  short = true,
  lines = 3,
}: {
  short?: boolean;
  lines?: number;
}) {
  return (
    <LoadingRegion label="Loading the page">
      <div
        className={cn(
          "relative flex items-end overflow-hidden bg-deep",
          short ? "min-h-[62svh]" : "min-h-[88svh]",
        )}
      >
        <div className="mx-auto w-full max-w-[1120px] px-5 pb-20 pt-24 sm:px-8">
          <Shimmer className="mb-6 h-3 w-32 bg-on-deep/10" />
          <Shimmer className="mb-4 h-12 w-[min(24rem,80%)] bg-on-deep/10 sm:h-16" />
          <Shimmer className="h-4 w-[min(32rem,90%)] bg-on-deep/10" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1120px] px-5 py-band sm:px-8">
        <Shimmer className="mb-8 h-8 w-[min(28rem,70%)]" />
        <div className="max-w-[62ch] space-y-3.5">
          {Array.from({ length: lines }).map((_, i) => (
            <TextLine key={i} w={i === lines - 1 ? "w-2/3" : "w-full"} />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}

/** A grid of photo cards, for the index and dispatch pages. */
export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 }) {
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-10",
        columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Shimmer className="aspect-[4/3] w-full" />
          <Shimmer className="mt-4 h-4 w-2/3" />
          <Shimmer className="mt-2.5 h-3 w-full" />
          <Shimmer className="mt-2 h-3 w-4/5" />
        </div>
      ))}
    </div>
  );
}
