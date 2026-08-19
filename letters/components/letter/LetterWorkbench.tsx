"use client";

import { useMemo, useState } from "react";
import { getLetterType } from "@/data/letters";
import type { DateFormat, Tone, Values } from "@/lib/letter/types";
import { LetterForm } from "./LetterForm";
import { LetterPreview } from "./LetterPreview";
import { ExportPanel } from "./ExportPanel";

/**
 * The working page: form on the left, the letter on the right, updating as you
 * type.
 *
 * All of it is component state. Nothing is written to the URL, to localStorage
 * or to a server — a letter can contain a refusal notice, a resignation or a
 * child's medical detail, and none of that belongs anywhere but this tab.
 * Refreshing loses the draft, which is the trade being made deliberately.
 */
export function LetterWorkbench({ slug, today }: { slug: string; today: string }) {
  // Resolved here rather than passed in. A LetterType carries its `build`
  // function, and functions cannot cross the server/client boundary — and the
  // build has to run in the browser anyway, on every keystroke, for the preview
  // to be live.
  const type = getLetterType(slug);

  const [values, setValues] = useState<Values>({});
  const [tone, setTone] = useState<Tone>(type?.toneVariants?.[0] ?? "polite");
  const [dateFormat, setDateFormat] = useState<DateFormat>("long-day-first");

  const doc = useMemo(
    () => type?.build(values, { tone, dateFormat, today }) ?? null,
    [type, values, tone, dateFormat, today],
  );

  // The route only exists for slugs in the data, so this is unreachable in
  // practice. Returning after the hooks keeps their order stable.
  if (!type || !doc) return null;

  const missing = type.fields.filter(
    (field) => field.required && (values[field.id] ?? "").trim() === "",
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
      <div>
        <LetterForm
          fields={type.fields}
          values={values}
          onChange={(id, value) => setValues((previous) => ({ ...previous, [id]: value }))}
          toneVariants={type.toneVariants}
          tone={tone}
          onToneChange={setTone}
        />

        <fieldset className="mt-8">
          <legend className="text-[14px] font-semibold text-foreground">Date format</legend>
          <div className="mt-2 inline-flex rounded-full border border-line p-1">
            {(
              [
                ["long-day-first", "17 August 2026"],
                ["long-month-first", "August 17, 2026"],
                ["iso", "2026-08-17"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={dateFormat === value}
                onClick={() => setDateFormat(value)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                  dateFormat === value ? "bg-foreground text-white" : "text-text-light"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="mt-8 text-[13px] text-text-light">
          Your letter is never uploaded, because it&apos;s built in your browser.
          Nothing you type here is saved, so refreshing starts again.
        </p>
      </div>

      <div className="lg:sticky lg:top-8 lg:self-start">
        <LetterPreview doc={doc} />

        {missing.length > 0 ? (
          <p className="mt-3 text-[13px] text-text-light">
            Still to fill in: {missing.map((field) => field.label.toLowerCase()).join(", ")}.
          </p>
        ) : null}

        <ExportPanel doc={doc} slug={type.slug} isoDate={today} />
      </div>
    </div>
  );
}
