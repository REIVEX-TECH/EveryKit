"use client";

import { useId, useState } from "react";
import { hasGivenEmail, isValidEmail, rememberEmailGiven, submitEmail } from "@/lib/emailCapture";

type Props = {
  /** Runs once a validly formatted address has been submitted. */
  onDone: () => void;
  /** What the user was about to do, so the button says something concrete. */
  actionLabel: string;
};

/**
 * Asked once a session, at the point someone takes their file.
 *
 * There is no skip. An address that passes the format check has to be
 * submitted before the action runs, and the submit button stays disabled until
 * one is typed.
 *
 * The one thing that is not a bypass, and must never be removed: if the
 * request to the hub fails or times out, the action still runs. That is in
 * `submitEmail`, which resolves either way and never throws, with a 3s cap.
 * The distinction is deliberate — the gate is a condition on the *user*, not on
 * our server being up. Someone who typed their address has done their part, and
 * an outage on our side must not cost them the file they made.
 */
export function EmailGate({ onDone, actionLabel }: Props) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const fieldId = useId();
  const valid = isValidEmail(email);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    // Whatever comes back, the session is marked and the action proceeds. A
    // failed request must not cost the user their file or show them an error
    // about something that is not their problem.
    await submitEmail(email, honeypot);
    rememberEmailGiven();
    setBusy(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="ek-card mt-4 bg-bg-soft p-4">
      <label htmlFor={fieldId} className="block text-[14px] font-semibold text-foreground">
        Email
      </label>
      <p className="mt-1 text-[13px] text-text-light">
        An email address is needed to continue. One email when a kit launches —
        nothing else, and we do not pass it on.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          id={fieldId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
        />
        <button type="submit" className="ek-btn ek-btn-accent py-2" disabled={!valid || busy}>
          {busy ? "One moment" : actionLabel}
        </button>
      </div>

      {/* Hidden from people and from screen readers; only a bot fills it. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`${fieldId}-company`}>Company</label>
        <input
          id={`${fieldId}-company`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>
    </form>
  );
}

/**
 * Wraps an action behind the gate. Returns the gate to render, or runs the
 * action straight away once an address has been given in this session.
 */
export function useEmailGate() {
  const [pending, setPending] = useState<(() => void) | null>(null);

  function guard(action: () => void): void {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setPending(() => action);
  }

  function complete(): void {
    const action = pending;
    setPending(null);
    action?.();
  }

  return { gateOpen: pending !== null, guard, complete };
}
