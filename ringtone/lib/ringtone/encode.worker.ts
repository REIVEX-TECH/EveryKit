/**
 * MP3 encoding, off the main thread.
 *
 * Encoding a minute of stereo audio is a few hundred milliseconds of solid
 * arithmetic, and a few hundred milliseconds on the main thread is a tab that
 * stops responding to the button that started it. Everything here runs in a
 * worker, and progress is posted back so the page can say how far along it is.
 *
 * The channels arrive as transferables, so a ten megabyte track is moved rather
 * than copied.
 */

import { Mp3Encoder } from "@breezystack/lamejs";

export type EncodeRequest = {
  id: number;
  /** One entry for mono, two for stereo. Already trimmed and faded. */
  channels: ArrayBuffer[];
  sampleRate: number;
  bitrate: number;
};

export type EncodeResponse =
  | { id: number; ok: true; mp3: ArrayBuffer }
  | { id: number; ok: false; error: string }
  | { id: number; progress: number };

/** Samples per encode call. Small enough to report progress, large enough to be quick. */
const BLOCK = 1152 * 16;

function toInt16(channel: Float32Array): Int16Array {
  const out = new Int16Array(channel.length);
  for (let i = 0; i < channel.length; i++) {
    const sample = Math.max(-1, Math.min(1, channel[i]));
    out[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return out;
}

self.addEventListener("message", (event: MessageEvent<EncodeRequest>) => {
  const request = event.data;
  const post = (message: EncodeResponse, transfer?: Transferable[]) =>
    (self as unknown as Worker).postMessage(message, transfer ?? []);

  try {
    const channels = request.channels.map((buffer) => toInt16(new Float32Array(buffer)));
    const stereo = channels.length > 1;
    const encoder = new Mp3Encoder(stereo ? 2 : 1, request.sampleRate, request.bitrate);

    const total = channels[0].length;
    const parts: Uint8Array[] = [];
    let bytes = 0;

    for (let at = 0; at < total; at += BLOCK) {
      const left = channels[0].subarray(at, at + BLOCK);
      const right = stereo ? channels[1].subarray(at, at + BLOCK) : undefined;
      const chunk = stereo
        ? encoder.encodeBuffer(left, right!)
        : encoder.encodeBuffer(left);
      if (chunk.length > 0) {
        parts.push(chunk);
        bytes += chunk.length;
      }
      post({ id: request.id, progress: Math.min(0.99, at / total) });
    }

    const tail = encoder.flush();
    if (tail.length > 0) {
      parts.push(tail);
      bytes += tail.length;
    }

    const mp3 = new Uint8Array(bytes);
    let offset = 0;
    for (const part of parts) {
      mp3.set(part, offset);
      offset += part.length;
    }

    post({ id: request.id, ok: true, mp3: mp3.buffer }, [mp3.buffer]);
  } catch (error) {
    post({
      id: request.id,
      ok: false,
      error:
        error instanceof Error ? error.message : "The MP3 could not be written on this device.",
    });
  }
});
