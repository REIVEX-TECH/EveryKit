"use client";

import { useMemo, useState } from "react";
import { describeSummary, lineDiff, wordDiff } from "@/lib/dev/diff";
import { Note, TextBox } from "./ui";

/**
 * Two blocks of text, compared by line or by word.
 *
 * The colours are the design system's: the success green marks additions and
 * the danger red marks removals, but as a left edge and a pale fill rather than
 * as the text colour. Green text on white is 2.1:1 and unreadable, which is
 * exactly the mistake a diff view makes when it colours the words themselves.
 * Every row also carries a plus or a minus, so the two are told apart without
 * relying on colour at all.
 */
export function DiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [mode, setMode] = useState<"line" | "word">("line");

  const lines = useMemo(() => lineDiff(left, right), [left, right]);
  const words = useMemo(() => wordDiff(left, right), [left, right]);

  const summary =
    mode === "line"
      ? describeSummary(lines.summary, "line")
      : describeSummary(words.summary, "word");

  const both = left.trim() !== "" || right.trim() !== "";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label htmlFor="diff-left" className="block text-[14px] font-semibold">
            Original
          </label>
          <TextBox
            id="diff-left"
            value={left}
            onChange={(event) => setLeft(event.target.value)}
            className="mt-2"
            placeholder="Paste the first version"
          />
        </div>
        <div>
          <label htmlFor="diff-right" className="block text-[14px] font-semibold">
            Changed
          </label>
          <TextBox
            id="diff-right"
            value={right}
            onChange={(event) => setRight(event.target.value)}
            className="mt-2"
            placeholder="Paste the second version"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <fieldset>
          <legend className="sr-only">Compare by</legend>
          <div className="flex gap-2">
            {(["line", "word"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                  mode === value
                    ? "bg-primary-dark text-white"
                    : "border border-line bg-background hover:border-line-strong"
                }`}
              >
                By {value}
              </button>
            ))}
          </div>
        </fieldset>
        {both ? <Note tone="quiet">{summary}</Note> : null}
      </div>

      {!both ? (
        <div className="ek-card flex min-h-[120px] items-center justify-center bg-bg-soft p-4">
          <p className="text-[14px] text-text-light">
            Paste something into both boxes to see what changed.
          </p>
        </div>
      ) : mode === "line" ? (
        <div className="ek-card overflow-x-auto">
          <table className="w-full border-collapse font-mono text-[13px]">
            <caption className="sr-only">
              Line by line comparison. Each row is marked added, removed or unchanged.
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Original line number</th>
                <th scope="col">Changed line number</th>
                <th scope="col">Change</th>
                <th scope="col">Text</th>
              </tr>
            </thead>
            <tbody>
              {lines.rows.map((row, index) => (
                <tr
                  key={index}
                  className={
                    row.kind === "added"
                      ? "bg-[#eafaf0]"
                      : row.kind === "removed"
                        ? "bg-[#fdeeee]"
                        : ""
                  }
                >
                  <td className="w-12 select-none border-r border-line px-2 py-0.5 text-right text-text-light">
                    {row.leftNumber ?? ""}
                  </td>
                  <td className="w-12 select-none border-r border-line px-2 py-0.5 text-right text-text-light">
                    {row.rightNumber ?? ""}
                  </td>
                  <td
                    className={`w-6 select-none px-1 py-0.5 text-center font-semibold ${
                      row.kind === "added"
                        ? "text-[#15803d]"
                        : row.kind === "removed"
                          ? "text-danger"
                          : "text-text-light"
                    }`}
                  >
                    {row.kind === "added" ? "+" : row.kind === "removed" ? "−" : ""}
                    <span className="sr-only">
                      {row.kind === "added" ? "added" : row.kind === "removed" ? "removed" : "unchanged"}
                    </span>
                  </td>
                  <td className="whitespace-pre-wrap break-words px-2 py-0.5">{row.text || " "}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ek-card whitespace-pre-wrap break-words p-3 font-mono text-[13px] leading-relaxed">
          {words.pieces.map((piece, index) =>
            piece.kind === "same" ? (
              <span key={index}>{piece.text}</span>
            ) : (
              <span
                key={index}
                className={
                  piece.kind === "added"
                    ? "rounded-[3px] bg-[#eafaf0] text-[#14532d] underline decoration-[#22c55e] decoration-2"
                    : "rounded-[3px] bg-[#fdeeee] text-[#7f1d1d] line-through decoration-danger decoration-2"
                }
              >
                {piece.text}
              </span>
            ),
          )}
        </div>
      )}

      {both ? (
        <p className="text-[13px] text-text-light">
          Additions are marked with a plus and an underline, removals with a minus and a strike,
          so the two are told apart without depending on colour.
        </p>
      ) : null}
    </div>
  );
}
