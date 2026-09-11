import type { ReactNode } from "react";
import { Photo } from "./photo";
import { ParallaxLayer, HeroCopyDrift } from "@/components/motion/parallax";
import { HeroVideo, ScrollCue } from "@/components/motion/hero-video";
import { SplitText } from "@/components/motion/split-text";
import { Reveal } from "@/components/motion/reveal";
import { SharedPhoto } from "@/components/motion/view-transition";
import { cn } from "@/lib/utils";

/**
 * Cinematic opener.
 *
 * Light text always sits on a scrim of --deep rather than straight onto the photograph, so the
 * declared on-deep/deep pair still describes the contrast a reader actually gets (AAA 1.4.6).
 *
 * Two layouts:
 *
 * - `center` stacks eyebrow, headline, tagline and actions on one axis. It suits the short
 *   heroes on inner pages, where the hero is a title card and there is nothing else competing.
 * - `editorial` puts the headline and the supporting column side by side along the foot of the
 *   frame, with a hairline and a meta strip under them. A centred stack of five elements is the
 *   most common hero on the web and reads as a template; moving the headline off the centre line
 *   and giving the photograph the whole upper half is what makes it feel composed instead.
 */
export function Hero({
  slug,
  alt,
  eyebrow,
  title,
  tagline,
  actions,
  short = false,
  video,
  poster,
  cue = false,
  layout = "center",
  meta,
}: {
  slug: string;
  alt?: string;
  eyebrow?: string;
  title: string;
  tagline?: string;
  actions?: ReactNode;
  short?: boolean;
  /** when set, the hero plays footage instead of a still (brief: fullscreen video hero) */
  video?: string;
  poster?: string;
  cue?: boolean;
  layout?: "center" | "editorial";
  /** short facts for the strip along the foot, editorial layout only */
  meta?: string[];
}) {
  const editorial = layout === "editorial";

  return (
    <section
      className={cn(
        "relative isolate flex items-end overflow-hidden bg-deep text-on-deep",
        short ? "min-h-[62svh]" : "min-h-[92svh]",
      )}
    >
      <ParallaxLayer className="absolute inset-0 -z-20">
        {video ? (
          <HeroVideo src={video} poster={poster ?? "/video/hero-ship-poster.jpg"} alt={alt ?? title} />
        ) : (
          // paired with the index card that links here, so the thumbnail grows into this frame
          <SharedPhoto slug={slug}>
            <Photo slug={slug} alt={alt} priority sizes="100vw" />
          </SharedPhoto>
        )}
      </ParallaxLayer>

      {/* Scrim: heavy at the foot where the copy sits, lighter at the top.
          The whole copy block has to sit at or above --scrim (0.88), not just its first few
          pixels — measured against real photography, a stop of 0.72 partway up the copy left the
          tagline at ~5:1, and 17px text needs 7:1 (1.4.6 only relaxes to 4.5:1 for large text,
          which the headline is and the tagline is not). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgb(10_32_54/0.94)_0%,rgb(10_32_54/0.9)_46%,rgb(10_32_54/0.52)_100%)]"
      />

      <HeroCopyDrift
        className={cn(
          "relative mx-auto w-full max-w-[1120px] px-5 pt-24 sm:px-8",
          editorial ? "pb-12" : cue ? "pb-36" : "pb-20",
        )}
      >
        {editorial ? (
          <>
            <div className="grid gap-x-14 gap-y-8 text-left lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-end">
              <div>
                {eyebrow ? (
                  <Reveal
                    as="span"
                    className="mb-5 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-deep"
                  >
                    {eyebrow}
                  </Reveal>
                ) : null}
                <SplitText
                  text={title}
                  as="h1"
                  className="mx-0 max-w-[13ch] text-left font-display text-[clamp(2.7rem,1rem+5.6vw,5.4rem)] font-medium leading-[1.02] tracking-[-0.022em] text-on-deep"
                />
              </div>

              <div className="lg:pb-2">
                {tagline ? (
                  <Reveal delay={0.22}>
                    <p className="mx-0 max-w-[38ch] text-left text-[1.0625rem] leading-relaxed text-on-deep sm:text-lg">
                      {tagline}
                    </p>
                  </Reveal>
                ) : null}
                {actions ? (
                  <Reveal delay={0.32} className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                    {actions}
                  </Reveal>
                ) : null}
              </div>
            </div>

            {/* hairline and meta strip: the scroll cue lives here rather than floating centred,
                so nothing is absolutely positioned over the copy */}
            <Reveal delay={0.42}>
              <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-on-deep/20 pt-5">
                {cue ? <ScrollCue inline /> : <span />}
                {meta?.length ? (
                  <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-deep">
                    {meta.map((m, i) => (
                      <li key={m} className="flex items-center gap-5">
                        {i > 0 ? (
                          <span aria-hidden="true" className="block h-3 w-px bg-on-deep/25" />
                        ) : null}
                        {m}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Reveal>
          </>
        ) : (
          <>
            {eyebrow ? (
              <Reveal
                as="span"
                className="mb-4 block text-[11px] font-medium uppercase tracking-[0.16em] text-muted-deep"
              >
                {eyebrow}
              </Reveal>
            ) : null}

            <SplitText
              text={title}
              as="h1"
              className="max-w-[16ch] text-balance font-display text-[clamp(2.6rem,1.2rem+4.6vw,4.7rem)] font-medium leading-[1.06] tracking-[-0.018em] text-on-deep"
            />

            {tagline ? (
              <Reveal delay={0.22} className="mx-auto mt-5 max-w-[50ch]">
                {/* opaque: knocking cream back to 90% over photography costs contrast for no
                    visible gain, and this size is held to 7:1 */}
                <p className="text-[1.0625rem] leading-relaxed text-on-deep sm:text-lg">{tagline}</p>
              </Reveal>
            ) : null}

            {actions ? (
              <Reveal delay={0.32} className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {actions}
              </Reveal>
            ) : null}
          </>
        )}
      </HeroCopyDrift>

      {cue && !editorial ? <ScrollCue /> : null}
    </section>
  );
}
