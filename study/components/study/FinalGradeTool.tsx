"use client";

import { useMemo, useState } from "react";
import { percent, sentence, whatIsNeeded } from "@/lib/study/finalGrade";
import { CopyButton, Field, Input } from "./ui";

/**
 * What do I need on the final.
 *
 * One sentence for an answer, because that is the whole question. The three
 * numbers underneath are there to be checked against, not to be read first.
 */
export function FinalGradeTool() {
  const [current, setCurrent] = useState("");
  const [weight, setWeight] = useState("");
  const [target, setTarget] = useState("");

  const answer = useMemo(
    () => whatIsNeeded(current, weight, target),
    [current, weight, target],
  );
  const line = sentence(answer, target.trim() || "your target");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Grade so far"
          htmlFor="fg-current"
          note="Your mark for everything except the final."
        >
          <Input
            id="fg-current"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            inputMode="decimal"
            placeholder="85"
            aria-describedby="fg-current-unit"
          />
        </Field>

        <Field
          label="The final is worth"
          htmlFor="fg-weight"
          note="Its share of the whole course, as a percentage."
        >
          <Input
            id="fg-weight"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
            inputMode="decimal"
            placeholder="30"
          />
        </Field>

        <Field label="You want" htmlFor="fg-target" note="The mark you are aiming to finish on.">
          <Input
            id="fg-target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            inputMode="decimal"
            placeholder="90"
          />
        </Field>
      </div>

      <div
        className={`ek-card p-5 ${answer.kind === "unreachable" || answer.kind === "invalid" ? "border-danger/40" : "bg-bg-soft"}`}
      >
        <p
          role={answer.kind === "invalid" ? "alert" : "status"}
          className="text-[19px] leading-snug"
        >
          {line}
        </p>

        {answer.kind === "needed" ? (
          <p className="mt-3 text-[36px] font-semibold leading-none tabular-nums">
            {percent(answer.required)}
          </p>
        ) : null}

        {answer.kind === "unreachable" ? (
          <p className="mt-3 text-[14px] text-text-light">
            Every other calculator prints {percent(answer.required)} here and stops. That number
            is real arithmetic and no use: no mark on the final gets you there. Aiming at{" "}
            {percent(answer.best)} or below is the honest version of the question.
          </p>
        ) : null}

        {answer.kind === "needed" || answer.kind === "already" || answer.kind === "unreachable" ? (
          <div className="mt-4">
            <CopyButton text={line} label="Copy the answer" />
          </div>
        ) : null}
      </div>

      <p className="text-[13px] text-text-light">
        The arithmetic: if the final is worth w of the course and everything else so far is c, the
        course ends at c times (1 minus w) plus f times w. Solving that for f is what this does.
        It assumes the rest of your grade is already final, which it is once the only thing left
        is the exam.
      </p>
    </div>
  );
}
