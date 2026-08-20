"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_SPEAKING_WPM,
  DEFAULT_WPM,
  MAX_WPM,
  MIN_WPM,
  analyse,
  countWords,
  duration,
  pagesSentence,
} from "@/lib/study/reading";
import { CopyButton, Field, Input, TextBox } from "./ui";

/**
 * Reading time, speaking time, and a page estimate that admits it is one.
 *
 * Either paste the text or type the number of words, because both are how the
 * question arrives: sometimes you have the essay and sometimes you only have
 * the word limit.
 */
export function ReadingTimeTool() {
  const [mode, setMode] = useState<"text" | "count">("text");
  const [text, setText] = useState("");
  const [typedCount, setTypedCount] = useState("");
  const [wpm, setWpm] = useState(String(DEFAULT_WPM));
  const [speakingWpm, setSpeakingWpm] = useState(String(DEFAULT_SPEAKING_WPM));

  const words = useMemo(
    () => (mode === "text" ? countWords(text) : Math.max(0, Math.floor(Number(typedCount) || 0))),
    [mode, text, typedCount],
  );

  const result = useMemo(
    () => analyse(words, Number(wpm), Number(speakingWpm)),
    [words, wpm, speakingWpm],
  );

  const summary =
    words === 0
      ? ""
      : `${words.toLocaleString("en")} words. Reading ${duration(result.readingMinutes)}, speaking ${duration(result.speakingMinutes)}.`;

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-[14px] font-semibold">Start from</legend>
        <div className="mt-2 flex gap-2">
          {(
            [
              ["text", "The text"],
              ["count", "A word count"],
            ] as const
          ).map(([value, label]) => (
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
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {mode === "text" ? (
        <div>
          <label htmlFor="rt-text" className="block text-[14px] font-semibold">
            Your text
          </label>
          <TextBox
            id="rt-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Paste the essay, the script or the chapter."
            className="mt-2 min-h-[180px] font-sans text-[15px]"
          />
        </div>
      ) : (
        <div className="max-w-[220px]">
          <Field label="Word count" htmlFor="rt-count">
            <Input
              id="rt-count"
              value={typedCount}
              onChange={(event) => setTypedCount(event.target.value)}
              inputMode="numeric"
              placeholder="1500"
            />
          </Field>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={`Reading pace: ${wpm} words a minute`}
          htmlFor="rt-wpm"
          note="200 is an ordinary adult pace for something you are not studying. Slow to 100 for a dense textbook."
        >
          <input
            id="rt-wpm"
            type="range"
            min={MIN_WPM}
            max={MAX_WPM}
            step={10}
            value={wpm}
            onChange={(event) => setWpm(event.target.value)}
            className="w-full accent-primary"
          />
        </Field>

        <Field
          label={`Speaking pace: ${speakingWpm} words a minute`}
          htmlFor="rt-speaking"
          note="130 is a comfortable presenting pace. Under 120 if you are being interpreted or recorded."
        >
          <input
            id="rt-speaking"
            type="range"
            min={MIN_WPM}
            max={300}
            step={5}
            value={speakingWpm}
            onChange={(event) => setSpeakingWpm(event.target.value)}
            className="w-full accent-primary"
          />
        </Field>
      </div>

      <div className="ek-card bg-bg-soft p-5">
        {words === 0 ? (
          <p className="text-[15px] text-text-light">
            Paste some text, or type a word count, and the times appear here.
          </p>
        ) : (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-[13px] text-text-light">Words</dt>
                <dd className="mt-1 text-[28px] font-semibold tabular-nums">
                  {words.toLocaleString("en")}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-text-light">Reading</dt>
                <dd className="mt-1 text-[28px] font-semibold">{duration(result.readingMinutes)}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-text-light">Speaking</dt>
                <dd className="mt-1 text-[28px] font-semibold">
                  {duration(result.speakingMinutes)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-[14px] text-text-light">{pagesSentence(result)}</p>

            <div className="mt-4">
              <CopyButton text={summary} label="Copy the summary" />
            </div>
          </>
        )}
      </div>

      <p className="text-[13px] text-text-light">
        Words are runs of characters with spaces around them, which is right for English, Urdu,
        Arabic and the European languages. Chinese and Japanese do not put spaces between words, so
        a count of those comes out far too low and the times with it.
      </p>
    </div>
  );
}
