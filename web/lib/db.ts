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
 * One connection per server process, created lazily so a build that never touches the database
 * never opens it.
 */
const DB_PATH =
  process.env.ANDALUCIA_DB ?? join(process.cwd(), "..", "data", "app.db");

let handle: DatabaseSync | null = null;

function db(): DatabaseSync {
  if (!handle) {
    handle = new DatabaseSync(DB_PATH);
    // the booking engine writes from its own process; queue rather than fail on a busy lock
    handle.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  }
  return handle;
}

export function one<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T | undefined {
  return db().prepare(sql).get(...(args as never[])) as T | undefined;
}

export function all<T = Record<string, unknown>>(sql: string, ...args: unknown[]): T[] {
  return db().prepare(sql).all(...(args as never[])) as T[];
}

export function run(sql: string, ...args: unknown[]) {
  return db().prepare(sql).run(...(args as never[]));
}

/** True when the booking engine's database is present and seeded. */
export function dbReady(): boolean {
  try {
    return Boolean(one<{ c: number }>("SELECT count(*) c FROM users"));
  } catch {
    return false;
  }
}
