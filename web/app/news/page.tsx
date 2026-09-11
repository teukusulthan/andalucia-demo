import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Hero } from "@/components/site/hero";
import { Photo } from "@/components/site/photo";
import { Band, Inner, Lede, Crumbs, ButtonLink } from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CardGridSkeleton, Shimmer, LoadingRegion } from "@/components/site/skeleton";
import { currentUser } from "@/lib/auth";
import { all } from "@/lib/db";

export const metadata: Metadata = {
  title: "The Island Dispatch",
  description: "Sailing schedules, destination notes and news from the crew.",
};

type Article = { slug: string; title: string; excerpt: string; published_at: string };

/**
 * The hero and the breadcrumb are the same for every visitor, so they render straight away and
 * only the article list waits on the session.
 *
 * The boundary is here rather than in a `loading.tsx` on purpose. A route-level fallback replaces
 * the whole page, which greys out a hero that was never waiting on anything, and — because the
 * shell streams first — puts the footer's headings ahead of this page's h1 in the HTML source.
 * Suspending just the part that actually fetches keeps the document in order and the opener solid.
 */
export default function NewsIndexPage() {
  return (
    <>
      <Hero
        slug="news-2"
        alt="Sunset over the Komodo archipelago"
        eyebrow="From the crew"
        title="The Island Dispatch"
        tagline="Sailing schedules, destination notes and members-only invitations."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "The Island Dispatch" }]} />

      <Band>
        <Inner>
          <Suspense fallback={<DispatchListSkeleton />}>
            <DispatchList />
          </Suspense>
        </Inner>
      </Band>
    </>
  );
}

async function DispatchList() {
  const user = await currentUser();
  const items = all<Article>(
    "SELECT slug, title, excerpt, published_at FROM articles ORDER BY published_at DESC",
  );

  return (
    <>
      {!user ? (
        <Reveal>
          <Lede className="mb-12">
            Headlines are open to everyone. Voyage Club members read every issue in full, and
            joining is free.
          </Lede>
        </Reveal>
      ) : null}

      <RevealGroup className="grid gap-10 sm:grid-cols-2">
        {items.map((d, i) => (
          <RevealItem key={d.slug} as="figure" className="group m-0">
            <Link href={`/news/${d.slug}`} className="block text-left">
              <span className="relative block aspect-[4/3] w-full overflow-hidden bg-secondary">
                <Photo
                  slug={`news-${(i % 4) + 1}`}
                  alt=""
                  sizes="(max-width: 640px) 100vw, 45vw"
                  className="transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                />
              </span>
              <figcaption className="pt-4">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {d.published_at?.slice(0, 10)}
                </span>
                <span className="mb-1.5 block text-[1.15rem] font-semibold tracking-[-0.015em] underline-offset-[5px] group-hover:underline">
                  {d.title}
                </span>
                <span className="block max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                  {d.excerpt}
                </span>
              </figcaption>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>

      {!user ? (
        <Reveal>
          <div className="mt-14 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/membership/join">Join the Voyage Club</ButtonLink>
            <ButtonLink href="/signin" variant="ghost">
              Sign in
            </ButtonLink>
          </div>
        </Reveal>
      ) : null}
    </>
  );
}

function DispatchListSkeleton() {
  return (
    <LoadingRegion label="Loading the dispatches">
      <Shimmer className="mb-12 h-5 w-[min(40rem,90%)]" />
      <CardGridSkeleton count={4} columns={2} />
    </LoadingRegion>
  );
}
