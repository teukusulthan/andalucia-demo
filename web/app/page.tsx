import Link from "next/link";
import { Anchor, Wrench, Compass, Users } from "lucide-react";
import { Hero } from "@/components/site/hero";
import { Photo } from "@/components/site/photo";
import {
  Band,
  Inner,
  H2,
  Lede,
  Eyebrow,
  ButtonLink,
  ArrowLink,
  CtaBand,
  SplitHead,
  EditorialSplit,
} from "@/components/site/sections";
import { Rail } from "@/components/site/rail";
import { TestimonialCard } from "@/components/site/testimonial-card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ENGLISH_TESTIMONIALS, decode } from "@/lib/content";
import { DISPATCHES } from "@/lib/dispatch";
import { DispatchPreview } from "@/components/site/dispatch-preview";
import { photo } from "@/lib/photos";

const WHY = [
  {
    Icon: Anchor,
    title: "Trusted yacht management",
    body: "One operator, one fleet, one calendar. Nothing is subcontracted and nothing is double-sold.",
  },
  {
    Icon: Wrench,
    title: "Professional maintenance standards",
    body: "Seaworthiness certification, annual inspection and a safety check before every single trip.",
  },
  {
    Icon: Compass,
    title: "Deep industry knowledge",
    body: "Sailing the Komodo archipelago since 2018. We know which site to be at, and at what hour.",
  },
  {
    Icon: Users,
    title: "Experienced crew support",
    body: "Eight trained professionals aboard, including a dedicated guide and a photographer.",
  },
];

const DOORS = [
  {
    href: "/enquire",
    slug: "andalucia-1",
    title: "Private charter",
    body: "Exclusive use of one phinisi for your group. Minimum three days, two nights.",
    cta: "Search dates",
  },
  {
    href: "/schedule",
    slug: "open-trip",
    title: "Open trip",
    body: "Join a scheduled departure. Take a berth in a shared cabin, or a whole cabin.",
    cta: "See departures",
  },
];

export default function HomePage() {
  const dispatches = DISPATCHES.map((d) => {
    const p = photo(d.photo);
    return { ...d, src: p.src, blurDataURL: p.blurDataURL };
  });

  return (
    <>
      <Hero
        slug="hero-home"
        video="/video/hero-ship-1600.mp4"
        poster="/video/hero-ship-poster.jpg"
        cue
        alt="A masted sailing vessel under way on open blue water"
        eyebrow="Labuan Bajo · Komodo National Park"
        title="Two ways to sail Komodo"
        tagline="Charter a whole phinisi for your own group, or join a scheduled departure."
        layout="editorial"
        meta={["18 guests", "6 cabins", "Crew of eight"]}
        actions={
          <>
            <ButtonLink href="/enquire" variant="onDark">
              Search private charters
            </ButtonLink>
            <ArrowLink href="/schedule" tone="onDark">
              Open trips
            </ArrowLink>
          </>
        }
      />

      {/* Welcome. No eyebrow: the section's position on the page is its label.
          Heading in its own column, prose beside it, so the page does not open with a third
          centred block in a row after the hero and the breadcrumb. */}
      <Band>
        <Inner>
          <Reveal>
            <EditorialSplit title="A handcrafted phinisi, and the people who sail her">
              <Lede align="left">
                Andalucía II was built in 2020 as a modern homage to traditional phinisi design.
                She carries eighteen guests across six cabins, with a crew of eight who have worked
                these waters long enough to know where to be when the light turns.
              </Lede>
              <Lede align="left" className="mt-6">
                Take the whole vessel or a single cabin. The trip is the same: mantas, dragons,
                three-coloured beaches, and food cooked twenty minutes before you eat it.
              </Lede>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href="/sailing/andalucia-2">Meet Andalucía II</ButtonLink>
                <ButtonLink href="/about" variant="ghost">
                  About us
                </ButtonLink>
              </div>
            </EditorialSplit>
          </Reveal>
        </Inner>
      </Band>

      {/* The brief's selling point, Plan A: two clickable panels over guest photography.
          They were circles, which is how the brief describes them, but a circle crops a
          photograph to its least interesting part, forces the copy into a diamond of usable
          space in the middle, and at this size read as two enormous blobs. Tall panels keep the
          same idea — one choice on the left, one on the right, both photographic — and let the
          picture and the type both do their job. */}
      <Band tone="shell">
        <Inner>
          <Reveal>
            <SplitHead title="Take the whole ship, or take a cabin">
              <p className="text-muted-foreground">
                The trip is the same either way. What changes is who else is aboard, and what it
                costs.
              </p>
            </SplitHead>
          </Reveal>
          <RevealGroup className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {DOORS.map((d) => (
              <RevealItem key={d.href}>
                <Link
                  href={d.href}
                  data-panel="trip"
                  className="group relative isolate block overflow-hidden text-left text-on-deep"
                >
                  <span className="relative block aspect-[4/5] w-full sm:aspect-[3/4]">
                    <Photo
                      slug={d.slug}
                      alt=""
                      sizes="(max-width: 640px) 100vw, 48vw"
                      className="transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]"
                    />
                  </span>
                  {/* the copy sits in the bottom third, so the scrim is weighted there rather
                      than flattening the whole photograph (1.4.6) */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(to_top,rgb(10_32_54/0.94)_0%,rgb(10_32_54/0.82)_34%,rgb(10_32_54/0.28)_68%,rgb(10_32_54/0.12)_100%)]"
                  />
                  <span className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                    <h3 className="mb-2.5 max-w-[14ch] font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.15rem)] font-medium leading-[1.1] tracking-[-0.015em]">
                      {d.title}
                    </h3>
                    <p className="mb-6 max-w-[30ch] text-[15px] leading-relaxed text-on-deep">
                      {d.body}
                    </p>
                    <span className="inline-flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.14em]">
                      {d.cta}
                      <span
                        aria-hidden="true"
                        className="block h-px w-8 bg-current transition-[width] duration-500 ease-out-expo group-hover:w-16"
                      />
                    </span>
                  </span>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </Inner>
      </Band>

      {/* Guest reviews */}
      <Band>
        <Inner>
          <Reveal>
            <SplitHead title="What guests say afterwards">
              <p className="text-muted-foreground">
                Reviews left after the trip, on TripAdvisor and by email. Nothing here is written
                by us.
              </p>
            </SplitHead>
          </Reveal>
          <Rail label="Guest testimonials">
            {ENGLISH_TESTIMONIALS.map((t) => (
              <li key={t.name}>
                <TestimonialCard
                  name={decode(t.name)}
                  country={t.country || undefined}
                  date={t.date}
                  source={t.source}
                  rating={t.rating}
                  body={decode(t.body)}
                  lang={t.lang}
                />
              </li>
            ))}
          </Rail>
        </Inner>
      </Band>

      {/* The Island Dispatch: blurred behind a sign-in prompt, open once the reader is a member. */}
      <Band>
        <Inner>
          {/* Centred, between two split sections: the alternation is the rhythm. An eyebrow
              above it gives this one a different character from the hero and the closing CTA,
              which are the page's other two centred moments. */}
          <Reveal>
            <Eyebrow>From the crew</Eyebrow>
          </Reveal>
          <Reveal delay={0.06}>
            <H2 className="mb-3">The Island Dispatch</H2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mb-12 max-w-[52ch] text-muted-foreground">
              Sailing schedules, destination notes and members-only invitations.
            </p>
          </Reveal>
          <DispatchPreview items={dispatches} />
        </Inner>
      </Band>

      {/* Why us */}
      <Band tone="deep">
        <Inner>
          <Reveal>
            <SplitHead
              tone="deep"
              title="Why guests come back"
              className="mb-0"
            >
              <p className="text-muted-deep">
                One operator, one fleet, one calendar. The things that go wrong on a charter
                usually go wrong between companies, so we did not build it that way.
              </p>
            </SplitHead>
          </Reveal>
          <RevealGroup className="mt-14 grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ Icon, title, body }) => (
              <RevealItem key={title} className="border-t border-on-deep/20 pt-6">
                <Icon aria-hidden="true" className="mb-6 size-6 text-on-deep" strokeWidth={1.25} />
                <h3 className="mb-2.5 text-[1.05rem] font-semibold tracking-[-0.012em] text-on-deep">
                  {title}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted-deep">{body}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </Inner>
      </Band>

      <CtaBand
        line="Let Andalucía accompany your journey across the sea."
        label="Make an enquiry"
        href="/enquire"
        slug="home-cta"
      />
    </>
  );
}
