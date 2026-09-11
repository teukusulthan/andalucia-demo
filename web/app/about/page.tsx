import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import {
  Band,
  Inner,
  H2,
  Lede,
  Crumbs,
  CtaBand,
  PhotoStrip,
  ButtonLink,
} from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";

export const metadata: Metadata = {
  title: "About Andalucía Charter",
  description:
    "Established in 2018, delivering refined sailing in the Komodo archipelago aboard a handcrafted phinisi with a crew of eight.",
};

const METRICS: { label: string; to: number; suffix?: string }[] = [
  { label: "Guest cabins", to: 6 },
  { label: "Crew on board", to: 8 },
  { label: "Hours of experience", to: 10000, suffix: "+" },
];

export default function AboutPage() {
  return (
    <>
      <Hero
        slug="about-hero"
        alt="Andalucía II sailing in Komodo waters"
        eyebrow="About us"
        title="Sailing with Confidence, Crafted with Care"
        tagline="Refined sailing in the Komodo Archipelago since 2018."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "About Us" }]} />

      <Band>
        <Inner narrow>
          <Reveal>
            <Lede>
              Established in 2018, our charter company has grown with a clear mission: to deliver
              refined sailing experiences in the Komodo Archipelago. Andalucía II, our signature
              vessel, was crafted in 2020 and launched in 2021 as a modern homage to traditional
              phinisi design, built to combine heritage with comfort.
            </Lede>
          </Reveal>
          <Reveal delay={0.08}>
            <Lede className="mt-6">
              Our team of eight trained professionals makes sure each journey is not only safe but
              exceptional in every way. Whether you join a private charter or an open trip, every
              moment is guided with precision, care and genuine hospitality.
            </Lede>
          </Reveal>

          <RevealGroup as="dl" className="mt-14 grid gap-8 text-center sm:grid-cols-3">
            {METRICS.map((m) => (
              <RevealItem key={m.label} className="flex flex-col-reverse gap-2.5">
                <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {m.label}
                </dt>
                <dd className="m-0 text-[clamp(2.4rem,1.6rem+3vw,4rem)] font-semibold leading-none tracking-[-0.04em]">
                  <CountUp to={m.to} suffix={m.suffix} />
                </dd>
              </RevealItem>
            ))}
          </RevealGroup>
        </Inner>
      </Band>

      <Band tone="deep">
        <Inner>
          <PhotoStrip
            items={[
              ["andalucia-2", "Andalucía II under way in Komodo waters"],
              ["vessel-deck", "The open deck"],
              ["vessel-dining-in", "The indoor saloon"],
              ["vessel-lounge", "Upper deck seating"],
            ]}
            label="Andalucía Charter"
          />
        </Inner>
      </Band>

      <Band tone="shell">
        <Inner narrow className="text-center">
          <Reveal>
            <H2 className="mx-auto mb-5">Meet the people who make it work</H2>
          </Reveal>
          <Reveal delay={0.06}>
            <Lede className="mx-auto mb-8">
              Eight professionals, most of whom have sailed these waters their whole working lives.
            </Lede>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/about/team">Our team</ButtonLink>
              <ButtonLink href="/about/legal" variant="ghost">
                Legal information
              </ButtonLink>
            </div>
          </Reveal>
        </Inner>
      </Band>

      <CtaBand
        line="Let Andalucía accompany your journey across the sea."
        label="Make an enquiry"
        href="/enquire"
        slug="about-cta"
      />
    </>
  );
}
