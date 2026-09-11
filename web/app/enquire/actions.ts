"use server";

import type { FormState } from "@/app/membership/actions";
import { record } from "@/lib/store";

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;
const MAX_MESSAGE = 2000;

/**
 * Trip enquiry. Validated on the server so it holds without JavaScript.
 *
 * Not yet delivered anywhere: the support inbox and its conversation records belong to the
 * booking engine, which still runs as the original Node app. A submission is validated and
 * acknowledged, and wiring it to that inbox is the next step in the migration.
 */
export async function sendEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const message = String(formData.get("message") ?? "").trim();

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
  if (!message) errors.message = "Tell us a little about the trip you have in mind.";
  else if (message.length > MAX_MESSAGE)
    errors.message = `Keep it under ${MAX_MESSAGE.toLocaleString("en-US")} characters.`;

  if (Object.keys(errors).length) {
    return { ok: false, message: "Check the highlighted fields and try again.", errors };
  }

  await record({ kind: "enquiry", name, email, message });

  return {
    ok: true,
    message: `Thank you, ${name}. Your enquiry is recorded and we will reply to ${email}. Routing it to the crew inbox arrives with the booking engine.`,
  };
}
