"use client";

import { useActionState, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { sendEnquiry } from "@/app/enquire/actions";
import type { FormState } from "@/app/membership/actions";
import { Spinner } from "./skeleton";

const EMPTY: FormState = { ok: false, message: "" };
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The form block is centred with the rest of the page, but its labels and fields stay
 * left-aligned: a centred label floating over a full-width input reads as unrelated to it, and a
 * centred caret jumps as you type. Composition centred, data entry left.
 */
export function EnquiryForm() {
  const [state, formAction, pending] = useActionState(sendEnquiry, EMPTY);
  const reduce = useReducedMotion();
  const uid = useId();

  return (
    <form action={formAction} className="mx-auto max-w-[36rem] text-left">
      <div aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait">
          {state.message ? (
            <motion.p
              key={state.message}
              initial={reduce ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              role={state.ok ? "status" : "alert"}
              className={`mb-7 border-l-2 py-2 pl-5 text-[15px] leading-relaxed ${
                state.ok ? "border-brand" : "border-destructive"
              }`}
            >
              <strong className="font-medium">{state.ok ? "Sent. " : "Not sent: "}</strong>
              {state.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <Row id={`${uid}-name`} name="name" label="Your name" autoComplete="name" required error={state.errors?.name} />
      <Row
        id={`${uid}-email`}
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        error={state.errors?.email}
      />

      <div className="mb-6">
        <label
          htmlFor={`${uid}-message`}
          className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
        >
          Your enquiry <span className="vh">(required)</span>
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          required
          aria-required="true"
          rows={5}
          maxLength={2000}
          aria-invalid={state.errors?.message ? true : undefined}
          aria-describedby={`${uid}-message-hint${state.errors?.message ? ` ${uid}-message-err` : ""}`}
          className="w-full resize-y border border-input bg-card px-3 py-2.5 text-base text-foreground"
        />
        <p id={`${uid}-message-hint`} className="mt-1.5 max-w-[52ch] text-[13px] text-muted-foreground">
          Dates, group size and what you would like to see. Up to 2,000 characters. Please do not
          send card or passport details.
        </p>
        {state.errors?.message ? (
          <p id={`${uid}-message-err`} className="mt-1.5 text-[13px] font-medium text-destructive">
            {state.errors.message}
          </p>
        ) : null}
      </div>

      <motion.button
        type="submit"
        disabled={pending}
        whileTap={reduce ? undefined : { y: 1 }}
        className="inline-flex min-h-11 items-center justify-center gap-2.5 bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-brand disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Sending…" : "Send enquiry"}
      </motion.button>
    </form>
  );
}

function Row({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  required,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="mb-6">
      <label
        htmlFor={id}
        className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
      >
        {label}
        {required ? <span className="vh"> (required)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-required={required || undefined}
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
