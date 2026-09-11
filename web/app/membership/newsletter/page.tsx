import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";
import { ClubForm } from "@/components/site/club-form";
import { DISPATCHES } from "@/lib/dispatch";

export const metadata: Metadata = {
  title: "Subscribe to the Island Dispatch",
  description:
    "New sailing schedules, destination highlights, travel insight and members-only invitations.",
};

export default function NewsletterPage() {
  return (
    <>
      <Hero
        slug="newsletter-hero"
        alt="Morning light over the Komodo archipelago"
        eyebrow="Membership program"
        title="Subscribe for free to Our Island Dispatch"
        tagline="New sailing schedules, destination highlights, travel insight and members-only invitations."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/membership", label: "Membership Program" },
          { label: "Newsletter" },
        ]}
      />

      <Band>
        <Inner>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Reveal>
              <ClubForm variant="subscribe" />
            </Reveal>
            <Reveal delay={0.1}>
              <aside className="border-t border-border pt-6">
                <h2 className="mb-4 text-[1.05rem] font-semibold tracking-[-0.012em]">
                  Recent dispatches
                </h2>
                <ul>
                  {DISPATCHES.slice(0, 3).map((d) => (
                    <li key={d.slug} className="border-b border-border py-4 last:border-b-0">
                      <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                        {d.date}
                      </p>
                      <p className="mb-1 font-medium">{d.title}</p>
                      <p className="text-[15px] leading-relaxed text-muted-foreground">
                        {d.excerpt}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[15px] text-muted-foreground">
                  Full issues are open to Voyage Club members.{" "}
                  <Link href="/membership/join" className="text-brand underline underline-offset-4">
                    Join for free
                  </Link>
                  .
                </p>
              </aside>
            </Reveal>
          </div>
        </Inner>
      </Band>
    </>
  );
}
