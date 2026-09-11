import type { Metadata } from "next";
import { SimplePage, DefRow, PendingNote, DefHead } from "@/components/site/simple-page";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Minimum charter length, single berths, dietary requirements and deposits.",
};

const ROWS: [string, string][] = [
  ["How long is the minimum private charter?", "Three days and two nights."],
  ["Can I book a single berth?", "Yes, on any open-trip departure."],
  ["Is dietary requirement catering possible?", "Yes. Tell us when you book."],
  ["How much deposit is taken?", "30% at booking, balance 30 days before departure."],
];

export default function FaqPage() {
  return (
    <SimplePage
      slug="faq-hero"
      title="Frequently Asked Questions"
      tagline="The things guests ask before they book."
      lede="We are still assembling the full list with the crew. In the meantime the fastest route to an answer is an enquiry: a real person reads it, usually within the hour."
      cta={{ line: "Ask us anything.", label: "Start an enquiry", href: "/enquire" }}
    >
      <Reveal>
        <DefHead className="mb-6">Common questions we can already answer</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {ROWS.map(([q, a]) => (
          <RevealItem key={q}>
            <DefRow term={q}>{a}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>
      <PendingNote title="Incomplete:">
        the brief lists FAQ as a footer destination but does not supply the questions. This page
        needs real content from the operator.
      </PendingNote>
    </SimplePage>
  );
}
