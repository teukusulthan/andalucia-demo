import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The brief asks for search metadata; titles, descriptions and Open Graph were in place but
 * robots.txt and the sitemap were both 404.
 *
 * `/account` is per-member and already carries `robots: { index: false }` in its own metadata;
 * disallowing it here keeps crawlers off it without relying on them rendering the page first.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/account", "/signin"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
