/**
 * A flashcard deck that lives entirely in the link.
 *
 * The whole deck is encoded into a URL query string, so sharing a deck is
 * sending a link and nothing is stored on a server. The encoding is compact
 * (an array of [term, definition] pairs, JSON, then URL-safe base64) and
 * forgiving on the way back in: a link that has been mangled decodes to an
 * empty deck rather than throwing.
 */

export type Card = { term: string; definition: string };

/** URL-safe base64 of a UTF-8 string, so accents and other alphabets survive. */
function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Drop blank rows, so an empty row left in the editor is not shared or studied. */
export function cleanDeck(cards: Card[]): Card[] {
  return cards
    .map((c) => ({ term: c.term.trim(), definition: c.definition.trim() }))
    .filter((c) => c.term !== "" || c.definition !== "");
}

export function encodeDeck(cards: Card[]): string {
  const pairs = cleanDeck(cards).map((c) => [c.term, c.definition]);
  return toBase64Url(JSON.stringify(pairs));
}

export function decodeDeck(param: string): Card[] {
  if (!param) return [];
  try {
    const parsed = JSON.parse(fromBase64Url(param));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row) =>
          Array.isArray(row) &&
          row.length === 2 &&
          typeof row[0] === "string" &&
          typeof row[1] === "string",
      )
      .map(([term, definition]) => ({ term, definition }));
  } catch {
    return [];
  }
}

/** Read a deck out of a full query string like "?d=...". */
export function deckFromQuery(search: string): Card[] {
  const params = new URLSearchParams(search);
  return decodeDeck(params.get("d") ?? "");
}

/** The "?d=..." query for a deck, or "" for an empty one so the URL stays clean. */
export function deckQuery(cards: Card[]): string {
  const cleaned = cleanDeck(cards);
  if (cleaned.length === 0) return "";
  return `?d=${encodeDeck(cleaned)}`;
}

/**
 * A shuffled copy, Fisher-Yates. The random source is a parameter so the shuffle
 * is deterministic under test and genuinely random in the browser.
 */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
