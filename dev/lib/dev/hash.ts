/**
 * SHA-256, SHA-1 and MD5, all three at once, of a string or a file.
 *
 * SHA-256 and SHA-1 come from WebCrypto, which is in every browser this site
 * supports and is the implementation the platform already trusts. MD5 is not in
 * WebCrypto and never will be, because it is broken: SpookyJS aside, the reason
 * it is here at all is that half the world's checksums and legacy APIs still
 * quote it, and a tool that omitted it would send people elsewhere. spark-md5
 * does the arithmetic, chosen for its incremental interface, which is what lets
 * a large file be hashed a slice at a time rather than read whole into memory.
 *
 * All three are shown together on purpose. Somebody checking a download against
 * a published checksum usually does not know which algorithm was published.
 */

import SparkMD5 from "spark-md5";

export type Digests = { sha256: string; sha1: string; md5: string };

export type Algorithm = keyof Digests;

export const ALGORITHM_LABELS: Record<Algorithm, string> = {
  sha256: "SHA-256",
  sha1: "SHA-1",
  md5: "MD5",
};

/** Bytes as lower case hex, which is how every checksum is published. */
export function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (const byte of bytes) out += (byte + 0x100).toString(16).slice(1);
  return out;
}

async function webcrypto(name: "SHA-256" | "SHA-1", data: BufferSource): Promise<string> {
  return toHex(await crypto.subtle.digest(name, data));
}

/** All three digests of a string, hashed as UTF-8. */
export async function hashText(text: string): Promise<Digests> {
  const bytes = new TextEncoder().encode(text);
  const [sha256, sha1] = await Promise.all([
    webcrypto("SHA-256", bytes),
    webcrypto("SHA-1", bytes),
  ]);
  return { sha256, sha1, md5: SparkMD5.ArrayBuffer.hash(bytes.buffer as ArrayBuffer) };
}

/** How much of a file is read at a time. Big enough to be quick, small enough not to spike memory. */
export const CHUNK_BYTES = 4 * 1024 * 1024;

/**
 * All three digests of a file, read a slice at a time.
 *
 * MD5 streams properly through spark-md5's incremental interface. WebCrypto has
 * no streaming digest, so for SHA the slices are concatenated into one buffer
 * before hashing: that is a real memory cost on a very large file, and it is
 * the honest trade rather than pretending the API can do something it cannot.
 * The progress callback is what keeps the page truthful while it works.
 */
export async function hashFile(
  file: Blob,
  onProgress?: (ratio: number) => void,
): Promise<Digests> {
  const md5 = new SparkMD5.ArrayBuffer();
  const parts: Uint8Array[] = [];

  let read = 0;
  while (read < file.size) {
    const slice = file.slice(read, Math.min(read + CHUNK_BYTES, file.size));
    const buffer = await slice.arrayBuffer();
    md5.append(buffer);
    parts.push(new Uint8Array(buffer));
    read += buffer.byteLength;
    onProgress?.(file.size === 0 ? 1 : read / file.size);
  }

  const whole = new Uint8Array(read);
  let offset = 0;
  for (const part of parts) {
    whole.set(part, offset);
    offset += part.length;
  }

  const [sha256, sha1] = await Promise.all([
    webcrypto("SHA-256", whole),
    webcrypto("SHA-1", whole),
  ]);

  return { sha256, sha1, md5: md5.end() };
}

/** Does a digest the user pasted match one we produced? Case and space insensitive. */
export function matchesDigest(digests: Digests, candidate: string): Algorithm | null {
  const wanted = candidate.trim().toLowerCase().replace(/\s+/g, "");
  if (wanted === "") return null;
  for (const key of Object.keys(digests) as Algorithm[]) {
    if (digests[key] === wanted) return key;
  }
  return null;
}
