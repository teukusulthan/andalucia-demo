"use server";

import { redirect } from "next/navigation";
import {
  audit,
  createMember,
  endSession,
  startSession,
  subscribeEmail,
  verifyMember,
} from "@/lib/auth";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> };

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/**
 * Voyage Club sign-up. Creates a real account in the reservation engine's `users` table, adds
 * the address to the shared newsletter list, and starts a session, so joining actually signs
 * the member in and unlocks the Island Dispatch.
 */
export async function joinClub(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const interest = String(formData.get("interest") ?? "both");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your full name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Choose a password of at least 8 characters.";
  if (Object.keys(errors).length) {
    return { ok: false, message: "Check the highlighted fields and try again.", errors };
  }

  const created = createMember({
    name,
    email,
    password,
    preferredName: String(formData.get("preferred_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    interest,
  });
  if (!created.ok) return { ok: false, message: created.error, errors: { email: created.error } };

  subscribeEmail(name, email, interest);
  audit(email, "member.join", "users", interest);
  await startSession(email);
  redirect("/account?welcome=1");
}

/** Sign in an existing member, agent or staff account. */
export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL.test(email) || !password) {
    return {
      ok: false,
      message: "Enter your email address and password.",
      errors: {
        ...(EMAIL.test(email) ? {} : { email: "Enter a valid email address." }),
        ...(password ? {} : { password: "Enter your password." }),
      },
    };
  }

  const result = verifyMember(email, password);
  if (!result.ok) return { ok: false, message: result.error };

  audit(result.email, "login", "users", "web");
  await startSession(result.email);
  redirect("/account");
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}

/** Newsletter, writing to the list the booking engine reads. */
export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const interest = String(formData.get("interest") ?? "both");

  const errors: Record<string, string> = {};
  if (!name) errors.name = "Enter your name.";
  if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
  if (Object.keys(errors).length) {
    return { ok: false, message: "Check the highlighted fields and try again.", errors };
  }

  const outcome = subscribeEmail(name, email, interest);
  audit(email, "newsletter.subscribe", "newsletter", interest);

  return {
    ok: true,
    message:
      outcome === "updated"
        ? `${email} was already on the list, so we have updated your preference.`
        : `The next Island Dispatch will reach you at ${email}.`,
  };
}
