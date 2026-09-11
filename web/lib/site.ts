/**
 * The site's own origin, used by the sitemap, robots and metadataBase.
 *
 * Set `NEXT_PUBLIC_SITE_URL` at deploy time. The fallback is the placeholder host the rest of
 * the prototype already uses, so nothing silently claims a real domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://andalucia-charter.test"
).replace(/\/$/, "");
