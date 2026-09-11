import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";
import { ClubForm } from "@/components/site/club-form";

export const metadata: Metadata = {
  title: "Join the Voyage Club",
  description: "Free to join. The Island Dispatch in full, onboard gifts and priority access.",
};

const BENEFITS = [
  "The Island Dispatch in full",
  "An onboard souvenir gift",
  "Early notice of seasonal discounts",
  "Priority access to special deals",
  "Invitations to private voyage dates",
];

export default function JoinPage() {
  return (
    <>
      <Hero
        slug="join-hero"
        alt="Andalucía II at anchor at golden hour"
        eyebrow="Membership program"
        title="Join the Voyage Club"
        tagline="Free to join. Takes about a minute."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/membership", label: "Membership Program" },
          { label: "Sign up" },
        ]}
      />

      <Band>
        <Inner>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Reveal>
              <ClubForm variant="join" />
            </Reveal>
            <Reveal delay={0.1}>
              <aside className="border-t border-border pt-6">
                <h2 className="mb-4 text-[1.05rem] font-semibold tracking-[-0.012em]">
                  What you get
                </h2>
                <ul>
                  {BENEFITS.map((b) => (
                    <li key={b} className="border-b border-border py-3 text-[15px] last:border-b-0">
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-[15px] text-muted-foreground">
                  Already a member?{" "}
                  <Link href="/signin" className="text-brand underline underline-offset-4">
                    Sign in
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
