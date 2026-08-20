"use client";

import { useMemo, useState } from "react";
import { Copy } from "lucide-react";
import {
  EMPTY_FIELDS,
  build,
  toHtml,
  toPlainText,
  type Fields,
  type Style,
} from "@/lib/study/citation";
import { Field, Input, Note, useTake } from "./ui";

/**
 * A citation in APA 7 or MLA 9, from fields you fill in.
 *
 * Two copy buttons rather than one. Plain text goes wherever text goes; the
 * rich text one puts real italics on the clipboard, which is what a word
 * processor needs and what makes the citation actually correct once pasted.
 * Copying asterisks around a journal title would be a markdown convention
 * pretending to be a citation style.
 */
export function CitationTool() {
  const [style, setStyle] = useState<Style>("apa");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);

  const segments = useMemo(() => build(fields, style), [fields, style]);
  const plain = toPlainText(segments);
  const html = toHtml(segments);

  const { take, gate } = useTake("Copy");
  const [copied, setCopied] = useState<"plain" | "rich" | null>(null);

  const set = (patch: Partial<Fields>) => setFields((current) => ({ ...current, ...patch }));

  const copyPlain = () => {
    void navigator.clipboard.writeText(plain).then(() => {
      setCopied("plain");
      setTimeout(() => setCopied(null), 1600);
    });
  };

  /**
   * The rich copy.
   *
   * `ClipboardItem` with an HTML flavour is the only way to put italics on the
   * clipboard. Where it is missing, the plain text goes on instead rather than
   * the button doing nothing, and the note under the buttons says as much.
   */
  const copyRich = () => {
    const done = () => {
      setCopied("rich");
      setTimeout(() => setCopied(null), 1600);
    };
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard.write) {
      void navigator.clipboard.writeText(plain).then(done);
      return;
    }
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plain], { type: "text/plain" }),
    });
    void navigator.clipboard.write([item]).then(done, () => {
      void navigator.clipboard.writeText(plain).then(done);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <fieldset>
        <legend className="text-[14px] font-semibold">Style</legend>
        <div className="mt-2 flex gap-2">
          {(
            [
              ["apa", "APA 7"],
              ["mla", "MLA 9"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={style === value}
              onClick={() => setStyle(value)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                style === value
                  ? "bg-primary-dark text-white"
                  : "border border-line bg-background hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Author or authors"
          htmlFor="cite-authors"
          note="One per line. Either order works: Ahmed, Sara or Sara Ahmed."
          className="sm:col-span-2"
        >
          <textarea
            id="cite-authors"
            value={fields.authors}
            onChange={(event) => set({ authors: event.target.value })}
            rows={3}
            placeholder={"Ahmed, Sara\nKhan, Ali"}
            className="w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
        </Field>

        <Field label="Title" htmlFor="cite-title" className="sm:col-span-2">
          <Input
            id="cite-title"
            value={fields.title}
            onChange={(event) => set({ title: event.target.value })}
            placeholder="How students choose a citation style"
          />
        </Field>

        <Field
          label="Source"
          htmlFor="cite-source"
          note="The journal, website or publisher it appeared in. Leave it empty for a standalone work."
        >
          <Input
            id="cite-source"
            value={fields.source}
            onChange={(event) => set({ source: event.target.value })}
            placeholder="Journal of Study Habits"
          />
        </Field>

        <Field label="Year" htmlFor="cite-year">
          <Input
            id="cite-year"
            value={fields.year}
            onChange={(event) => set({ year: event.target.value })}
            inputMode="numeric"
            placeholder="2024"
          />
        </Field>

        <Field label="URL" htmlFor="cite-url">
          <Input
            id="cite-url"
            value={fields.url}
            onChange={(event) => set({ url: event.target.value })}
            placeholder="https://example.org/article"
          />
        </Field>

        <Field
          label="Date you read it"
          htmlFor="cite-accessed"
          note="MLA asks for this. APA wants it only when the page is likely to change."
        >
          <Input
            id="cite-accessed"
            type="date"
            value={fields.accessed}
            onChange={(event) => set({ accessed: event.target.value })}
          />
        </Field>
      </div>

      <div className="ek-card bg-bg-soft p-5">
        <h2 className="text-[13px] font-semibold text-text-light">
          {style === "apa" ? "APA 7" : "MLA 9"}
        </h2>
        {plain === "" ? (
          <p className="mt-2 text-[15px] text-text-light">
            Fill in what you have and the citation builds itself here.
          </p>
        ) : (
          <p className="mt-2 text-[17px] leading-relaxed">
            {segments.map((segment, index) =>
              segment.italic ? <em key={index}>{segment.text}</em> : <span key={index}>{segment.text}</span>,
            )}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => take(copyPlain)}
            disabled={plain === ""}
            className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            {copied === "plain" ? "Copied" : "Copy as plain text"}
          </button>
          <button
            type="button"
            onClick={() => take(copyRich)}
            disabled={plain === ""}
            className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            {copied === "rich" ? "Copied" : "Copy with the italics"}
          </button>
        </div>
        {gate}

        <p className="mt-3 text-[13px] text-text-light">
          The second one keeps the italics when you paste into a word processor. Where a browser
          does not allow that, it falls back to plain text rather than doing nothing.
        </p>
      </div>

      <Note tone="quiet">
        This formats what you type. It does not look anything up, resolve a DOI or check that the
        source exists, so the spelling and the details are yours to get right. Both styles have
        rules for cases this form has no field for, a chapter in an edited book among them, and
        your department may have its own house variations.
      </Note>
    </div>
  );
}
