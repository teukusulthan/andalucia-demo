import type { Metadata } from "next";
import { SimplePage, DefRow, PendingNote, DefHead } from "@/components/site/simple-page";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What this prototype collects, where it is stored, who can reach it, and what is still to be decided.",
};

/**
 * The brief lists privacy as a required page and SEC03 names what it has to settle: collection
 * purpose, retention, staff access, deletion and correction, and provider data-sharing notices.
 *
 * None of those are business decisions this prototype can make, so the page states what the
 * software demonstrably does today — which is checkable against the code — and lists the
 * decisions still owed rather than inventing a policy. Publishing invented privacy wording would
 * be worse than publishing none.
 */
const COLLECTED: [string, string][] = [
  [
    "Booking contact",
    "Name and email, entered at checkout. Used to send the confirmation and to let you retrieve the booking later. Stored against the booking.",
  ],
  [
    "Traveller details",
    "Collected before departure through your booking link, for the manifest and for crew readiness. Held separately from the booking contact.",
  ],
  [
    "Voyage Club account",
    "Email, chosen name, optional phone, and which trip type interests you. Used to sign you in and to send the Island Dispatch.",
  ],
  [
    "Newsletter address",
    "Only the address and your preference. Re-subscribing updates the preference rather than adding a second record.",
  ],
  [
    "Support conversation",
    "The messages you send and the email you started them with, so staff can reply and you can reopen the thread.",
  ],
  [
    "Payment records",
    "The reservation system stores payment attempts, amounts and gateway references. Card details are never received or stored by this application; the payment page is hosted by the gateway.",
  ],
];

const HANDLING: [string, string][] = [
  [
    "Where it is stored",
    "One SQLite database on the application server, shared by this site and the reservation system. It is not copied to a third-party analytics or marketing tool.",
  ],
  [
    "Who can reach it",
    "Staff accounts, by role. Operations sees bookings and manifests, finance sees payments and refunds, and every sensitive action is written to an audit log with the actor and reason.",
  ],
  [
    "What leaves the system",
    "A booking projection is written to the operations schedule spreadsheet: reference, ship, dates, allocation and status. Passenger details and payment records are deliberately excluded from it.",
  ],
  [
    "Sessions",
    "A single signed cookie holds your session. It carries no personal data itself and is cleared when you sign out.",
  ],
];

const OWED: [string, string][] = [
  ["Retention periods", "How long bookings, manifests, support threads and marketing addresses are kept after a trip ends."],
  ["Deletion and correction", "How a guest asks for their record to be corrected or erased, who approves it, and what must be retained for financial or safety reasons."],
  ["Identity documents", "Whether passport or identity details are collected at all, and if so the storage, access and destruction rules for them."],
  ["Processor notices", "The named payment, spreadsheet and messaging providers, and the disclosure each one requires."],
  ["Governing law", "The jurisdiction and the regulation this policy is written to satisfy."],
  ["Contact for requests", "The named owner and address a privacy request should be sent to."],
];

export default function PrivacyPage() {
  return (
    <SimplePage
      slug="terms-hero"
      title="Privacy"
      tagline="What we collect, where it goes, and what is still to be decided."
      crumb={[{ href: "/", label: "Home" }, { label: "Privacy" }]}
      lede="This is a working description of what the prototype actually does with your information, written so it can be checked against the software. It is not yet an approved privacy policy, and the decisions it depends on are listed at the end."
    >
      <Reveal>
        <DefHead className="mb-6">What the prototype collects</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {COLLECTED.map(([t, d]) => (
          <RevealItem key={t}>
            <DefRow term={t}>{d}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal>
        <DefHead className="mb-6 mt-16">How it is handled</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {HANDLING.map(([t, d]) => (
          <RevealItem key={t}>
            <DefRow term={t}>{d}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>

      <Reveal>
        <DefHead className="mb-6 mt-16">Still to be decided</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {OWED.map(([t, d]) => (
          <RevealItem key={t}>
            <DefRow term={t}>{d}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>

      <PendingNote title="Not an approved policy:">
        the business requirements make no legal compliance determination and require the
        appropriate business or legal owner to approve privacy wording before launch. The sections
        above describe observed system behaviour; the decisions listed under “Still to be decided”
        must be settled and this page rewritten by that owner before the site goes live.
      </PendingNote>
    </SimplePage>
  );
}
