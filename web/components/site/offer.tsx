import { Check, X, MapPin, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { H2, Prose, SectionOpener } from "./sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import {
  offerTerms,
  privateFromPrices,
  openCabinPrices,
  upcomingDepartures,
  embarkationPorts,
  idr,
  duration,
} from "@/lib/offer";

/**
 * Everything §3 asks a public offer to state, read from the reservation engine.
 *
 * The figures are all "from" prices and every one of them says so. The engine recalculates the
 * binding quote at checkout against the chosen vessel, dates and season (PR03/PR05), and a price
 * shown here is never the contract — PR08 is explicit that an accepted booking keeps its own
 * snapshot. Saying "from" is not hedging; it is the accurate description of a marketing figure.
 */

/**
 * Shown when the reservation engine's database is not reachable.
 *
 * Returning null here left a band of pure padding on the page, which reads as a rendering fault.
 * Saying plainly that prices come from the reservation system, and offering the enquiry route
 * instead, is both honest and more useful than a gap.
 */
function OfferUnavailable({ what }: { what: string }) {
  return (
    <Reveal>
      <p className="mx-auto max-w-[58ch] text-muted-foreground">
        {what} are served by the reservation system, which is not reachable from here at the
        moment.{" "}
        <Link href="/enquire" className="text-brand underline underline-offset-4">
          Send us your dates
        </Link>{" "}
        and we will come back to you with a quote.
      </p>
    </Reveal>
  );
}

function Money({ amount, unit }: { amount: number; unit: string }) {
  return (
    <span className="inline-flex flex-wrap items-baseline justify-center gap-x-2">
      <span className="text-[1.35rem] font-medium tabular-nums tracking-[-0.02em] text-foreground">
        {idr(amount)}
      </span>
      <span className="text-[13px] text-muted-foreground">{unit}</span>
    </span>
  );
}

/** Inclusions and exclusions, side by side, with the unit and minimum stated above them. */
export async function PrivateOffer({ index = 1 }: { index?: number }) {
  const terms = offerTerms("private");
  const bands = privateFromPrices();
  const ports = embarkationPorts();
  if (!terms) return <OfferUnavailable what="Charter rates and inclusions" />;

  return (
    <>
      <Reveal>
        <Prose className="mb-0">
          <SectionOpener index={index}>What a private charter costs, and covers</SectionOpener>
        </Prose>
      </Reveal>

      <Reveal>
        <p className="mx-auto mb-10 max-w-[64ch] text-left text-[1.0625rem] leading-[1.65] text-foreground/85">
          A private charter is priced as a{" "}
          <strong className="font-medium text-foreground">whole vessel</strong>, not per person, for
          a minimum of {duration(terms.minNights)}. The figures below are the lowest published
          retail rate at each duration across the fleet; the price for your dates is calculated by
          the reservation system when you search, and the vessel you choose and the season both
          move it.
        </p>
      </Reveal>

      {bands.length ? (
        <RevealGroup className="mb-12 grid gap-px overflow-hidden bg-border sm:grid-cols-3">
          {bands.map((b) => (
            <RevealItem key={b.nights} className="bg-background px-5 py-7">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {duration(b.nights)}
              </p>
              <Money amount={b.fromIdr} unit="from, whole vessel" />
            </RevealItem>
          ))}
        </RevealGroup>
      ) : null}

      <IncludedExcluded inclusions={terms.inclusions} exclusions={terms.exclusions} />
      <OfferFooter itinerary={terms.itinerary} ports={ports} termsVersion={terms.termsVersion} />
    </>
  );
}

/** Per-cabin pricing for the open trip, in both of the sale units the brief allows (OT02). */
export async function OpenTripOffer({ index = 1 }: { index?: number }) {
  const terms = offerTerms("open");
  const cabins = openCabinPrices();
  const ports = embarkationPorts();
  if (!terms) return <OfferUnavailable what="Berth prices and inclusions" />;

  return (
    <>
      <Reveal>
        <Prose className="mb-0">
          <SectionOpener index={index}>What a berth costs, and covers</SectionOpener>
        </Prose>
      </Reveal>

      <Reveal>
        <p className="mx-auto mb-10 max-w-[64ch] text-left text-[1.0625rem] leading-[1.65] text-foreground/85">
          An open trip is sold two ways: a{" "}
          <strong className="font-medium text-foreground">berth</strong> in a shared cabin, or a{" "}
          <strong className="font-medium text-foreground">whole cabin</strong> to yourselves. Taking
          a cabin outright removes its berths from sale, so the two never oversell each other.
          Prices are per departure and shown from the lowest published retail rate.
        </p>
      </Reveal>

      {cabins.length ? (
        <div className="mb-12 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[15px]">
            <caption className="pb-4 text-left text-[13px] text-muted-foreground">
              Published retail rates by cabin category. One berth is one person; a whole cabin is
              the entire room.
            </caption>
            <thead>
              <tr>
                {["Cabin", "Per berth", "Whole cabin"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border-b border-border py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cabins.map((c) => (
                <tr key={c.category}>
                  <th scope="row" className="border-b border-border py-3.5 font-medium capitalize">
                    {c.category}
                  </th>
                  <td className="border-b border-border py-3.5 tabular-nums">
                    {c.berthIdr ? idr(c.berthIdr) : "Not sold by the berth"}
                  </td>
                  <td className="border-b border-border py-3.5 tabular-nums">
                    {c.wholeIdr ? idr(c.wholeIdr) : "Not sold whole"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <IncludedExcluded inclusions={terms.inclusions} exclusions={terms.exclusions} />
      <OfferFooter itinerary={terms.itinerary} ports={ports} termsVersion={terms.termsVersion} />
    </>
  );
}

function IncludedExcluded({
  inclusions,
  exclusions,
}: {
  inclusions: string[];
  exclusions: string[];
}) {
  if (!inclusions.length && !exclusions.length) return null;
  return (
    <div className="mb-12 grid gap-10 text-left sm:grid-cols-2">
      <Reveal>
        <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Included
        </h3>
        <ul className="space-y-2.5">
          {inclusions.map((t) => (
            <li key={t} className="flex gap-3 text-[15px] leading-relaxed">
              <Check aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.08}>
        <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Not included
        </h3>
        <ul className="space-y-2.5">
          {exclusions.map((t) => (
            <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
              <X aria-hidden="true" strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

/** Departure location, itinerary flexibility and the cancellation terms, as §3 lists them. */
function OfferFooter({
  itinerary,
  ports,
  termsVersion,
}: {
  itinerary: string;
  ports: string[];
  termsVersion: number;
}) {
  return (
    <Reveal>
      <dl className="mx-auto max-w-[68ch] border-t border-border pt-7 text-left">
        {itinerary ? (
          <div className="mb-5">
            <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Route, and how fixed it is
            </dt>
            <dd className="m-0 text-[15px] leading-relaxed">
              {itinerary}.{" "}
              <span className="text-muted-foreground">
                The order is indicative. The captain sets the day around tide, light and weather,
                and will say so on the morning briefing rather than hold to a printed schedule.
              </span>
            </dd>
          </div>
        ) : null}

        <div className="mb-5">
          <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Departure location
          </dt>
          <dd className="m-0 flex flex-wrap items-center gap-2 text-[15px]">
            <MapPin aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0 text-brand" />
            {ports.length ? ports.join(" or ") : "Labuan Bajo"}
            <span className="text-muted-foreground">
              — confirmed on your booking, as not every vessel sails from the same port.
            </span>
          </dd>
        </div>

        <div>
          <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Deposit, balance and cancellation
          </dt>
          <dd className="m-0 text-[15px] leading-relaxed text-muted-foreground">
            30% deposit confirms a reservation, with the balance due 30 days before departure.
            Checkout holds your space for 15 minutes. Cancellations are handled under the published
            policy with the fee and reason recorded.{" "}
            <Link href="/terms" className="text-brand underline underline-offset-4">
              Terms version {termsVersion}
            </Link>
            .
          </dd>
        </div>
      </dl>
    </Reveal>
  );
}

/**
 * These three read the reservation engine during render.
 *
 * The pages that use them set `revalidate`, so they are regenerated on a timer rather than baked
 * once at build. That matters commercially: a rate edited in the admin console must not wait for
 * a redeploy to appear. The alternative, `connection()`, does give a per-request read, but
 * without Cache Components it makes the entire route dynamic — measured, it turned both the
 * schedule and the flagship vessel page from prerendered into server-rendered. A few minutes of
 * staleness on a "from" price is a fair trade for keeping them prerendered; a stale price that
 * persists until the next deploy is not.
 *
 * They stay async so their <Suspense> boundaries are real: the skeleton shows while the read
 * resolves rather than the band popping in.
 */

/**
 * The departures board.
 *
 * Each row states whether the departure is guaranteed or still conditional on reaching its
 * minimum, because OT06 requires a paid booking on a conditional departure to carry that
 * condition rather than discover it later.
 */
export async function DepartureBoard() {
  const departures = upcomingDepartures();

  if (!departures.length) {
    return (
      <Reveal>
        <p className="mx-auto max-w-[60ch] text-muted-foreground">
          No published departures at the moment. Tell us your dates and we will let you know as
          soon as the schedule opens.
        </p>
      </Reveal>
    );
  }

  return (
    <>
      <Reveal>
        <H2 className="mb-3">Published departures</H2>
      </Reveal>
      <Reveal delay={0.06}>
        <p className="mx-auto mb-10 max-w-[62ch] text-muted-foreground">
          Live from the reservation system. A guaranteed departure sails as scheduled; a
          conditional one still needs its minimum number of guests, and your confirmation will say
          so until it is met.
        </p>
      </Reveal>

      <RevealGroup as="ul" className="grid gap-px overflow-hidden bg-border sm:grid-cols-2">
        {departures.map((d) => (
          <RevealItem key={d.id} as="li" className="bg-background p-6 text-left sm:p-7">
            <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-[1.05rem] font-medium tracking-[-0.012em]">
                {d.startDate} to {d.endDate}
              </span>
              <span
                className={
                  d.guaranteed
                    ? "inline-flex items-center bg-brand px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-on-deep"
                    : "inline-flex items-center bg-secondary px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-foreground shadow-[inset_0_0_0_1px_var(--input)]"
                }
              >
                {d.guaranteed ? "Guaranteed" : "Conditional"}
              </span>
            </p>

            <p className="mb-4 text-[15px] text-muted-foreground">
              {duration(d.nights)} aboard {d.shipName}, from {d.embarkation}.
            </p>

            <dl className="grid gap-2.5 text-[14px]">
              {d.fromIdr ? (
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Price</dt>
                  <dd className="m-0 tabular-nums">
                    <strong className="font-medium">{idr(d.fromIdr)}</strong>{" "}
                    <span className="text-muted-foreground">from, per berth</span>
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Users aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                <dt className="sr-only">Minimum guests</dt>
                <dd className="m-0">
                  {d.guaranteed
                    ? `Sails regardless of numbers`
                    : `Needs ${d.minPax} guests to be confirmed`}
                </dd>
              </div>
              {d.cutoffAt ? (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <CalendarClock aria-hidden="true" strokeWidth={1.75} className="size-4 shrink-0" />
                  <dt className="sr-only">Booking closes</dt>
                  <dd className="m-0">Booking closes {d.cutoffAt.slice(0, 10)}</dd>
                </div>
              ) : null}
            </dl>
          </RevealItem>
        ))}
      </RevealGroup>
    </>
  );
}
