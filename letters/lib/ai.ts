/**
 * The seam for a phase-2 AI polish pass. Deliberately not implemented.
 *
 * v1 letters come from hand-written templates, and that is a decision rather
 * than a placeholder: they cost nothing to run, work with no network, keep the
 * letter on the device, and for formulaic correspondence a good template beats
 * a general model that has to be prompted into the right register every time.
 *
 * If this is ever switched on, two things must stay true. The letter text is
 * the user's private writing, so anything sent off-device belongs behind an
 * explicit, informed opt-in — not a flag flipped quietly. And the privacy page
 * has to change in the same commit, because "built in your browser" would no
 * longer be the whole truth.
 *
 * No API key handling belongs in this file, or in this app, until that
 * conversation has happened.
 */

import type { LetterDoc } from "./letter/types";

export const AI_POLISH_ENABLED = process.env.NEXT_PUBLIC_AI_POLISH_ENABLED === "true";

export async function polishLetter(doc: LetterDoc): Promise<LetterDoc> {
  if (!AI_POLISH_ENABLED) return doc;
  throw new Error(
    "polishLetter is a stub. Turning NEXT_PUBLIC_AI_POLISH_ENABLED on requires an opt-in flow and a privacy page update first.",
  );
}
