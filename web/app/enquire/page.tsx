import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { CONTACT } from "@/lib/content";

export const metadata: Metadata = {
  title: "Make an enquiry",
  description: "Tell us the dates and the group, and the crew will come back to you.",
};

export default function EnquirePage() {
  return (
    <>
      <Hero
        slug="private-charter"
        alt="Andalucía II anchored in a turquoise bay"
        eyebrow="Contact"
        title="Make an Enquiry"
        tagline="Tell us the dates and the group, and we will come back to you."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "Make an enquiry" }]} />

      <Band>
        <Inner>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Reveal>
              <EnquiryForm />
            </Reveal>
            <Reveal delay={0.1}>
              <aside className="border-t border-border pt-6">
                <h2 className="mb-4 text-[1.05rem] font-semibold tracking-[-0.012em]">
                  Or reach us directly
                </h2>
                <dl>
                  <div className="border-b border-border py-3">
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      Phone
                    </dt>
                    <dd className="m-0">
                      <a
                        href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                        className="inline-flex min-h-11 items-center text-brand underline underline-offset-4"
                      >
                        {CONTACT.phone}
                      </a>
                    </dd>
                  </div>
                  <div className="border-b border-border py-3">
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      Email
                    </dt>
                    <dd className="m-0">
                      <a
                        href={`mailto:${CONTACT.email}`}
                        className="inline-flex min-h-11 items-center text-brand underline underline-offset-4"
                      >
                        {CONTACT.email}
                      </a>
                    </dd>
                  </div>
                  <div className="py-3">
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      In person
                    </dt>
                    <dd className="m-0 max-w-[34ch] text-[15px] text-muted-foreground">
                      {CONTACT.address}. Ask for Mr. Marco.
                    </dd>
                  </div>
                </dl>
                {CONTACT.pending ? (
                  <p className="mt-4 text-[13px] italic text-muted-foreground">
                    Placeholder contact details, awaiting the real phone, email and address.
                  </p>
                ) : null}
              </aside>
            </Reveal>
          </div>
        </Inner>
      </Band>
    </>
  );
}
