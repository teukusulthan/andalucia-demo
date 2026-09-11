import type { Metadata } from "next";
import { Suspense } from "react";
import { SimplePage, DefRow, DefHead } from "@/components/site/simple-page";
import {ButtonLink, Band, Inner} from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { DepartureBoard, OpenTripOffer } from "@/components/site/offer";
import { Shimmer, LoadingRegion, TextLine } from "@/components/site/skeleton";
import { bookingEngine } from "@/lib/booking-engine";

/* Rates and departures live in the reservation engine and change without a deploy, so this page
   is regenerated on a timer rather than frozen at build time. Five minutes is well inside how
   often a charter rate actually moves, and keeps the route prerendered. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Schedule and availability",
  description:
    "Published open-trip departures, what a berth costs and covers, and whether each departure is guaranteed or conditional.",
};

const RULES: [string, string][] = [
  ["One calendar", "Private charter, open departures and maintenance all check the same ship calendar."],
  ["One pool", "A berth sale and a whole-cabin sale draw down the same physical capacity."],
  ["One lock", "Holds and payment notifications run inside a single immediate transaction."],
  ["Three states", "Booking, payment and sync status never collapse into one field."],
];

export default function SchedulePage() {
  return (
    <SimplePage
      slug="open-trip"
      title="Schedule & Availability"
      tagline="Live departures, live capacity."
      lede="Every published departure is below, read from the reservation system as you load the page. Holds, payment and checkout happen there too, because availability has to be read from the same calendar that commits it."
      after={<ScheduleBoards />}
      cta={{
        line: "Not sure which trip is yours?",
        label: "Make an enquiry",
        href: "/enquire",
      }}
    >
      <Reveal>
        <div className="mb-14 flex flex-wrap justify-center gap-3">
          <ButtonLink href={bookingEngine.trips}>Check live availability</ButtonLink>
          <ButtonLink href={bookingEngine.charter} variant="ghost">
            Search private charter dates
          </ButtonLink>
        </div>
      </Reveal>

      <Reveal>
        <DefHead className="mb-6">What the reservation system guarantees</DefHead>
      </Reveal>
      <RevealGroup as="dl">
        {RULES.map(([t, d]) => (
          <RevealItem key={t}>
            <DefRow term={t}>{d}</DefRow>
          </RevealItem>
        ))}
      </RevealGroup>
    </SimplePage>
  );
}

/* The two live blocks sit outside SimplePage's narrow column so the board can use the full
   measure. Each has its own boundary: a slow database read delays that block, not the page. */
function ScheduleBoards() {
  return (
    <>
      <Band tone="shell">
        <Inner>
          <Suspense fallback={<BoardSkeleton />}>
            <DepartureBoard />
          </Suspense>
        </Inner>
      </Band>
      <Band>
        <Inner>
          <Suspense fallback={<OfferSkeleton />}>
            <OpenTripOffer />
          </Suspense>
        </Inner>
      </Band>
    </>
  );
}

function BoardSkeleton() {
  return (
    <LoadingRegion label="Loading published departures">
      <Shimmer className="mx-auto mb-3 h-8 w-[min(22rem,70%)]" />
      <Shimmer className="mx-auto mb-10 h-4 w-[min(34rem,90%)]" />
      <div className="grid gap-px bg-border sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-background p-6 sm:p-7">
            <Shimmer className="mb-3 h-5 w-56" />
            <Shimmer className="mb-4 h-4 w-full" />
            <TextLine w="w-40" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}

function OfferSkeleton() {
  return (
    <LoadingRegion label="Loading prices and inclusions">
      <Shimmer className="mx-auto mb-6 h-7 w-[min(24rem,70%)]" />
      <Shimmer className="mx-auto mb-10 h-20 w-[min(60ch,100%)]" />
      <Shimmer className="mx-auto h-52 w-full" />
    </LoadingRegion>
  );
}
