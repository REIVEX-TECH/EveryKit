"use client";

import { useState } from "react";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { SignatureMaker } from "./SignatureMaker";
import { SignPdf } from "./SignPdf";

/**
 * The signing page, which needs the maker and the document side to share one
 * signature. Holding it here means someone draws once and places it on a PDF
 * without drawing again.
 */
export function SignPage() {
  const [signature, setSignature] = useState<Blob | null>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-[20px]">Your signature</h2>
        <div className="mt-3 flex gap-2">
          {(["draw", "type"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              aria-pressed={mode === value}
              className={[
                "inline-flex min-h-[36px] items-center rounded-full border px-4 py-2 text-[14px] transition-colors",
                mode === value
                  ? "border-primary-dark bg-primary-dark text-white"
                  : "border-line text-text-light hover:border-line-strong hover:text-foreground",
              ].join(" ")}
            >
              {value === "draw" ? "Draw it" : "Type it"}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <SignatureMaker mode={mode} onSignature={setSignature} />
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <h2 className="text-[20px]">The document</h2>
        <div className="mt-4">
          <SignPdf signature={signature} />
        </div>
      </section>

      <MoreFromEveryKit />
    </div>
  );
}
