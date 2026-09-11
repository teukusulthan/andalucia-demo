import type { Metadata } from "next";
import { SimplePage, DefRow, PendingNote, DefHead } from "@/components/site/simple-page";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Travel resources",
  description: "Visas, customs and getting to Labuan Bajo for a Komodo charter.",
};

const ROWS: [string, string][] = [
  [
    "Visa",
    "Most nationalities can use visa on arrival or e-VOA for tourism. Check current eligibility.",
  ],
  ["Passport validity", "At least six months beyond your arrival date."],
  ["Customs declaration", "Submit the electronic customs declaration on arrival."],
  ["Getting here", "Fly to Komodo Airport (LBJ) in Labuan Bajo, via Jakarta, Bali or Surabaya."],
  ["Park fees", "Komodo National Park entry and ranger fees are not included in your trip price."],
];

export default function TravelResourcesPage() {
  return (
    <SimplePage
      slug="travel-resources"
      title="Travel Resources"
      tagline="Visas, customs and getting to Labuan Bajo."
      lede="Practical information for visiting Indonesia. Requirements change, so always confirm against the official Directorate General of Immigration guidance before you travel."
      cta={{ line: "Questions about getting here?", label: "Ask the crew", href: "/enquire" }}
    >
      <Reveal>
        <DefHead className="mb-6">Before you fly</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {ROWS.map(([t, d]) => (
          <RevealItem key={t}>
            <DefRow term={t}>{d}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>
      <PendingNote title="Verify before launch:">
        visa and customs rules change often. This page needs a factual review and a dated
        last-checked line.
      </PendingNote>
    </SimplePage>
  );
}
