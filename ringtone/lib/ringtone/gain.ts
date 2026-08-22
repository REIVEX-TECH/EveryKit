/**
 * Changing the loudness of a clip, and knowing when that will clip.
 *
 * Clipping is the whole reason this is its own module. Multiplying samples past
 * the range an audio format can hold does not make them louder, it flattens the
 * peaks into a buzz, and the encoder that follows clamps them silently. So the
 * gain is applied here where the overflow can be counted and reported before
 * anything is encoded, rather than discovered by ear afterwards.
 *
 * Pure and AudioContext-free, so the arithmetic is tested in Node.
 */

export type GainResult = {
  /** The scaled channel, not yet clamped, so the caller can still inspect it. */
  channel: Float32Array;
  /** How many samples landed outside [-1, 1] and would be clipped on encode. */
  clippedSamples: number;
};

/** Multiply every sample by `gain`, counting the ones that overflow. */
export function applyGain(channel: Float32Array, gain: number): GainResult {
  const out = new Float32Array(channel.length);
  let clippedSamples = 0;
  for (let i = 0; i < channel.length; i++) {
    const v = channel[i] * gain;
    if (v > 1 || v < -1) clippedSamples += 1;
    out[i] = v;
  }
  return { channel: out, clippedSamples };
}

/**
 * The largest gain that leaves the loudest sample just touching the ceiling.
 *
 * This is what a "normalise" or "maximise without clipping" would use, and it
 * is what the UI suggests when a chosen gain would clip: the peak sample sets
 * the limit, so 1 / peak is as loud as the clip can go cleanly.
 */
export function maxCleanGain(channel: Float32Array): number {
  let peak = 0;
  for (let i = 0; i < channel.length; i++) {
    const a = Math.abs(channel[i]);
    if (a > peak) peak = a;
  }
  if (peak === 0) return 1;
  return 1 / peak;
}

/** The fraction of samples that would clip at a given gain, 0 to 1. */
export function clippedFraction(channel: Float32Array, gain: number): number {
  if (channel.length === 0) return 0;
  return applyGain(channel, gain).clippedSamples / channel.length;
}

/** A percentage (100 = unchanged) as a linear gain multiplier. */
export function percentToGain(percent: number): number {
  return percent / 100;
}
