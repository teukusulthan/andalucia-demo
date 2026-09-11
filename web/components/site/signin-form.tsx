"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { signInAction, type FormState } from "@/app/membership/actions";
import { Spinner } from "./skeleton";

const EMPTY: FormState = { ok: false, message: "" };
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Sign in. A plain form bound to a Server Action, so it works without JavaScript; on success
 * the action redirects, so there is no success state to render here.
 */
export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, EMPTY);
  const reduce = useReducedMotion();
  const uid = useId();

  return (
    <form action={formAction} className="mx-auto max-w-[34rem] text-left">
      <div aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          {state.message ? (
            <motion.p
              key={state.message}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              role="alert"
              className="mb-7 border-l-2 border-destructive py-2 pl-5 text-[15px] leading-relaxed"
            >
              <strong className="font-medium">Not signed in: </strong>
              {state.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <Field
        id={`${uid}-email`}
        name="email"
        type="email"
        label="Email address"
        autoComplete="username"
        error={state.errors?.email}
      />
      <Field
        id={`${uid}-password`}
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        error={state.errors?.password}
      />

      <motion.button
        type="submit"
        disabled={pending}
        whileTap={reduce ? undefined : { y: 1 }}
        className="inline-flex min-h-11 items-center justify-center gap-2.5 bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-brand disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </motion.button>

      <p className="mt-6 text-[15px] text-muted-foreground">
        Not a member yet?{" "}
        <Link href="/membership/join" className="text-brand underline underline-offset-4">
          Join the Voyage Club
        </Link>
        . It is free.
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
      >
        {label} <span className="vh">(required)</span>
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className="min-h-11 w-full border border-input bg-card px-3 text-base text-foreground"
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
