/**
 * Comparing two blocks of text, by line and by word.
 *
 * The comparison itself comes from `diff` (BSD-3-Clause), which implements the
 * Myers algorithm the whole industry uses. Reimplementing it here would be a
 * day of work to arrive somewhere less correct, and the interesting decisions
 * are all in what happens to its output rather than in the algorithm.
 *
 * Two of those decisions are worth stating. Line mode pairs a removal with the
 * addition that replaced it, so the two panes stay side by side instead of
 * drifting apart by the number of inserted lines. And both sides are given
 * exactly one trailing newline before comparing, so that a file ending in a
 * newline and one that does not are not reported as different, and so that
 * appending lines reads as an addition rather than a rewrite.
 */

import { diffLines, diffWords } from "diff";

export type ChangeKind = "same" | "added" | "removed";

export type LineRow = {
  kind: ChangeKind;
  /** One-based line numbers in each side, null where the line does not exist. */
  leftNumber: number | null;
  rightNumber: number | null;
  text: string;
};

export type WordPiece = { kind: ChangeKind; text: string };

export type DiffSummary = { added: number; removed: number; unchanged: number };

function normalise(text: string): string {
  // \r\n to \n first, so a Windows file against a Unix one is not reported as
  // entirely different.
  const unix = text.replace(/\r\n/g, "\n");
  if (unix === "") return "";

  // Then exactly one trailing newline, always. This is not cosmetic: diffLines
  // compares "b" against "b\n" as different lines, so adding c and d to a file
  // ending in b came out as one line removed and three added rather than two
  // added. Giving both sides a final newline makes every line the same shape,
  // and the phantom empty line it creates is dropped when the rows are built.
  return `${unix.replace(/\n+$/, "")}\n`;
}

/**
 * Line by line, with the numbers each side would show in an editor.
 *
 * Removals are emitted before the additions that replace them, which is what a
 * two-pane view needs to line up.
 */
export function lineDiff(left: string, right: string): { rows: LineRow[]; summary: DiffSummary } {
  const parts = diffLines(normalise(left), normalise(right));

  const rows: LineRow[] = [];
  const summary: DiffSummary = { added: 0, removed: 0, unchanged: 0 };

  let leftNumber = 1;
  let rightNumber = 1;

  for (const part of parts) {
    // `diff` hands back a block of text; the trailing empty string after the
    // final newline is not a line and would render as a phantom blank row.
    const lines = part.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();

    for (const text of lines) {
      if (part.added) {
        rows.push({ kind: "added", leftNumber: null, rightNumber: rightNumber++, text });
        summary.added++;
      } else if (part.removed) {
        rows.push({ kind: "removed", leftNumber: leftNumber++, rightNumber: null, text });
        summary.removed++;
      } else {
        rows.push({ kind: "same", leftNumber: leftNumber++, rightNumber: rightNumber++, text });
        summary.unchanged++;
      }
    }
  }

  return { rows, summary };
}

/**
 * Word by word, as one flowing run.
 *
 * This is the mode for prose, where a line diff reports a whole paragraph as
 * changed because one word in the middle of it moved.
 */
export function wordDiff(left: string, right: string): { pieces: WordPiece[]; summary: DiffSummary } {
  const parts = diffWords(normalise(left), normalise(right));

  const pieces: WordPiece[] = [];
  const summary: DiffSummary = { added: 0, removed: 0, unchanged: 0 };

  for (const part of parts) {
    const kind: ChangeKind = part.added ? "added" : part.removed ? "removed" : "same";
    pieces.push({ kind, text: part.value });

    // Counted in words rather than characters, since that is what the mode is
    // named after and what the summary line claims to report.
    const words = part.value.trim() === "" ? 0 : part.value.trim().split(/\s+/).length;
    if (kind === "added") summary.added += words;
    else if (kind === "removed") summary.removed += words;
    else summary.unchanged += words;
  }

  return { pieces, summary };
}

/** The one line above the panes: what changed, in words a person reads. */
export function describeSummary(summary: DiffSummary, unit: "line" | "word"): string {
  if (summary.added === 0 && summary.removed === 0) {
    return "The two sides are identical.";
  }
  const bits: string[] = [];
  if (summary.added > 0) bits.push(`${summary.added} ${unit}${summary.added === 1 ? "" : "s"} added`);
  if (summary.removed > 0) {
    bits.push(`${summary.removed} ${unit}${summary.removed === 1 ? "" : "s"} removed`);
  }
  return `${bits.join(", ")}.`;
}
