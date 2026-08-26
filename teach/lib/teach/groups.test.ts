import { describe, expect, it } from "vitest";
import { intoGroups, intoGroupsOfSize } from "./groups";
import { parseRoster, shuffle } from "./roster";

const names = ["a", "b", "c", "d", "e", "f", "g"];

describe("parseRoster", () => {
  it("takes one name a line, trims, and drops blanks", () => {
    expect(parseRoster(" Ada \n\nBob\n  \nGrace")).toEqual(["Ada", "Bob", "Grace"]);
  });
});

describe("intoGroups", () => {
  it("splits into a number of groups with even sizes when balanced", () => {
    const groups = intoGroups(names, 3, true);
    expect(groups).toHaveLength(3);
    expect(groups.map((g) => g.length).sort()).toEqual([2, 2, 3]);
    // Every name appears exactly once.
    expect(groups.flat().sort()).toEqual([...names].sort());
  });

  it("keeps every name and never loses one", () => {
    const groups = intoGroups(names, 2, false);
    expect(groups.flat().sort()).toEqual([...names].sort());
  });
});

describe("intoGroupsOfSize", () => {
  it("makes groups of exactly the size with a smaller last group, unbalanced", () => {
    expect(intoGroupsOfSize(names, 3, false).map((g) => g.length)).toEqual([3, 3, 1]);
  });

  it("spreads the remainder so sizes differ by at most one, balanced", () => {
    const groups = intoGroupsOfSize(names, 3, true);
    const sizes = groups.map((g) => g.length).sort();
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    expect(groups.flat().sort()).toEqual([...names].sort());
  });
});

describe("shuffle", () => {
  it("keeps every element, changing only the order", () => {
    const out = shuffle(names, () => 0.5);
    expect([...out].sort()).toEqual([...names].sort());
  });
});
