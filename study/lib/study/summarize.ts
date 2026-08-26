/**
 * Pulling the key sentences out of a block of notes, and tidying the text.
 *
 * The extraction is a small TextRank pass: sentences are nodes, an edge between
 * two of them is weighted by how many words they share, and a PageRank-style
 * iteration settles on which sentences are most central. It SELECTS sentences,
 * it does not rewrite them, so the output is always the student's own words in
 * their own order. The copy says this plainly rather than calling it a summary.
 *
 * The cleanup is honest mechanical work: collapse runs of spaces, drop
 * duplicated lines, and normalise assorted bullet characters to one.
 */

const STOPWORDS = new Set(
  (
    "a about above after again against all am an and any are aren't as at be because been before being below " +
    "between both but by can cannot could couldn't did didn't do does doesn't doing don't down during each few " +
    "for from further had hadn't has hasn't have haven't having he her here hers herself him himself his how i " +
    "if in into is isn't it its itself just me more most my myself no nor not of off on once only or other our " +
    "ours out over own said same she should so some such than that the their theirs them themselves then there " +
    "these they this those through to too under until up very was wasn't we were weren't what when where which " +
    "while who whom why will with would you your yours yourself"
  ).split(" "),
);

/** Split text into sentences, tolerantly. */
export function toSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** The meaningful words of a sentence: lowercased, no stopwords, length over two. */
function keywords(sentence: string): Set<string> {
  const found = sentence.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return new Set(found.filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

/** TextRank sentence similarity: shared words, damped by sentence length. */
function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let common = 0;
  for (const word of a) if (b.has(word)) common += 1;
  if (common === 0) return 0;
  const denom = Math.log(a.size + 1) + Math.log(b.size + 1);
  return denom === 0 ? 0 : common / denom;
}

/**
 * The `count` most central sentences, returned in their original order.
 *
 * Fewer sentences than asked for are returned as they are; there is nothing to
 * rank when everything is already a key point.
 */
export function keyPoints(text: string, count: number): string[] {
  const sentences = toSentences(text);
  const n = sentences.length;
  if (n <= count || count <= 0) return n <= count ? sentences : [];

  const tokens = sentences.map(keywords);
  const weights: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const rowSums = new Array(n).fill(0);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const sim = similarity(tokens[i], tokens[j]);
      weights[i][j] = sim;
      weights[j][i] = sim;
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) rowSums[i] += weights[i][j];
  }

  const damping = 0.85;
  let scores = new Array(n).fill(1 / n);
  for (let iter = 0; iter < 40; iter += 1) {
    const next = new Array(n).fill((1 - damping) / n);
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        if (i === j || rowSums[j] === 0) continue;
        next[i] += damping * (weights[j][i] / rowSums[j]) * scores[j];
      }
    }
    scores = next;
  }

  const ranked = sentences
    .map((sentence, index) => ({ sentence, index, score: scores[index] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.index - b.index);

  return ranked.map((r) => r.sentence);
}

/** Collapse runs of spaces, drop spaces before punctuation, tidy blank lines. */
export function fixSpacing(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Remove repeated lines, keeping the first of each. Blank lines are left alone. */
export function stripDuplicateLines(text: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const key = line.trim();
    if (key === "") {
      out.push(line);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n");
}

/** Turn assorted bullet characters at the start of a line into a plain "- ". */
export function normalizeBullets(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      const match = line.match(/^(\s*)[•●▪◦‣·∙*+‧–—-]\s+(.*)$/u);
      return match ? `${match[1]}- ${match[2]}` : line;
    })
    .join("\n");
}

/** All three cleanups in the order that lets them cooperate. */
export function cleanText(text: string): string {
  return fixSpacing(stripDuplicateLines(normalizeBullets(text)));
}
