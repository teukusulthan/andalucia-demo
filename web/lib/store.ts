import "server-only";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * Prototype-grade submission store.
 *
 * Appends one JSON object per line under .data/, which is enough to prove the forms round-trip
 * and to read back what was submitted. It is deliberately NOT the real home for this data: the
 * `users` and `newsletter` tables belong to the booking engine, and the CRM hand-off the brief
 * asks for (Mailchimp, Brevo, MemberStack) replaces this entirely. A file also does not survive
 * a serverless deploy, so this is a development convenience, not production persistence.
 */
const FILE = join(process.cwd(), ".data", "submissions.jsonl");

export type Submission = {
  kind: "membership" | "newsletter" | "enquiry";
  at: string;
  [key: string]: unknown;
};

export async function record(entry: Omit<Submission, "at">): Promise<void> {
  try {
    await mkdir(dirname(FILE), { recursive: true });
    await appendFile(FILE, JSON.stringify({ ...entry, at: new Date().toISOString() }) + "\n", "utf8");
  } catch (err) {
    // A failed write must never lose the visitor's submission silently, but it also must not
    // break the response: log it and let the caller acknowledge.
    console.error("[store] could not record submission", err);
  }
}

/** True when this address has already subscribed, so the newsletter does not duplicate rows. */
export async function alreadySubscribed(email: string): Promise<boolean> {
  try {
    const raw = await readFile(FILE, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .some((line) => {
        try {
          const row = JSON.parse(line) as Submission;
          return row.kind === "newsletter" && String(row.email).toLowerCase() === email;
        } catch {
          return false;
        }
      });
  } catch {
    return false;
  }
}
