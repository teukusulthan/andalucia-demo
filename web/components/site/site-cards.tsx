import Link from "next/link";
import { Photo } from "./photo";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { decode, type Site } from "@/lib/content";

/**
 * Snorkelling and diving sites as photo cards, which is what the brief asks for on both pages.
 * Sites that have a destination page of their own link to it; the rest are informational, so
 * they render as figures rather than as links to nowhere.
 */
export function SiteCards({ sites, label }: { sites: Site[]; label: string }) {
  return (
    <RevealGroup
      as="ul"
      className="mt-8 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3"
    >
      {sites.map(([slug, name, caption, href]) => {
        const inner = (
          <>
            <span className="relative block aspect-[4/3] w-full overflow-hidden bg-secondary">
              <Photo
                slug={slug}
                alt={decode(name)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
              />
            </span>
            <span className="mt-3.5 block text-[1.02rem] font-semibold tracking-[-0.012em]">
              <span className={href ? "underline-offset-[5px] group-hover:underline" : undefined}>
                {decode(name)}
              </span>
            </span>
            <span className="mt-1.5 block max-w-[40ch] text-[14px] leading-relaxed text-muted-foreground">
              {decode(caption)}
            </span>
          </>
        );

        return (
          <RevealItem key={slug + name} as="li">
            {href ? (
              <Link href={href} className="group block text-left">
                {inner}
              </Link>
            ) : (
              <figure className="group m-0 text-left">{inner}</figure>
            )}
          </RevealItem>
        );
      })}
      <span className="sr-only">{label}</span>
    </RevealGroup>
  );
}
