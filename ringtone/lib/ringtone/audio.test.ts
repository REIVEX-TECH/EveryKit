import { describe, expect, it } from "vitest";
import {
  applyFades,
  FADE_SECONDS,
  formatTime,
  MAX_SECONDS,
  normaliseSelection,
  outputFilename,
  peaks,
  selectionSamples,
  sliceChannel,
  toInt16,
} from "./audio";

/** A steady tone, so any change to the envelope is unambiguous. */
function tone(seconds: number, sampleRate = 44100, amplitude = 0.8): Float32Array {
  const out = new Float32Array(Math.round(seconds * sampleRate));
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * amplitude;
  }
  return out;
}

describe("the selection", () => {
  it("keeps the handles inside the track", () => {
    expect(normaliseSelection({ start: -5, end: 999 }, 30)).toEqual({ start: 0, end: 30 });
  });

  it("swaps the handles when they are dragged past each other", () => {
    expect(normaliseSelection({ start: 20, end: 5 }, 30)).toEqual({ start: 5, end: 20 });
  });

  it("caps at sixty seconds by moving the end, not the start", () => {
    // The start is the bit someone chose deliberately, so it is the one to keep.
    const selection = normaliseSelection({ start: 40, end: 200 }, 300);
    expect(selection.start).toBe(40);
    expect(selection.end).toBe(40 + MAX_SECONDS);
  });

  it("never produces a zero length clip", () => {
    // A zero-length selection encodes to a zero-byte file, which looks like a
    // broken download rather than an empty one.
    const selection = normaliseSelection({ start: 10, end: 10 }, 30);
    expect(selection.end).toBeGreaterThan(selection.start);
  });

  it("converts to sample offsets without leaving the buffer", () => {
    const total = 44100 * 10;
    expect(selectionSamples({ start: 1, end: 2 }, 44100, total)).toEqual({
      from: 44100,
      to: 88200,
    });
    expect(selectionSamples({ start: 0, end: 999 }, 44100, total)).toEqual({
      from: 0,
      to: total,
    });
  });

  it("slices the span asked for", () => {
    const channel = tone(3);
    const cut = sliceChannel(channel, 44100, 44100 * 2);
    expect(cut.length).toBe(44100);
    expect(cut[0]).toBeCloseTo(channel[44100], 6);
  });

  it("slices safely when the range runs past the end", () => {
    const channel = tone(1);
    expect(sliceChannel(channel, 0, 999999).length).toBe(channel.length);
    expect(sliceChannel(channel, -50, 10).length).toBe(10);
  });
});

describe("fades", () => {
  const sampleRate = 44100;

  it("starts a fade in at silence and reaches full level", () => {
    const channel = applyFades(tone(3), sampleRate, true, false);
    expect(Math.abs(channel[0])).toBeLessThan(0.001);
    // Halfway through the fade the envelope is about half.
    const half = Math.round((FADE_SECONDS * sampleRate) / 2);
    const peakNear = Math.max(...Array.from(channel.slice(half - 200, half + 200)).map(Math.abs));
    expect(peakNear).toBeGreaterThan(0.2);
    expect(peakNear).toBeLessThan(0.65);
    // Past the fade it is untouched.
    const later = Math.max(...Array.from(channel.slice(sampleRate, sampleRate + 500)).map(Math.abs));
    expect(later).toBeGreaterThan(0.7);
  });

  it("ends a fade out at silence", () => {
    const channel = applyFades(tone(3), sampleRate, false, true);
    expect(Math.abs(channel[channel.length - 1])).toBeLessThan(0.001);
    const before = Math.max(
      ...Array.from(channel.slice(sampleRate, sampleRate + 500)).map(Math.abs),
    );
    expect(before).toBeGreaterThan(0.7);
  });

  it("leaves the audio alone when neither fade is on", () => {
    const original = tone(2);
    const copy = applyFades(tone(2), sampleRate, false, false);
    expect(copy[0]).toBeCloseTo(original[0], 6);
    expect(copy[copy.length - 1]).toBeCloseTo(original[original.length - 1], 6);
  });

  it("does not overlap the two fades on a very short clip", () => {
    // Half a second in and half a second out on a 0.6s clip would attenuate the
    // middle twice and dip it, which sounds like a fault rather than a fade.
    const channel = applyFades(tone(0.6), sampleRate, true, true);
    const middle = channel[Math.floor(channel.length / 2)];
    const peakMiddle = Math.max(
      ...Array.from(channel.slice(Math.floor(channel.length / 2) - 100, Math.floor(channel.length / 2) + 100)).map(Math.abs),
    );
    expect(Number.isFinite(middle)).toBe(true);
    expect(peakMiddle).toBeGreaterThan(0.2);
  });

  it("copes with an empty channel", () => {
    expect(applyFades(new Float32Array(0), sampleRate, true, true).length).toBe(0);
  });
});

describe("converting to 16-bit", () => {
  it("maps the range without wrapping", () => {
    const out = toInt16(Float32Array.from([0, 1, -1, 0.5, -0.5]));
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(32767);
    expect(out[2]).toBe(-32768);
    expect(out[3]).toBeGreaterThan(16000);
    expect(out[4]).toBeLessThan(-16000);
  });

  it("clamps samples that exceed the range", () => {
    // Floats out of an AudioContext can exceed 1 after mixing. Letting those
    // wrap turns a loud passage into a burst of noise.
    const out = toInt16(Float32Array.from([2.5, -3]));
    expect(out[0]).toBe(32767);
    expect(out[1]).toBe(-32768);
  });
});

describe("the waveform summary", () => {
  it("gives one bucket per drawn column", () => {
    expect(peaks(tone(5), 300)).toHaveLength(300);
  });

  it("keeps the shape rather than flattening it", () => {
    // Both extremes per bucket, so a transient shows. Averaging absolute values
    // instead would make every waveform look like a flat sausage.
    const summary = peaks(tone(2), 100);
    for (const bucket of summary) {
      expect(bucket.max).toBeGreaterThan(0.5);
      expect(bucket.min).toBeLessThan(-0.5);
    }
  });

  it("shows silence as a flat line", () => {
    const summary = peaks(new Float32Array(44100), 50);
    expect(summary.every((bucket) => bucket.min === 0 && bucket.max === 0)).toBe(true);
  });

  it("returns nothing for nothing", () => {
    expect(peaks(new Float32Array(0), 100)).toEqual([]);
    expect(peaks(tone(1), 0)).toEqual([]);
  });
});

describe("labels", () => {
  it("writes time the way a player does", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(9)).toBe("0:09");
    expect(formatTime(61)).toBe("1:01");
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(-5)).toBe("0:00");
  });

  it("names the file after the track", () => {
    expect(outputFilename("Song Name.mp3")).toBe("Song Name-ringtone.mp3");
    expect(outputFilename("noextension")).toBe("noextension-ringtone.mp3");
  });
});
