import Link from "next/link";
import { Photo } from "./photo";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { SharedPhoto } from "@/components/motion/view-transition";

export type CardItem = {
  href: string;
  slug: string;
  title: string;
  body?: string;
  note?: string;
};

/** Photo-led index grid, used by Sailing, Destinations and the Gallery. */
/**
 * `level` keeps heading ranks contiguous: h3 when the grid sits under a section h2, h2 when the
 * grid is the page's own first content after the hero h1 (1.3.1).
 */
export function LinkCardGrid({
  items,
  columns = 3,
  aspect = "aspect-[4/3]",
  label,
  level = 3,
}: {
  items: CardItem[];
  columns?: 2 | 3 | 4;
  aspect?: string;
  label?: string;
  level?: 2 | 3;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <RevealGroup className={`grid gap-x-6 gap-y-10 ${cols}`}>
      {items.map((it) => (
        <RevealItem key={it.href}>
          <Link href={it.href} className="group block text-left">
            <div className={`relative w-full overflow-hidden bg-secondary ${aspect}`}>
              <SharedPhoto slug={it.slug}>
                <Photo
                  slug={it.slug}
                  alt={it.title}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.05]"
                />
              </SharedPhoto>
            </div>
            <Heading className="mt-4 flex flex-wrap items-center gap-2.5 text-[1.05rem] font-semibold tracking-[-0.012em]">
              <span className="underline-offset-[5px] group-hover:underline">{it.title}</span>
              {it.note ? (
                <span className="bg-secondary px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                  {it.note}
                </span>
              ) : null}
            </Heading>
            {it.body ? (
              <p className="mt-1.5 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
                {it.body}
              </p>
            ) : null}
          </Link>
        </RevealItem>
      ))}
      {label ? <span className="vh">{label}</span> : null}
    </RevealGroup>
  );
}
