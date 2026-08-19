"use client";

import { useCallback, useRef, useState } from "react";
import { Copy, Download, FileText } from "lucide-react";
import type { LetterDoc } from "@/lib/letter/types";
import { renderText } from "@/lib/render/text";
import { revealResult } from "@/lib/revealResult";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { EmailGate, useEmailGate } from "@/components/site/EmailGate";
import {
  PAYMENTS_ENABLED,
  PRICE_LABEL,
  hasPaid,
  rememberPaid,
  startCheckout,
} from "@/lib/payments";

type Props = {
  doc: LetterDoc;
  slug: string;
  isoDate: string;
};

/**
 * Everything someone can leave with, and the one place the email is asked for.
 *
 * Copying the text is free and always will be — reading your own letter is the
 * product working. The formatted files are what the payment is for.
 */
export function ExportPanel({ doc, slug, isoDate }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /**
   * The confirmation. On a phone the letter and its buttons sit below a long
   * form, so after copying or downloading there is nothing on screen to say it
   * worked unless the page comes back to it.
   */
  const doneRef = useRef<HTMLDivElement | null>(null);
  const revealDone = useCallback(() => {
    requestAnimationFrame(() => revealResult(doneRef.current));
  }, []);
  const [unlocked, setUnlocked] = useState(() => hasPaid());
  const gate = useEmailGate();

  const filename = `${slug}-${isoDate}`;

  const copyText = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(renderText(doc));
      setStatus("Copied. Paste it into an email or a document.");
      setDone(true);
      revealDone();
    } catch {
      setStatus("Your browser blocked the clipboard. Select the letter and copy it by hand.");
    }
  }, [doc, revealDone]);

  const save = useCallback(
    async (kind: "pdf" | "docx") => {
      setStatus(kind === "pdf" ? "Building the PDF" : "Building the document");
      try {
        const blob =
          kind === "pdf"
            ? await (await import("@/lib/render/pdf")).renderPdf(doc)
            : await (await import("@/lib/render/docx")).renderDocx(doc);

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.${kind}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        setStatus(null);
        setDone(true);
        revealDone();
      } catch {
        setStatus("That file could not be built. Copying the text still works.");
      }
    },
    [doc, filename, revealDone],
  );

  const onBuy = useCallback(async () => {
    setStatus("Opening checkout");
    try {
      const result = await startCheckout();
      if (result === "paid") {
        setUnlocked(true);
        rememberPaid();
        setStatus(null);
        await save("pdf");
      } else {
        setStatus(null);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkout could not open.");
    }
  }, [save]);

  return (
    <div className="mt-6 border-t border-line pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="ek-btn ek-btn-quiet"
          onClick={() => gate.guard(() => void copyText())}
        >
          <Copy size={16} aria-hidden="true" />
          Copy the text
        </button>

        {unlocked ? (
          <>
            <button
              type="button"
              className="ek-btn ek-btn-accent"
              onClick={() => gate.guard(() => void save("pdf"))}
            >
              <Download size={17} aria-hidden="true" />
              Download PDF
            </button>
            <button
              type="button"
              className="ek-btn ek-btn-quiet"
              onClick={() => gate.guard(() => void save("docx"))}
            >
              <FileText size={16} aria-hidden="true" />
              Download Word
            </button>
            <span className="rounded-full border border-line px-3 py-1 text-[12px] text-text-light">
              {PAYMENTS_ENABLED ? "paid, thank you" : "launch week, free"}
            </span>
          </>
        ) : (
          <button type="button" className="ek-btn ek-btn-accent" onClick={onBuy}>
            <Download size={17} aria-hidden="true" />
            Get the PDF and Word file for {PRICE_LABEL}
          </button>
        )}
      </div>

      {gate.gateOpen ? (
        <EmailGate actionLabel="Continue" onDone={gate.complete} />
      ) : null}

      {PAYMENTS_ENABLED && !unlocked ? (
        <p className="mt-3 text-[13px] text-text-light">
          Reading and copying the letter is free. The payment is for the
          formatted PDF and Word file, which open with the margins and spacing a
          formal letter is expected to have.
        </p>
      ) : null}

      <p aria-live="polite" className="mt-3 min-h-[20px] text-[14px] text-text-light">
        {status}
      </p>

      {done ? (
        <div ref={doneRef} className="mt-2 border-t border-line pt-4">
          <p className="text-[14px] text-foreground">That&apos;s it. You&apos;re done.</p>
          <p className="mt-1 text-[14px] text-text-light">
            Read it once more before you send it. Names and dates are the things
            that go wrong.
          </p>
          <MoreFromEveryKit />
        </div>
      ) : null}
    </div>
  );
}
