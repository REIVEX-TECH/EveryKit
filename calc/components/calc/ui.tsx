"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Copy, Download } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { hasGivenEmail } from "@/lib/emailCapture";
import { countToolCompleted, countToolOpened } from "@/lib/pageview";

/**
 * The pieces every tool in this kit is built from.
 *
 * Five tools with five copies of a copy button is five places for the email gate
 * to be wired slightly differently, and the gate is the one thing on this site
 * that must behave identically everywhere. It is wired once, here.
 */

/**
 * The gate, as a hook.
 *
 * `take` is the only way a tool hands anything over. If an address has been
 * given this session the action runs immediately; if not, the modal opens and
 * the action runs after it is submitted. Dismissing the modal cancels the
 * action: that is not a bypass, and there is no skip.
 */
export function useTake(actionLabel: string) {
  const [pending, setPending] = useState<(() => void) | null>(null);

  useEffect(() => {
    countToolOpened();
  }, []);

  const take = useCallback((action: () => void) => {
    if (hasGivenEmail()) {
      action();
      countToolCompleted();
      return;
    }
    setPending(() => action);
  }, []);

  const gate = pending ? (
    <EmailGate
      actionLabel={actionLabel}
      onDone={() => {
        pending();
        countToolCompleted();
        setPending(null);
      }}
      onCancel={() => setPending(null)}
    />
  ) : null;

  return { take, gate };
}

/** Copy to the clipboard, behind the gate, with the button confirming it worked. */
export function CopyButton({
  text,
  label = "Copy",
  disabled = false,
  className = "ek-btn ek-btn-accent",
}: {
  text: string | (() => string);
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { take, gate } = useTake("Copy");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = () => {
    const value = typeof text === "function" ? text() : text;
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => take(copy)}
        disabled={disabled}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
        {copied ? "Copied" : label}
      </button>
      {gate}
    </>
  );
}

/** Save a blob, behind the same gate. */
export function DownloadButton({
  build,
  filename,
  label = "Download",
  disabled = false,
  className = "ek-btn ek-btn-quiet",
}: {
  build: () => Blob;
  filename: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { take, gate } = useTake("Download");

  const save = () => {
    const url = URL.createObjectURL(build());
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => take(save)}
        disabled={disabled}
        className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        {label}
      </button>
      {gate}
    </>
  );
}

const FIELD_CLASS =
  "w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary";

/** A labelled control, with room for a note under it. */
export function Field({
  label,
  htmlFor,
  note,
  children,
  className = "",
}: {
  label: string;
  htmlFor: string;
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-[14px] font-semibold">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {note ? <p className="mt-1.5 text-[13px] text-text-light">{note}</p> : null}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${FIELD_CLASS} ${className}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select {...rest} className={`${FIELD_CLASS} ${className}`} />;
}

/** The big text boxes every one of these tools has one or two of. */
export function TextBox(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      spellCheck={false}
      {...rest}
      className={`${FIELD_CLASS} min-h-[200px] font-mono text-[13px] leading-relaxed ${className}`}
    />
  );
}

/** A monospace block for output, scrollable rather than page-stretching. */
export function CodeBlock({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <pre
      className={`ek-card max-h-[420px] overflow-auto bg-bg-soft p-3 font-mono text-[13px] leading-relaxed ${className}`}
    >
      {children}
    </pre>
  );
}

/** The one line that says what happened, in the colour that says how it went. */
export function Note({ tone, children }: { tone: "ok" | "bad" | "quiet"; children: ReactNode }) {
  // Not the success token for text: #22c55e on white is 2.1:1 and unreadable at
  // this size. It is a colour for ticks and fills, and the tick goes beside
  // ordinary foreground text instead.
  const colour = tone === "bad" ? "text-danger" : tone === "ok" ? "text-foreground" : "text-text-light";
  return (
    <p role={tone === "bad" ? "alert" : undefined} className={`text-[14px] ${colour}`}>
      {children}
    </p>
  );
}
