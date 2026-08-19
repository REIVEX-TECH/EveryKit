import { describe, expect, it } from "vitest";
import { letterTypes } from "./index";
import { renderText } from "@/lib/render/text";
import type { BuildContext, LetterType, Tone, Values } from "@/lib/letter/types";

const TODAY = "2026-08-18";

function ctx(tone: Tone = "polite"): BuildContext {
  return { tone, dateFormat: "long-day-first", today: TODAY };
}

/** Only what the form marks as required, so optional clauses must drop out. */
function requiredOnly(type: LetterType): Values {
  const values: Values = {};
  for (const field of type.fields) {
    if (field.required) values[field.id] = type.example[field.id] ?? "";
  }
  return values;
}

/**
 * The artefacts a template engine leaves behind when a conditional is wrong.
 * This is the check that matters: a letter with ", ," or a dangling "and" in it
 * is worse than no letter, because someone will send it without reading.
 */
const ARTEFACTS: Array<{ name: string; pattern: RegExp }> = [
  { name: "undefined", pattern: /\bundefined\b/i },
  { name: "null", pattern: /\bnull\b/i },
  { name: "NaN", pattern: /\bNaN\b/ },
  { name: "[object Object]", pattern: /\[object Object\]/ },
  { name: "unreplaced token", pattern: /\{\{|\}\}|\$\{/ },
  { name: "N/A placeholder", pattern: /\bN\/A\b/i },
  { name: "TBD placeholder", pattern: /\bTBD\b/i },
  { name: "doubled comma", pattern: /,\s*,/ },
  { name: "space before comma", pattern: /\s+,/ },
  { name: "space before full stop", pattern: /\s+\./ },
  { name: "doubled full stop", pattern: /\.\./ },
  { name: "doubled space", pattern: /[^\n] {2,}[^\n]/ },
  { name: "empty parentheses", pattern: /\(\s*\)/ },
  // A sentence ending on a bare connective is what a vanished fragment leaves
  // behind: "I will cover the costs including." The comma case is deliberately
  // not checked here — "the mother I care for, who lives with me" is correct
  // English, and `space before comma` already catches the artefact version.
  {
    name: "sentence ending on a connective",
    pattern: /\b(and|with|of|from|including|covering|namely|such as)\s*\.(\s|$)/i,
  },
  { name: "sentence starting mid-clause", pattern: /(^|\n)\s*(and|but|,)\s/i },
  { name: "blank list bullet", pattern: /(^|\n)-\s*$/ },
];

describe.each(letterTypes.map((type) => [type.slug, type] as const))(
  "%s",
  (_slug, type: LetterType) => {
    const tones: Tone[] = type.toneVariants ?? ["polite"];

    it("has the shape every letter type must have", () => {
      expect(type.title.trim()).not.toBe("");
      expect(type.whoItsFor.trim()).not.toBe("");
      expect(type.seoNotes.length).toBeGreaterThan(0);
      expect(type.faq.length).toBeGreaterThanOrEqual(3);
      expect(type.fields.length).toBeGreaterThan(0);
      expect(new Set(type.fields.map((f) => f.id)).size).toBe(type.fields.length);
    });

    it("gives every field an example answer, so the worked example is complete", () => {
      for (const field of type.fields) {
        expect([type.slug, field.id, field.id in type.example]).toEqual([
          type.slug,
          field.id,
          true,
        ]);
      }
    });

    it("marks at least one field required", () => {
      expect(type.fields.some((f) => f.required)).toBe(true);
    });

    describe.each(tones)("tone: %s", (tone) => {
      it("renders a complete letter with every field answered", () => {
        const doc = type.build(type.example, ctx(tone));
        expect(doc.body.length).toBeGreaterThan(1);
        expect(doc.salutation).not.toBe("");
        expect(doc.valediction).not.toBe("");
        expect(doc.signOff.length).toBeGreaterThan(0);
        expect(doc.date).toBe("18 August 2026");
      });

      it("renders with only the required fields answered", () => {
        const doc = type.build(requiredOnly(type), ctx(tone));
        expect(doc.body.length).toBeGreaterThan(0);
        expect(doc.salutation).not.toBe("");
      });

      it.each(ARTEFACTS)("leaves no $name, fully filled", ({ pattern }) => {
        const text = renderText(type.build(type.example, ctx(tone)));
        expect(text).not.toMatch(pattern);
      });

      it.each(ARTEFACTS)("leaves no $name, required fields only", ({ pattern }) => {
        const text = renderText(type.build(requiredOnly(type), ctx(tone)));
        expect(text).not.toMatch(pattern);
      });

      it("never emits an empty paragraph or a stray full stop", () => {
        for (const values of [type.example, requiredOnly(type)]) {
          const doc = type.build(values, ctx(tone));
          for (const para of doc.body) {
            expect(para.trim()).not.toBe("");
            expect(para.trim()).not.toBe(".");
            expect(para).toBe(para.trim());
          }
          for (const line of [...doc.sender, ...doc.recipient, ...doc.signOff]) {
            expect(line.trim()).not.toBe("");
          }
        }
      });

      it("pairs the salutation and the valediction the British way", () => {
        const doc = type.build(type.example, ctx(tone));
        if (doc.salutation === "Dear Sir or Madam") {
          expect(doc.valediction).toBe("Yours faithfully");
        } else {
          expect(doc.valediction).toBe("Yours sincerely");
        }
      });

      it("uses none of the banned words", () => {
        const text = renderText(type.build(type.example, ctx(tone))).toLowerCase();
        for (const word of [
          "seamless", "empower", "unlock", "leverage", "supercharge", "simply",
          "effortless", "elevate", "streamline",
          "whether you're", "whether you’re", "in today's", "in today’s",
          "say goodbye to",
        ]) {
          expect([type.slug, word, text.includes(word)]).toEqual([type.slug, word, false]);
        }
      });

      it("uses no dash as punctuation", () => {
        // The single clearest tell of generated prose, and a letter is the one
        // thing here that gets read by a stranger deciding whether to act on it.
        // Hyphens inside words are fine; an em or en dash never is.
        const text = renderText(type.build(type.example, ctx(tone)));
        const dashes = [...text].filter((c) => c === "—" || c === "–");
        expect([type.slug, dashes]).toEqual([type.slug, []]);

        // A hyphen with spaces round it is a dash wearing a disguise.
        expect([type.slug, / - /.test(text)]).toEqual([type.slug, false]);
      });

      it("does not grovel or play at legalese", () => {
        const text = renderText(type.build(type.example, ctx(tone))).toLowerCase();
        for (const phrase of [
          "humbly beg", "humbly request", "kindly do the needful", "heretofore",
          "hereinafter", "aforementioned", "please be informed that", "i beg to",
        ]) {
          expect([type.slug, phrase, text.includes(phrase)]).toEqual([
            type.slug,
            phrase,
            false,
          ]);
        }
      });
    });

    if (type.toneVariants) {
      it("produces a genuinely different letter in each tone", () => {
        const polite = renderText(type.build(type.example, ctx("polite")));
        const firm = renderText(type.build(type.example, ctx("firm")));
        expect(polite).not.toBe(firm);

        // A swapped adjective is not a tone. Require a real rewrite: at least a
        // third of the words differ, or the letters differ in length markedly.
        const words = (text: string) => new Set(text.toLowerCase().split(/\W+/));
        const a = words(polite);
        const b = words(firm);
        const shared = [...a].filter((w) => b.has(w)).length;
        const union = new Set([...a, ...b]).size;
        const overlap = shared / union;
        expect([type.slug, overlap < 0.8]).toEqual([type.slug, true]);
      });

      it("stays professional when firm", () => {
        const text = renderText(type.build(type.example, ctx("firm"))).toLowerCase();
        for (const rude of [
          "unacceptable behaviour from your", "disgraceful", "incompetent",
          "ridiculous", "outrageous", "you people", "sue you",
        ]) {
          expect([type.slug, rude, text.includes(rude)]).toEqual([type.slug, rude, false]);
        }
      });
    }
  },
);

describe("the collection as a whole", () => {
  it("uses unique slugs", () => {
    expect(new Set(letterTypes.map((t) => t.slug)).size).toBe(letterTypes.length);
  });

  it("opens at most three letters with 'I am writing to'", () => {
    // The tell of a mail-merge. Allowed where it genuinely is the natural
    // opening, but not as a default.
    const offenders = letterTypes.filter((type) => {
      const doc = type.build(type.example, ctx(type.toneVariants?.[0] ?? "polite"));
      return /^i am writing to/i.test(doc.body[0] ?? "");
    });
    expect(offenders.map((t) => t.slug).length).toBeLessThanOrEqual(3);
  });

  it("varies how the letters open", () => {
    const openings = letterTypes.map((type) => {
      const doc = type.build(type.example, ctx(type.toneVariants?.[0] ?? "polite"));
      return (doc.body[0] ?? "").split(" ").slice(0, 3).join(" ").toLowerCase();
    });
    // No opening phrase may be shared by more than a quarter of the letters.
    const counts = new Map<string, number>();
    for (const opening of openings) counts.set(opening, (counts.get(opening) ?? 0) + 1);
    const worst = Math.max(...counts.values());
    expect(worst).toBeLessThanOrEqual(Math.ceil(letterTypes.length / 4));
  });
});
