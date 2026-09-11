import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs, CtaBand, ButtonLink } from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PendingNote } from "@/components/site/simple-page";
import { Gift, BellRing, Star, MailOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Member offers",
  description:
    "Onboard souvenir gifts, early notice of seasonal discounts, priority access and invitations to private voyage dates.",
};

const OFFERS: { title: string; body: string; Icon: typeof Gift }[] = [
  {
    title: "An onboard souvenir gift",
    Icon: Gift,
    body: "Waiting in your cabin when you board. Arranged by the crew, not billed to you.",
  },
  {
    title: "Early notice of seasonal discounts",
    Icon: BellRing,
    body: "Members hear about shoulder-season pricing before it reaches the public schedule.",
  },
  {
    title: "Priority access to special deals",
    Icon: Star,
    body: "Limited cabins on high-demand departures are released to members first.",
  },
  {
    title: "Invitations to private voyage dates",
    Icon: MailOpen,
    body: "Occasional closed departures and exclusive voyage experiences, by invitation.",
  },
];

export default function SpecialOfferPage() {
  return (
    <>
      <Hero
        slug="offer-hero"
        alt="A private dinner set on the beach"
        eyebrow="Membership program"
        title="Member Offers"
        tagline="The things we keep for people who sail with us more than once."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/membership", label: "Membership Program" },
          { label: "Special offer" },
        ]}
      />

      <Band>
        <Inner>
          <RevealGroup className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {OFFERS.map((o) => (
              <RevealItem key={o.title} className="border-t border-border pt-6">
                <o.Icon aria-hidden="true" strokeWidth={1.3} className="mb-5 size-7 text-brand" />
                <h2 className="mb-2.5 text-[1.15rem] font-semibold tracking-[-0.02em]">{o.title}</h2>
                <p className="max-w-[46ch] text-[15px] leading-relaxed text-muted-foreground">
                  {o.body}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal>
            <div className="mt-12">
              <ButtonLink href="/membership/join">Unlock member perks</ButtonLink>
            </div>
          </Reveal>

          <PendingNote title="Operationally manual for now:">
            the souvenir gift is a note to staff on the booking, not an automated fulfilment.
            Discounts and priority release are not yet wired into the rates engine.
          </PendingNote>
        </Inner>
      </Band>

      <CtaBand
        line="Join once. Benefit every voyage after."
        label="Become a member"
        href="/membership/join"
        slug="offer-cta"
      />
    </>
  );
}
