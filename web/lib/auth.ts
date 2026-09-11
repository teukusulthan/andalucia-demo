import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { one, run } from "./db";

/**
 * Authentication, sharing the reservation engine's scheme exactly.
 *
 * Password format (`salt:scrypt`) and the session cookie (`email.hmac`, HMAC-SHA256 truncated
 * to 24 chars, same secret) are byte-identical to the Node prototype, so a session created on
 * one app is accepted by the other and a member has one account across both.
 *
 * This is the prototype's scheme, not a production one: sessions are unexpiring, there is no
 * CSRF token beyond SameSite=Lax, and no rate limiting on sign-in. Those are listed in the
 * README as owed before launch.
 */
const SECRET = process.env.SESSION_SECRET ?? "prototype-secret";
const COOKIE = "sid";

export type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  preferred_name: string | null;
  phone: string | null;
  interest: string | null;
  active: number;
};

const hashPw = (pw: string, salt = randomBytes(8).toString("hex")) =>
  `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`;

const checkPw = (pw: string, stored?: string | null) =>
  Boolean(stored) && hashPw(pw, stored!.split(":")[0]) === stored;

const sign = (v: string) =>
  `${v}.${createHmac("sha256", SECRET).update(v).digest("hex").slice(0, 24)}`;

function unsign(c: string | undefined): string | null {
  if (!c) return null;
  const i = c.lastIndexOf(".");
  if (i < 0) return null;
  const value = c.slice(0, i);
  try {
    return timingSafeEqual(Buffer.from(sign(value)), Buffer.from(c)) ? value : null;
  } catch {
    return null;
  }
}

/** The signed-in member, or null. Reads the cookie, so any caller becomes dynamic. */
export async function currentUser(): Promise<Member | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  const email = unsign(raw);
  if (!email) return null;
  return one<Member>("SELECT * FROM users WHERE email=? AND active=1", email) ?? null;
}

export async function startSession(email: string) {
  (await cookies()).set(COOKIE, sign(email), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

export type AuthResult = { ok: true; email: string } | { ok: false; error: string };

/** Creates a Voyage Club member in the booking engine's `users` table. */
export function createMember(input: {
  name: string;
  email: string;
  password: string;
  preferredName?: string;
  phone?: string;
  interest?: string;
}): AuthResult {
  const email = input.email.trim().toLowerCase();
  if (one("SELECT id FROM users WHERE lower(email)=?", email)) {
    return { ok: false, error: "That email address already has an account. Sign in instead." };
  }
  const id = `U-MEM-${randomBytes(4).toString("hex").toUpperCase()}`;
  run(
    `INSERT INTO users(id,email,pw,role,name,preferred_name,phone,interest,active)
     VALUES(?,?,?,'member',?,?,?,?,1)`,
    id,
    email,
    hashPw(input.password),
    input.name.trim(),
    input.preferredName?.trim() || null,
    input.phone?.trim() || null,
    input.interest ?? "both",
  );
  return { ok: true, email };
}

export function verifyMember(email: string, password: string): AuthResult {
  const e = email.trim().toLowerCase();
  const u = one<Member & { pw: string }>("SELECT * FROM users WHERE lower(email)=?", e);
  // one message for both branches, so it cannot be used to enumerate addresses
  if (!u || !u.active || !checkPw(password, u.pw)) {
    return { ok: false, error: "That email address and password were not recognised." };
  }
  return { ok: true, email: u.email };
}

/** Newsletter list, shared with the booking engine. */
export function subscribeEmail(name: string, email: string, interest: string): "added" | "updated" {
  const e = email.trim().toLowerCase();
  const existing = one<{ id: string }>("SELECT id FROM newsletter WHERE lower(email)=?", e);
  if (existing) {
    run("UPDATE newsletter SET name=?, interest=? WHERE id=?", name.trim(), interest, existing.id);
    return "updated";
  }
  run(
    "INSERT INTO newsletter(id,name,email,interest,source,created_at) VALUES(?,?,?,?,?,?)",
    `NL-${randomBytes(4).toString("hex").toUpperCase()}`,
    name.trim(),
    e,
    interest,
    "web",
    new Date().toISOString(),
  );
  return "added";
}

export function audit(actor: string, action: string, entity: string, detail = "") {
  try {
    run(
      "INSERT INTO audit(at,actor,action,entity,detail) VALUES(?,?,?,?,?)",
      new Date().toISOString(),
      actor,
      action,
      entity,
      detail,
    );
  } catch {
    /* auditing must never block the visitor's action */
  }
}
