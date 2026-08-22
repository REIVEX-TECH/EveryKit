"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCountdownQuery,
  countdownSentence,
  parseCountdown,
  timeLeft,
} from "@/lib/study/countdown";
import { CopyButton, Field, Input, Note } from "./ui";

/**
 * A countdown to an exam, encoded entirely in the link.
 *
 * Nothing is stored: the name and date go in the URL, so sharing is just
 * sending the link, and the page says so under the share button rather than
 * implying there is an account or a saved list somewhere.
 */
export function ExamCountdownTool() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  // Read an existing countdown out of the link on load, and start the clock.
  useEffect(() => {
    const parsed = parseCountdown(window.location.search);
    if (parsed) {
      setName(parsed.name);
      setDate(parsed.date);
    }
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Keep the shareable link in step with the fields.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setShareUrl("");
      return;
    }
    setShareUrl(`${window.location.origin}${window.location.pathname}${buildCountdownQuery({ name, date })}`);
  }, [name, date]);

  const left = useMemo(() => {
    if (!now || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return timeLeft(date, now);
  }, [now, date]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Exam name" htmlFor="cd-name" note="Optional. Appears in the countdown and the link.">
          <Input
            id="cd-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Maths paper 1"
          />
        </Field>
        <Field label="Exam date" htmlFor="cd-date">
          <Input id="cd-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      {left ? (
        <section className="ek-card p-6 text-center">
          {left.passed ? (
            <p className="text-[20px]">{countdownSentence(left, name)}</p>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-6">
                <Unit value={left.days} label={left.days === 1 ? "day" : "days"} />
                <Unit value={left.hours} label={left.hours === 1 ? "hour" : "hours"} />
                <Unit value={left.minutes} label={left.minutes === 1 ? "minute" : "minutes"} />
              </div>
              <p className="mt-4 text-[15px] text-text-light">{countdownSentence(left, name)}</p>
            </>
          )}
        </section>
      ) : (
        <Note tone="quiet">Pick a date to start the countdown.</Note>
      )}

      {shareUrl ? (
        <div>
          <label htmlFor="cd-link" className="block text-[14px] font-semibold">
            Shareable link
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              id="cd-link"
              readOnly
              value={shareUrl}
              className="min-w-0 flex-1 rounded-[10px] border border-line bg-bg-soft px-3 py-2 text-[14px] outline-none"
            />
            <CopyButton text={shareUrl} label="Copy link" className="ek-btn ek-btn-accent" />
          </div>
          <p className="mt-2 text-[13px] text-text-light">
            This link contains the details you typed. Nothing is saved here: open it any time, or
            send it to someone, and the countdown rebuilds itself from the link.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-[40px] leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[13px] text-text-light">{label}</p>
    </div>
  );
}
