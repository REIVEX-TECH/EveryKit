"use client";

import { useMemo, useState } from "react";
import { analyseEssay } from "@/lib/study/essayLength";
import { duration } from "@/lib/study/reading";
import { CopyButton, TextBox } from "./ui";

/**
 * Paste an essay, see whether it hits the length a rubric asks for.
 *
 * One job: counts and page estimates, live as you type. The page numbers name
 * the format they assume, because a page is only a page at a given size and
 * spacing.
 */
export function EssayLengthTool() {
  const [text, setText] = useState("");
  const stats = useMemo(() => analyseEssay(text), [text]);

  const summary = () =>
    [
      `Words: ${stats.words}`,
      `Characters: ${stats.characters} (${stats.charactersNoSpaces} without spaces)`,
      `Sentences: ${stats.sentences}`,
      `Reading time: ${duration(stats.readingMinutes)}`,
      `Speaking time: ${duration(stats.speakingMinutes)}`,
      ...stats.pages.map((p) => `${p.label}: ${p.pages} page${p.pages === 1 ? "" : "s"}`),
    ].join("\n");

  return (
    <div className="flex flex-col gap-4">
      <TextBox
        aria-label="Your text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your essay or draft here."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Words" value={stats.words.toLocaleString()} />
        <Stat label="Characters" value={stats.characters.toLocaleString()} />
        <Stat label="Characters, no spaces" value={stats.charactersNoSpaces.toLocaleString()} />
        <Stat label="Sentences" value={stats.sentences.toLocaleString()} />
        <Stat label="Reading time" value={text.trim() ? duration(stats.readingMinutes) : "—"} />
        <Stat label="Speaking time" value={text.trim() ? duration(stats.speakingMinutes) : "—"} />
      </div>

      <div className="ek-card p-4">
        <h2 className="text-[15px] font-semibold">Estimated pages</h2>
        <p className="mt-1 text-[13px] text-text-light">
          At 12 point with one inch margins. Change the font, size or spacing and the count changes,
          so treat these as a guide.
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {stats.pages.map((p) => (
            <li key={p.label} className="flex items-baseline justify-between text-[15px]">
              <span className="text-text-light">{p.label}</span>
              <span className="font-semibold">
                {text.trim() ? `${p.pages} page${p.pages === 1 ? "" : "s"}` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <CopyButton text={summary} label="Copy the counts" disabled={stats.words === 0} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="ek-card p-3">
      <div className="text-[13px] text-text-light">{label}</div>
      <div className="mt-0.5 text-[20px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}
