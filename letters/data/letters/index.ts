/**
 * Every letter type this kit can produce.
 *
 * Grouped into files by subject rather than kept in one, because each template
 * carries its own prose and a single file would run to thousands of lines.
 * `@/data/letters` is the only import path anything else uses.
 */

import type { LetterType } from "@/lib/letter/types";
import { visaLetters } from "./visa";
import { workLetters } from "./work";
import { consumerLetters } from "./consumer";
import { housingLetters } from "./housing";
import { personalLetters } from "./personal";

export const letterTypes: LetterType[] = [
  ...visaLetters,
  ...workLetters,
  ...consumerLetters,
  ...housingLetters,
  ...personalLetters,
];

const bySlug = new Map(letterTypes.map((type) => [type.slug, type]));

export function getLetterType(slug: string): LetterType | undefined {
  return bySlug.get(slug);
}

export type { LetterType };
