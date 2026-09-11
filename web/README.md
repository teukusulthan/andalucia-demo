# Andalucía, marketing site

The public-facing site, migrated from the zero-dependency Node prototype in the parent directory
to Next.js. The reservation engine, support chat and admin console still run there, on `:3000`,
and this app links across to them.

```bash
npm run dev          # http://localhost:3000 (use -p 3001 while the old app is running)
npm run build        # 55 pages prerendered; 5 routes session-aware
npm run test:a11y    # 25 guards: WCAG 2.2 AAA, plus the PR07 agent-rate check
npm run test:contrast # 10 contrast checks measured on rendered pixels (needs headless Chrome)
npm run photos       # re-source photography from Unsplash
npm run content      # re-export editorial copy from the prototype
```

## Stack

| | |
|---|---|
| Framework | Next.js 16, App Router, Turbopack, React 19.2 |
| Styling | Tailwind v4, shadcn/ui components |
| Motion | `motion/react` |
| Icons | lucide-react, plus two brand glyphs from Simple Icons |
| Content | JSON exported from the prototype, typed in `lib/content.ts` |
| Photography | 191 photographs under `public/photos`: 21 of Andalucía II, the rest Unsplash stand-ins |

Every route is a Server Component. Motion lives only in client leaves under `components/motion`
and in the header, so the interactive surface stays small.

## Layout and tone

**One container, one left edge.** `CONTAINER` in `components/site/sections.tsx` is the single
source of the page measure and gutter, and everything page-level goes through it — hero,
breadcrumb, bands, footer, the deck morph. It is worth saying why: before this the hero, the
breadcrumb, wide sections, narrow sections and the footer each carried their own width and
padding, so one page had five different left edges, spread across 168px. `Band` now owns only
vertical rhythm and `Inner` owns the horizontal measure; `narrow` makes the reading column
narrower without moving where it starts.

**Tone follows the brief**, which names its own colours: "deep sea blue gradient", "soft
navy-blue overlay", "dark navy or deep ocean blue". Hence `--deep: #0a2036`, `--band: #12314f`,
`--brand: #1d4e89` over a warm off-white ground, every value checked at 7:1 before it went in.

Playfair Display carries the headline voice — hero `h1`, section `h2`, cabin titles, the
specification caption — against Geist for anything read at length. Serif display over sans body
is the whole tonal move; the 1.05–1.2rem card and sidebar headings deliberately stay on the sans
face, where Playfair reads fussy rather than editorial.

Everything the brief names about the look is in place and can be checked against it: deep sea
blue (`--deep`), the navy-blue overlay (`.scrim-deep`), the deep-blue gradient on every hero,
Playfair Display, the rounded navy enquiry button with its serif invitation line, gold rating
stars (`--gold` on light grounds, `--gold-deep` on dark, two values because one cannot clear 7:1
against both), and serif capitals on the cabin names. The brief gives these as descriptions
rather than hex values or a type scale, so the specific numbers are ours.

The breadcrumb is a small letterspaced trail with chevron separators — muted steps, the current
page in full foreground, underline on hover and focus only. Blue underlined links separated by a
literal `/` read as an unstyled document, and an underline on a link nobody is being asked to
click is noise.

**A centred spine, with the detail left-aligned.** `main` and `footer` set `text-align: center`
once, because it inherits; nothing else needs a class for the common case. What is centred is the
composition — hero, breadcrumb, eyebrow, `H2`, `Lede`, calls to action, the trip-type panels. What
is *not* is anything read at length or scanned as a pair:

| Left-aligned, inside a centred block | Why |
|---|---|
| `Prose` — article bodies, long copy | a centred paragraph restarts the eye at a different x on every line |
| Card interiors (destination, dispatch, site, testimonial) | the grid is already symmetric; the card is where the reading happens |
| `DefRow`, spec tables, `s.list` | a term and its definition have to share an edge to read as a pair |
| Form labels and fields | a centred label over a full-width input reads as unrelated to it |

Two rules make the centred case work at all, and both are in `globals.css`:

- `p`, `h1`–`h4` get `margin-inline: auto`. A `max-width` only balances if the box itself is
  centred; without it a 74ch paragraph in a 1120px band sits hard left, and the centred text
  inside that box then reads as off-centre. This is what put the vessel hero's eyebrow 255px
  left of its own headline.
- There is deliberately **no** `text-align` on `p`. The initial value is already `start`, so
  declaring `left` changed nothing on its own — but a declaration on the element beats a value
  inherited from an ancestor, which left every centred block with a centred heading above ragged
  left-aligned copy. AAA 1.4.8 asks that text is not justified, which is a separate thing.

**Alignment alternates by role, not at random.** A page that centres every section heading reads
as one long column. The rhythm now is: centred hero, editorial split, centred feature, split,
centred, split, centred call to action. `SplitHead` puts a heading on the left with a standfirst
or control beside it; `EditorialSplit` gives the heading its own column with the prose alongside;
`SectionOpener` numbers the body sections of an article; `DefHead` puts a heading on the same
edge and measure as the definition rows under it.

The home hero uses `layout="editorial"`: headline and supporting column side by side along the
foot, a hairline, then the scroll cue and a meta strip. Inner pages keep `layout="center"`, where
the hero is a title card with nothing competing. One solid button plus an `ArrowLink` rather than
two boxed buttons, which is what made the old hero read like a form.

`tests/` has no guard for this; `/tmp`-style probes were used to find blocks narrower than their
parent but not centred in it, and the remaining offsets are all intentional (carousel arrows,
breadcrumb steps, the two halves of an unequal button pair).

## What was migrated, and what was not

**Migrated:** all 30 marketing pages. Home, the three vessels, cabin collection, seven experience
articles, fourteen destination articles, the itinerary, membership, About / Team / Legal, the
gallery, and every footer destination.

**Not migrated, still on the Node app:** charter search, departures, quoting, holds, checkout,
Midtrans payments, the Sheets sync, the support chat and the twelve admin screens. `/schedule`
shows the real published departures and prices read from that engine, then links across to it for
live availability and checkout rather than trying to reserve anything here.

**Accounts are shared, not duplicated.** This app opens the reservation engine's SQLite database
directly (`lib/db.ts`) and writes to the same `users`, `newsletter`, `articles` and `audit`
tables. Password hashing and the session cookie are byte-identical to the prototype's, so a
member who joins at `:3001` can sign in at `:3000` and the same cookie is accepted by both.

Only five routes read the session, so the other 47 stay prerendered: the header and the Dispatch
gate fetch `/api/me` once on mount rather than making the whole shell dynamic.

## Published offers, and the one rule that must not break

§3 of the business requirements asks the public site to "display the pricing unit clearly,
together with inclusions, exclusions, cancellation terms, itinerary flexibility, departure
location, and whether a departure is guaranteed or conditional". All of that is on `/schedule`
and on the vessel pages, and none of it is typed into this repo: `lib/offer.ts` reads it from the
reservation engine's `products`, `rates`, `departures` and `ships` tables. The engine is the
authority on price (PR05), and a second copy here would only guarantee the two disagree.

Prices are always framed as "from". The binding figure is the one the engine recalculates at
checkout against vessel, dates and season (PR03/PR05), and an accepted booking keeps its own
snapshot regardless of later changes (PR08).

Both pages set `revalidate = 300` rather than reading per request. `connection()` was tried first
and does give a per-request read, but without Cache Components it makes the whole route dynamic —
measured, it turned `/schedule` and the flagship vessel page from prerendered into server-rendered.
Five minutes of staleness on a "from" price is a fair trade for keeping them prerendered; staleness
that lasts until the next deploy is not.

**PR07 is the rule that must not break.** Agent net rates are confidential and these pages are
prerendered for anonymous visitors, which is exactly the "shared cache" the requirement names. So
every query in `lib/offer.ts` pins `rate_class = 'retail'` as a literal rather than accepting it
as a parameter — there is no call site that can ask the module for an agent price. `test:a11y`
then checks the result rather than trusting it: it reads every agent amount out of the database
and asserts none appears in the HTML of any crawled route. The guard has been negative-tested by
flipping that constant, which fails the suite with the leaked amounts named.

## Deploying

This repository holds two applications. The Next app is in `web/`, and the repository root is the
zero-dependency reservation engine. A host that builds from the root will not find Next at all —
Vercel reports *"No Next.js version detected"* — so **set the project's Root Directory to `web`**.

The engine's SQLite database is deliberately not committed: it holds member accounts and
bookings. Any deployment of this app on its own therefore has no database beside it, and
`lib/db.ts` is written for that case. It resolves availability once, by opening the file and
checking for a table the seed creates, because `node:sqlite` will happily create an empty file
rather than fail — the first symptom is `no such table`, not `cannot open`, and it used to take
the build down while prerendering `/schedule`.

With no database the marketing site builds and serves in full. What degrades, and how:

| Surface | Without a database |
|---|---|
| `/schedule` departures | "No published departures at the moment", with the enquiry route offered |
| Prices and inclusions | a line saying rates come from the reservation system, linking to `/enquire` |
| Island Dispatch | the sign-in gate, as it shows any signed-out visitor |
| Sign in, sign up, newsletter | fail with a stated reason rather than silently doing nothing |

Reads return nothing; writes throw. That asymmetry is deliberate: a sign-up that quietly
succeeds and stores nothing is worse than one that says it could not save.

To run the full stack, seed the engine first (`npm run seed` in the parent directory) and point
`ANDALUCIA_DB` at it if it is not at `../data/app.db`. On a serverless host the filesystem is
ephemeral, so a SQLite file there will not persist writes between invocations — the engine needs
a host that keeps its disk.

## Accessibility

The prototype's WCAG 2.2 **AAA** contract came across intact. shadcn's stock palette is AA only
(its `--muted-foreground` is 4.6:1 on white), so every token in `app/globals.css` is replaced
rather than themed.

`npm run test:a11y` reads the hex values out of the stylesheet that actually ships, so the CSS and
the contract cannot drift apart, then asserts against the rendered HTML of all 47 routes:

- 31 foreground/background pairs at 7:1, 3 non-text pairs at 3:1
- one `h1` per page, no skipped heading ranks, labelled landmarks, skip link
- every control labelled, every required field marked, every link and button named
- tables captioned with column scopes, no auto-refresh, nothing justified
- reduced-motion and increased-contrast honoured; `scroll-padding-top` so the sticky header
  never lands on the element that just took focus

Cinematic sections put light text over photography. Rather than hope a photograph is dark enough,
that text always sits on a scrim of `--deep` at `--scrim: 0.88`; at ≥0.85 the composite luminance
is within a rounding error of `--deep`, so the declared `on-deep`/`deep` pair still describes what
a reader sees. The test asserts the floor.

That only holds where the scrim is the tokenised one. A token suite cannot see a hand-written
`bg-deep/45` or a gradient stop, and it cannot see that `text-on-deep/85` is not `on-deep` — which
is how the hero taglines came to render at about 5:1 while every declared pair still passed. So
`npm run test:contrast` measures the composite instead: it renders each page in headless Chrome,
paints every glyph transparent so the crop is the plate and nothing else, composites the element's
own computed colour (alpha included) over each plate pixel, and takes the worst ratio. Headlines
are held to 4.5:1 and body text to 7:1, per 1.4.6's large-text allowance, with each case declaring
which floor applies. All ten surfaces currently clear their floor, the tightest at 7.04:1.

## Motion

Motion is an enhancement over a visible default, never the thing that makes content appear. Every
animated component checks `useReducedMotion` and renders its final state when motion is not wanted.

- **Hero**: photograph parallax and copy drift, driven by `useScroll` → `useTransform` motion
  values, so nothing re-renders per frame and there is no scroll listener anywhere.
- **Headlines**: word-by-word rise from behind a mask. The full string stays in the accessibility
  tree as one heading.
- **Sections**: `whileInView` reveals with stagger, backed by IntersectionObserver.
- **Header**: hides going down, returns coming up, and un-hides the instant anything inside takes
  focus. Scroll state is stored as derived booleans, so identical values bail out of re-render.
- **Metrics**: count up once in view, written straight to the DOM node rather than through state.
- **Images**: every photograph carries an inline blur placeholder and fades in.
- **Loading**: shimmer skeletons shaped like the content they stand in for, so nothing jumps when
  the real thing arrives, plus an in-button spinner on every form.

Only `transform`, `opacity` and `background-position` are animated.

### Where the loading boundaries sit

Almost every route is prerendered, so only the four that read the session or the articles table
can suspend at all. Three of them put their `<Suspense>` around the fetch rather than taking a
route-level `loading.tsx`, because a whole-page fallback has two costs that are easy to miss: it
greys out a hero that was never waiting on anything, and — since the shell streams first — it puts
the footer's `h2`s ahead of the page's `h1` in the HTML source, which the heading-rank guard in
`test:a11y` catches. A root `app/loading.tsx` does this to all 48 static routes at once.

`/account` is the exception and keeps a route-level fallback: its `h1` is the member's own name,
so there is no static opener to hold, and it is `noindex` behind a sign-in.

## Photography

`tools/fetch-photos.mjs` sources one photograph per slot from Unsplash and writes
`lib/photos.generated.json` with dimensions, an inline blur placeholder and the photographer's
credit. Two things it gets right that are easy to miss:

- **No browser `user-agent` header.** Sending one gets the search endpoint to 307-redirect to a
  version that needs a paid API key.
- **Unsplash+ is filtered out.** Premium results download with a tiled watermark across the frame.

`tools/fetch-vessel-photos.mjs` then overwrites every slot that should show the vessel itself
with real photographs of Andalucía II, and marks them `vessel: true` so the credits page can
tell the two sources apart. Unsplash photographers are listed at `/credits`; the vessel
photographs carry a rights warning on the same page.

## Brief coverage

Everything in *Andalucía Website Brief* that can be built without material we do not have:

| Brief feature | Where |
|---|---|
| Fullscreen autoplay video hero, muted and looped | `components/motion/hero-video.tsx` |
| Selling point Plan A, two clickable panels | home page, `data-panel="trip"` |
| Animated scroll indicator at the hero foot | `ScrollCue`, same file |
| Testimonial carousel, gold stars, full review text | `components/site/testimonial-card.tsx` |
| News preview blurred behind a sign-in prompt | home page, Island Dispatch section |

| Room showcase, serif capitals, 3 distinct photos per cabin | `components/site/rooms.tsx` |
| Aerial photograph dissolving into the deck plan on scroll | `components/motion/deck-morph.tsx`, `public/deck-plan.svg` |
| Gallery lightbox with hover/focus captions | `lightbox.tsx`, `gallery-grid.tsx` |
| Icon grids on Legal, Special Offer, and the trail charts | lucide marks, keyed off the fact label |
| Rounded navy enquiry CTA, serif invitation line | `CtaBand` in `sections.tsx` |
| Sign-up creates a real account and signs the member in | `lib/auth.ts`, `app/membership/actions.ts` |
| Sign in, sign out, member account page | `/signin`, `/account` |
| Newsletter writes to the shared subscriber list | `subscribeEmail` in `lib/auth.ts` |
| Enquiries recorded | `lib/store.ts` |
| Snorkelling and diving sites as photo cards | `components/site/site-cards.tsx` |
| Komodo trail chart: route map, difficulty, sighting chance | `components/site/trail-chart.tsx` |
| Guest quotes on the private dinner page | article template, `quotes` in the content |
| Vessel opener: photograph dims, name fades in centred | `components/motion/vessel-hero.tsx` |
| Centred GALLERY headline, tagline and "View gallery" | vessel page |
| Per-destination gallery layouts (masonry, mosaic, rail, wide) | `components/site/gallery.tsx` |

**Photography.** Twenty photographs show Andalucía II itself: exteriors, the open deck, both
dining areas, the galley, and all four cabin types including bathrooms and balconies. They come
from the vessel's published listing on komodoluxury.com. **Rights are not verified**: confirm
Andalucía owns or is licensed for them before launch, and replace any that belong to the agency
or a third-party photographer. `/credits` states this on the page.

The remaining 66 photographs are Unsplash stand-ins for destinations and landscapes, which are
generic by nature.

Deliberate deviations, flagged rather than silent: the hero footage is a stock sailing vessel
rather than Andalucía's own drone reel, the brief's two *round* selling-point boxes are tall
panels instead (a circle crops a photograph to its least interesting part and squeezes the copy
into the middle; the idea of two photographic choices side by side is unchanged), the deck plan is a schematic drawn to the published
specification rather than the yard's drawing, and the trail chart carries no distances or
walking times because the park does not publish them and the ranger sets them on the day.

## Still owed

- Dark mode. The `.dark` block is kept AAA-correct but nothing toggles it.
- Real contact details, FAQ, T&C, awards citations, press clippings, six vessel specifications.
- FR / CN / ID translations. The switcher exists and says plainly that they are not published.
- The CRM hand-off the brief names (Mailchimp, Brevo, MemberStack). Members and subscribers
  currently land in the booking engine's own tables, which is the right interim home.
- Auth hardening. The session scheme is the prototype's: cookies do not expire, there is no CSRF
  token beyond `SameSite=Lax`, no rate limit on sign-in and no password reset. All of that is
  needed before real accounts exist.
- Enquiries are recorded to the audit log but not routed to the crew inbox.
- Plan B for the selling point (Family / Group / Couple / Solo) is not built; Plan A was chosen.
- Crew portraits are still stock: the operator's listing publishes no photographs of the crew.
- A true top-down aerial of the vessel. The deck morph opens on a stern view instead.
