import Link from "next/link";
import { Hero } from "./hero";
import {
  Band,
  Inner,
  H2,
  Lede,
  Prose,
  SectionOpener,
  Chips,
  FactStrip,
  CtaBand,
  Crumbs,
} from "./sections";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { SiteCards } from "./site-cards";
import { TrailChart } from "./trail-chart";
import { Gallery } from "./gallery";
import { Stars } from "./stars";
import { decode, type Article, type Section } from "@/lib/content";

/**
 * One template behind every experience blog and every destination page. A new article is a row
 * in content.generated.json, not a new route.
 */
export function ArticlePage({ article, slug }: { article: Article; slug: string }) {
  const a = article;
  return (
    <>
      <Hero
        slug={slug}
        alt={`${decode(a.h1)}, Komodo archipelago`}
        eyebrow={a.eyebrow ? decode(a.eyebrow) : undefined}
        title={decode(a.h1)}
        tagline={decode(a.tagline)}
        short
      />

      <Crumbs
        trail={[
          { href: "/", label: "Home" },
          { href: a.crumb[1], label: a.crumb[0] },
          { label: decode(a.title) },
        ]}
      />

      <Band tone="shell">
        <Inner narrow>
          {a.chips ? <Chips items={a.chips.map(decode)} label="Highlights" /> : null}
          {a.lede.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <Lede className={i > 0 ? "mt-6" : undefined}>{decode(p)}</Lede>
            </Reveal>
          ))}
        </Inner>
      </Band>

      <Band>
        <Inner narrow>
          {a.sections.map((s, i) => (
            <SectionBlock key={i} section={s} first={i === 0} index={i + 1} />
          ))}
          {a.facts ? <FactStrip pairs={a.facts.map(([k, v]) => [decode(k), decode(v)])} /> : null}
          {a.close ? (
            <Reveal>
              <Lede className="mt-10">{decode(a.close)}</Lede>
            </Reveal>
          ) : null}
        </Inner>
      </Band>

      {a.quotes ? (
        <Band tone="shell">
          <Inner>
            <Reveal>
              <H2 className="mb-8">{decode(a.quotes.label)}</H2>
            </Reveal>
            <RevealGroup as="ul" className="grid gap-8 sm:grid-cols-3">
              {a.quotes.items.map(([body, who, where]) => (
                <RevealItem key={who} as="li">
                  <figure className="m-0 flex h-full flex-col gap-4 border-t border-border pt-5 text-left">
                    <p className="m-0">
                      <Stars n={5} />
                    </p>
                    <blockquote className="m-0 text-[1.0625rem] leading-[1.55] tracking-[-0.01em]">
                      <p className="m-0 max-w-none">{decode(body)}</p>
                    </blockquote>
                    <figcaption className="mt-auto text-sm text-muted-foreground">
                      <span className="block font-medium text-foreground">{decode(who)}</span>
                      {where ? decode(where) : null}
                    </figcaption>
                  </figure>
                </RevealItem>
              ))}
            </RevealGroup>
            {a.quotes.note ? (
              <Reveal>
                <p className="mx-auto mt-8 max-w-[68ch] border-l-2 border-foreground py-1 pl-5 text-left text-[15px] leading-relaxed text-muted-foreground">
                  <strong className="font-medium text-foreground">Note: </strong>
                  {decode(a.quotes.note)}
                </p>
              </Reveal>
            ) : null}
          </Inner>
        </Band>
      ) : null}

      {a.gallery && a.gallery.items.length ? (
        <Band tone="deep">
          <Inner>
            <Reveal>
              <H2 className="mb-8 text-on-deep">{decode(a.gallery.label)}</H2>
            </Reveal>
            <Gallery
              items={a.gallery.items.map(([s, c]) => [s, decode(c)] as [string, string])}
              label={decode(a.gallery.label)}
              layout={a.gallery.layout}
            />
          </Inner>
        </Band>
      ) : null}

      <CtaBand
        line={decode(a.cta.line)}
        label={decode(a.cta.label)}
        href={mapHref(a.cta.href)}
        slug={`${slug}-cta`}
      />
    </>
  );
}

function SectionBlock({
  section: s,
  first,
  index,
}: {
  section: Section;
  first: boolean;
  index: number;
}) {
  return (
    <div className={first ? "" : "mt-20"}>
      {/* Numbered and left-aligned, on the same edge as the prose beneath it. The page's centred
          moments are the hero, the opening statement and the call to action; the body of an
          article is where a reader settles in, and it should read as a column, not a poster. */}
      <Reveal>
        <Prose className="mb-0">
          <SectionOpener index={index}>{decode(s.h)}</SectionOpener>
        </Prose>
      </Reveal>

      {(s.p ?? []).length ? (
        <Prose>
          {(s.p ?? []).map((p, i) => (
            <Reveal key={i} delay={0.05 + i * 0.06}>
              <p className="mb-5 text-[1.0625rem] leading-[1.65] text-foreground/85">{decode(p)}</p>
            </Reveal>
          ))}
        </Prose>
      ) : null}

      {s.cards ? (
        <RevealGroup className="mt-7 grid gap-7 sm:grid-cols-2">
          {s.cards.map(([t, d]) => (
            <RevealItem key={t} className="border-t border-border pt-5 text-left">
              <h3 className="mb-2 text-[1.05rem] font-semibold tracking-[-0.012em]">{decode(t)}</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{decode(d)}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      ) : null}

      {s.list ? (
        <RevealGroup as="dl" className="mt-7">
          {s.list.map(([t, d]) => (
            <RevealItem key={t} className="border-t border-border py-4 text-left">
              <dt className="mb-1 font-medium">{decode(t)}</dt>
              <dd className="max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
                {decode(d)}
              </dd>
            </RevealItem>
          ))}
        </RevealGroup>
      ) : null}

      {s.sites ? <SiteCards sites={s.sites} label={decode(s.h)} /> : null}

      {s.tracks ? <TrailChart tracks={s.tracks} note={s.trackNote} /> : null}

      {s.links ? (
        <RevealGroup as="ul" className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-1">
          {s.links.map(([slug, label]) => (
            <RevealItem key={slug} as="li">
              <Link
                href={`/destination/${slug}`}
                className="inline-flex min-h-11 items-center text-[15px] text-brand underline underline-offset-4"
              >
                {decode(label)}
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      ) : null}

      {s.note ? (
        <Reveal>
          <p className="mx-auto mt-6 max-w-[68ch] border-l-2 border-foreground py-1 pl-5 text-left text-[15px] leading-relaxed text-muted-foreground">
            <strong className="font-medium text-foreground">Good to know: </strong>
            {decode(s.note)}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** The prototype's CTAs pointed at booking-engine routes; map them onto this app. */
function mapHref(href: string): string {
  const map: Record<string, string> = {
    "/trips": "/schedule",
    "/charter": "/enquire",
    "/support": "/enquire",
    "/login": "/membership/join",
  };
  return map[href] ?? href;
}
