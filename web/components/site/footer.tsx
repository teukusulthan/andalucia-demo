import Link from "next/link";
import { Mail } from "lucide-react";
import { CONTACT } from "@/lib/content";
import { FOOTER_EXPLORE, FOOTER_LEGAL } from "@/lib/nav";
import { BRAND_ICONS } from "@/lib/brand-icons";

/* lucide dropped its brand glyphs, so Instagram and YouTube come from Simple Icons. */
function BrandGlyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
      <path d={d} />
    </svg>
  );
}

const SOCIAL = [
  {
    href: CONTACT.instagram,
    label: "Andalucía on Instagram",
    icon: <BrandGlyph d={BRAND_ICONS.instagram.path} />,
  },
  {
    href: CONTACT.youtube,
    label: "Andalucía on YouTube",
    icon: <BrandGlyph d={BRAND_ICONS.youtube.path} />,
  },
  {
    href: `mailto:${CONTACT.email}`,
    label: `Email Andalucía at ${CONTACT.email}`,
    icon: <Mail className="size-5" aria-hidden="true" />,
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-deep text-muted-deep">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-5 pb-8 pt-20 sm:px-8 lg:grid-cols-4">
        <div>
          <span className="mb-5 block text-lg font-semibold uppercase tracking-[0.2em] text-muted-deep">
            Andalucía
          </span>
          <div className="mb-4">
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
              className="inline-flex min-h-11 items-center text-[15px] text-on-deep underline-offset-4 hover:underline"
            >
              {CONTACT.phone}
            </a>
            <br />
            <a
              href={`mailto:${CONTACT.email}`}
              className="inline-flex min-h-11 items-center text-[15px] text-on-deep underline-offset-4 hover:underline"
            >
              {CONTACT.email}
            </a>
          </div>
          <p className="max-w-[34ch] text-[15px]">{CONTACT.address}</p>
          <p className="mt-3 max-w-[34ch] text-[15px]">Ask for Mr. Marco for in-person assistance.</p>
          {CONTACT.pending ? (
            <p className="mt-3 max-w-[34ch] text-[13px] italic">
              Placeholder contact details, awaiting the real phone, email and address.
            </p>
          ) : null}
          <Link
            href="/travel-resources"
            className="mt-2 inline-flex min-h-11 items-center text-[15px] text-on-deep underline underline-offset-4"
          >
            Travel Resources
          </Link>
        </div>

        <FooterColumn title="Explore" links={FOOTER_EXPLORE} />
        <FooterColumn title="Legal & Media" links={FOOTER_LEGAL} />

        <div>
          <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-on-deep">
            Connect With Us
          </h2>
          <p className="mb-5 max-w-[34ch] text-[15px]">
            Voyage notes, new schedules and members-only invitations.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SOCIAL.map(({ href, label, icon }) => (
              <a
                key={label}
                href={href}
                rel="noopener"
                className="inline-flex size-11 items-center justify-center text-on-deep shadow-[inset_0_0_0_1px_rgb(250_250_248/0.25)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-band"
              >
                {icon}
                <span className="vh">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-3 border-t border-on-deep/15 px-5 py-6 text-sm sm:px-8">
        <p className="max-w-[70ch]">
          Prototype built to the business rules in{" "}
          <cite>Phinisi Booking Platform: Business Requirements v1.0</cite>. No real payments are
          taken and no real vessel is reserved.
        </p>
        <p>
          Targets WCAG 2.2 Level AAA.{" "}
          <Link href="/credits" className="text-on-deep underline underline-offset-4">
            Photography credits
          </Link>
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.14em] text-on-deep">{title}</h2>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex min-h-11 items-center text-[15px] text-on-deep underline-offset-4 hover:underline"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
