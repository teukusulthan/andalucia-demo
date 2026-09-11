import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { Band, Inner, Lede, Crumbs, ButtonLink } from "@/components/site/sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PendingNote } from "@/components/site/simple-page";
import { ShieldCheck, BadgeCheck, Compass, ClipboardCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal and safety information",
  description:
    "Vessel certification, crew training, national park permits and onboard safety equipment for Andalucía II.",
};

const BLOCKS: { title: string; sub: string; Icon: typeof ShieldCheck; paras: string[] }[] = [
  {
    title: "Vessel certification",
    Icon: ShieldCheck,
    sub: "Legalitas Kapal",
    paras: [
      "The vessel holds a valid Annual Seaworthiness Certificate (Pas Tahunan) issued by the Indonesian Port Authority (KSOP, Kantor Kesyahbandaran dan Otoritas Pelabuhan).",
      "Registration status, official size measurement (Surat Ukur Kapal) and annual inspection records are held onboard and at the office.",
    ],
  },
  {
    title: "Crew training & safety",
    Icon: BadgeCheck,
    sub: "Sertifikasi Kru",
    paras: [
      "All crew members hold Basic Safety Training certification (BST, Pelatihan Dasar Keselamatan).",
      "The captain and officers hold official competency licences (SKK60 / SKK30, Surat Keterangan Kecakapan).",
      "Passenger insurance (Asuransi Penumpang) is active and valid for every voyage.",
    ],
  },
  {
    title: "National park compliance",
    Icon: Compass,
    sub: "Izin Operasional",
    paras: [
      "The vessel holds the permits required to operate inside Komodo National Park (Taman Nasional Komodo).",
      "We use authorised landing zones only and work with official park rangers (Petugas Balai Taman Nasional) at every site that requires them.",
    ],
  },
  {
    title: "Onboard safety equipment",
    Icon: ClipboardCheck,
    sub: "Fasilitas Keselamatan",
    paras: [
      "Life jackets (jaket pelampung), life rafts (sekoci), GPS, VHF radio and fire extinguishers (alat pemadam api) are carried as standard.",
      "All equipment is inspected before every trip, and the inspection log is available to guests.",
    ],
  },
];

export default function LegalPage() {
  return (
    <>
      <Hero
        slug="legal-hero"
        alt="Andalucía II at anchor"
        eyebrow="About us"
        title="Legal & Safety Information"
        tagline="Registered, certified, and operating under national and park regulations."
        short
      />
      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: "/about", label: "About Us" },
          { label: "Legal information" },
        ]}
      />

      <Band>
        <Inner>
          <Reveal>
            <Lede className="mb-12">
              Andalucía II is legally registered, fully certified and operates under both Indonesian
              national maritime regulation and the specific rules of Komodo National Park. The
              documents summarised below are available for guest review on request.
            </Lede>
          </Reveal>

          <RevealGroup className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
            {BLOCKS.map((b) => (
              <RevealItem key={b.title} className="border-t border-border pt-6">
                <b.Icon aria-hidden="true" strokeWidth={1.3} className="mb-5 size-7 text-brand" />
                <h2 className="mb-1 text-[1.15rem] font-semibold tracking-[-0.02em]">{b.title}</h2>
                <p className="mb-4 text-[13px] italic text-muted-foreground">{b.sub}</p>
                {b.paras.map((p, i) => (
                  <p key={i} className="mb-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal>
            <div className="mt-12">
              <ButtonLink href="/enquire">Request a copy of our permits and certifications</ButtonLink>
            </div>
          </Reveal>

          <PendingNote title="For review:">
            this page paraphrases the brief&rsquo;s legal section. It needs sign-off from the
            operator, and the certificate numbers and expiry dates need to be supplied, before it is
            published.
          </PendingNote>
        </Inner>
      </Band>
    </>
  );
}
