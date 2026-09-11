import { ViewTransition as ReactViewTransition } from "react";
import type { ReactNode } from "react";

/**
 * React's <ViewTransition>, imported in one place.
 *
 * The browser's View Transitions API is what makes navigation feel continuous rather than like a
 * page swap: it snapshots the old and new documents and animates between them. React drives it
 * declaratively — name the elements that persist and the browser tweens their position and size.
 * Next's App Router treats every navigation as a Transition, so this activates on its own.
 *
 * Where a browser does not support it the page simply changes with no animation, which is the
 * behaviour we had before, so nothing needs a fallback.
 *
 * Everything here passes `default="none"`. Without it, every named ViewTransition on the page
 * animates on *any* transition, so an unrelated navigation would crossfade all of them at once.
 */
export function ViewTransition({
  name,
  children,
  share,
  enter,
  exit,
}: {
  name?: string;
  children: ReactNode;
  share?: string;
  enter?: string;
  exit?: string;
}) {
  return (
    <ReactViewTransition name={name} share={share} enter={enter} exit={exit} default="none">
      {children}
    </ReactViewTransition>
  );
}

/**
 * The photograph shared between an index card and the page it opens.
 *
 * Both ends use the same slug, so the thumbnail grows into the hero instead of one image
 * disappearing and another appearing. This is the single most legible transition on the site:
 * it tells the reader "this is the thing you clicked", not "here is a new page".
 */
export function SharedPhoto({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <ReactViewTransition name={`photo-${slug}`} share="morph" default="none">
      {children}
    </ReactViewTransition>
  );
}
