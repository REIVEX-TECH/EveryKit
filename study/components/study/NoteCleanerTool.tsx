"use client";

import { useMemo, useState } from "react";
import { cleanText, keyPoints } from "@/lib/study/summarize";
import { CopyButton, Field, Note, Select, TextBox } from "./ui";

/**
 * Paste notes, get the key sentences and a tidied copy.
 *
 * The honesty matters here: this SELECTS the most central sentences, it does not
 * rewrite anything, so the "key points" are the student's own words. The copy
 * says so plainly rather than implying an AI summary.
 */
export function NoteCleanerTool() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);

  const points = useMemo(() => keyPoints(text, count), [text, count]);
  const cleaned = useMemo(() => cleanText(text), [text]);
  const hasText = text.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <TextBox
        aria-label="Your notes"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste lecture notes or an article here."
      />

      <Field label="How many key points" htmlFor="count" className="sm:max-w-[220px]">
        <Select id="count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
          <option value={3}>3 key points</option>
          <option value={5}>5 key points</option>
          <option value={8}>8 key points</option>
        </Select>
      </Field>

      {hasText ? (
        <div className="ek-card p-4">
          <h2 className="text-[15px] font-semibold">Key points</h2>
          <Note tone="quiet">
            These are the most central sentences, selected and copied as they are. This is not an AI
            summary and nothing is rewritten, so the words are yours.
          </Note>
          {points.length > 0 ? (
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[15px]">
              {points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[14px] text-text-light">
              Not enough text to rank yet. Paste a few sentences.
            </p>
          )}
          {points.length > 0 ? (
            <div className="mt-4">
              <CopyButton text={() => points.map((p) => `- ${p}`).join("\n")} label="Copy the key points" />
            </div>
          ) : null}
        </div>
      ) : null}

      {hasText && cleaned !== text ? (
        <div className="ek-card p-4">
          <h2 className="text-[15px] font-semibold">Tidied text</h2>
          <p className="mt-1 text-[13px] text-text-light">
            Extra spaces removed, duplicate lines dropped, and bullets normalised to a dash.
          </p>
          <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap bg-bg-soft p-3 text-[14px] leading-relaxed">
            {cleaned}
          </pre>
          <div className="mt-3">
            <CopyButton text={cleaned} label="Copy the tidied text" className="ek-btn ek-btn-quiet" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
