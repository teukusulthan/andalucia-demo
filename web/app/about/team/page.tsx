import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Photo } from "@/components/site/photo";
import { Band, Inner, Crumbs, CtaBand } from "@/components/site/sections";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PendingNote } from "@/components/site/simple-page";
import { CREW } from "@/lib/content";

export const metadata: Metadata = {
  title: "Our team",
  description:
    "The crew behind every voyage aboard Andalucía II: captain, engineer, chef, guide, photographer and guest attendant.",
};

export default function TeamPage() {
  return (
    <>
      <Hero
        slug="team-hero"
        alt="The crew of Andalucía II on deck"
        eyebrow="About us"
        title="Meet the Crew Behind Every Seamless Voyage"
        tagline="The people who make a good trip feel effortless."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/about", label: "About Us" },
          { label: "Our team" },
        ]}
      />

      <Band>
        <Inner>
          <RevealGroup className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {CREW.map(([name, role, bio], i) => (
              <RevealItem key={name} as="figure" className="group m-0">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
                  <Photo
                    slug={`crew-${i + 1}`}
                    alt={`${name}, ${role}`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.04]"
                  />
                </div>
                <figcaption className="pt-5">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-brand">
                    {role}
                  </p>
                  <h2 className="mb-2 text-[1.2rem] font-semibold tracking-[-0.02em]">{name}</h2>
                  <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted-foreground">
                    {bio}
                  </p>
                </figcaption>
              </RevealItem>
            ))}
          </RevealGroup>

          <PendingNote title="Still to come:">
            the shore-side management team. The brief leaves this section open, so names, roles and
            photographs are needed before launch.
          </PendingNote>
        </Inner>
      </Band>

      <CtaBand
        line="Sail with a crew who know these waters."
        label="Make an enquiry"
        href="/enquire"
        slug="team-cta"
      />
    </>
  );
}
