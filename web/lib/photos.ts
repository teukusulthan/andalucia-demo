import manifest from "./photos.generated.json";

export type Photo = {
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  alt: string;
  credit: { name: string; url: string; id: string; vessel?: boolean };
};

const PHOTOS = manifest as unknown as Record<string, Photo>;

/**
 * Resolve an image slot. Every slot in the design has a real photograph behind it; if a slug
 * is ever missing we fall back to the home hero rather than render a broken image, and say so
 * in development so the gap gets filled instead of shipping silently.
 */
export function photo(slug: string, alt?: string): Photo {
  const found = PHOTOS[slug];
  if (!found) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[photos] no photograph for slot "${slug}" - run: node tools/fetch-photos.mjs`);
    }
    return { ...PHOTOS["hero-home"], alt: alt ?? "Andalucía II in the Komodo archipelago" };
  }
  // A slot-specific alt always beats Unsplash's generic description.
  return alt ? { ...found, alt } : found;
}

export function hasPhoto(slug: string): boolean {
  return Boolean(PHOTOS[slug]);
}

/**
 * Credits, split by source. Photographs of the vessel itself are the operator's own; everything
 * else is a stock stand-in from Unsplash. The credits page states both separately, because
 * calling the whole set "from Unsplash" stopped being true once the real vessel photographs
 * went in.
 */
export function allCredits(): Array<{ name: string; url: string; count: number }> {
  const by = new Map<string, { name: string; url: string; count: number }>();
  for (const p of Object.values(PHOTOS)) {
    if (p.credit.vessel) continue;
    const key = p.credit.url;
    const hit = by.get(key);
    if (hit) hit.count += 1;
    else by.set(key, { name: p.credit.name, url: p.credit.url, count: 1 });
  }
  return [...by.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function vesselPhotoCount(): number {
  return Object.values(PHOTOS).filter((p) => p.credit.vessel).length;
}
export function stockPhotoCount(): number {
  return Object.values(PHOTOS).filter((p) => !p.credit.vessel).length;
}

export const PHOTO_COUNT = Object.keys(PHOTOS).length;
