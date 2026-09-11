import Link from "next/link";
import type { ReactNode } from "react";
import {
  Footprints,
  Clock,
  Backpack,
  Thermometer,
  UserCheck,
  Gauge,
  MapPin,
  Utensils,
  Compass,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Photo } from "./photo";
import { PhotoRail } from "./rail";
import { GalleryGrid } from "./gallery-grid";
export { Stars } from "./stars";
import { photo } from "@/lib/photos";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { MagneticLink } from "@/components/motion/interactions";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- layout

   One container for the whole site.

   Before this, the hero, the breadcrumb, wide sections, narrow sections and the footer each
   had their own width and padding, so the same page had five different left edges and nothing
   lined up. `Inner` is now the single source of that measure, and a narrow column is a narrower
   box that still starts on the same edge rather than a smaller centred box.
   ---------------------------------------------------------------- */

/** Shared gutter and measure. Every page-level element goes through this. */
export const CONTAINER = "mx-auto w-full max-w-[1120px] px-5 sm:px-8";

export function Band({
  tone = "plain",
  children,
  className,
  id,
}: {
  tone?: "plain" | "shell" | "deep" | "flush";
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        tone !== "flush" && "py-band",
        tone === "shell" && "bg-secondary",
        tone === "deep" && "bg-deep text-on-deep",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Inner({
  children,
  narrow = false,
  className,
}: {
  children: ReactNode;
  /** hold the reading measure to something comfortable, still centred in the band */
  narrow?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(CONTAINER, className)}>
      {narrow ? <div className="mx-auto max-w-[760px]">{children}</div> : children}
    </div>
  );
}

/**
 * A centred reading column whose text stays left-aligned.
 *
 * The page's spine is centred — hero, section opener, call to action — but prose read at length
 * is not: a centred paragraph gives the eye a different starting x on every line, which is the
 * one place where symmetry costs more than it gives. Centred column, left-aligned text.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-[68ch] text-left", className)}>{children}</div>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </p>
  );
}

/**
 * Section heading.
 *
 * `align` exists because a page where every heading is centred reads as one long column and
 * stops having a rhythm. Centred is for the ceremonial moments — the statement that opens a
 * page, a call to action, a symmetric pair of panels. `left` is for the body of an article,
 * where the heading should sit on the same edge as the prose under it.
 */
export function H2({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <h2
      className={cn(
        "max-w-[26ch] font-display text-[clamp(1.7rem,1.25rem+1.7vw,2.5rem)] font-medium leading-[1.16] tracking-[-0.012em]",
        align === "center" ? "mx-auto" : "mx-0 text-left",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function Lede({
  children,
  className,
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  return (
    <p
      className={cn(
        "max-w-[62ch] text-[1.25rem] leading-[1.55] tracking-[-0.008em] text-muted-foreground",
        align === "center" ? "mx-auto" : "mx-0 text-left",
        className,
      )}
    >
      {children}
    </p>
  );
}

/**
 * Editorial section opener: a hairline, a two-digit index and the heading on one baseline.
 *
 * The numeral is decorative and `aria-hidden` — a screen reader announcing "zero two" before
 * every heading would be noise, and the heading order already conveys the sequence. It exists to
 * give the eye an anchor on the left edge so a run of sections reads as a progression rather
 * than as a stack of identical centred titles.
 */
export function SectionOpener({
  index,
  children,
  className,
}: {
  index: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-baseline gap-4 sm:gap-6", className)}>
      <span
        aria-hidden="true"
        className="shrink-0 font-display text-[0.95rem] tabular-nums text-brand"
      >
        {String(index).padStart(2, "0")}
      </span>
      <span aria-hidden="true" className="mt-[-0.35em] h-px w-6 shrink-0 bg-border sm:w-10" />
      <H2 align="left" className="mb-0">
        {children}
      </H2>
    </div>
  );
}

/**
 * Section header with the heading on the left and something beside it on the right.
 *
 * The right slot is for whatever already lives at that edge — a standfirst, a "see all" link,
 * the carousel arrows — so that edge reads as composed rather than as a control that drifted
 * there. They share a baseline on wide screens and stack on narrow ones.
 */
export function SplitHead({
  title,
  children,
  className,
  tone = "light",
}: {
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: "light" | "deep";
}) {
  return (
    <div
      className={cn(
        "mb-10 grid gap-x-10 gap-y-4 text-left lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end",
        className,
      )}
    >
      <H2 align="left" className={cn("mb-0", tone === "deep" && "text-on-deep")}>
        {title}
      </H2>
      {children ? <div className="lg:pb-1.5">{children}</div> : null}
    </div>
  );
}

/**
 * Editorial two-column section: a short heading holding the left column, the prose running down
 * a wider column beside it.
 *
 * This is the layout that breaks up a run of centred sections most effectively, because it moves
 * the heading off the centre line entirely rather than just re-aligning the text inside it.
 */
export function EditorialSplit({
  title,
  aside,
  children,
  className,
}: {
  title: ReactNode;
  /** optional small print under the heading, in the left column */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-x-14 gap-y-7 text-left lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]",
        className,
      )}
    >
      <div>
        <H2 align="left" className="mb-0 max-w-[18ch]">
          {title}
        </H2>
        {aside ? <div className="mt-5">{aside}</div> : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

/**
 * Breadcrumb (AAA 2.4.8).
 *
 * Set as a small letterspaced trail with a chevron between steps, rather than blue underlined
 * links separated by a literal "/" — that reads as an unstyled document, and the underline on a
 * link the reader is not being asked to click is noise. The trail is muted, the current page is
 * the one step in full foreground, and the underline appears on hover and focus only.
 *
 * Each step still clears the 44px target floor (2.5.5) even though the type is 12px.
 */
export function Crumbs({ trail }: { trail: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className={cn(CONTAINER, "pt-7")}>
      <ol className="flex flex-wrap items-center justify-center text-[12px] font-medium uppercase tracking-[0.12em]">
        {trail.map((t, i) => (
          <li key={t.label} className="flex items-center">
            {i > 0 ? (
              <ChevronRight
                aria-hidden="true"
                strokeWidth={1.75}
                className="mx-1.5 size-3.5 shrink-0 text-muted-foreground/55"
              />
            ) : null}
            {t.href && i < trail.length - 1 ? (
              <Link
                href={t.href}
                className="inline-flex min-h-11 items-center text-muted-foreground underline-offset-[6px] transition-colors duration-200 hover:text-foreground hover:underline"
              >
                {t.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="inline-flex min-h-11 items-center text-foreground"
              >
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- content blocks */

export function Chips({ items, label }: { items: string[]; label: string }) {
  return (
    <ul aria-label={label} className="mb-9 flex flex-wrap justify-center gap-x-7 gap-y-2.5">
      {items.map((t) => (
        <li key={t} className="text-[13px] text-muted-foreground">
          {t}
        </li>
      ))}
    </ul>
  );
}

/**
 * Trail / experience fact chart. The brief asks for iconography against difficulty, duration,
 * gear and conditions, so each row picks a mark from its label rather than carrying one in the
 * content data: the copy stays plain text and the presentation layer decides how to show it.
 */
const FACT_ICONS: [RegExp, LucideIcon][] = [
  [/step|trail|track|difficult|climb/i, Footprints],
  [/start|time|duration|summit|descend/i, Clock],
  [/bring|gear|equipment|aboard/i, Backpack],
  [/condition|weather|light|season|temperature/i, Thermometer],
  [/led by|guide|ranger|crew/i, UserCheck],
  [/level|booking|book/i, Gauge],
  [/spot|where|planned|route/i, MapPin],
  [/cook|dietary|pairing|menu/i, Utensils],
];
const factIcon = (label: string): LucideIcon =>
  FACT_ICONS.find(([re]) => re.test(label))?.[1] ?? Compass;

export function FactStrip({ pairs }: { pairs: [string, string][] }) {
  return (
    <RevealGroup as="dl" className="my-9 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
      {pairs.map(([k, v]) => {
        const Icon = factIcon(k);
        return (
          <RevealItem key={k} className="bg-background p-5">
            <Icon aria-hidden="true" strokeWidth={1.3} className="mx-auto mb-4 size-5 text-brand" />
            <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {k}
            </dt>
            <dd className="text-[1.2rem] font-medium tracking-[-0.02em]">{v}</dd>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}

/** Gallery grid: hover/focus captions and a fullscreen lightbox (server resolves the photos). */
export function PhotoTiles({
  items,
  label,
  columns = 3,
}: {
  items: [string, string][];
  label: string;
  columns?: 2 | 3;
}) {
  return <GalleryGrid photos={toLightboxPhotos(items)} label={label} columns={columns} />;
}

/** Resolve slugs once on the server, then hand the client only the fields it renders. */
function toLightboxPhotos(items: [string, string][]) {
  return items.map(([slug, caption]) => {
    const p = photo(slug, caption);
    return {
      src: p.src,
      width: p.width,
      height: p.height,
      blurDataURL: p.blurDataURL,
      alt: p.alt,
      caption,
    };
  });
}

/**
 * Server wrapper: resolves slugs to photographs once, then hands the client rail only the
 * fields it renders, rather than the whole manifest.
 */
export function PhotoStrip({ items, label }: { items: [string, string][]; label: string }) {
  return <PhotoRail photos={toLightboxPhotos(items)} label={label} />;
}


/* ---------------------------------------------------------------- calls to action */

export function CtaBand({
  line,
  label,
  href,
  slug,
}: {
  line: string;
  label: string;
  href: string;
  slug: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-deep py-28 text-center text-on-deep">
      <Photo slug={slug} alt="" className="-z-20" sizes="100vw" />
      <div aria-hidden="true" className="scrim-deep absolute inset-0 -z-10" />
      <Reveal className={CONTAINER}>
        {/* elegant serif sentence and a rounded navy button, as the brief specifies */}
        <p className="mx-auto mb-10 max-w-[20ch] font-display text-[clamp(1.7rem,1.1rem+2.6vw,3.1rem)] font-normal leading-[1.2] text-on-deep">
          {line}
        </p>
        <MagneticLink href={href}>{label}</MagneticLink>
      </Reveal>
    </section>
  );
}

/* ---------------------------------------------------------------- buttons */

/**
 * A quiet secondary action: a label and a rule that lengthens on hover.
 *
 * Two boxed buttons side by side give a hero the look of a form. Pairing one solid button with
 * this makes the primary action obvious and keeps the frame calm. It still clears the 44px
 * target floor (2.5.5), and the rule is not the only signal — the label is a normal link.
 */
export function ArrowLink({
  href,
  children,
  tone = "light",
  className,
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "onDark";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-3 text-[13px] font-medium uppercase tracking-[0.14em]",
        tone === "onDark" ? "text-on-deep" : "text-foreground",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="block h-px w-8 bg-current transition-[width] duration-300 ease-out-expo group-hover:w-14"
      />
    </Link>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "solid",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost" | "onDark";
  className?: string;
}) {
  const base =
    "inline-flex min-h-11 items-center justify-center px-6 text-[15px] font-medium transition-[background-color,color,transform] duration-200 active:translate-y-px";
  const styles = {
    solid: "bg-primary text-primary-foreground hover:bg-brand",
    ghost: "text-foreground shadow-[inset_0_0_0_1px_var(--input)] hover:bg-primary hover:text-primary-foreground",
    onDark:
      "text-on-deep shadow-[inset_0_0_0_1px_rgb(250_250_248/0.45)] hover:bg-on-deep hover:text-deep",
  }[variant];
  return (
    <Link href={href} className={cn(base, styles, className)}>
      {children}
    </Link>
  );
}
