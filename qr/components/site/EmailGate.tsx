"use client";

import { useId, useState } from "react";
import { hasGivenEmail, isValidEmail, rememberEmailGiven, submitEmail } from "@/lib/emailCapture";

type Props = {
  /** Runs once the gate is satisfied — or immediately, if it cannot be. */
  onDone: () => void;
  onCancel: () => void;
  /** What the user was about to do, so the button says something concrete. */
  actionLabel: string;
};

/**
 * Asked once, at the point someone takes their file.
 *
 * "Skip" is a real button, not a dark pattern in disguise: the file is theirs
 * either way, and pretending otherwise would be a lie we would then have to
 * keep. The address is worth having only from people who meant to give it.
 */
export function EmailGate({ onDone, onCancel, actionLabel }: Props) {
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
    // failed request must not cost the user their download or show them an
    // error about something that is not their problem.
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
        Where should we tell you about new kits? One email when a kit launches.
        No spam.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          id={fieldId}
          type="email"
          inputMode="email"
          autoComplete="email"
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

      <button
        type="button"
        onClick={onCancel}
        className="mt-3 text-[13px] text-text-light underline underline-offset-2 hover:text-primary-dark"
      >
        Skip and download anyway
      </button>
    </form>
  );
}

/**
 * Wraps an action behind the gate. Returns the gate to render, or null when the
 * action should just run — which is the case once per session after the first
 * time, and always for anyone who skipped.
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

  function skip(): void {
    const action = pending;
    setPending(null);
    rememberEmailGiven();
    action?.();
  }

  return { gateOpen: pending !== null, guard, complete, skip };
}
