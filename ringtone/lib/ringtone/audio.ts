/**
 * The audio maths: trimming, fading, and reducing a waveform to something
 * drawable.
 *
 * All pure and all working on plain Float32Arrays, so the parts that decide
 * what the ringtone sounds like can be tested in Node without an AudioContext.
 */

/** Ringtones longer than this are not ringtones. */
export const MAX_SECONDS = 60;

/** Length of each fade, when fades are switched on. */
export const FADE_SECONDS = 0.5;

export type Selection = { start: number; end: number };

/**
 * Pull the selection into range and into shape.
 *
 * Handles are dragged, so start can pass end and either can leave the track.
 * A selection is also capped at 60 seconds by moving the end rather than the
 * start, because the start is the bit someone chose deliberately.
 */
export function normaliseSelection(
  selection: Selection,
  duration: number,
  maxSeconds = MAX_SECONDS,
): Selection {
  const limit = Math.max(0, duration);
  let start = Math.min(Math.max(selection.start, 0), limit);
  let end = Math.min(Math.max(selection.end, 0), limit);

  if (end < start) [start, end] = [end, start];
  // A zero-length selection produces a zero-byte file, so keep a floor.
  if (end - start < 0.05) end = Math.min(start + 0.05, limit);
  if (end - start > maxSeconds) end = start + maxSeconds;

  return { start, end };
}

export function selectionSamples(
  selection: Selection,
  sampleRate: number,
  totalSamples: number,
): { from: number; to: number } {
  const from = Math.max(0, Math.min(Math.round(selection.start * sampleRate), totalSamples));
  const to = Math.max(from, Math.min(Math.round(selection.end * sampleRate), totalSamples));
  return { from, to };
}

/** Copy out the selected span of one channel. */
export function sliceChannel(
  channel: Float32Array,
  from: number,
  to: number,
): Float32Array {
  return channel.slice(Math.max(0, from), Math.max(0, Math.min(to, channel.length)));
}

/**
 * Fade the ends in place.
 *
 * Linear rather than logarithmic: over half a second the difference is barely
 * audible, and a linear ramp is the one a reader of this file can predict.
 * The fades are clamped so that on a very short clip they meet in the middle
 * rather than overlapping into a double attenuation that would dip the centre.
 */
export function applyFades(
  channel: Float32Array,
  sampleRate: number,
  fadeIn: boolean,
  fadeOut: boolean,
  fadeSeconds = FADE_SECONDS,
): Float32Array {
  const length = channel.length;
  if (length === 0) return channel;

  const requested = Math.round(fadeSeconds * sampleRate);
  const both = (fadeIn ? 1 : 0) + (fadeOut ? 1 : 0);
  const fade = both === 0 ? 0 : Math.min(requested, Math.floor(length / both));
  if (fade <= 0) return channel;

  if (fadeIn) {
    for (let i = 0; i < fade; i++) channel[i] *= i / fade;
  }
  if (fadeOut) {
    for (let i = 0; i < fade; i++) {
      channel[length - 1 - i] *= i / fade;
    }
  }
  return channel;
}

/**
 * Convert a float channel to the 16-bit integers an MP3 encoder takes.
 *
 * Clamped before scaling: floats out of an AudioContext can exceed 1 after
 * mixing, and letting those wrap round turns a loud passage into a burst of
 * noise.
 */
export function toInt16(channel: Float32Array): Int16Array {
  const out = new Int16Array(channel.length);
  for (let i = 0; i < channel.length; i++) {
    const sample = Math.max(-1, Math.min(1, channel[i]));
    out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return out;
}

export type Peak = { min: number; max: number };

/**
 * Reduce a channel to one min and max per drawn column.
 *
 * A three minute track is eight million samples and a waveform is a few hundred
 * pixels wide, so drawing has to work from a summary. Keeping both the minimum
 * and the maximum of each bucket is what makes the shape look like the audio;
 * averaging the absolute value instead flattens every transient.
 */
export function peaks(channel: Float32Array, buckets: number): Peak[] {
  const out: Peak[] = [];
  if (buckets <= 0 || channel.length === 0) return out;

  const size = channel.length / buckets;
  for (let bucket = 0; bucket < buckets; bucket++) {
    const from = Math.floor(bucket * size);
    const to = Math.min(channel.length, Math.floor((bucket + 1) * size));
    let min = 0;
    let max = 0;
    for (let i = from; i < to; i++) {
      const sample = channel[i];
      if (sample < min) min = sample;
      if (sample > max) max = sample;
    }
    out.push({ min, max });
  }
  return out;
}

/** Seconds as m:ss, which is how anyone reads a track position. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  return `${minutes}:${String(whole % 60).padStart(2, "0")}`;
}

/** A name that says what the file is. */
export function outputFilename(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const stem = (dot > 0 ? originalName.slice(0, dot) : originalName) || "ringtone";
  return `${stem}-ringtone.mp3`;
}
