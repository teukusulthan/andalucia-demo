import type { ReactNode } from "react";
import { Hero } from "./hero";
import { Band, Inner, Lede, Crumbs, CtaBand, H2 } from "./sections";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/reveal";

/**
 * The supporting pages the footer links to: short hero, one column of prose, optional CTA.
 * Keeps FAQ, Terms, Awards, Press and Travel Resources on one rhythm.
 */
export function SimplePage({
  slug,
  title,
  tagline,
  eyebrow = "Andalucía",
  lede,
  children,
  after,
  crumb,
  cta,
}: {
  slug: string;
  title: string;
  tagline?: string;
  eyebrow?: string;
  lede?: ReactNode;
  children?: ReactNode;
  /** full-width bands between the reading column and the call to action */
  after?: ReactNode;
  crumb?: { href?: string; label: string }[];
  cta?: { line: string; label: string; href: string };
}) {
  return (
    <>
      <Hero slug={slug} alt={title} eyebrow={eyebrow} title={title} tagline={tagline} short />
      <Crumbs trail={crumb ?? [{ href: "/", label: "Home" }, { label: title }]} />
      <Band>
        <Inner narrow>
          {lede ? (
            <Reveal>
              <Lede className="mb-10">{lede}</Lede>
            </Reveal>
          ) : null}
          {children}
        </Inner>
      </Band>
      {after}
      {cta ? <CtaBand {...cta} slug={`${slug}-cta`} /> : null}
    </>
  );
}

/**
 * A definition row used across the supporting pages: a two-column pair, left-aligned, in a block
 * that is itself centred in the band. The centred spine holds the page together; the rows inside
 * it are where the reading happens, and a term and its definition have to share an edge to read
 * as a pair.
 */
export function DefRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[52rem] gap-x-10 gap-y-1.5 border-b border-border py-5 text-left last:border-b-0 sm:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
      <dt className="font-medium">{term}</dt>
      <dd className="m-0 text-muted-foreground">{children}</dd>
    </div>
  );
}

/** Flags copy that is structurally in place but factually incomplete. */
export function PendingNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Reveal>
      {/* a rule above rather than beside it, so the note stays part of the centred column */}
      <p className="mx-auto mt-12 max-w-[64ch] border-t border-border pt-6 text-[15px] leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">{title} </strong>
        {children}
      </p>
    </Reveal>
  );
}

/**
 * Heading for a run of `DefRow`s.
 *
 * The rows are a left-aligned two-column list on a 52rem measure, so a centred heading above them
 * pointed at nothing: the eye started in the middle and then had to find the left edge again.
 * This puts the heading on the same edge and the same measure as the rows it introduces.
 */
export function DefHead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-[52rem]", className)}>
      <H2 align="left" className="mb-0">
        {children}
      </H2>
    </div>
  );
}
