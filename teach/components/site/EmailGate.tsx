"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  gateOutcome,
  hasGivenEmail,
  isValidEmail,
  rememberEmailGiven,
  submitEmail,
} from "@/lib/emailCapture";
import { countPageview } from "@/lib/pageview";

type Props = {
  /** Runs once a validly formatted address has been submitted. */
  onDone: () => void;
  /**
   * Runs when the dialog is cancelled. The action does not happen.
   *
   * A cancel, not a skip: the X, the Escape key and a backdrop click all land
   * here, dropping what the user was about to do exactly as if they had never
   * pressed the button. There is no route to the file without an address.
   */
  onCancel: () => void;
  /** What the user was about to do, so the button says something concrete. */
  actionLabel: string;
};

/**
 * Asked once a session, at the point someone takes their file.
 *
 * A native <dialog> rather than a div, for the focus trap, the top layer and
 * the focus restore, which browsers get right more reliably than a hand-rolled
 * version does.
 *
 * Dismissal is wired explicitly on every route out rather than through the
 * element's own close event. That event is not dependable: there are engines
 * where close() flips `open` to false and dispatches nothing, and when the
 * parent never learns the dialog closed, the component stays mounted while
 * invisible and the trigger button silently stops working for the rest of the
 * session. The close listener is still attached, as a backstop for the times
 * the browser closes the dialog itself, and `settled` keeps the two paths from
 * both firing.
 *
 * The gate is mandatory. A validly formatted address, submitted, is the only
 * route to the file: submit sends it, marks the session and runs the action,
 * and a submit is counted once through the aggregate hit so the trade is
 * measurable, carrying a kit and a path and nothing about the person. Cancel,
 * the X, Escape and a backdrop click abandon, and there is no other way past.
 *
 * The one thing that must never be removed: if the request to the hub fails or
 * times out, the action still runs. That lives in `submitEmail`, which resolves
 * either way with a 3s cap. It is not a bypass. The gate is a condition on the
 * user, not on our server being up.
 */
export function EmailGate({ onDone, onCancel, actionLabel }: Props) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const fieldId = useId();
  const titleId = `${fieldId}-title`;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** True once the gate has resolved either way, so nothing fires twice. */
  const settled = useRef(false);

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const valid = isValidEmail(email);

  /** Close and abandon the pending action. */
  const dismiss = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    dialogRef.current?.close();
    onCancelRef.current();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

    /*
     * Focus the field explicitly. showModal() focuses the first tabbable child
     * on its own, and that is the close button, which sits first because it
     * belongs in the top corner. React's autoFocus does not win either, since
     * showModal runs afterwards in this effect and moves focus again.
     */
    inputRef.current?.focus();

    // Backstop for browsers that close the dialog themselves, for example on
    // the Escape key, where no click or keydown of ours is involved.
    const handleClose = () => {
      if (settled.current) return;
      settled.current = true;
      onCancelRef.current();
    };
    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
      // Leaving a dialog in the top layer keeps the rest of the page inert.
      if (dialog.open) dialog.close();
    };
  }, []);

  /**
   * Submit the address and take the file. The only path that completes an
   * action: it sends the address, marks the session, counts the one event, and
   * runs what the person asked for. Cancel goes through `dismiss` instead, which
   * abandons.
   */
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (settled.current || !valid || busy) return;
    const outcome = gateOutcome("submit");

    setBusy(true);
    // Whatever comes back, the action proceeds. A failed request must not cost
    // the user their file or show them an error that is not their problem.
    await submitEmail(email, honeypot);
    setBusy(false);

    if (outcome.remember) rememberEmailGiven();
    if (outcome.countPath) countPageview(outcome.countPath);

    settled.current = true;
    dialogRef.current?.close();
    if (outcome.runAction) onDone();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        // Handled here rather than left to the browser, so the cancel runs on
        // engines whose close event never arrives.
        if (event.key === "Escape") {
          event.preventDefault();
          dismiss();
        }
      }}
      onClick={(event) => {
        // A click landing on the dialog element itself is a click on the
        // backdrop; anything inside the form has a nearer target.
        if (event.target === dialogRef.current) dismiss();
      }}
      className="ek-dialog"
    >
      <form onSubmit={submit} className="p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-[18px] font-semibold text-foreground">
            Your email
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close without saving"
            className="-m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-light hover:bg-bg-soft hover:text-foreground"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-[14px] text-text-light">
          An email address is needed to continue. One email when a kit launches,
          nothing else, and we do not pass it on.
        </p>

        <label htmlFor={fieldId} className="mt-4 block text-[14px] font-semibold text-foreground">
          Email
        </label>
        {/* Full width on its own row. Sharing a row with the button is what
            squeezed this to "you@exar" on a narrow screen. */}
        <input
          id={fieldId}
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 block w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
        />

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

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="ek-btn ek-btn-quiet justify-center py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="ek-btn ek-btn-accent justify-center py-2"
            disabled={!valid || busy}
          >
            {busy ? "One moment" : actionLabel}
          </button>
        </div>
      </form>
    </dialog>
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

  /** Dismissed. The pending action is dropped without running. */
  function cancel(): void {
    setPending(null);
  }

  return { gateOpen: pending !== null, guard, complete, cancel };
}
