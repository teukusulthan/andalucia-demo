import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Crumbs } from "@/components/site/sections";
import { Reveal } from "@/components/motion/reveal";
import { SignInForm } from "@/components/site/signin-form";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to read the Island Dispatch in full and see your bookings.",
};

export default async function SignInPage() {
  if (await currentUser()) redirect("/account");

  return (
    <>
      <Hero
        slug="join-hero"
        alt="Andalucía II at anchor at golden hour"
        eyebrow="Voyage Club"
        title="Sign in"
        tagline="The Island Dispatch in full, and your bookings in one place."
        short
      />
      <Crumbs trail={[{ href: "/", label: "Home" }, { label: "Sign in" }]} />

      <Band>
        <Inner>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Reveal>
              <SignInForm />
            </Reveal>
            <Reveal delay={0.1}>
              <aside className="border-t border-border pt-6">
                <h2 className="mb-4 text-[1.05rem] font-semibold tracking-[-0.012em]">
                  Demonstration accounts
                </h2>
                <p className="mb-4 text-[15px] text-muted-foreground">
                  This prototype shares its accounts with the reservation engine. The password is
                  the role name.
                </p>
                <dl className="text-[15px]">
                  {[
                    ["admin@andalusia.test", "Administrator"],
                    ["ops@andalusia.test", "Operations"],
                    ["agent@balisea.test", "Travel agent"],
                  ].map(([email, role]) => (
                    <div key={email} className="border-b border-border py-3 last:border-b-0">
                      <dt className="font-mono text-[13px]">{email}</dt>
                      <dd className="m-0 text-muted-foreground">{role}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </Reveal>
          </div>
        </Inner>
      </Band>
    </>
  );
}
