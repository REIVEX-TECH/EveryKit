"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { clampMinutes, clock, playChime, secondsLeft } from "@/lib/teach/timer";
import { Note } from "./ui";

type Mode = "countdown" | "stopwatch";

const PRESETS = [1, 2, 5, 10, 15, 20, 30] as const;

export function ClassroomTimerTool() {
  const [mode, setMode] = useState<Mode>("countdown");
  const [minutes, setMinutes] = useState(5);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(false);

  const audioRef = useRef<AudioContext | null>(null);
  const chimedRef = useRef(false);

  // One clock, read four times a second while running. The arithmetic in
  // timer.ts works from the start instant, so a background tab that throttles
  // this interval still shows the right time the moment it is looked at, and
  // the display is m:ss, so a quarter-second tick is smooth enough without the
  // waste of an animation frame sixty times a second.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const remaining = secondsLeft(minutes, startedAt, elapsedBefore, now);
  const elapsedSeconds =
    startedAt === null ? Math.floor(elapsedBefore) : Math.floor(elapsedBefore + (now - startedAt) / 1000);
  const display = mode === "countdown" ? clock(remaining) : clock(elapsedSeconds);

  // Fire the chime once when a countdown reaches zero.
  useEffect(() => {
    if (mode !== "countdown" || !running) return;
    if (remaining === 0 && !chimedRef.current) {
      chimedRef.current = true;
      setRunning(false);
      setStartedAt(null);
      setElapsedBefore(minutes * 60);
      setDone(true);
      try {
        if (!audioRef.current) audioRef.current = new AudioContext();
        void audioRef.current.resume();
        playChime(audioRef.current);
      } catch {
        /* audio is a nicety, not a requirement */
      }
    }
  }, [mode, running, remaining, minutes]);

  const start = useCallback(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = new AudioContext();
      } catch {
        /* ignore */
      }
    }
    void audioRef.current?.resume();
    chimedRef.current = false;
    setDone(false);
    setStartedAt(Date.now());
    setNow(Date.now());
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    setElapsedBefore((prev) => (startedAt === null ? prev : prev + (Date.now() - startedAt) / 1000));
    setStartedAt(null);
    setRunning(false);
  }, [startedAt]);

  const reset = useCallback(() => {
    setRunning(false);
    setStartedAt(null);
    setElapsedBefore(0);
    setDone(false);
    chimedRef.current = false;
  }, []);

  function pickMode(next: Mode) {
    setMode(next);
    reset();
  }
  function pickPreset(m: number) {
    setMinutes(clampMinutes(m));
    reset();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex rounded-full border border-line p-1">
        {(["countdown", "stopwatch"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => pickMode(m)}
            aria-pressed={mode === m}
            className={`rounded-full px-4 py-1.5 text-[14px] ${
              mode === m ? "bg-primary-dark text-white" : "text-text-light"
            }`}
          >
            {m === "countdown" ? "Countdown" : "Stopwatch"}
          </button>
        ))}
      </div>

      {mode === "countdown" ? (
        <div className="flex flex-wrap justify-center gap-2">
          {PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pickPreset(m)}
              aria-pressed={minutes === m && !running}
              className={`rounded-full border px-3 py-1 text-[13px] ${
                minutes === m ? "border-primary bg-primary/10 text-primary-dark" : "border-line text-text-light hover:border-line-strong"
              }`}
            >
              {m} min
            </button>
          ))}
          <label className="flex items-center gap-1.5 text-[13px] text-text-light">
            or
            <input
              type="number"
              min={1}
              max={120}
              value={minutes}
              onChange={(e) => pickPreset(Number(e.target.value) || 1)}
              className="w-16 rounded-[8px] border border-line bg-background px-2 py-1 text-center text-[14px] outline-none focus:border-primary"
              aria-label="Custom minutes"
            />
          </label>
        </div>
      ) : null}

      <div
        className={`select-none text-center font-mono tabular-nums leading-none ${
          done ? "text-success" : "text-foreground"
        }`}
        style={{ fontSize: "clamp(64px, 22vw, 200px)", fontWeight: 600 }}
        aria-live="off"
      >
        {display}
      </div>

      {done ? <Note tone="ok">Time is up.</Note> : null}

      <div className="flex gap-3">
        {running ? (
          <button type="button" onClick={pause} className="ek-btn ek-btn-quiet">
            <Pause aria-hidden="true" className="h-4 w-4" />
            Pause
          </button>
        ) : (
          <button type="button" onClick={start} className="ek-btn ek-btn-accent">
            <Play aria-hidden="true" className="h-4 w-4" />
            {elapsedBefore > 0 || startedAt !== null ? "Resume" : "Start"}
          </button>
        )}
        <button type="button" onClick={reset} className="ek-btn ek-btn-quiet">
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Reset
        </button>
      </div>

      <Note tone="quiet">
        The timer runs in your browser and chimes softly when a countdown ends. Keep the tab visible on the board.
      </Note>
    </div>
  );
}
