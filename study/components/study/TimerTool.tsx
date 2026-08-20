"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import {
  DEFAULTS,
  MAX_MINUTES,
  MIN_MINUTES,
  clampMinutes,
  clock,
  secondsLeft,
  tabTitle,
  playChime,
  type Phase,
} from "@/lib/study/timer";
import { Field, Input } from "./ui";

/**
 * A pomodoro timer with nothing behind it.
 *
 * No account, no history, no storage of any kind: close the tab and it is gone.
 * That is a deliberate scope call rather than an omission. A timer that
 * remembers your sessions needs somewhere to keep them, and the only thing this
 * site keeps is an email address.
 *
 * The countdown reads the clock rather than decrementing a counter, because a
 * background tab has its timers throttled to roughly once a minute and a
 * counting-down number would be minutes wrong by the time anybody looked back
 * at it. The interval here only decides how often to repaint.
 */
export function TimerTool() {
  // Typed as number, not as the literal the const carries: DEFAULTS is `as
  // const`, so inferring from it would make these settings unchangeable.
  const [focusMinutes, setFocusMinutes] = useState<number>(DEFAULTS.focus);
  const [breakMinutes, setBreakMinutes] = useState<number>(DEFAULTS.break);
  const [phase, setPhase] = useState<Phase>("focus");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [now, setNow] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);

  const audio = useRef<AudioContext | null>(null);
  const rang = useRef(false);

  const total = phase === "focus" ? focusMinutes : breakMinutes;
  const running = startedAt !== null;
  const left = now === null ? total * 60 : secondsLeft(total, startedAt, elapsedBefore, now);

  // Repaint once a second while running. Nothing is computed from the tick.
  useEffect(() => {
    setNow(Date.now());
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [running]);

  const chime = useCallback(() => {
    try {
      // Created on first use, because a context made before a user gesture is
      // suspended by every browser and would never make a sound.
      audio.current ??= new AudioContext();
      void audio.current.resume();
      playChime(audio.current);
    } catch {
      // No audio available. The phase still changes, silently.
    }
  }, []);

  // The phase change. Guarded by a ref so a repaint at zero cannot ring twice.
  useEffect(() => {
    if (!running || left > 0) {
      rang.current = false;
      return;
    }
    if (rang.current) return;
    rang.current = true;

    chime();
    setPhase((current) => (current === "focus" ? "break" : "focus"));
    if (phase === "focus") setCompleted((count) => count + 1);
    setStartedAt(Date.now());
    setElapsedBefore(0);
  }, [left, running, phase, chime]);

  // The countdown in the tab title, so it is readable from another tab.
  useEffect(() => {
    document.title = tabTitle(left, phase, running);
    return () => {
      document.title = "EveryKit Study";
    };
  }, [left, phase, running]);

  const start = () => {
    // Touching the context inside the click is what unlocks audio for later.
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {
      // Fine. The timer runs without a chime.
    }
    setStartedAt(Date.now());
  };

  const pause = () => {
    if (startedAt === null) return;
    setElapsedBefore((served) => served + (Date.now() - startedAt) / 1000);
    setStartedAt(null);
  };

  const reset = () => {
    setStartedAt(null);
    setElapsedBefore(0);
    rang.current = false;
  };

  const switchTo = (next: Phase) => {
    setPhase(next);
    reset();
  };

  const progress = total > 0 ? 1 - left / (total * 60) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="ek-card flex flex-col items-center gap-5 p-8">
        <div className="flex gap-2">
          {(
            [
              ["focus", "Focus"],
              ["break", "Break"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={phase === value}
              onClick={() => switchTo(value)}
              className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                phase === value
                  ? "bg-primary-dark text-white"
                  : "border border-line bg-background hover:border-line-strong"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <p
          role="timer"
          aria-live="off"
          className="text-[72px] font-semibold leading-none tabular-nums sm:text-[96px]"
        >
          {clock(left)}
        </p>

        {/* A bar rather than a ring: one flat fill, no gradient, and it reads at
            a glance from across a desk. */}
        <div className="h-2 w-full max-w-[420px] overflow-hidden rounded-full bg-bg-soft">
          <div
            className="h-2 rounded-full bg-primary-dark transition-[width] duration-300"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {running ? (
            <button type="button" onClick={pause} className="ek-btn ek-btn-accent">
              <Pause aria-hidden="true" className="h-4 w-4" />
              Pause
            </button>
          ) : (
            <button type="button" onClick={start} className="ek-btn ek-btn-accent">
              <Play aria-hidden="true" className="h-4 w-4" />
              {elapsedBefore > 0 ? "Resume" : "Start"}
            </button>
          )}
          <button type="button" onClick={reset} className="ek-btn ek-btn-quiet">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Reset
          </button>
        </div>

        <p aria-live="polite" className="text-[14px] text-text-light">
          {completed === 0
            ? "No focus sessions finished yet in this tab."
            : `${completed} focus session${completed === 1 ? "" : "s"} finished in this tab.`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Focus, in minutes" htmlFor="t-focus">
          <Input
            id="t-focus"
            type="number"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            value={focusMinutes}
            onChange={(event) => {
              setFocusMinutes(clampMinutes(Number(event.target.value)));
              if (phase === "focus") reset();
            }}
          />
        </Field>
        <Field label="Break, in minutes" htmlFor="t-break">
          <Input
            id="t-break"
            type="number"
            min={MIN_MINUTES}
            max={MAX_MINUTES}
            value={breakMinutes}
            onChange={(event) => {
              setBreakMinutes(clampMinutes(Number(event.target.value)));
              if (phase === "break") reset();
            }}
          />
        </Field>
      </div>

      <p className="text-[13px] text-text-light">
        Nothing is stored. Close the tab and the count goes with it, because there is no account
        here to keep it in. The countdown is worked out from the clock rather than counted down, so
        leaving this tab in the background and coming back to it shows the right time rather than
        however far a throttled timer got. The chime is two tones generated in the page, not a
        sound file, so nothing is downloaded to make it.
      </p>
    </div>
  );
}
