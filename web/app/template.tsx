import type { ReactNode } from "react";
import { ViewTransition } from "@/components/motion/view-transition";

/**
 * Page-level transition.
 *
 * This is a `template`, not a `layout`, on purpose: a layout persists across navigations, so a
 * ViewTransition inside one never sees an enter or an exit. A template remounts per navigation,
 * which is exactly the mount/unmount pair the transition needs.
 *
 * The motion is a short blur-and-rise rather than a directional slide. Slides read as "you have
 * moved somewhere else", which suits an app with a back button; this is an editorial site where
 * every page is a destination, and sliding the whole viewport on a luxury charter site feels
 * like a slideshow. The shared photograph morph in `view-transition.tsx` carries the continuity
 * instead, and it is what the reader actually follows.
 *
 * The header is excluded from all of this in globals.css so it stays put as a fixed reference.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-enter" exit="page-exit">
      {children}
    </ViewTransition>
  );
}
