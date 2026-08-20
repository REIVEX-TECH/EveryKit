"use client";

import { useEffect, useMemo, useState } from "react";
import { FLAGS, MAX_MATCHES, highlight, type Match } from "@/lib/dev/regex";
import { REGEX_TIMEOUT_MS, regexInWorker } from "@/lib/dev/work";
import { Input, Note, TextBox } from "./ui";

/**
 * A regex tester that cannot lock the tab.
 *
 * Every match runs in a worker with a two second kill. That is the whole reason
 * this tool is not thirty lines: `(a+)+b` against a string of a's does not
 * finish, and there is no way to interrupt a running regex on the main thread.
 * A worker can be terminated, so it is.
 */
export function RegexTool() {
  const [pattern, setPattern] = useState("(\\w+)@(\\w+)\\.com");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("ahad@example.com and someone@other.com");
  const [matches, setMatches] = useState<Match[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let live = true;
    setRunning(true);

    // Debounced, because every keystroke would otherwise start a worker, and a
    // worker that is started and killed 200ms later has done nothing useful.
    const timer = setTimeout(() => {
      regexInWorker(pattern, flags, text)
        .then((result) => {
          if (!live) return;
          if (result.ok) {
            setMatches(result.matches);
            setTruncated(result.truncated);
            setError(null);
          } else {
            setMatches([]);
            setError(result.message);
          }
        })
        .catch((thrown: Error) => {
          if (!live) return;
          setMatches([]);
          setError(thrown.message);
        })
        .finally(() => {
          if (live) setRunning(false);
        });
    }, 250);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [pattern, flags, text]);

  const pieces = useMemo(() => highlight(text, matches), [text, matches]);

  function toggleFlag(flag: string) {
    setFlags((current) =>
      current.includes(flag) ? current.replace(flag, "") : current + flag,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="rx-pattern" className="block text-[14px] font-semibold">
            Pattern
          </label>
          <div className="mt-2 flex items-center gap-1">
            <span aria-hidden="true" className="font-mono text-[15px] text-text-light">/</span>
            <Input
              id="rx-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              className="font-mono text-[14px]"
              placeholder="\\d{4}-\\d{2}-\\d{2}"
            />
            <span aria-hidden="true" className="font-mono text-[15px] text-text-light">
              /{flags}
            </span>
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="text-[14px] font-semibold">Flags</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {FLAGS.map(({ flag, label, note }) => {
            const on = flags.includes(flag);
            return (
              <button
                key={flag}
                type="button"
                aria-pressed={on}
                title={note}
                onClick={() => toggleFlag(flag)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                  on
                    ? "bg-primary-dark text-white"
                    : "border border-line bg-background hover:border-line-strong"
                }`}
              >
                <span className="font-mono">{flag}</span>
                <span className="ml-1.5 font-normal">{label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="rx-text" className="block text-[14px] font-semibold">
          Test string
        </label>
        <TextBox
          id="rx-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="mt-2 min-h-[140px]"
        />
      </div>

      {error ? <Note tone="bad">{error}</Note> : null}

      <section>
        <h2 className="text-[15px]">
          {running ? "Matching" : `${matches.length} ${matches.length === 1 ? "match" : "matches"}`}
        </h2>
        {truncated ? (
          <p className="mt-1 text-[13px] text-text-light">
            Stopped at {MAX_MATCHES}. There are more.
          </p>
        ) : null}

        <div className="ek-card mt-2 overflow-x-auto whitespace-pre-wrap break-words bg-bg-soft p-3 font-mono text-[13px] leading-relaxed">
          {pieces.map((piece, index) =>
            piece.matched ? (
              <mark key={index} className="rounded-[3px] bg-[#ffe0cc] px-0.5 text-foreground">
                {piece.text}
              </mark>
            ) : (
              <span key={index}>{piece.text}</span>
            ),
          )}
        </div>

        {matches.length > 0 ? (
          <ol className="ek-card mt-3 divide-y divide-line">
            {matches.slice(0, 50).map((match, index) => (
              <li key={`${match.start}-${index}`} className="px-3 py-2">
                <p className="font-mono text-[13px]">
                  <span className="text-text-light">at {match.start}: </span>
                  {match.value === "" ? (
                    <span className="text-text-light">an empty match</span>
                  ) : (
                    match.value
                  )}
                </p>
                {match.groups.length > 0 ? (
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {match.groups.map((group) => (
                      <li key={group.index} className="font-mono text-[12px] text-text-light">
                        {group.name ? `${group.name} (${group.index})` : `group ${group.index}`}:{" "}
                        {group.value === undefined ? "did not participate" : group.value}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}

        <p className="mt-3 text-[13px] text-text-light">
          Matching runs in a worker and is stopped after {REGEX_TIMEOUT_MS / 1000} seconds. A
          pattern that nests one repeat inside another, like (a+)+, can take longer than the
          universe has left on input that nearly matches, and a regex cannot be interrupted once it
          starts. Killing the worker is the only way to get the page back.
        </p>
      </section>
    </div>
  );
}
