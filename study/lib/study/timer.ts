/**
 * The pomodoro timer's arithmetic and its chime, apart from its UI.
 *
 * The countdown is worked out from a start instant and the clock, not by
 * subtracting one from a counter every second. A counter drifts, and a
 * background tab in every modern browser throttles its timers to once a minute,
 * so a counting-down number is minutes wrong by the time somebody looks back at
 * it. Reading the clock is right whatever the browser did while it was hidden.
 */

export type Phase = "focus" | "break";

export const DEFAULTS = { focus: 25, break: 5 } as const;

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 120;

export function clampMinutes(value: number): number {
  if (!Number.isFinite(value)) return DEFAULTS.focus;
  return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, Math.round(value)));
}

/**
 * Seconds left, from when it started and how long it should run.
 *
 * `elapsedBefore` carries the time already served across a pause, so pausing
 * and resuming does not restart the arithmetic.
 */
export function secondsLeft(
  totalMinutes: number,
  startedAt: number | null,
  elapsedBefore: number,
  now: number,
): number {
  const total = totalMinutes * 60;
  const running = startedAt === null ? 0 : (now - startedAt) / 1000;
  return Math.max(0, Math.ceil(total - elapsedBefore - running));
}

/** m:ss, the shape every timer uses. */
export function clock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

/** The tab title, so the countdown is readable from another tab. */
export function tabTitle(seconds: number, phase: Phase, running: boolean): string {
  if (!running && seconds === 0) return "EveryKit Study";
  const label = phase === "focus" ? "focus" : "break";
  return `${clock(seconds)} ${label} | EveryKit Study`;
}

/**
 * The chime, generated rather than downloaded.
 *
 * No audio file: a sound asset is a request, a licence question and a thing to
 * host, and two sine tones through the Web Audio API are none of those. Two
 * notes a fifth apart with a soft envelope, because a square wave at full
 * volume in a quiet room is a fright rather than a prompt.
 */
export function playChime(context: AudioContext): void {
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.value = 0.0001;
  master.connect(context.destination);

  // A short ramp up and a long ramp down. An abrupt start clicks audibly.
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

  for (const [frequency, at] of [
    [660, 0],
    [990, 0.18],
  ] as const) {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    const voice = context.createGain();
    voice.gain.setValueAtTime(0, now + at);
    voice.gain.linearRampToValueAtTime(1, now + at + 0.01);
    voice.gain.exponentialRampToValueAtTime(0.0001, now + at + 1.1);
    oscillator.connect(voice);
    voice.connect(master);
    oscillator.start(now + at);
    oscillator.stop(now + at + 1.2);
  }
}
