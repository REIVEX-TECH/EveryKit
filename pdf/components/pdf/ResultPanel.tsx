"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Lock } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { PAYMENTS_ENABLED, PRICE_LABEL, hasPaid, startCheckout } from "@/lib/payments";
import { formatBytes } from "@/lib/pdf/files";
import { revealResult } from "@/lib/revealResult";

export type ResultFile = { name: string; bytes: Uint8Array };

type Props = {
  files: ResultFile[];
  /** An honest sentence about what happened, when there is one worth saying. */
  note?: string;
  /** Set when the job is past the free limits, with the reason why. */
  lockedReason?: string | null;
  onStartOver: () => void;
};

function saveFile(file: ResultFile) {
  // Copy into a fresh buffer: the Blob must not be built over a view that
  // something else may still be holding.
  const copy = new Uint8Array(file.bytes.length);
  copy.set(file.bytes);
  const url = URL.createObjectURL(new Blob([copy], { type: "application/pdf" }));

  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Safari needs the URL to outlive the click.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function ResultPanel({ files, note, lockedReason, onStartOver }: Props) {
  const [gateFor, setGateFor] = useState<ResultFile[] | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const locked = Boolean(lockedReason) && PAYMENTS_ENABLED && !hasPaid();

  useEffect(() => {
    if (panelRef.current) revealResult(panelRef.current);
  }, [files]);

  /** Ask for an email once a session, then get out of the way. */
  function take(selection: ResultFile[]) {
    if (hasGivenEmail()) {
      selection.forEach(saveFile);
      return;
    }
    setGateFor(selection);
  }

  async function unlock() {
    setCheckingOut(true);
    setCheckoutError(null);
    try {
      await startCheckout();
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "The checkout could not be opened.",
      );
    } finally {
      setCheckingOut(false);
    }
  }

  const total = files.reduce((sum, file) => sum + file.bytes.length, 0);

  return (
    <div ref={panelRef} className="ek-card p-4 sm:p-5">
      <h2 className="text-[18px] font-semibold">
        {files.length === 1 ? "Your file is ready" : `Your ${files.length} files are ready`}
      </h2>
      <p className="mt-1 text-[13px] text-text-light">
        {formatBytes(total)} in total. Nothing was uploaded to make {files.length === 1 ? "it" : "them"}.
      </p>

      {note ? (
        <p className="mt-3 rounded-[12px] bg-bg-soft px-3 py-2 text-[13px] text-text-light">
          {note}
        </p>
      ) : null}

      {lockedReason && !PAYMENTS_ENABLED ? (
        <p className="mt-3 inline-block rounded-full bg-bg-soft px-3 py-1 text-[12px] text-text-light">
          launch week — free
        </p>
      ) : null}

      {locked ? (
        <div className="mt-4">
          <p className="text-[14px] text-text-light">
            {lockedReason} Unlocking this job is a one-time {PRICE_LABEL}, and it covers the
            rest of this session.
          </p>
          <button
            type="button"
            onClick={() => void unlock()}
            disabled={checkingOut}
            className="ek-btn ek-btn-accent mt-3"
          >
            <Lock aria-hidden="true" className="h-4 w-4" />
            {checkingOut ? "Opening checkout…" : `Unlock for ${PRICE_LABEL}`}
          </button>
          {checkoutError ? (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              {checkoutError}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {files.length > 1 ? (
            <button
              type="button"
              onClick={() => take(files)}
              className="ek-btn ek-btn-accent mt-4 w-full sm:w-auto"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Save all {files.length}
            </button>
          ) : null}

          <ul className="mt-3 flex flex-col gap-2">
            {files.map((file) => (
              <li
                key={file.name}
                className="flex items-center gap-2 rounded-[12px] border border-line px-3 py-2"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{file.name}</span>
                  <span className="block text-[12px] text-text-light">
                    {formatBytes(file.bytes.length)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => take([file])}
                  className={
                    files.length === 1
                      ? "ek-btn ek-btn-accent shrink-0"
                      : "ek-btn ek-btn-quiet shrink-0"
                  }
                >
                  <Download aria-hidden="true" className="h-4 w-4" />
                  Save
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {gateFor ? (
        <EmailGate
          actionLabel={gateFor.length === 1 ? "Save the file" : `Save ${gateFor.length} files`}
          onDone={() => {
            gateFor.forEach(saveFile);
            setGateFor(null);
          }}
          onCancel={() => {
            // Skipping still hands over the file. It was always theirs.
            gateFor.forEach(saveFile);
            setGateFor(null);
          }}
        />
      ) : null}

      <button type="button" onClick={onStartOver} className="ek-btn ek-btn-quiet mt-4">
        Start over
      </button>

      <MoreFromEveryKit />
    </div>
  );
}
