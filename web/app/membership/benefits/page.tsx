import type { Metadata } from "next";
import { SimplePage, DefRow } from "@/components/site/simple-page";
import { ButtonLink } from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Membership benefits",
  description: "Everything the Voyage Club includes. Membership is free.",
};

const ROWS: [string, string][] = [
  ["The Island Dispatch, in full", "Every issue, not just the headline."],
  ["Onboard souvenir gift", "On every voyage you take with us."],
  ["Early notice of seasonal discounts", "Before they reach the public schedule."],
  ["Priority access to special deals", "First refusal on limited cabins."],
  ["Invitations to private voyage dates", "Closed departures and exclusive experiences."],
  ["One place for your bookings", "Your trips and enquiries in a single account."],
];

export default function BenefitsPage() {
  return (
    <SimplePage
      slug="benefits-hero"
      eyebrow="Membership program"
      title="Membership Benefits"
      tagline="Everything the Voyage Club includes."
      crumb={[
        { href: "/", label: "Home" },
        { href: "/membership", label: "Membership Program" },
        { label: "Benefits" },
      ]}
      lede="Membership is free. It exists so that people who come back get treated like people who came back."
    >
      <RevealGroup as="dl">
        {ROWS.map(([term, desc]) => (
          <RevealItem key={term}>
            <DefRow term={term}>{desc}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>
      <Reveal>
        <div className="mt-10">
          <ButtonLink href="/membership/join">Join the Voyage Club</ButtonLink>
        </div>
      </Reveal>
    </SimplePage>
  );
}
