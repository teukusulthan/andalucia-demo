import "server-only";
import { all, one } from "./db";

/**
 * What the site is allowed to publish about an offer.
 *
 * §3 of the business requirements asks the public site to "display the pricing unit clearly,
 * together with inclusions, exclusions, cancellation terms, itinerary flexibility, departure
 * location, and whether a departure is guaranteed or conditional". All of that already exists in
 * the reservation engine's tables, so it is read from there rather than retyped here: the engine
 * is the authority on price (PR05) and retyping it into the marketing site would guarantee the
 * two disagree.
 *
 * ---------------------------------------------------------------------------
 * PR07: agent rates are confidential.
 *
 * "Protect agent rates across APIs, HTML, search indexing, shared caches, exports, notifications
 * and invoices." These pages are prerendered and served to anonymous visitors, which is exactly
 * the shared cache that rule is about. Every query below therefore pins `rate_class = 'retail'`
 * as a literal rather than taking it as a parameter, so there is no call site that can ask this
 * module for an agent price, by mistake or otherwise. Agent rates stay on the agent portal.
 * ---------------------------------------------------------------------------
 */
const RETAIL = "retail";

export type OfferTerms = {
  title: string;
  /** e.g. "Labuan Bajo → Kelor → Padar → …": the published route, which is indicative not fixed */
  itinerary: string;
  inclusions: string[];
  exclusions: string[];
  /** onboard nights; the brief's 3D2N minimum is 2 nights (PC02) */
  minNights: number;
  termsVersion: number;
};

type ProductRow = {
  title: string;
  itinerary: string | null;
  inclusions: string | null;
  exclusions: string | null;
  min_nights: number;
  terms_version: number;
};

const list = (s: string | null): string[] =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/** Inclusions, exclusions, itinerary and the minimum duration for one of the two service modes. */
export function offerTerms(mode: "private" | "open"): OfferTerms | null {
  const p = one<ProductRow>(
    `SELECT title, itinerary, inclusions, exclusions, min_nights, terms_version
       FROM products WHERE mode=? AND status='published' LIMIT 1`,
    mode,
  );
  if (!p) return null;
  return {
    title: p.title,
    itinerary: p.itinerary ?? "",
    inclusions: list(p.inclusions),
    exclusions: list(p.exclusions),
    minNights: p.min_nights,
    termsVersion: p.terms_version,
  };
}

export type PriceBand = { nights: number; fromIdr: number };

/**
 * The cheapest published retail price for a whole-vessel charter at each duration.
 *
 * Deliberately a range across the published fleet rather than a single number: the rate depends
 * on which vessel, which season and which duration (PR03), and the binding figure is the one the
 * reservation engine recalculates at checkout (PR05/PR08). "From" is the only honest framing for
 * a marketing page.
 */
export function privateFromPrices(): PriceBand[] {
  return all<PriceBand>(
    `SELECT r.nights AS nights, MIN(r.amount_idr) AS fromIdr
       FROM rates r
       JOIN ships s ON s.id = r.ship_id
      WHERE r.rate_class = '${RETAIL}'
        AND r.cabin_category IS NULL
        AND r.nights IS NOT NULL
        AND s.status = 'active'
      GROUP BY r.nights
      ORDER BY r.nights`,
  );
}

export type CabinPrice = {
  category: string;
  berthIdr: number | null;
  wholeIdr: number | null;
};

/** Retail prices per cabin category, split by the two sale units the brief names (OT02). */
export function openCabinPrices(): CabinPrice[] {
  const rows = all<{ cabin_category: string; sale_mode: string; amount_idr: number }>(
    `SELECT cabin_category, sale_mode, MIN(amount_idr) AS amount_idr
       FROM rates
      WHERE rate_class = '${RETAIL}'
        AND cabin_category IS NOT NULL
      GROUP BY cabin_category, sale_mode`,
  );
  const by = new Map<string, CabinPrice>();
  for (const r of rows) {
    const e = by.get(r.cabin_category) ?? {
      category: r.cabin_category,
      berthIdr: null,
      wholeIdr: null,
    };
    if (r.sale_mode === "berth") e.berthIdr = r.amount_idr;
    if (r.sale_mode === "whole") e.wholeIdr = r.amount_idr;
    by.set(r.cabin_category, e);
  }
  const order = ["master", "deluxe", "standard", "sharing"];
  return [...by.values()].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}

export type Departure = {
  id: string;
  startDate: string;
  endDate: string;
  nights: number;
  shipName: string;
  embarkation: string;
  /** OT06: a conditional departure must carry its condition all the way to the confirmation */
  guaranteed: boolean;
  minPax: number;
  cutoffAt: string | null;
  fromIdr: number | null;
};

/**
 * Published, future departures.
 *
 * `guaranteed` and `min_pax` come straight from the engine so the site states the departure
 * condition rather than implying every trip is certain to sail (OT06). `embarkation` is per ship
 * for the same reason §3 gives: do not assume every vessel operates identically — one ship in
 * this fleet leaves from a different port.
 */
export function upcomingDepartures(limit = 12): Departure[] {
  const today = new Date().toISOString().slice(0, 10);
  const rows = all<{
    id: string;
    start_date: string;
    end_date: string;
    ship_name: string;
    embarkation: string;
    guaranteed: number;
    min_pax: number;
    cutoff_at: string | null;
    from_idr: number | null;
  }>(
    `SELECT d.id, d.start_date, d.end_date, s.name AS ship_name, s.embarkation,
            d.guaranteed, d.min_pax, d.cutoff_at,
            (SELECT MIN(r.amount_idr) FROM rates r
              WHERE r.rate_class = '${RETAIL}'
                AND r.sale_mode = 'berth'
                AND (r.departure_id = d.id OR r.departure_id IS NULL)) AS from_idr
       FROM departures d
       JOIN ships s ON s.id = d.ship_id
      WHERE d.status = 'published' AND d.end_date >= ?
      ORDER BY d.start_date
      LIMIT ?`,
    today,
    limit,
  );

  return rows.map((r) => ({
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    nights: Math.max(
      0,
      Math.round((Date.parse(r.end_date) - Date.parse(r.start_date)) / 86_400_000),
    ),
    shipName: r.ship_name,
    embarkation: r.embarkation,
    guaranteed: Boolean(r.guaranteed),
    minPax: r.min_pax,
    cutoffAt: r.cutoff_at,
    fromIdr: r.from_idr,
  }));
}

/** Every embarkation port currently in use, so the site never hardcodes one. */
export function embarkationPorts(): string[] {
  return all<{ embarkation: string }>(
    `SELECT DISTINCT embarkation FROM ships WHERE status='active' AND embarkation IS NOT NULL
      ORDER BY embarkation`,
  ).map((r) => r.embarkation);
}

/** IDR, grouped, with the currency stated. Money is stored as an integer (PR05). */
export const idr = (n: number) => `IDR ${Number(n || 0).toLocaleString("en-US")}`;

/** "3 days and 2 nights", the way the brief phrases durations (PC02). */
export const duration = (nights: number) => `${nights + 1} days and ${nights} nights`;
