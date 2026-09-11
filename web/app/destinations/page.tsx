import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs, CtaBand } from "@/components/site/sections";
import { LinkCardGrid } from "@/components/site/link-card";
import { DESTINATION_ORDER, DESTINATIONS, decode } from "@/lib/content";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Fourteen islands, sandbars, reefs and dive sites across the Komodo archipelago, and what each one is actually like.",
};

export default function DestinationsPage() {
  const items = DESTINATION_ORDER.map(([slug, label]) => ({
    href: `/destination/${slug}`,
    slug,
    title: decode(label),
    body: DESTINATIONS[slug] ? decode(DESTINATIONS[slug].tagline) : undefined,
  }));

  return (
    <>
      <Hero
        slug="destinations-index"
        alt="The Komodo archipelago from the air"
        eyebrow="Komodo National Park"
        title="Fourteen places worth the crossing"
        tagline="Islands, sandbars, reefs and one mangrove full of bats. This is where the boat actually goes."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "Destinations" }]} />

      <Band>
        <Inner>
          <LinkCardGrid items={items} columns={3} level={2} label="Destinations in the Komodo archipelago" />
        </Inner>
      </Band>

      <CtaBand
        line="Every one of these sits on a single three-day route."
        label="See the itinerary"
        href="/open-trip/itinerary"
        slug="destinations-index-cta"
      />
    </>
  );
}
