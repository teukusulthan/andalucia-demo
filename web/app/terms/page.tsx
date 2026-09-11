import type { Metadata } from "next";
import { SimplePage, DefRow, PendingNote, DefHead } from "@/components/site/simple-page";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Deposit, balance, hold and cancellation rules the reservation system enforces.",
};

const ROWS: [string, string][] = [
  ["Deposit", "30% of the total, due to confirm a reservation."],
  ["Balance", "Due 30 days before departure."],
  ["Hold", "15 minutes from checkout to payment, stated before you commit."],
  ["Cancellation", "Handled case by case with a recorded fee and reason."],
];

export default function TermsPage() {
  return (
    <SimplePage
      slug="terms-hero"
      title="Terms & Conditions"
      tagline="Booking, payment, cancellation and liability."
      lede="The booking rules the reservation system actually enforces are summarised below. The full legal terms have not been drafted yet and must be reviewed before this site goes live."
    >
      <Reveal>
        <DefHead className="mb-6">What the system enforces today</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {ROWS.map(([t, d]) => (
          <RevealItem key={t}>
            <DefRow term={t}>{d}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>
      <PendingNote title="Not legal copy:">
        this is a plain-language summary of system behaviour, not a contract. Do not publish without
        a drafted and reviewed set of terms.
      </PendingNote>
    </SimplePage>
  );
}
