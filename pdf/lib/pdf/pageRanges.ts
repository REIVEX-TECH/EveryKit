/**
 * Parsing the page ranges people actually type.
 *
 * "1-3, 7, 12-" is what someone writes when they mean the first three pages,
 * the seventh, and everything from twelve to the end. This turns that into
 * zero-based indices, and says plainly what it could not understand rather
 * than silently dropping part of a selection — losing pages quietly is the
 * worst thing a split tool can do.
 *
 * Pure, so the awkward cases are testable without a PDF.
 */

export type RangeParse =
  | { ok: true; pages: number[] }
  | { ok: false; error: string };

/**
 * Parse a range expression against a document of `pageCount` pages.
 *
 * Returns zero-based indices in the order written, so "3,1" extracts page 3
 * then page 1 — people reorder this way and it would be rude to sort it back.
 * Duplicates are kept for the same reason.
 */
export function parsePageRanges(input: string, pageCount: number): RangeParse {
  const text = input.trim();
  if (text === "") return { ok: false, error: "Type which pages you want, such as 1-3, 7." };
  if (pageCount < 1) return { ok: false, error: "That file has no pages." };

  const pages: number[] = [];

  for (const rawPart of text.split(",")) {
    const part = rawPart.trim();
    if (part === "") continue;

    // "12-" means twelve to the end; "-4" means the start to four.
    const match = /^(\d+)?\s*-\s*(\d+)?$/.exec(part);
    if (match) {
      const from = match[1] ? Number(match[1]) : 1;
      const to = match[2] ? Number(match[2]) : pageCount;
      if (!match[1] && !match[2]) {
        return { ok: false, error: `"${part}" is not a page range.` };
      }
      const bad = outOfRange(from, pageCount) ?? outOfRange(to, pageCount);
      if (bad) return { ok: false, error: bad };
      if (from > to) {
        return { ok: false, error: `Page ${from} comes after page ${to}, so that range is backwards.` };
      }
      for (let page = from; page <= to; page++) pages.push(page - 1);
      continue;
    }

    if (/^\d+$/.test(part)) {
      const page = Number(part);
      const bad = outOfRange(page, pageCount);
      if (bad) return { ok: false, error: bad };
      pages.push(page - 1);
      continue;
    }

    return { ok: false, error: `"${part}" is not a page number.` };
  }

  if (pages.length === 0) {
    return { ok: false, error: "Type which pages you want, such as 1-3, 7." };
  }
  return { ok: true, pages };
}

function outOfRange(page: number, pageCount: number): string | null {
  if (!Number.isInteger(page) || page < 1) return `Pages start at 1.`;
  if (page > pageCount) {
    return `This file has ${pageCount} ${pageCount === 1 ? "page" : "pages"}, so page ${page} does not exist.`;
  }
  return null;
}

/**
 * Split an expression into one group per comma, for the split tool: each
 * group becomes its own output file.
 */
export function parseSplitGroups(
  input: string,
  pageCount: number,
): { ok: true; groups: number[][] } | { ok: false; error: string } {
  const parts = input.split(",").map((p) => p.trim()).filter((p) => p !== "");
  if (parts.length === 0) {
    return { ok: false, error: "Type which pages you want, such as 1-3, 4-6." };
  }

  const groups: number[][] = [];
  for (const part of parts) {
    const parsed = parsePageRanges(part, pageCount);
    if (!parsed.ok) return parsed;
    groups.push(parsed.pages);
  }
  return { ok: true, groups };
}

/** "1-3, 7" for a set of zero-based indices, for naming files and confirming back. */
export function describePages(pages: number[]): string {
  if (pages.length === 0) return "";
  const sorted = [...pages].sort((a, b) => a - b);
  const runs: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    runs.push(start === previous ? `${start + 1}` : `${start + 1}-${previous + 1}`);
    start = current;
    previous = current;
  }
  return runs.join(", ");
}

/** Rotation normalised to what a PDF /Rotate entry accepts. */
export function normaliseRotation(degrees: number): 0 | 90 | 180 | 270 {
  const wrapped = ((Math.round(degrees / 90) * 90) % 360 + 360) % 360;
  return wrapped as 0 | 90 | 180 | 270;
}
