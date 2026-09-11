import "server-only";
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

/**
 * The reservation engine's SQLite database, opened read/write.
 *
 * There is deliberately no second user store: `users`, `newsletter` and `articles` belong to
 * the booking engine in the parent directory, and this app reads and writes the same tables.
 * A member who joins here can sign in there, and vice versa.
 *
 * ---------------------------------------------------------------------------
 * The database may not be there at all, and that must not take the site down.
 *
 * It is deliberately not committed — it holds member accounts and bookings — so any deployment
 * of this app alone has no engine database beside it. `node:sqlite` will happily *create* an
 * empty file rather than fail, so the first symptom is not "cannot open" but "no such table",
 * which surfaced as a hard build failure while prerendering /schedule.
 *
 * So availability is resolved once, by opening the file and checking a table the seed creates.
 * When it is unavailable, reads return nothing and the pages that use them fall back to their
 * empty state: the marketing site still builds and serves, it simply has no live departures or
 * prices to show. Writes still throw, because a sign-up that silently does nothing is worse than
 * one that says it failed.
 * ---------------------------------------------------------------------------
 */
const DB_PATH =
  process.env.ANDALUCIA_DB ?? join(process.cwd(), "..", "data", "app.db");

let handle: DatabaseSync | null | undefined;

function db(): DatabaseSync | null {
  if (handle !== undefined) return handle;
  try {
    const h = new DatabaseSync(DB_PATH);
    // the booking engine writes from its own process; queue rather than fail on a busy lock
    h.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    // an empty file opens fine, so prove the schema is actually there before trusting it
    h.prepare("SELECT 1 FROM users LIMIT 1").get();
    handle = h;
  } catch {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[db] no reservation database at ${DB_PATH}. Live departures, prices, the Island ` +
          `Dispatch and accounts are unavailable; the rest of the site is unaffected. ` +
          `Run \`npm run seed\` in the parent directory to create one.`,
      );
    }
    handle = null;
  }
  return handle;
}

export function one<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T | undefined {
  const d = db();
  if (!d) return undefined;
  return d.prepare(sql).get(...(args as never[])) as T | undefined;
}

export function all<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T[] {
  const d = db();
  if (!d) return [];
  return d.prepare(sql).all(...(args as never[])) as T[];
}

export function run(sql: string, ...args: unknown[]) {
  const d = db();
  if (!d) {
    // surfaced by the forms as an inline error, rather than a silent no-op
    throw new Error(
      "The reservation system is not reachable right now, so this could not be saved. Please try again shortly.",
    );
  }
  return d.prepare(sql).run(...(args as never[]));
}

/** True when the booking engine's database is present and seeded. */
export function dbReady(): boolean {
  return db() !== null;
}
