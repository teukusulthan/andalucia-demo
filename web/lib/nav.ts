import { DESTINATION_ORDER, EXPERIENCE_ORDER, decode } from "./content";

export type NavLink = { href: string; label: string; note?: string };
export type NavColumn = { title: string; links: NavLink[] };
export type NavGroup = { label: string; href: string; columns: NavColumn[] };

const destLinks = (from: number, to: number): NavLink[] =>
  DESTINATION_ORDER.slice(from, to).map(([slug, label]) => ({
    href: `/destination/${slug}`,
    label: decode(label),
  }));

export const NAV: NavGroup[] = [
  {
    label: "Sailing",
    href: "/sailing",
    columns: [
      {
        title: "Our Voyage",
        links: [
          { href: "/sailing/andalucia-1", label: "Andalucía I", note: "Retired" },
          { href: "/sailing/andalucia-2", label: "Andalucía II" },
          { href: "/sailing/andalucia-3", label: "Andalucía III", note: "Coming soon" },
        ],
      },
      {
        title: "Private Charter",
        links: [
          ...EXPERIENCE_ORDER.map(([slug, label]) => ({
            href: `/experience/${slug}`,
            label: decode(label),
          })),
        ],
      },
      {
        title: "Open Trip",
        links: [
          { href: "/open-trip/itinerary", label: "Itinerary" },
          { href: "/sailing/cabin-collection", label: "Cabin collection" },
          { href: "/schedule", label: "Schedule" },
        ],
      },
    ],
  },
  {
    label: "Destination",
    href: "/destinations",
    columns: [
      { title: "Islands & Beaches", links: destLinks(0, 5) },
      { title: "Reefs & Dive Sites", links: destLinks(5, 10) },
      { title: "More of the Archipelago", links: destLinks(10, 14) },
    ],
  },
  {
    label: "Membership Program",
    href: "/membership",
    columns: [
      {
        title: "Stay in Touch",
        links: [
          { href: "/membership/newsletter", label: "Newsletter" },
          { href: "/membership/special-offer", label: "Special offer" },
        ],
      },
      {
        title: "Join",
        links: [
          { href: "/membership/join", label: "Sign up" },
          { href: "/membership/benefits", label: "Membership benefits" },
        ],
      },
    ],
  },
  {
    label: "About Us",
    href: "/about",
    columns: [
      {
        title: "The Company",
        links: [
          { href: "/about", label: "About Andalucía Charter" },
          { href: "/about/legal", label: "Legal information" },
          { href: "/about/team", label: "Our team" },
        ],
      },
      {
        title: "More",
        links: [
          { href: "/gallery", label: "Gallery" },
          { href: "/faq", label: "Frequently asked questions" },
          { href: "/credits", label: "Photography credits" },
        ],
      },
    ],
  },
];

export const FOOTER_EXPLORE: NavLink[] = [
  { href: "/awards", label: "Awards" },
  { href: "/press", label: "Press" },
  { href: "/about/team", label: "Staff" },
  { href: "/faq", label: "FAQ" },
  { href: "/membership/newsletter", label: "Subscription" },
];

export const FOOTER_LEGAL: NavLink[] = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about/legal", label: "Legal information" },
  { href: "/credits", label: "Photography credits" },
];
