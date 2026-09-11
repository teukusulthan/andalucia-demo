import type { Metadata } from "next";
import { SimplePage } from "@/components/site/simple-page";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { allCredits, vesselPhotoCount, stockPhotoCount } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Photography credits",
  description: "Every photographer whose work appears on this site.",
};

export default function CreditsPage() {
  const credits = allCredits();
  const vessel = vesselPhotoCount();
  const stock = stockPhotoCount();
  return (
    <SimplePage
      slug="gallery-aerial"
      title="Photography Credits"
      tagline="The people whose pictures carry this site."
      lede={`${vessel} photographs on this site show Andalucía II itself, its cabins and its decks, and come from the vessel's own published listing. The other ${stock} are stock stand-ins from Unsplash, used under the Unsplash licence, standing in for photography Andalucía has yet to supply. Attribution is not required by that licence; it is here because the work deserves it.`}
    >
      <Reveal>
        <p className="mb-8 max-w-[68ch] border-l-2 border-foreground py-1 pl-5 text-[15px] leading-relaxed text-muted-foreground">
          <strong className="font-medium text-foreground">Before launch: </strong>
          the vessel photographs were taken from a booking agency&rsquo;s listing for Andalucía II.
          Confirm Andalucía owns or is licensed for them, and replace any that belong to the agency
          or to a third-party photographer.
        </p>
      </Reveal>
      <Reveal>
        <h2 className="mb-5 text-[1.05rem] font-semibold tracking-[-0.012em]">
          Stock photography, from Unsplash
        </h2>
      </Reveal>
      <RevealGroup as="ul" className="grid gap-x-10 sm:grid-cols-2">
        {credits.map((c) => (
          <RevealItem key={c.url} as="li" className="border-b border-border py-3.5">
            <a
              href={c.url}
              rel="noopener"
              className="inline-flex min-h-11 items-center text-brand underline underline-offset-4"
            >
              {c.name}
            </a>
            <span className="ml-2 text-[13px] text-muted-foreground">
              {c.count} {c.count === 1 ? "photograph" : "photographs"}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </SimplePage>
  );
}
