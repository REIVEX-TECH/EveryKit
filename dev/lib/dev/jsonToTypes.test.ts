import { describe, expect, it } from "vitest";
import { jsonToTypes } from "./jsonToTypes";

describe("jsonToTypes", () => {
  it("names a top-level object with the root name and its primitive fields", () => {
    const out = jsonToTypes({ id: 1, name: "Ada", active: true }, "User");
    expect(out).toContain("interface User {");
    expect(out).toContain("id: number;");
    expect(out).toContain("name: string;");
    expect(out).toContain("active: boolean;");
  });

  it("gives a nested object its own interface", () => {
    const out = jsonToTypes({ id: 1, address: { city: "London", zip: "N1" } }, "User");
    expect(out).toContain("interface Address {");
    expect(out).toContain("city: string;");
    expect(out).toContain("address: Address;");
  });

  it("merges an array of objects, marking missing keys optional and mixed types as unions", () => {
    const out = jsonToTypes(
      { items: [{ a: 1, b: "x" }, { a: 2 }, { a: "n", b: "y" }] },
      "Cart",
    );
    // Element interface is the singular of the field name.
    expect(out).toContain("interface Item {");
    // a is number in two elements and string in one: a union.
    expect(out).toMatch(/a: (number \| string|string \| number);/);
    // b is missing from the second element: optional.
    expect(out).toMatch(/b\?: string;/);
    expect(out).toContain("items: Item[];");
  });

  it("types an empty array as unknown[] and a null as null", () => {
    const out = jsonToTypes({ tags: [], parent: null }, "Node");
    expect(out).toContain("tags: unknown[];");
    expect(out).toContain("parent: null;");
  });

  it("unions the element types of a mixed primitive array", () => {
    const out = jsonToTypes({ mixed: [1, "a", true] }, "Bag");
    expect(out).toMatch(/mixed: \((boolean \| number \| string)\)\[\];/);
  });

  it("quotes a key that is not a valid identifier", () => {
    const out = jsonToTypes({ "first-name": "Ada" }, "Row");
    expect(out).toContain('"first-name": string;');
  });

  it("wraps a top-level array of objects in a root alias", () => {
    const out = jsonToTypes([{ id: 1 }, { id: 2 }], "Root");
    expect(out).toContain("interface RootItem {");
    expect(out).toContain("type Root = RootItem[];");
  });
});
