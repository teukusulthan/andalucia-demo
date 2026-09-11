import type { Metadata } from "next";
import { SimplePage, PendingNote } from "@/components/site/simple-page";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Awards",
  description: "Recognition from the travel industry, including Travass Life and Ker & Downey.",
};

export default function AwardsPage() {
  return (
    <SimplePage
      slug="awards-hero"
      title="Awards"
      tagline="Recognition from the travel industry."
      lede="Andalucía has been featured by Travass Life for authentic journeys to Indonesia, and within the luxury travel industry through Ker & Downey."
    >
      <RevealGroup className="grid gap-8 sm:grid-cols-2">
        {[
          { name: "Travass Life", body: "Authentic Journeys to Indonesia." },
          { name: "Ker & Downey", body: "Press recognition within the luxury travel industry." },
        ].map((a) => (
          <RevealItem key={a.name} className="border-t border-border pt-6">
            <h2 className="mb-2 text-[1.15rem] font-semibold tracking-[-0.02em]">{a.name}</h2>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{a.body}</p>
          </RevealItem>
        ))}
      </RevealGroup>
      <PendingNote title="Needs detail:">
        the brief names these two but gives no dates, citations or links. Supply them and this page
        becomes real.
      </PendingNote>
    </SimplePage>
  );
}
