import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, H2, Crumbs, CtaBand, SplitHead } from "@/components/site/sections";
import { LinkCardGrid } from "@/components/site/link-card";
import { Reveal } from "@/components/motion/reveal";
import { VESSELS, EXPERIENCE_ORDER, decode } from "@/lib/content";

export const metadata: Metadata = {
  title: "Sailing",
  description:
    "The Andalucía fleet, seven private charter experiences, and the three-day open trip route through Komodo.",
};

export default function SailingPage() {
  const vessels = Object.entries(VESSELS).map(([slug, v]) => ({
    href: `/sailing/${slug}`,
    slug,
    title: v.name,
    body: v.tagline,
    note: v.state === "retired" ? "Retired" : v.state === "soon" ? "Coming soon" : undefined,
  }));

  const experiences = EXPERIENCE_ORDER.map(([slug, label]) => ({
    href: `/experience/${slug}`,
    slug,
    title: decode(label),
  }));

  return (
    <>
      <Hero
        slug="andalucia-2"
        alt="Andalucía II under sail in the Komodo archipelago"
        eyebrow="The fleet and the experiences"
        title="Two ways to sail Komodo"
        tagline="Take the whole ship, or take a cabin on a scheduled departure."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "Sailing" }]} />

      <Band>
        <Inner>
          <Reveal>
            <SplitHead title="Our voyage">
              <p className="text-muted-foreground">
                Three vessels, one operator. Andalucía II sails today; the first of the line is
                retired and the third is still fitting out.
              </p>
            </SplitHead>
          </Reveal>
          <LinkCardGrid items={vessels} columns={3} label="The Andalucía fleet" />
        </Inner>
      </Band>

      <Band tone="shell">
        <Inner>
          <Reveal>
            <SplitHead title="Private charter experiences">
              <p className="text-muted-foreground">
                What a chartered day is actually made of, written up one at a time.
              </p>
            </SplitHead>
          </Reveal>
          <LinkCardGrid
            items={experiences}
            columns={4}
            aspect="aspect-[4/3]"
            label="Private charter experiences"
          />
        </Inner>
      </Band>

      <Band>
        <Inner>
          <Reveal>
            <H2 className="mb-10">Open trip</H2>
          </Reveal>
          <LinkCardGrid
            columns={3}
            items={[
              {
                href: "/open-trip/itinerary",
                slug: "itinerary-day1",
                title: "Itinerary",
                body: "Three days, island by island.",
              },
              {
                href: "/sailing/cabin-collection",
                slug: "cabin-collection",
                title: "Cabin collection",
                body: "Every room aboard, in detail.",
              },
              {
                href: "/schedule",
                slug: "open-trip",
                title: "Schedule",
                body: "Live departures and live availability.",
              },
            ]}
            label="Open trip"
          />
        </Inner>
      </Band>

      <CtaBand
        line="Let Andalucía accompany your journey across the sea."
        label="Make an enquiry"
        href="/enquire"
        slug="sailing-index-cta"
      />
    </>
  );
}
