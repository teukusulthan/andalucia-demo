import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, H2, Lede, Crumbs, CtaBand, ButtonLink } from "@/components/site/sections";
import { RoomShowcase } from "@/components/site/rooms";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Cabin collection",
  description:
    "Six cabins across three decks aboard Andalucía II: VIP room, two ocean view, two private and one sharing cabin.",
};

export default function CabinCollectionPage() {
  return (
    <>
      <Hero
        slug="cabin-collection"
        alt="The VIP room aboard Andalucía II"
        eyebrow="Onboard"
        title="Cabin Collection"
        tagline="Six rooms, three decks, one private bathroom each."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/sailing", label: "Sailing" },
          { label: "Cabin collection" },
        ]}
      />

      <Band>
        <Inner>
          <RoomShowcase level={2} />
        </Inner>
      </Band>

      <Band tone="shell">
        <Inner narrow className="text-center">
          <Reveal>
            <H2 className="mx-auto mb-5">Ready to choose a cabin?</H2>
          </Reveal>
          <Reveal delay={0.06}>
            <Lede className="mx-auto mb-8">
              Open-trip departures sell by the berth or by the whole cabin, and both draw on the same
              physical capacity, so what you see is what is actually left.
            </Lede>
          </Reveal>
          <Reveal delay={0.12}>
            <ButtonLink href="/schedule">See departures and availability</ButtonLink>
          </Reveal>
        </Inner>
      </Band>

      <CtaBand
        line="A story carved in wood and wind."
        label="Make an enquiry"
        href="/enquire"
        slug="cabin-collection-cta"
      />
    </>
  );
}
