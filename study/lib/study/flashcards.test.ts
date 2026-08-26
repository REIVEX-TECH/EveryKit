import { describe, expect, it } from "vitest";
import { cleanDeck, deckFromQuery, deckQuery, decodeDeck, encodeDeck, shuffle } from "./flashcards";

const deck = [
  { term: "Osmosis", definition: "Movement of water across a membrane" },
  { term: "Café", definition: "A test of Unicode, résumé, 日本語" },
];

describe("deck encode/decode", () => {
  it("round-trips a deck through the URL encoding", () => {
    expect(decodeDeck(encodeDeck(deck))).toEqual(deck);
  });

  it("survives non-ASCII terms and definitions", () => {
    const [, second] = decodeDeck(encodeDeck(deck));
    expect(second.definition).toContain("日本語");
  });

  it("returns an empty deck for a mangled or empty param", () => {
    expect(decodeDeck("")).toEqual([]);
    expect(decodeDeck("not-valid-base64!!")).toEqual([]);
    expect(decodeDeck(encodeDeck([]))).toEqual([]);
  });

  it("round-trips through a full query string", () => {
    const query = deckQuery(deck);
    expect(query.startsWith("?d=")).toBe(true);
    expect(deckFromQuery(query)).toEqual(deck);
  });

  it("gives an empty query for an empty deck, keeping the URL clean", () => {
    expect(deckQuery([])).toBe("");
    expect(deckQuery([{ term: "  ", definition: "  " }])).toBe("");
  });
});

describe("cleanDeck", () => {
  it("trims and drops fully blank rows", () => {
    expect(
      cleanDeck([
        { term: " a ", definition: " b " },
        { term: "", definition: "" },
        { term: "c", definition: "" },
      ]),
    ).toEqual([
      { term: "a", definition: "b" },
      { term: "c", definition: "" },
    ]);
  });
});

describe("shuffle", () => {
  it("keeps every element, changing only the order", () => {
    const items = [1, 2, 3, 4, 5];
    const out = shuffle(items, () => 0.5);
    expect([...out].sort()).toEqual(items);
    expect(out).toHaveLength(items.length);
  });

  it("does not mutate the input", () => {
    const items = [1, 2, 3];
    shuffle(items, () => 0.1);
    expect(items).toEqual([1, 2, 3]);
  });
});
