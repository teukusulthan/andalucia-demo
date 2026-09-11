# Phinisi Booking Platform — working prototype

Implements the reservation, pricing, payment and synchronisation rules from
*Phinisi Booking Platform — Business Requirements v1.0*. Zero dependencies: Node 22+
(`node:sqlite`, `node:http`, `node:crypto`).

```bash
npm run seed     # build data/app.db with the demo fleet
npm start        # http://localhost:3000
npm test         # 131 checks: section 13 acceptance, admin rules, permissions, chat, WCAG 2.2 AAA
```

## Demo accounts

| Login | Password | Shows |
|---|---|---|
| `agent@balisea.test` | `agent` | approved agent — net B2B prices (U06) |
| `agent@jktvoyages.test` | `agent` | suspended agent — falls back to retail (BR01) |
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
| Departures | admin, ops | schedule against the shared calendar; per-cabin inventory; manifest; below-minimum warning (CAT06, OT05–OT07) |
| Rates | admin, finance | retail and agent rates; a tie with an existing rate is refused at save time (PR01, PR03) |
| Agents | admin | register, approve, suspend organisations (BR01, AT06) |
| Users | admin | accounts and roles; re-enter your password to change them; the last admin can't be removed (SEC01) |
| Schedule | admin, ops | the Sheets workbook tabs and schedule requests (U07) |
| Settings | admin | deposit, balance deadline, hold length, stale threshold — validated and audited |
| Audit | admin, finance | searchable log of every change |

A private charter product created here is bookable straight away. Previously the charter search
was hard-wired to one product ID, so an admin-created product would never have appeared.

## Support chat

**Chat with us** is in the main navigation, and each booking page links to it with the reference
filled in. Visitors don't need an account: the conversation is tied to an HttpOnly cookie, so a
visitor only ever sees their own thread. Staff answer from **Admin → Inbox**.

- Live updates use Server-Sent Events, built into Node and browsers — no dependency.
- It works without JavaScript: every action is a normal form post, plus a "Check for new messages" link.
- Accessible: the thread is a `role="log"` live region, errors are announced and focus returns to the
  message box. A toggle turns live updates off (AAA 2.2.4 Interruptions).
- It isn't a floating widget, because a fixed launcher can cover the element that has focus (AAA 2.4.12).
- Abuse limits: 2,000 characters per message, 10 messages a minute, 5 new conversations per email per hour.
  All text is escaped.

## Five-minute tour

1. **/charter** — ask for 1 night: rejected in the form *and* in `core.quotePrivate` (AT02).
   Ask for dates over `Andalusia` 26–29 Sep: unavailable, because a published open departure
   already claims that ship interval (AT03).
2. **/departure/DEP-1001** — take a whole shared cabin; its four berths disappear from the
   per-berth column. One pool, two sale modes (AT05).
3. Check out → the hold is written to the sheet and acknowledged *before* the payment page
   opens (SYNC03). On the mock Snap page, "Replay the last notification twice" proves the
   webhook posts exactly once (AT11).
4. **/admin** — set *Sheets connection* to `fail`, then pay for another booking: the reservation
   is kept, the queue retries, and new sales on that ship stop until sync recovers (AT14).
5. **/admin/sheets** — write a `external_charter` row over a paid booking, press *Sync now*:
   quarantined with a reason written back to `SyncResults`, never applied (AT10).

## Accessibility — WCAG 2.2 Level AAA

Design language referenced from pacifichighcruise.com (cream paper, near-black teal, rust accent,
wide-tracked uppercase micro-labels, 2px radii, light editorial display type). The reference palette
was **not** copied verbatim: their body greens and sands land at 4–6:1, so every colour was darkened
until the pair cleared 7:1. Tokens live in one place, `TOKENS` in `views.js`, and `npm test` asserts
every declared pair.

What the suite enforces, per success criterion:

| Criterion | Enforced by |
|---|---|
| 1.4.6 Contrast (Enhanced) | all 32 declared token pairs and every ship swatch at ≥7:1 |
| 1.4.8 Visual Presentation | 1.6 line-height, 74ch measure, never justified |
| 1.4.10 Reflow | four CSS guards, verified 320–1280px with no sideways scroll |
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

Three defects the audit caught that a manual pass would have missed:

- Labels were rendered as siblings of their inputs, never associated. `field()` in `views.js` now
  makes that impossible to get wrong.
- Screen-reader-only spans were `position:absolute` with no positioned ancestor, so they escaped
  the table scroll containers and dragged the whole page sideways on mobile.
- `.big.money` text was `nowrap` and overflowed its card by 11px at one specific width — invisible
  to element-rect scans, only a text-range scan found it.

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
| Admin: dashboard, bookings, inbox, schedule, settings, audit | `admin.js` | |
| Admin: ships, products, departures, rates, agents, users | `catalog.js` | business rules live in `core.js` so tests hit them directly |
| Support chat engine | `chat.js` | SQLite record + Server-Sent Events push |
| Acceptance suite | `test.js` | AT02–AT17 plus the PR/SH/SYNC rules |

Key mechanics:

- **One calendar.** `core.shipConflicts()` is consulted by private charter search, checkout,
  and inbound schedule validation. Turnaround days are a per-ship buffer on both ends (PC04/AT16).
- **One pool.** A departure cabin has `berths`; a berth sale takes *n*, a whole-cabin sale takes
  all of them. Nothing else can oversell it (OT02/OT03).
- **One lock.** `createHold` and `handleNotification` run inside `BEGIN IMMEDIATE`. The test
  suite races four real OS processes at one interval and at the last two berths (AT04).
- **Three independent states.** `booking` / `payment` / `sync_status` never collapse into one
  field — visible on every booking page and in the ops table.
- **Money never moves on a redirect.** The browser return only displays; confirmation comes from
  a signature-checked notification reconciled against a gateway status lookup (PAY03).

## Deliberately not built

Not required to prove the design, and cheap to add later:

- Email/WhatsApp delivery (OPS08) — notification *events* are audited, nothing is sent.
- Amendment workflow (OPS03) and waitlists (OT07).
- Email or WhatsApp delivery of chat replies and notifications (OPS08): replies show on the site only.
- Reporting exports (OPS10), MFA (SEC01), i18n (D11), CSRF tokens (SameSite=Lax cookies cover modern browsers).
- The chat's live push is held in memory in one process; running several app instances needs Redis pub/sub or similar (marked `ponytail:`).
- Real Composio and Midtrans clients — both adapters are one-file swaps, marked `ponytail:`.

Open decisions D01–D14 are unresolved by design. The prototype takes the planning defaults from
section 14: 30% deposit, 15-minute hold, 30-day balance deadline, 120-second stale threshold —
all in the `settings` table, none hardcoded.
