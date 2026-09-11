import { PhotoStrip } from "./sections";
import { GalleryGrid } from "./gallery-grid";
import { photo } from "@/lib/photos";
import type { GalleryLayout } from "@/lib/content";

/**
 * Destination galleries.
 *
 * The brief specifies a different layout per destination: masonry for Padar, a horizontal
 * scroll for Kalong, a mosaic with negative space for Taka Makassar, full-width imagery for
 * Manta Point, and airy grids elsewhere. This dispatches on the layout recorded with the
 * content, so each page gets the treatment it was written for.
 *
 * Every variant carries the same behaviour underneath: hover and focus captions, and a
 * fullscreen lightbox.
 */
export function Gallery({
  items,
  label,
  layout = "grid",
}: {
  items: [string, string][];
  label: string;
  layout?: GalleryLayout;
}) {
  if (layout === "rail") return <PhotoStrip items={items} label={label} />;

  const photos = items.map(([slug, caption]) => {
    const p = photo(slug, caption);
    return {
      src: p.src,
      width: p.width,
      height: p.height,
      blurDataURL: p.blurDataURL,
      alt: p.alt,
      caption,
    };
  });

  return <GalleryGrid photos={photos} label={label} variant={layout} />;
}
