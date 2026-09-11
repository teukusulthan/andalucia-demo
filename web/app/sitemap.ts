import type { MetadataRoute } from "next";
import { EXPERIENCES, DESTINATIONS, VESSELS } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/**
 * Every public, indexable route.
 *
 * Built from the same content collections the pages render from, so a new destination or
 * experience appears here without anyone remembering to add it. `/account` and `/signin` are
 * omitted deliberately — they are per-visitor and `robots.ts` disallows them.
 *
 * `/news` and its articles are excluded too: the dispatch is gated behind Voyage Club
 * membership, so indexing the headlines would advertise content a crawler cannot reach.
 */
const STATIC = [
  "/",
  "/sailing",
  "/sailing/cabin-collection",
  "/destinations",
  "/open-trip/itinerary",
  "/schedule",
  "/gallery",
  "/enquire",
  "/about",
  "/about/team",
  "/about/legal",
  "/membership",
  "/membership/benefits",
  "/membership/join",
  "/membership/newsletter",
  "/membership/special-offer",
  "/faq",
  "/terms",
  "/privacy",
  "/awards",
  "/press",
  "/credits",
  "/travel-resources",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = [
    ...STATIC,
    ...Object.keys(VESSELS).map((v) => `/sailing/${v}`),
    ...Object.keys(DESTINATIONS).map((d) => `/destination/${d}`),
    ...Object.keys(EXPERIENCES).map((e) => `/experience/${e}`),
  ];

  return paths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.split("/").length > 2 ? 0.6 : 0.8,
  }));
}
