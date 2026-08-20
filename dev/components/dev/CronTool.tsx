"use client";

import { useEffect, useMemo, useState } from "react";
import { nextRuns, parseCron } from "@/lib/dev/cron";
import { localZoneName, relative, toLocalString } from "@/lib/dev/timestamp";
import { CopyButton, Input, Note } from "./ui";

/** Schedules people actually write, as a way in. */
const EXAMPLES = [
  { expression: "*/15 * * * *", what: "every quarter of an hour" },
  { expression: "0 9 * * MON-FRI", what: "weekday mornings" },
  { expression: "0 0 1 * *", what: "the first of the month" },
  { expression: "30 3 * * SUN", what: "early Sunday" },
  { expression: "0 0 13 * FRI", what: "the surprising one" },
];

const FIELD_LABELS = ["minute", "hour", "day of month", "month", "day of week"];

/**
 * A cron expression, explained.
 *
 * The sentence and the next five run times together, because either alone is
 * half an answer: the sentence can be misread and the times can be a
 * coincidence, and agreeing with each other is what makes them convincing.
 */
export function CronTool() {
  const [expression, setExpression] = useState("*/15 * * * *");
  const [now, setNow] = useState<Date | null>(null);

  // After mount only. Run times depend on the current moment, and rendering
  // them on the server would produce markup the browser disagrees with.
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const zone = useMemo(() => localZoneName(), []);
  const result = useMemo(() => parseCron(expression), [expression]);
  const runs = useMemo(
    () => (result.ok && now ? nextRuns(result.parsed, now, 5) : []),
    [result, now],
  );

  const fields = expression.trim().split(/\s+/);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="cron-in" className="block text-[14px] font-semibold">
          Cron expression
        </label>
        <Input
          id="cron-in"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="*/15 * * * *"
          className="mt-2 font-mono text-[16px]"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {FIELD_LABELS.map((label, index) => (
            <span key={label} className="text-[12px] text-text-light">
              <span className="font-mono text-foreground">{fields[index] ?? "?"}</span> {label}
            </span>
          ))}
        </div>
      </div>

      {result.ok ? (
        <div className="ek-card p-4">
          <p className="text-[18px] leading-snug">{result.description}</p>
          <div className="mt-3">
            <CopyButton
              text={result.description}
              label="Copy the explanation"
              className="ek-btn ek-btn-accent px-4 py-2 text-[14px]"
            />
          </div>
        </div>
      ) : (
        <div className="ek-card border-danger/40 p-4">
          <Note tone="bad">{result.error.message}</Note>
          {result.error.field ? (
            <p className="mt-1 text-[13px] text-text-light">
              The problem is in the{" "}
              {FIELD_LABELS[
                ["minute", "hour", "dayOfMonth", "month", "dayOfWeek"].indexOf(result.error.field)
              ]}{" "}
              field.
            </p>
          ) : null}
        </div>
      )}

      {result.ok ? (
        <section>
          <h2 className="text-[15px]">The next five runs</h2>
          <p className="mt-1 text-[13px] text-text-light">In {zone}.</p>
          {runs.length === 0 ? (
            <Note tone="bad">
              {now
                ? "This never runs. The date it asks for does not occur, like the 30th of February."
                : "Working them out."}
            </Note>
          ) : (
            <ol className="ek-card mt-2 divide-y divide-line">
              {runs.map((run) => (
                <li key={run.toISOString()} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                  <span className="font-mono text-[14px]">{toLocalString(run)}</span>
                  <span className="text-[13px] text-text-light">
                    {now ? relative(run, now.getTime()) : ""}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      ) : null}

      <section>
        <h2 className="text-[15px]">Try one of these</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <li key={example.expression}>
              <button
                type="button"
                onClick={() => setExpression(example.expression)}
                className="rounded-full border border-line bg-background px-3 py-1.5 text-[13px] hover:border-line-strong"
              >
                <span className="font-mono">{example.expression}</span>
                <span className="ml-2 text-text-light">{example.what}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
