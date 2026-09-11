import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs, CtaBand } from "@/components/site/sections";
import { LinkCardGrid } from "@/components/site/link-card";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "The Voyage Club: the Island Dispatch, onboard gifts, early notice of seasonal pricing and invitations to private voyage dates.",
};

export default function MembershipPage() {
  return (
    <>
      <Hero
        slug="membership-hero"
        alt="Guests on deck at sunset"
        eyebrow="Membership program"
        title="The Voyage Club"
        tagline="Sail with us more than once, and we will make it worth your while."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "Membership Program" }]} />

      <Band>
        <Inner>
          <LinkCardGrid
            columns={4}
            items={[
              {
                href: "/membership/newsletter",
                slug: "newsletter-hero",
                title: "Newsletter",
                body: "The Island Dispatch: schedules, destinations and travel notes, free.",
              },
              {
                href: "/membership/special-offer",
                slug: "offer-hero",
                title: "Special offer",
                body: "Seasonal discounts and priority access to private trip dates.",
              },
              {
                href: "/membership/benefits",
                slug: "benefits-hero",
                title: "Membership benefits",
                body: "Everything a member gets, in one list.",
              },
              {
                href: "/membership/join",
                slug: "join-hero",
                title: "Sign up",
                body: "Join the Voyage Club. Takes a minute, costs nothing.",
              },
            ]}
            level={2}
            label="Membership program"
          />
        </Inner>
      </Band>

      <CtaBand
        line="Join the Voyage Club and read the Dispatch in full."
        label="Become a member"
        href="/membership/join"
        slug="membership-cta"
      />
    </>
  );
}
