"use client";

import type { LetterDoc } from "@/lib/letter/types";

/**
 * The letter as an A4 page.
 *
 * Always black on white, whatever the surrounding page is doing. This is a
 * picture of a document, not a piece of the interface, and a letter that
 * repainted itself to match a dark theme would stop looking like the thing that
 * comes out of the printer.
 */
export function LetterPreview({ doc }: { doc: LetterDoc }) {
  return (
    <div
      className="mx-auto w-full max-w-[520px] overflow-hidden rounded-[4px] border border-line bg-white"
      style={{ aspectRatio: "210 / 297" }}
    >
      <div
        className="h-full overflow-y-auto text-[10px] leading-[1.55] text-[#111111] sm:text-[11px]"
        // 25mm margins, expressed against the page width so the proportions
        // survive whatever size the column ends up at.
        style={{ padding: "11.9%" }}
      >
        {doc.sender.length > 0 ? (
          <div className="mb-4 text-right">
            {doc.sender.map((linetext, index) => (
              <div key={`${linetext}-${index}`}>{linetext}</div>
            ))}
          </div>
        ) : null}

        {doc.recipient.length > 0 ? (
          <div className="mb-4">
            {doc.recipient.map((linetext, index) => (
              <div key={`${linetext}-${index}`}>{linetext}</div>
            ))}
          </div>
        ) : null}

        {doc.date ? <div className="mb-4">{doc.date}</div> : null}
        {doc.subject ? <div className="mb-4 font-semibold">{doc.subject}</div> : null}

        <div className="mb-3">{doc.salutation},</div>

        {doc.body.map((para, index) => (
          <p key={index} className="mb-3">
            {para}
          </p>
        ))}

        <div className="mt-5">{doc.valediction},</div>
        {/* The gap a signature goes in. */}
        <div className="h-8" />
        {doc.signOff.map((linetext, index) => (
          <div key={`${linetext}-${index}`}>{linetext}</div>
        ))}

        {doc.enclosures && doc.enclosures.length > 0 ? (
          <div className="mt-4">
            <div className="font-semibold">Enclosed:</div>
            {doc.enclosures.map((item) => (
              <div key={item}>- {item}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
