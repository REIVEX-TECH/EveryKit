/**
 * Reading a JSON request body without trusting the caller about its size.
 *
 * Both write endpoints did their own version of this, and both of them decided
 * whether a body was too big by reading `Content-Length` and then reading the
 * whole body anyway. That header is the caller's claim, not a fact: a chunked
 * request carries no length at all, so the check passed and `request.text()`
 * buffered whatever arrived.
 *
 * nginx now caps these locations at a few kilobytes, which is the real
 * protection and the one that costs nothing. This is the second line, for the
 * same reason the app keeps its own login lockout: the handler should not stop
 * being correct if it is ever reached another way.
 *
 * The stream is read a chunk at a time and abandoned the moment it passes the
 * cap, so an oversized body is refused rather than accumulated.
 */

export type BodyRejection =
  /** Content-Type was absent or was not JSON. */
  | { ok: false; reason: "type" }
  /** Longer than the cap, whether the header admitted it or not. */
  | { ok: false; reason: "too-large" }
  /** The stream failed, or the bytes were not UTF-8. */
  | { ok: false; reason: "unreadable" }
  /** Not JSON, or JSON that is not a plain object. */
  | { ok: false; reason: "not-json" };

export type BodyResult =
  | { ok: true; body: Record<string, unknown> }
  | BodyRejection;

/**
 * Read and parse a JSON object body, or say why not.
 *
 * The order is deliberate and is the point of the function: content type,
 * then declared length, then the bytes themselves, then the parse. Nothing is
 * parsed until it is known to be small enough to be worth parsing.
 */
export async function readJsonObject(
  request: Request,
  maxBytes: number,
): Promise<BodyResult> {
  const contentType = request.headers.get("content-type") ?? "";
  // A media type may carry parameters (`application/json; charset=utf-8`), so
  // this matches the type and ignores the rest.
  if (!/^application\/(?:[\w.+-]+\+)?json\b/i.test(contentType.trim())) {
    return { ok: false, reason: "type" };
  }

  // The header is only worth reading as an early exit. A caller that lies low
  // or omits it entirely is caught by the byte count below.
  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, reason: "too-large" };
  }

  const raw = await readAtMost(request, maxBytes);
  if (raw === "too-large") return { ok: false, reason: "too-large" };
  if (raw === null) return { ok: false, reason: "unreadable" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "not-json" };
  }
  // An array is an object to typeof, and neither an array nor null has the
  // named fields either endpoint goes on to read.
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "not-json" };
  }

  return { ok: true, body: parsed as Record<string, unknown> };
}

/**
 * The body as text, or `"too-large"` as soon as it passes the cap, or `null`
 * if the stream itself failed.
 *
 * Counts bytes rather than characters. A body of astral-plane characters is
 * four bytes each and one or two lengths in JavaScript, and the cap is about
 * how much has to be held in memory.
 */
async function readAtMost(
  request: Request,
  maxBytes: number,
): Promise<string | "too-large" | null> {
  const body = request.body;
  if (!body) {
    // No stream to read: some runtimes give a bodyless Request for an empty
    // POST. text() is safe here precisely because there is nothing in it.
    try {
      const text = await request.text();
      return byteLength(text) > maxBytes ? "too-large" : text;
    } catch {
      return null;
    }
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        // Stop pulling. Whatever is still in flight is the connection's
        // problem, not this process's memory.
        await reader.cancel().catch(() => {});
        return "too-large";
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const joined = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    joined.set(chunk, at);
    at += chunk.byteLength;
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(joined);
  } catch {
    return null;
  }
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}
