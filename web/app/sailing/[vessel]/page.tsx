import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Photo } from "@/components/site/photo";
import {
  Band,
  Inner,
  H2,
  Lede,
  Crumbs,
  CtaBand,
  PhotoStrip,
  ButtonLink,
} from "@/components/site/sections";
import { RoomShowcase, SpecTable } from "@/components/site/rooms";
import { DeckMorph } from "@/components/motion/deck-morph";
import { VesselHero } from "@/components/motion/vessel-hero";
import { Reveal } from "@/components/motion/reveal";
import { PrivateOffer } from "@/components/site/offer";
import { Shimmer, LoadingRegion } from "@/components/site/skeleton";
import { getVessel, vesselSlugs, decode } from "@/lib/content";
import { photo } from "@/lib/photos";

const GALLERY: [string, string][] = [
  ["vessel-deck", "The open deck"],
  ["vessel-dining-out", "The outdoor dining area"],
  ["vessel-dining-in", "The indoor saloon"],
  ["vessel-lounge", "Upper deck seating"],
  ["vessel-galley", "The galley, where every meal is cooked aboard"],
  ["andalucia-2-aerial", "Andalucía II from astern"],
];

/* Rates and departures live in the reservation engine and change without a deploy, so this page
   is regenerated on a timer rather than frozen at build time. Five minutes is well inside how
   often a charter rate actually moves, and keeps the route prerendered. */
export const revalidate = 300;

export function generateStaticParams() {
  return vesselSlugs.map((vessel) => ({ vessel }));
}

export async function generateMetadata(props: PageProps<"/sailing/[vessel]">): Promise<Metadata> {
  const { vessel } = await props.params;
  const v = getVessel(vessel);
  if (!v) return {};
  return {
    title: v.name,
    description: v.tagline,
    openGraph: { title: v.name, description: v.tagline, images: [{ url: photo(vessel).src }] },
  };
}

export default async function VesselPage(props: PageProps<"/sailing/[vessel]">) {
  const { vessel } = await props.params;
  const v = getVessel(vessel);
  if (!v) notFound();
  const live = v.state === "active";
  const aerial = photo("andalucia-2-aerial");
  const heroPhoto = photo(vessel);

  return (
    <>
      <VesselHero
        src={heroPhoto.src}
        blurDataURL={heroPhoto.blurDataURL}
        alt={`${v.name} sailing across open water`}
        eyebrow="Our voyage"
        name={v.name}
        tagline={v.tagline}
        actions={
          live ? (
            <>
              <ButtonLink href="/enquire" variant="onDark">
                Check charter dates
              </ButtonLink>
              <ButtonLink href="/sailing/cabin-collection" variant="onDark">
                Cabin collection
              </ButtonLink>
            </>
          ) : undefined
        }
      />

      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/sailing", label: "Sailing" },
          { label: v.name },
        ]}
      />

      {/* The name returns, larger, dissolving into the deep band. */}
      <Band tone="deep" className="overflow-hidden !pt-14">
        <Reveal className="px-5 sm:px-8">
          <p
            aria-hidden="true"
            className="m-0 max-w-none bg-[linear-gradient(to_bottom,var(--on-deep)_26%,rgb(250_250_248/0.07)_94%)] bg-clip-text text-center text-[clamp(3rem,0.2rem+11.5vw,9.5rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-transparent"
          >
            {v.name}
          </p>
        </Reveal>
        <Inner narrow>
          <Reveal delay={0.1}>
            <Lede className="mx-auto text-muted-deep">{decode(v.intro)}</Lede>
          </Reveal>
          {v.state !== "active" ? (
            <Reveal delay={0.16}>
              <p className="mt-6 inline-block px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] text-deep [background:var(--muted-deep)]">
                {v.state === "retired" ? "Retired from service" : "Coming soon, specifications to follow"}
              </p>
            </Reveal>
          ) : null}
        </Inner>
      </Band>

      {live ? (
        <>
          <Band tone="shell">
            <Inner>
              <Reveal>
                <H2 className="mx-auto mb-4 text-center">Cabin collection</H2>
              </Reveal>
              <Reveal delay={0.06}>
                <Lede className="mx-auto mb-6 text-center">
                  Six cabins across three decks. Every room has a private bathroom and full air
                  conditioning.
                </Lede>
              </Reveal>
              <RoomShowcase level={3} />
            </Inner>
          </Band>

          <Band>
            <Inner>
              <Reveal>
                <H2 className="mx-auto mb-10 text-center">From the air, and from within</H2>
              </Reveal>
            </Inner>
            {/* keep the morph wider than the prose column: it is the widest moment on the page */}
            <div className="mx-auto w-full max-w-[1120px] px-5 sm:px-8">
              <DeckMorph
                aerialSrc={aerial.src}
                aerialAlt={`${v.name} from above in open water`}
                blurDataURL={aerial.blurDataURL}
              />
            </div>
            <Inner className="mt-16">
              <SpecTable />
            </Inner>
          </Band>

          {/* §3: the pricing unit, inclusions, exclusions, route flexibility, departure port and
              cancellation terms, read live from the reservation engine rather than retyped. */}
          <Band tone="shell">
            <Inner>
              <Suspense fallback={<OfferSkeleton />}>
                <PrivateOffer />
              </Suspense>
            </Inner>
          </Band>

          <Band tone="deep">
            <Inner>
              <div className="mb-12 text-center">
                <Reveal>
                  <H2 className="mx-auto mb-5 font-display text-[clamp(1.8rem,1.2rem+2vw,2.8rem)] font-normal uppercase tracking-[0.14em] text-on-deep">
                    Gallery
                  </H2>
                </Reveal>
                <Reveal delay={0.06}>
                  <p className="mx-auto mb-8 max-w-[52ch] text-muted-deep">
                    A glimpse into life aboard our handcrafted yacht, woven with intimacy,
                    exploration and charm.
                  </p>
                </Reveal>
                <Reveal delay={0.12}>
                  <Link
                    href="/gallery"
                    className="group inline-flex min-h-11 items-center gap-3 text-[13px] font-medium uppercase tracking-[0.16em] text-on-deep"
                  >
                    View gallery
                    <span aria-hidden="true" className="relative block h-px w-8 bg-current transition-[width] duration-300 group-hover:w-14" />
                  </Link>
                </Reveal>
              </div>
              <PhotoStrip items={GALLERY} label={`Life aboard ${v.name}`} />
            </Inner>
          </Band>
        </>
      ) : null}

      <CtaBand
        line="Let Andalucía accompany your journey across the sea."
        label={live ? "Make an enquiry" : "Talk to us about the fleet"}
        href="/enquire"
        slug={`${vessel}-cta`}
      />
    </>
  );
}

function OfferSkeleton() {
  return (
    <LoadingRegion label="Loading charter prices and inclusions">
      <Shimmer className="mx-auto mb-6 h-7 w-[min(26rem,70%)]" />
      <Shimmer className="mx-auto mb-10 h-20 w-[min(64ch,100%)]" />
      <div className="mb-12 grid gap-px bg-border sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-background px-5 py-7">
            <Shimmer className="mb-3 h-3 w-28" />
            <Shimmer className="h-7 w-40" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
