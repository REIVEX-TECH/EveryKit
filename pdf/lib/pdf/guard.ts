/**
 * Timeouts around pdf.js, so a malformed file fails with a sentence instead of
 * hanging the tab.
 *
 * ## What actually hangs, and why the two timeouts differ
 *
 * pdf.js does not reject on a file it cannot make sense of. A damaged
 * cross-reference table, a worker that failed to load, or a page whose font
 * data cannot be fetched all produce the same thing: a promise that simply
 * never settles. The console stays clean, the spinner stays up, and the only
 * way out is closing the tab. That is the failure this file exists to convert
 * into a message.
 *
 * Opening and drawing get different treatment on purpose:
 *
 * - **Opening rejects.** Nothing in this kit works without a document, so
 *   there is nothing to carry on with.
 * - **Drawing does not, for thumbnails.** Sign already learned this: when the
 *   pictures cannot be drawn, the page outlines and the page count are still
 *   correct, and every tool that reorders or removes pages still works. Killing
 *   the whole grid because page 94 of 300 would not paint costs the user a tool
 *   that was about to do its job. PDF-to-images is the exception, because there
 *   the pictures *are* the product.
 */

/**
 * Opening is given longer than drawing, and deliberately so.
 *
 * The kit accepts files up to 60 MB. Parsing one of those on a mid-range phone
 * genuinely takes several seconds, and calling a working document damaged
 * because it was slow is a worse failure than making somebody wait a little
 * longer for one that is actually broken.
 */
export const PDF_OPEN_TIMEOUT_MS = 20_000;

/** One page. Sign uses the same figure for the same job. */
export const PDF_PAGE_TIMEOUT_MS = 8_000;

export const PDF_OPEN_ERROR =
  "This file could not be opened. If it is password-protected, remove the password in your PDF reader first.";

export const PDF_PAGE_ERROR =
  "A page in this file could not be drawn, so the images are incomplete. The other tools here still work on it.";

/**
 * Reject `promise` if it has not settled within `ms`.
 *
 * The original work is not cancelled, because a promise cannot be. The caller
 * has to destroy the pdf.js loading task in a `finally` so the worker does not
 * sit there after we have stopped waiting for it.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

/**
 * The messages this module is allowed to put in front of a person.
 *
 * Anything else that reaches the UI came from pdf.js and reads like
 * "Invalid PDF structure" or "Unexpected server response", which tells someone
 * holding a file from their bank nothing they can act on.
 */
const PUBLIC_MESSAGES = new Set<string>([PDF_OPEN_ERROR, PDF_PAGE_ERROR]);

/**
 * Collapse whatever pdf.js threw into one sentence, without flattening errors
 * that were already written for a person.
 *
 * The `also` list is how a caller keeps its own messages: PDF-to-images raises
 * "This browser could not draw that page", and turning that into "the file
 * could not be opened" would be a plain lie about a file that opened fine.
 */
export function asOpenError(error: unknown, also: readonly string[] = []): Error {
  if (error instanceof Error) {
    if (PUBLIC_MESSAGES.has(error.message) || also.includes(error.message)) {
      return error;
    }
  }
  return new Error(PDF_OPEN_ERROR);
}

/** True for the abort a caller raised itself, which must travel untouched. */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
