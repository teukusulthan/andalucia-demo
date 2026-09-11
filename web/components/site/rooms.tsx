import { PhotoStrip } from "./sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ROOMS, SPECS, decode } from "@/lib/content";
import { hasPhoto, photo } from "@/lib/photos";

/**
 * Room showcase.
 *
 * `level` keeps heading ranks contiguous: h3 when the showcase sits under a page's "Cabin
 * collection" h2, h2 when it is the page's own first section (1.3.1).
 *
 * Names are set in large serif capitals and each cabin carries three distinct photographs in a
 * left-right slider, both as the brief specifies.
 */
/* The brief asks for 2-3 frames per cabin. The operator publishes three of most cabins and two
   of the sharing cabin, so this lists only the frames that actually exist rather than repeating
   one to pad the slider to a fixed three. */
function roomFrames(key: string): [string, string][] {
  return [`room-${key}`, `room-${key}-2`, `room-${key}-3`]
    .filter(hasPhoto)
    // caption from the photograph itself: a positional caption ("frame 3 is the bathroom")
    // mislabels the VIP balcony and the Ocean View balcony, which are not bathrooms
    .map((slug) => [slug, photo(slug).alt] as [string, string]);
}

export function RoomShowcase({ level = 3 }: { level?: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div>
      {ROOMS.map((room, i) => (
        <section
          key={room.key}
          className={i === 0 ? "pb-16 pt-6" : "border-t border-border py-16"}
        >
          <Reveal>
            <Heading className="mx-auto max-w-none text-center font-display text-[clamp(1.6rem,1.1rem+1.8vw,2.5rem)] font-normal uppercase tracking-[0.06em]">
              {decode(room.name)}
            </Heading>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mx-auto mb-8 mt-4 max-w-[58ch] text-center text-base leading-relaxed text-muted-foreground">
              {decode(room.desc)}
            </p>
          </Reveal>

          <PhotoStrip
            items={roomFrames(room.key)}
            label={`${decode(room.name)} photographs`}
          />

          <RevealGroup as="dl" className="mt-6 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["Units", String(room.units)],
                ["Location", room.location],
                ["Occupancy", room.occupancy],
                ["Amenities", room.amenities],
              ] as [string, string][]
            ).map(([k, v]) => (
              <RevealItem key={k} className="bg-background p-5">
                <dt className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {k}
                </dt>
                <dd className="m-0 text-base">{decode(v)}</dd>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      ))}
    </div>
  );
}

export function SpecTable() {
  return (
    <Reveal>
      <div className="mx-auto max-w-[820px] overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <caption className="pb-8 text-center font-display text-[1.7rem] font-normal text-foreground">
            Andalucía II, specification
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="border-b border-border py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
              >
                Category
              </th>
              <th
                scope="col"
                className="border-b border-border py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
              >
                Specification
              </th>
            </tr>
          </thead>
          <tbody>
            {SPECS.map(([label, value, unconfirmed]) => (
              <tr key={label}>
                <th
                  scope="row"
                  className="w-[44%] border-b border-border py-3.5 pr-6 align-top font-normal text-muted-foreground"
                >
                  {decode(label)}
                </th>
                <td className="border-b border-border py-3.5 align-top">
                  {value === null ? (
                    <span className="italic text-muted-foreground">Awaiting data</span>
                  ) : (
                    <>
                      {decode(value)}
                      {unconfirmed ? (
                        <span className="italic text-muted-foreground"> (awaiting confirmation)</span>
                      ) : null}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}
