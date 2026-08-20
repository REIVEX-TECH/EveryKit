/**
 * Base64 and URL encoding, both directions, correct for text that is not
 * English.
 *
 * The trap in both: `btoa` and `escape`-era helpers work on bytes, and a
 * JavaScript string is UTF-16 code units. Passing an emoji or an Urdu sentence
 * straight to `btoa` throws, and the usual workaround found in answers online
 * mangles anything outside Latin-1 silently, which is worse. Everything here
 * goes through TextEncoder and TextDecoder, so the bytes are real UTF-8 and a
 * round trip is byte for byte the same string.
 */

/** Base64 of a byte array. */
export function bytesToBase64(bytes: Uint8Array): string {
  // Chunked, because String.fromCharCode(...bytes) on a multi-megabyte file
  // blows the argument limit and throws a RangeError rather than returning.
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function encodeBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

export type DecodeResult = { ok: true; text: string } | { ok: false; message: string };

/**
 * Decode, or explain what is wrong.
 *
 * Whitespace and line breaks are stripped first: base64 arrives wrapped at 76
 * characters often enough that refusing it would be pedantry. URL-safe base64
 * is accepted too, since half the tokens people paste here are JWT halves.
 * Missing padding is added rather than rejected for the same reason.
 */
export function decodeBase64(input: string): DecodeResult {
  const cleaned = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (cleaned === "") return { ok: false, message: "There is nothing to decode yet." };

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return {
      ok: false,
      message: "That is not base64. It has characters outside A to Z, a to z, 0 to 9, + and /.",
    };
  }

  const padded = cleaned.padEnd(Math.ceil(cleaned.length / 4) * 4, "=");

  try {
    const bytes = base64ToBytes(padded);
    // fatal, so invalid UTF-8 is reported rather than silently replaced with
    // question marks that look like the file decoded fine.
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return {
      ok: false,
      message:
        "That decoded to bytes, but they are not text. It is probably a file rather than a string.",
    };
  }
}

/** The same bytes, for the file side, where the result is downloaded not shown. */
export function decodeBase64ToBytes(input: string): { ok: true; bytes: Uint8Array } | { ok: false; message: string } {
  const cleaned = input.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (cleaned === "") return { ok: false, message: "There is nothing to decode yet." };
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return { ok: false, message: "That is not base64." };
  }
  try {
    return { ok: true, bytes: base64ToBytes(cleaned.padEnd(Math.ceil(cleaned.length / 4) * 4, "=")) };
  } catch {
    return { ok: false, message: "That is not base64." };
  }
}

/**
 * The two URL encodings, and the one line that says which to use.
 *
 * `component` escapes everything that is not unreserved, so a whole URL passed
 * to it comes back with its slashes and colons escaped, which is right when the
 * value is going inside another URL and wrong when it is the URL. `full` leaves
 * the characters that give a URL its structure alone.
 */
export type UrlMode = "component" | "full";

export const URL_MODE_NOTE: Record<UrlMode, string> = {
  component:
    "Escapes everything that is not a plain letter, digit or one of - _ . ! ~ * ' ( ), including / : ? & =. Use this for a value going inside a URL, like a search term or a redirect target.",
  full:
    "Leaves the characters that give a URL its structure alone, so / : ? & = # survive. Use this for a whole URL that only needs its spaces and accents made safe.",
};

export function encodeUrl(text: string, mode: UrlMode): string {
  return mode === "component" ? encodeURIComponent(text) : encodeURI(text);
}

export function decodeUrl(text: string, mode: UrlMode): DecodeResult {
  if (text === "") return { ok: false, message: "There is nothing to decode yet." };
  try {
    return { ok: true, text: mode === "component" ? decodeURIComponent(text) : decodeURI(text) };
  } catch {
    return {
      ok: false,
      message:
        "That has a percent sign that is not part of a valid escape. A literal percent has to be written %25.",
    };
  }
}
