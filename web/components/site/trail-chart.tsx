import { Footprints, Mountain, Eye } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { decode, type Track } from "@/lib/content";

const LEVEL: Record<string, number> = { Good: 1, Better: 2, Best: 3 };

/**
 * Trail chart for the three Komodo tracks: a schematic route map plus difficulty, terrain and
 * dragon-sighting chance per track, which is what the brief asks for.
 *
 * Sighting chance is three marks rather than a filled progress bar; a bar with a background
 * track reads as dashboard furniture on an editorial page, and implies a precision the park
 * does not publish. Distances and durations are deliberately absent: the ranger sets those on
 * the day, and inventing figures would be inventing data.
 */
export function TrailChart({ tracks, note }: { tracks: Track[]; note?: string }) {
  return (
    <div className="mt-9">
      <Reveal>
        <TrailMap />
      </Reveal>

      <RevealGroup as="dl" className="mt-8 grid gap-px bg-border lg:grid-cols-3">
        {tracks.map((t) => (
          <RevealItem key={t.name} className="bg-background p-6">
            <dt className="mb-3 text-[1.05rem] font-semibold tracking-[-0.015em]">
              {decode(t.name)}
            </dt>
            <dd className="m-0">
              <p className="mb-5 max-w-[42ch] text-[15px] leading-relaxed text-muted-foreground">
                {decode(t.blurb)}
              </p>
              <ul className="space-y-2.5">
                <Row Icon={Footprints} label="Difficulty" value={t.difficulty} />
                <Row Icon={Mountain} label="Terrain" value={t.terrain} />
                <li className="flex items-center gap-2.5 text-[14px]">
                  <Eye aria-hidden="true" strokeWidth={1.4} className="size-4 shrink-0 text-brand" />
                  <span className="text-muted-foreground">Sighting chance</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="flex gap-1" aria-hidden="true">
                      {[1, 2, 3].map((n) => (
                        <span
                          key={n}
                          className={`block size-1.5 rounded-full ${
                            n <= (LEVEL[t.sighting] ?? 0) ? "bg-brand" : "bg-border"
                          }`}
                        />
                      ))}
                    </span>
                    <span className="font-medium">{t.sighting}</span>
                  </span>
                </li>
              </ul>
            </dd>
          </RevealItem>
        ))}
      </RevealGroup>

      {note ? (
        <Reveal>
          <p className="mt-6 max-w-[68ch] border-l-2 border-foreground py-1 pl-5 text-[15px] leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">On distances and times: </strong>
            {decode(note)}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

function Row({
  Icon,
  label,
  value,
}: {
  Icon: typeof Footprints;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-2.5 text-[14px]">
      <Icon aria-hidden="true" strokeWidth={1.4} className="size-4 shrink-0 text-brand" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{decode(value)}</span>
    </li>
  );
}

/**
 * Schematic of the three routes out of the ranger post. A diagram, drawn here rather than
 * pulled from an icon set, and described for screen readers by the chart beneath it.
 */
function TrailMap() {
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 900 340"
        className="h-auto w-full bg-secondary"
        role="img"
        aria-label="Schematic of the three trekking routes leaving the ranger post: a short loop near the coast, a medium route into the savannah, and a long route over the ridge."
      >
        {/* island mass */}
        <path
          d="M40,250 C90,180 150,150 220,160 C270,105 350,70 430,92 C510,60 610,72 665,120
             C745,120 820,160 850,215 C870,250 845,285 800,292 L110,292 C55,288 22,278 40,250 Z"
          fill="#ffffff"
          stroke="#e6e6e4"
          strokeWidth="2"
        />
        {/* long route: over the ridge */}
        <path d="M150,268 C250,250 300,150 430,128 C560,106 650,150 735,170"
              fill="none" stroke="#1d3e8f" strokeWidth="2.5" strokeDasharray="1 7"
              strokeLinecap="round" opacity="0.9"/>
        {/* medium route: into the savannah */}
        <path d="M150,268 C240,258 300,205 400,196 C480,189 540,205 585,222"
              fill="none" stroke="#1d3e8f" strokeWidth="2.5" strokeDasharray="9 7"
              strokeLinecap="round" opacity="0.75"/>
        {/* short loop: near the post */}
        <path d="M150,268 C210,264 250,244 288,250 C318,255 322,272 296,278 C250,288 195,284 150,268 Z"
              fill="none" stroke="#1d3e8f" strokeWidth="2.5" strokeLinecap="round"/>

        {/* ranger post */}
        <circle cx="150" cy="268" r="7" fill="#111113"/>
        <text x="150" y="312" textAnchor="middle"
              style={{ font: "500 13px ui-sans-serif, system-ui, sans-serif", fill: "#111113" }}>
          Ranger post
        </text>

        {/* legend */}
        <g style={{ font: "400 13px ui-sans-serif, system-ui, sans-serif", fill: "#4e4e55" }}>
          <line x1="600" y1="40" x2="644" y2="40" stroke="#1d3e8f" strokeWidth="2.5" strokeLinecap="round"/>
          <text x="656" y="45">Short</text>
          <line x1="600" y1="66" x2="644" y2="66" stroke="#1d3e8f" strokeWidth="2.5"
                strokeDasharray="9 7" strokeLinecap="round" opacity="0.75"/>
          <text x="656" y="71">Medium</text>
          <line x1="600" y1="92" x2="644" y2="92" stroke="#1d3e8f" strokeWidth="2.5"
                strokeDasharray="1 7" strokeLinecap="round" opacity="0.9"/>
          <text x="656" y="97">Long</text>
        </g>
      </svg>
      <figcaption className="pt-3 text-[13px] text-muted-foreground">
        Indicative routes only. The ranger chooses the line on the day.
      </figcaption>
    </figure>
  );
}
