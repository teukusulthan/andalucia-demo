"use client";

import { useActionState, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { joinClub, subscribe, type FormState } from "@/app/membership/actions";
import { Spinner } from "./skeleton";

const EMPTY: FormState = { ok: false, message: "" };
const EASE = [0.16, 1, 0.3, 1] as const;

const INTERESTS = [
  { value: "both", label: "Both" },
  { value: "private", label: "Private charter" },
  { value: "open", label: "Open trip" },
];

/**
 * Forms are plain <form action={...}> bound to a Server Action, so they submit and validate
 * with JavaScript disabled; useActionState only adds the inline result and pending state on
 * top. Labels are always rendered above their control, never used as placeholders (3.3.2), and
 * errors are announced through a live region rather than signalled by colour alone (3.3.1).
 */
export function ClubForm({ variant }: { variant: "join" | "subscribe" }) {
  const action = variant === "join" ? joinClub : subscribe;
  const [state, formAction, pending] = useActionState(action, EMPTY);
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
              role={state.ok ? "status" : "alert"}
              className={`mb-7 border-l-2 py-2 pl-5 text-[15px] leading-relaxed ${
                state.ok ? "border-brand text-foreground" : "border-destructive text-foreground"
              }`}
            >
              <strong className="font-medium">{state.ok ? "Thank you. " : "Not sent: "}</strong>
              {state.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <Field
        id={`${uid}-name`}
        name="name"
        label="Full name"
        autoComplete="name"
        required
        error={state.errors?.name}
      />
      <Field
        id={`${uid}-email`}
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        error={state.errors?.email}
        hint={
          variant === "subscribe"
            ? "Roughly one dispatch a month. Unsubscribe from any of them."
            : undefined
        }
      />

      {variant === "join" ? (
        <>
          <Field
            id={`${uid}-preferred`}
            name="preferred_name"
            label="Preferred name"
            autoComplete="nickname"
            hint="What the crew should call you."
          />
          <Field id={`${uid}-phone`} name="phone" type="tel" label="Phone" autoComplete="tel" />
        </>
      ) : null}

      <div className="mb-6">
        <label
          htmlFor={`${uid}-interest`}
          className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
        >
          {variant === "join" ? "Travel interest" : "What interests you"}
        </label>
        <select
          id={`${uid}-interest`}
          name="interest"
          defaultValue="both"
          className="min-h-11 w-full border border-input bg-card px-3 text-base text-foreground"
        >
          {INTERESTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {variant === "join" ? (
        <Field
          id={`${uid}-password`}
          name="password"
          type="password"
          label="Choose a password"
          autoComplete="new-password"
          required
          error={state.errors?.password}
          hint="At least 8 characters."
        />
      ) : null}

      <motion.button
        type="submit"
        disabled={pending}
        whileTap={reduce ? undefined : { y: 1 }}
        className="inline-flex min-h-11 items-center justify-center gap-2.5 bg-primary px-6 text-[15px] font-medium text-primary-foreground transition-colors duration-200 hover:bg-brand disabled:opacity-60"
      >
        {pending ? <Spinner /> : null}
        {pending
          ? variant === "join"
            ? "Joining…"
            : "Subscribing…"
          : variant === "join"
            ? "Become a member"
            : "Subscribe"}
      </motion.button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  required,
  hint,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

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
        aria-describedby={describedBy}
        className="min-h-11 w-full border border-input bg-card px-3 text-base text-foreground"
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 max-w-[52ch] text-[13px] text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="mt-1.5 text-[13px] font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
