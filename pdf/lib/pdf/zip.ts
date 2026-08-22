/**
 * Zip a set of named files in the browser.
 *
 * fflate is the library: MIT, no dependencies, a few kilobytes, and it never
 * fetches anything at run time. JSZip is the usual alternative and is larger,
 * older, and carries its own inflate implementation. Nothing here wants a CDN
 * copy of either.
 */

import { zipSync } from "fflate";

/**
 * Bundle files under the names they were given.
 *
 * Stored rather than deflated, on purpose. Everything this is used for is
 * already a compressed image, and running deflate over a JPEG spends real
 * seconds of a phone's CPU to save a fraction of a percent. Level 0 writes the
 * bytes straight through, which is why a 200-page export finishes instead of
 * appearing to hang.
 *
 * `zipSync` blocks the thread it runs on. That is acceptable here and nowhere
 * else: the caller has just spent far longer rendering the pages, and the
 * alternative is fflate's worker-backed async form, which builds its worker
 * from a blob URL. `worker-src 'self' blob:` allows that today, but a bundling
 * step that is invisible from here is a poor thing to hang the no-network
 * promise on when the saving is a few hundred milliseconds.
 */
export function zipNamedFiles(files: Array<{ name: string; bytes: Uint8Array }>): Uint8Array {
  if (files.length === 0) throw new Error("There is nothing to zip.");

  const record: Record<string, [Uint8Array, { level: 0 }]> = {};
  for (const file of files) {
    if (record[file.name]) {
      throw new Error(`Two files were given the same name: ${file.name}.`);
    }
    record[file.name] = [file.bytes, { level: 0 }];
  }
  return zipSync(record);
}
