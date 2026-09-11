import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs, CtaBand, PhotoTiles } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Life aboard Andalucía II: sailing, sunsets, cabins, reefs and the crew who make it work.",
};

const TILES: [string, string][] = [
  ["andalucia-2", "Andalucía II at anchor"],
  ["vessel-deck", "The open deck"],
  ["andalucia-2-aerial", "From astern, in open water"],
  ["vessel-lounge", "Upper deck seating"],
  ["room-ocean", "Inside an Ocean View cabin"],
  ["vessel-dining-in", "The indoor saloon"],
  ["vessel-dining-out", "Dinner on deck"],
  ["andalucia-1", "Under sail between the islands"],
  ["vessel-galley", "The galley"],
  ["snorkeling", "Snorkelling off the tender"],
  ["gallery-hike", "The climb up Padar"],
  ["pink-beach", "Pink sand at the waterline"],
];

export default function GalleryPage() {
  return (
    <>
      <Hero
        slug="andalucia-2"
        alt="Andalucía II at anchor in Komodo waters"
        eyebrow="Gallery"
        title="Gallery"
        tagline="A glimpse into life aboard our handcrafted yacht, woven with intimacy, exploration and charm."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "Gallery" }]} />

      <Band>
        <Inner>
          <PhotoTiles items={TILES} label="Life aboard Andalucía II" />
        </Inner>
      </Band>

      <CtaBand
        line="Let Andalucía accompany your journey across the sea."
        label="Make an enquiry"
        href="/enquire"
        slug="gallery-cta"
      />
    </>
  );
}
