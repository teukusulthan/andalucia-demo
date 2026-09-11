/**
 * Where the reservation system lives.
 *
 * Search, checkout, payment and booking retrieval are served by the Node application in the
 * parent directory, not by this app, so every link that crosses over goes through here rather
 * than being written inline. They were hard-coded to `http://localhost:3000`, which works on the
 * machine that built it and nowhere else — including on a laptop being used to demo it.
 *
 * Set `NEXT_PUBLIC_BOOKING_ENGINE_URL` for any deployment that is not the local pair.
 */
const BASE = (process.env.NEXT_PUBLIC_BOOKING_ENGINE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const bookingEngine = {
  /** Private charter date search. */
  charter: `${BASE}/charter`,
  /** Published open-trip departures with live capacity. */
  trips: `${BASE}/trips`,
  /** Retrieve an existing booking by reference. */
  retrieve: `${BASE}/retrieve`,
  /** Agent sign-in, which lands on the agent portal and its net rates. */
  agent: `${BASE}/login?next=/agent`,
} as const;
