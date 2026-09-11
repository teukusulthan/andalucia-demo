import Image from "next/image";
import { photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Every image on the site goes through here. Photographs are local files under /public/photos,
 * so next/image optimises them at build time and each one carries an inline blur placeholder,
 * which is what makes them fade in rather than pop.
 */
export function Photo({
  slug,
  alt,
  className,
  sizes = "100vw",
  priority = false,
  fill = true,
  width,
  height,
}: {
  slug: string;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}) {
  const p = photo(slug, alt);

  if (!fill) {
    return (
      <Image
        src={p.src}
        alt={p.alt}
        width={width ?? p.width}
        height={height ?? p.height}
        sizes={sizes}
        placeholder="blur"
        blurDataURL={p.blurDataURL}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image
      src={p.src}
      alt={p.alt}
      fill
      sizes={sizes}
      placeholder="blur"
      blurDataURL={p.blurDataURL}
      priority={priority}
      // fetchPriority follows priority; leaving it implicit keeps one source of truth
      className={cn("object-cover", className)}
    />
  );
}
