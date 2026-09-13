# Phinisi Booking Platform - working prototype

Implements the reservation, pricing, payment and synchronisation rules from
*Phinisi Booking Platform - Business Requirements v1.0*. Zero dependencies: Node 22+
(`node:sqlite`, `node:http`, `node:crypto`).

> **Deploying the website?** This repository holds two applications. The Next.js site lives in
> `web/`; the repository root is the reservation engine and has no `next` dependency at all. A
> host that builds from the root will not find it — Vercel reports *"No Next.js version
> detected"*, and if it deploys anyway every request, including static files like
> `/photos/hero.jpg` and `/robots.txt`, returns `FUNCTION_INVOCATION_FAILED`. **Set the service's
> Root Directory to `web`.**
>
> The same trap on Railway is quieter and easier to misread: the root `npm start` runs the
> *engine*, which deploys and serves perfectly well — but the engine keeps no photography. It
> looks for real files in its own `public/`, finds none, and draws a labelled SVG stand-in for
> every slot (`media.js`). The 191 photographs live in `web/public/photos`, so the symptom is a
> working site with placeholder graphics rather than an error. Point the service at `web`.
>
> See `web/README.md` for the rest, including how the site behaves when the engine's database is
> not beside it.

The public site is built to the *Andalucía Website Brief*: a cinematic, image-led marketing site
in front of the reservation engine, sharing one design system and one accessibility standard.

```bash
npm run seed     # build data/app.db with the demo fleet
npm start        # http://localhost:3000
npm test         # 149 checks: section 13 acceptance, admin rules, permissions, chat,
                 # every navigation destination, membership, WCAG 2.2 AAA
```

## Demo accounts

| Login | Password | Shows |
|---|---|---|
| `agent@balisea.test` | `agent` | approved agent - net B2B prices (U06) |
| `agent@jktvoyages.test` | `agent` | suspended agent - falls back to retail (BR01) |
| `ops@andalusia.test` | `ops` | operations console, no refund authority |
| `finance@andalusia.test` | `finance` | refund approval and execution |
| `admin@andalusia.test` | `admin` | everything |

## Admin panel

Sign in as any staff account and choose **Admin**. The menu shows only what that role may use; every
route checks the same permission map on the server (`PERMS` in `views.js`, BR01).

| Screen | Who | What it manages |
|---|---|---|
| Dashboard | all staff | booking value, cash, balances and refunds as separate figures (OPS10); sync, stop-sales, exceptions |
| Bookings | all staff | search and filter (OPS01); per booking: cancel with fee and reason, refunds, manifest, timeline, linked chats, re-sync |
| Inbox | all staff | support conversations: reply, assign, close and reopen, with live updates |
| Ships | admin, ops | ships and cabins; deactivate or archive lists affected bookings, never cancels them (CAT03, CAT04, CAT07) |
| Products | admin, ops | create, edit, preview, publish, unpublish, archive; eligible ships; material edits bump the terms version (CAT01, CAT05, CAT08) |
| Departures | admin, ops | schedule against the shared calendar; per-cabin inventory; manifest; below-minimum warning (CAT06, OT05-OT07) |
| Rates | admin, finance | retail and agent rates; a tie with an existing rate is refused at save time (PR01, PR03) |
| Agents | admin | register, approve, suspend organisations (BR01, AT06) |
| Users | admin | accounts and roles; re-enter your password to change them; the last admin can't be removed (SEC01) |
| Schedule | admin, ops | the Sheets workbook tabs and schedule requests (U07) |
| Settings | admin | deposit, balance deadline, hold length, stale threshold - validated and audited |
| Audit | admin, finance | searchable log of every change |

A private charter product created here is bookable straight away. Previously the charter search
was hard-wired to one product ID, so an admin-created product would never have appeared.

## The public site

Sticky header that hides going down and returns coming up, four hover/focus mega menus, a language
selector, and a marketing footer - all rendered by `page()` in `views.js`, so the booking engine and
the brochure are the same document.

| Area | Routes | Notes |
|---|---|---|
| Home | `/` | Cinematic hero, welcome, testimonial rail, gated news, two-door selling point, why us |
| Sailing | `/sailing`, `/sailing/andalucia-{1,2,3}`, `/sailing/cabin-collection` | Vessel pages with room showcase, spec table and gallery. I is retired, III is coming soon |
| Experiences | `/experience/<slug>` × 7 | Trekking, sunrise, sunset, snorkelling, diving, paddling, private dinner |
| Destinations | `/destinations`, `/destination/<slug>` × 14 | Every island, reef and dive site in the brief |
| Open trip | `/open-trip/itinerary` | The three-day route, cross-linked to each destination |
| Membership | `/membership`, `/newsletter`, `/special-offer`, `/benefits`, `/join`, `/account` | The Voyage Club |
| About | `/about`, `/about/team`, `/about/legal` | Company, crew, certification |
| Support | `/gallery`, `/faq`, `/terms`, `/awards`, `/press`, `/travel-resources` | Footer destinations |

Experiences and destinations are rows in `content.js`, rendered by one template - a new blog is data,
not a route. `npm test` pulls every `href` out of the rendered mega menu and footer and asserts each
one returns 200, so a menu entry cannot outlive its page.

**Members.** The Voyage Club sign-up writes an ordinary `users` row with `role='member'`, which means
`can()` refuses it every admin permission with no special case - asserted in the suite. Signing up
also adds the address to the newsletter, because it is the same intent. The Island Dispatch is
readable in full by members; signed-out visitors get blurred cards behind a lock panel, and the
blurred copy is `aria-hidden` so a screen reader is not read teasers it cannot open.

**Media.** There are no photographs yet. `media.js` resolves every image slot to a real file under
`public/` if one exists, and otherwise generates a deterministic SVG at the exact slot size, labelled
with the photograph it is waiting for. Dropping `public/hero-home.jpg` in replaces the hero with no
code change and no layout shift. Video works the same way via `public/hero-home.mp4`.

**Languages.** The selector offers EN, FR, CN and ID. Only English exists; the other three route to a
page that says so and offers the chat instead of silently serving English. Asserted in the suite.

## Support chat

**Chat with us** is in the main navigation, and each booking page links to it with the reference
filled in. Visitors don't need an account: the conversation is tied to an HttpOnly cookie, so a
visitor only ever sees their own thread. Staff answer from **Admin → Inbox**.

- Live updates use Server-Sent Events, built into Node and browsers - no dependency.
- It works without JavaScript: every action is a normal form post, plus a "Check for new messages" link.
- Accessible: the thread is a `role="log"` live region, errors are announced and focus returns to the
  message box. A toggle turns live updates off (AAA 2.2.4 Interruptions).
- It isn't a floating widget, because a fixed launcher can cover the element that has focus (AAA 2.4.12).
- Abuse limits: 2,000 characters per message, 10 messages a minute, 5 new conversations per email per hour.
  All text is escaped.

## Five-minute tour

1. **/charter** - ask for 1 night: rejected in the form *and* in `core.quotePrivate` (AT02).
   Ask for dates over `Andalusia` 26-29 Sep: unavailable, because a published open departure
   already claims that ship interval (AT03).
2. **/departure/DEP-1001** - take a whole shared cabin; its four berths disappear from the
   per-berth column. One pool, two sale modes (AT05).
3. Check out → the hold is written to the sheet and acknowledged *before* the payment page
   opens (SYNC03). On the mock Snap page, "Replay the last notification twice" proves the
   webhook posts exactly once (AT11).
4. **/admin** - set *Sheets connection* to `fail`, then pay for another booking: the reservation
   is kept, the queue retries, and new sales on that ship stop until sync recovers (AT14).
5. **/admin/sheets** - write a `external_charter` row over a paid booking, press *Sync now*:
   quarantined with a reason written back to `SyncResults`, never applied (AT10).

## Accessibility - WCAG 2.2 Level AAA

**Design language: neutral monochrome, one accent, one typeface, no corners.**

The first pass leaned on a cream-paper, teal-and-rust, Palatino-display language borrowed from
pacifichighcruise.com. It read as heritage brochure rather than as a modern charter brand, so the
system was rebuilt:

| | Before | Now |
|---|---|---|
| Ground | `#FFFEF2` warm cream | `#FAFAFA` cool neutral |
| Accent | teal `#0E4B52` + rust `#6C2B29` | one navy-cobalt `#1D3E8F` |
| Display face | Palatino / Iowan Old Style serif | the UI sans, hierarchy from weight and tracking |
| Corner radius | 2px, plus 50% circles and 999px pills | `--r: 0`, everywhere, no exceptions |
| Cards | 1px box around everything | a hairline above the content, and space |
| Micro-labels | `.26em` tracked caps above every section | at most one per three sections |

Colour on the page now comes from photography and nothing else. The accent appears on links and
on button hover; `--focus` is amber but only ever renders while an element has keyboard focus;
gold appears only in star ratings, which the brief asks for by name. Tokens live in one place,
`TOKENS` in `views.js`, and `npm test` asserts all 36 declared pairs at 7:1.

Three deliberate departures from the brief, all in service of the same goal:

- **No scroll indicator.** A reader looking at a hero knows the page scrolls, and the label was
  the loudest thing in an otherwise quiet composition. The hero runs short of the fold instead.
- **Cabin names are sentence case, not wide-tracked capitals.** The capitals were the last piece
  of heritage styling left on the page.
- **The selling-point tiles are rectangles, not circles.** The round motif fought every other
  edge on the page and cropped the photography badly.

What the suite enforces, per success criterion:

| Criterion | Enforced by |
|---|---|
| 1.4.6 Contrast (Enhanced) | all 32 declared token pairs and every ship swatch at ≥7:1 |
| 1.4.8 Visual Presentation | 1.6 line-height, 74ch measure, never justified |
| 1.4.10 Reflow | four CSS guards, verified 320-1280px with no sideways scroll |
| 1.4.11 Non-text Contrast | input borders and the focus ring at ≥3:1 |
| 1.3.1 Info and Relationships | one h1, no skipped ranks, captions and `scope` on every table |
| 1.3.5 Identify Input Purpose | `autocomplete` on name, email and password |
| 2.4.1 / 2.4.8 | skip link to `#main`; breadcrumbs on every inner page |
| 2.4.7 / 2.4.13 Focus | two-tone amber-on-ink ring, visible on cream *and* the dark bands |
| 2.5.5 Target Size (Enhanced) | 44px minimum on every control; the terms checkbox label carries the target |
| 2.2.6 Timeouts | the 15-minute hold is stated before any commitment |
| 3.3.6 Error Prevention (All) | checkout is a review-and-confirm step, reversible and stated as such |
| 3.3.1 / 3.3.2 / 3.3.3 | `role="alert"` errors, `<label for>` on every control, fixes suggested |
| 2.3.3 / prefers-contrast | reduced-motion and increased-contrast media queries |

The cinematic sections put cream text over photography. Rather than hope a photograph is dark enough,
the text always sits on a scrim of `--deep` at `SCRIM_ALPHA` (0.88), where the composite luminance is
within a rounding error of `--deep` itself - so the declared `onDeep`/`deep` pair still describes what
a reader actually sees. `npm test` asserts the floor and asserts the hero renders the scrim.

Four defects the audit caught that a manual pass would have missed:

- Labels were rendered as siblings of their inputs, never associated. `field()` in `views.js` now
  makes that impossible to get wrong.
- Screen-reader-only spans were `position:absolute` with no positioned ancestor, so they escaped
  the table scroll containers and dragged the whole page sideways on mobile.
- `.big.money` text was `nowrap` and overflowed its card by 11px at one specific width - invisible
  to element-rect scans, only a text-range scan found it.
- The same absolute-positioning trap returned on the testimonial rail. `stars()` emits a `.vh` span;
  the nearest positioned ancestor was the wrapper, not the scroller, so the span resolved against the
  page at its un-scrolled x and dragged the document to 2755px at every width. Every horizontal
  scroller now carries `position:relative`, and the suite asserts it.

Not covered by automation, and still owed before launch: screen-reader walkthroughs (NVDA, VoiceOver),
3.1.5 Reading Level, 3.1.3 Unusual Words for the nautical vocabulary, and 1.2.x if media is added.

## Where each rule lives

| Area | File | Notes |
|---|---|---|
| Schema, seed fleet, roles | `db.js` | archive-not-delete, stable IDs, audit table |
| Conflict calendar, holds, pricing, payments, sync | `core.js` | the only place inventory is committed |
| Composio → Google Sheets | `sheets.js` | ScheduleInputs / BookingProjection / SyncResults / AvailabilityView |
| Midtrans Snap | `midtrans.js` | order-id per attempt, sha512 signature, status lookup, refund limits |
| Public site, agent portal, visitor chat | `server.js`, `views.js` | requirement IDs printed next to the UI they drive |
| Experiences, destinations, vessels, testimonials | `content.js` | copy as data; three templates render all of it |
| Vessel pages, itinerary, About Us, footer pages | `pages.js` | |
| Voyage Club, newsletter, the news gate | `members.js` | members are `users` rows with `role='member'` |
| Image and video slots, SVG stand-ins | `media.js` | real files in `public/` always win |
| Admin: dashboard, bookings, inbox, schedule, settings, audit | `admin.js` | |
| Admin: ships, products, departures, rates, agents, users | `catalog.js` | business rules live in `core.js` so tests hit them directly |
| Support chat engine | `chat.js` | SQLite record + Server-Sent Events push |
| Acceptance suite | `test.js` | AT02-AT17 plus the PR/SH/SYNC rules |

Key mechanics:

- **One calendar.** `core.shipConflicts()` is consulted by private charter search, checkout,
  and inbound schedule validation. Turnaround days are a per-ship buffer on both ends (PC04/AT16).
- **One pool.** A departure cabin has `berths`; a berth sale takes *n*, a whole-cabin sale takes
  all of them. Nothing else can oversell it (OT02/OT03).
- **One lock.** `createHold` and `handleNotification` run inside `BEGIN IMMEDIATE`. The test
  suite races four real OS processes at one interval and at the last two berths (AT04).
- **Three independent states.** `booking` / `payment` / `sync_status` never collapse into one
  field - visible on every booking page and in the ops table.
- **Money never moves on a redirect.** The browser return only displays; confirmation comes from
  a signature-checked notification reconciled against a gateway status lookup (PAY03).

## Deliberately not built

Not required to prove the design, and cheap to add later:

- Email/WhatsApp delivery (OPS08) - notification *events* are audited, nothing is sent.
- Amendment workflow (OPS03) and waitlists (OT07).
- Email or WhatsApp delivery of chat replies and notifications (OPS08): replies show on the site only.
- Reporting exports (OPS10), MFA (SEC01), i18n (D11), CSRF tokens (SameSite=Lax cookies cover modern browsers).
- Photography and video. Every slot renders a labelled SVG stand-in until real files land in `public/`.
- FR / CN / ID translations. The switcher exists and says plainly that they are not published yet.
- The scroll-linked morph from the aerial photograph into the deck plan; both are shown, stacked.
- Gallery lightboxes, the member CRM hand-off, and member discounts in the rates engine.
- Copy the brief does not supply: contact details, social URLs, FAQ, T&C, awards citations, press
  clippings, shore-side management, and six vessel specifications. Each of those pages says so on
  its face rather than pretending to be finished.
- The chat's live push is held in memory in one process; running several app instances needs Redis pub/sub or similar (marked `ponytail:`).
- Real Composio and Midtrans clients - both adapters are one-file swaps, marked `ponytail:`.

Open decisions D01-D14 are unresolved by design. The prototype takes the planning defaults from
section 14: 30% deposit, 15-minute hold, 30-day balance deadline, 120-second stale threshold -
all in the `settings` table, none hardcoded.
