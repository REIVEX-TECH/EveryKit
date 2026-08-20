/**
 * Version 4 UUIDs, from the platform's own randomness.
 *
 * `crypto.getRandomValues` rather than `Math.random`: the second is not a
 * random source, it is a fast sequence, and a UUID generated from it can
 * collide and can be predicted from a handful of earlier ones. Nobody should be
 * generating security tokens on a web page, but somebody will, and this is one
 * line either way.
 *
 * `crypto.randomUUID` exists and does exactly this, but only over HTTPS and
 * localhost, and it is absent in a few browsers still in use. The bytes are
 * laid out by hand so the tool works everywhere the rest of the page does.
 */

/** How many can be asked for at once. */
export const MIN_COUNT = 1;
export const MAX_COUNT = 100;

const HEX: string[] = [];
for (let i = 0; i < 256; i++) HEX.push((i + 0x100).toString(16).slice(1));

/** One v4 UUID from 16 random bytes. */
export function uuidFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error("a UUID needs 16 bytes");
  const b = bytes.slice(0, 16);

  // Version 4 in the high nibble of byte 6, and the RFC 4122 variant in the
  // top two bits of byte 8. Without these it is 128 random bits that no parser
  // will agree is a v4 UUID.
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;

  return (
    HEX[b[0]] + HEX[b[1]] + HEX[b[2]] + HEX[b[3]] + "-" +
    HEX[b[4]] + HEX[b[5]] + "-" +
    HEX[b[6]] + HEX[b[7]] + "-" +
    HEX[b[8]] + HEX[b[9]] + "-" +
    HEX[b[10]] + HEX[b[11]] + HEX[b[12]] + HEX[b[13]] + HEX[b[14]] + HEX[b[15]]
  );
}

/** Ask for between 1 and 100. Anything else is pulled into range. */
export function clampCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_COUNT;
  return Math.max(MIN_COUNT, Math.min(MAX_COUNT, Math.floor(value)));
}

export function generateUuids(count: number): string[] {
  const wanted = clampCount(count);
  // One call for all of them rather than one per UUID: the entropy pool is the
  // same either way and the syscall is not free.
  const bytes = new Uint8Array(wanted * 16);
  crypto.getRandomValues(bytes);

  const out: string[] = [];
  for (let i = 0; i < wanted; i++) out.push(uuidFromBytes(bytes.subarray(i * 16, i * 16 + 16)));
  return out;
}

/** The shape a v4 UUID has to have, used by the tests and nothing else. */
export const V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
