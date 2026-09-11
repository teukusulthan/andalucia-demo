import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Hero } from "@/components/site/hero";
import { Photo } from "@/components/site/photo";
import { Band, Inner, H2, Crumbs, CtaBand } from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Open trip itinerary",
  description:
    "Three days through Komodo: manta rays and Padar at sunset, dragons and Pink Beach, then Manjarite and Kelor before the harbour.",
};

const DAYS: { n: number; title: string; slug: string; body: ReactNode[]; gets: string[] }[] = [
  {
    n: 1,
    title: "Arrival, mantas and sunset at Padar",
    slug: "itinerary-day1",
    body: [
      <>
        We collect you from your hotel or the airport in Labuan Bajo. Once everyone is aboard and
        the welcome coconut is in your hand, we sail for the first stop.
      </>,
      <>
        <Dl href="/destination/manta-point">Manta Point</Dl> comes first, snorkelling alongside reef
        mantas in clear water. No cages, no aquariums. Then{" "}
        <Dl href="/destination/taka-makassar">Taka Makassar</Dl>, a sandbar in the middle of the
        sea, for swimming and photographs.
      </>,
      <>
        By late afternoon we reach <Dl href="/destination/padar-island">Padar Island</Dl>. The hike
        takes around 40 minutes and ends with three crescent beaches and the golden hills below you.
      </>,
    ],
    gets: [
      "Pick-up from airport or hotel",
      "Welcome drink and crew introduction",
      "Snorkelling with manta rays",
      "Swimming and beach time at Taka Makassar",
      "Guided hike to the Padar viewpoint",
      "All meals and soft drinks aboard",
      "Professional documentation throughout the day",
    ],
  },
  {
    n: 2,
    title: "Komodo dragons, Pink Beach and paddle adventures",
    slug: "itinerary-day2",
    body: [
      <>
        After breakfast we begin with{" "}
        <Dl href="/experience/komodo-trekking">trekking on Komodo Island</Dl>, guided by an
        experienced ranger through the dragons&rsquo; own habitat.
      </>,
      <>
        From there to <Dl href="/destination/pink-beach">Pink Beach</Dl> to swim, sunbathe and take
        the paddleboards out straight from the shore. Then{" "}
        <Dl href="/destination/penga-island">Penga Island</Dl> for snorkelling over shallow coral,
        and Pempeng for a beach stop.
      </>,
      <>
        We close the day anchored near <Dl href="/destination/kalong-island">Kalong Island</Dl>,
        where tens of thousands of fruit bats cross the sunset sky.
      </>,
    ],
    gets: [
      "Guided Komodo dragon trekking with a ranger",
      "Paddleboarding and beach time at Pink Beach",
      "Snorkelling at Penga Island",
      "Beach swim at Pempeng",
      "Sunset bat migration at Kalong Island",
      "Chef-prepared meals aboard",
      "Optional stargazing from the upper deck after dinner",
    ],
  },
  {
    n: 3,
    title: "Final exploration and farewell",
    slug: "itinerary-day3",
    body: [
      <>
        On the last morning we visit <Dl href="/destination/manjarite-island">Manjarite</Dl> for a
        calm snorkel and a good chance of turtles. Then{" "}
        <Dl href="/destination/kelor-island">Kelor Island</Dl>: clear water, a short hike to the
        hilltop, and sometimes baby sharks in the shallows.
      </>,
      <>
        We aim to be back at Labuan Bajo harbour around 11:00, with drop-off to your hotel or the
        airport depending on your departure.
      </>,
    ],
    gets: [
      "Snorkelling and swimming at Manjarite",
      "Hiking and island views at Kelor",
      "Farewell breakfast and final photographs on deck",
      "Drop-off to hotel or airport",
    ],
  },
];

function Dl({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-brand underline underline-offset-4">
      {children}
    </Link>
  );
}

export default function ItineraryPage() {
  return (
    <>
      <Hero
        slug="itinerary-day1"
        alt="The open trip route through the Komodo archipelago"
        eyebrow="Open trip"
        title="Three Days Through Komodo"
        tagline="Mantas, dragons, pink sand and a sky full of bats."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/sailing", label: "Sailing" },
          { label: "Itinerary" },
        ]}
      />

      <Band>
        <Inner narrow>
          {DAYS.map((d, i) => (
            <section key={d.n} className={i === 0 ? "" : "mt-20 border-t border-border pt-16"}>
              <Reveal>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Day {d.n}
                </p>
              </Reveal>
              <Reveal delay={0.05}>
                <H2 className="mb-6">{d.title}</H2>
              </Reveal>
              {d.body.map((p, j) => (
                <Reveal key={j} delay={0.08 + j * 0.05}>
                  <p className="mb-5 max-w-[68ch] text-[1.0625rem] leading-[1.65] text-foreground/85">
                    {p}
                  </p>
                </Reveal>
              ))}
              <Reveal>
                <div className="relative my-8 aspect-[16/9] w-full overflow-hidden bg-secondary">
                  <Photo slug={d.slug} alt={d.title} sizes="(max-width: 768px) 100vw, 760px" />
                </div>
              </Reveal>
              <Reveal>
                <h3 className="mb-4 text-[1.05rem] font-semibold tracking-[-0.012em]">
                  What guests receive
                </h3>
              </Reveal>
              <RevealGroup as="ul">
                {d.gets.map((g) => (
                  <RevealItem key={g} as="li" className="border-t border-border py-3 text-[15px]">
                    {g}
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>
          ))}
        </Inner>
      </Band>

      <CtaBand
        line="Three days. Every island on this page."
        label="See departures and prices"
        href="/schedule"
        slug="itinerary-cta"
      />
    </>
  );
}
