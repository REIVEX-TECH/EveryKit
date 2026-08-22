import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  formatHsl,
  hslToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  wcagGrades,
} from "./color";
import { renderMarkdown } from "./markdown";
import { jsonToCsv, textToCsv } from "./jsonToCsv";

describe("parseColor", () => {
  it("reads six-digit and three-digit hex", () => {
    expect(parseColor("#1d81f2")).toEqual({ r: 29, g: 129, b: 242 });
    expect(parseColor("#abc")).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseColor("1d81f2")).toEqual({ r: 29, g: 129, b: 242 });
  });
  it("reads rgb() and ignores alpha", () => {
    expect(parseColor("rgb(29, 129, 242)")).toEqual({ r: 29, g: 129, b: 242 });
    expect(parseColor("rgba(29,129,242,0.5)")).toEqual({ r: 29, g: 129, b: 242 });
  });
  it("reads hsl()", () => {
    // hsl(210, 89%, 53%) is close to #1d81f2.
    const rgb = parseColor("hsl(210, 89%, 53%)");
    expect(rgb).not.toBeNull();
    expect(rgb!.b).toBeGreaterThan(rgb!.r);
  });
  it("returns null for nonsense", () => {
    expect(parseColor("not a colour")).toBeNull();
    expect(parseColor("")).toBeNull();
  });
});

describe("colour conversions round-trip", () => {
  it("rgb to hex and back", () => {
    const rgb = { r: 29, g: 129, b: 242 };
    expect(rgbToHex(rgb)).toBe("#1d81f2");
    expect(parseColor(rgbToHex(rgb))).toEqual(rgb);
  });
  it("rgb to hsl to rgb lands back within rounding", () => {
    for (const rgb of [{ r: 29, g: 129, b: 242 }, { r: 255, g: 138, b: 76 }, { r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }]) {
      const back = hslToRgb(rgbToHsl(rgb));
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
    }
  });
  it("grey has zero saturation", () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });
  it("formats hsl", () => {
    expect(formatHsl({ h: 210, s: 89, l: 53 })).toBe("hsl(210, 89%, 53%)");
  });
});

describe("contrast and WCAG grades", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 0);
  });
  it("grades a strong pair as passing everything", () => {
    const g = wcagGrades(21);
    expect(g.normalAA && g.normalAAA && g.largeAA && g.largeAAA).toBe(true);
  });
  it("grades a middling pair as large-only", () => {
    // 3.5:1 passes large AA but not normal AA.
    const g = wcagGrades(3.5);
    expect(g.largeAA).toBe(true);
    expect(g.normalAA).toBe(false);
  });
});

describe("renderMarkdown", () => {
  it("renders headings, bold, italic and inline code", () => {
    expect(renderMarkdown("# Title")).toBe("<h1>Title</h1>");
    expect(renderMarkdown("**bold**")).toBe("<p><strong>bold</strong></p>");
    expect(renderMarkdown("*it*")).toBe("<p><em>it</em></p>");
    expect(renderMarkdown("`code`")).toBe("<p><code>code</code></p>");
  });

  it("escapes HTML in the source so it cannot inject tags", () => {
    const out = renderMarkdown("<script>alert(1)</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("keeps a star inside inline code literal", () => {
    expect(renderMarkdown("`a * b`")).toContain("<code>a * b</code>");
  });

  it("renders a safe link but drops a javascript: URL", () => {
    expect(renderMarkdown("[go](https://example.com)")).toContain('href="https://example.com"');
    const bad = renderMarkdown("[x](javascript:alert(1))");
    // It is not turned into a link: no anchor, so nothing executable. The
    // literal text is left as harmless escaped characters.
    expect(bad).not.toContain("<a ");
    expect(bad).not.toContain('href="javascript:');
    expect(bad).toContain("[x]");
  });

  it("renders lists, blockquotes, rules and fenced code", () => {
    expect(renderMarkdown("- one\n- two")).toBe("<ul><li>one</li><li>two</li></ul>");
    expect(renderMarkdown("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
    expect(renderMarkdown("> quiet")).toBe("<blockquote>quiet</blockquote>");
    expect(renderMarkdown("---")).toBe("<hr>");
    expect(renderMarkdown("```\n<b>&\n```")).toBe("<pre><code>&lt;b&gt;&amp;</code></pre>");
  });

  it("groups consecutive text lines into one paragraph", () => {
    expect(renderMarkdown("a\nb\n\nc")).toBe("<p>a b</p>\n<p>c</p>");
  });
});

describe("jsonToCsv", () => {
  const comma = { delimiter: "," };

  it("writes a header from the union of keys and one row each", () => {
    const r = jsonToCsv([{ a: 1, b: 2 }, { a: 3, b: 4 }], comma);
    if (!r.ok) throw new Error(r.error);
    expect(r.csv).toBe("a,b\r\n1,2\r\n3,4");
    expect(r.columns).toEqual(["a", "b"]);
    expect(r.rows).toBe(2);
  });

  it("fills a missing field with an empty cell rather than shifting the row", () => {
    const r = jsonToCsv([{ a: 1, b: 2 }, { a: 3 }], comma);
    if (!r.ok) throw new Error(r.error);
    expect(r.csv).toBe("a,b\r\n1,2\r\n3,");
  });

  it("quotes a value with the delimiter, a quote or a newline", () => {
    const r = jsonToCsv([{ note: 'a, b "c"\nd' }], comma);
    if (!r.ok) throw new Error(r.error);
    expect(r.csv).toBe('note\r\n"a, b ""c""\nd"');
  });

  it("flattens one level of nesting into dotted columns", () => {
    const r = jsonToCsv([{ name: "Ada", address: { city: "London", zip: "SW1" } }], comma);
    if (!r.ok) throw new Error(r.error);
    expect(r.columns).toEqual(["name", "address.city", "address.zip"]);
    expect(r.csv).toContain("Ada,London,SW1");
  });

  it("writes an array cell and a deep object as JSON text rather than columns", () => {
    const r = jsonToCsv([{ tags: ["x", "y"], deep: { a: { b: 1 } } }], comma);
    if (!r.ok) throw new Error(r.error);
    expect(r.columns).toEqual(["tags", "deep.a"]);
    // The array cell holds a comma, so it is quoted with its quotes doubled.
    expect(r.csv).toContain('"[""x"",""y""]"');
    // The deep object under deep.a becomes JSON text, quoted for its quotes.
    expect(r.csv).toContain('"{""b"":1}"');
  });

  it("honours a semicolon or tab delimiter", () => {
    expect((jsonToCsv([{ a: 1, b: 2 }], { delimiter: ";" }) as { csv: string }).csv).toBe("a;b\r\n1;2");
    expect((jsonToCsv([{ a: 1, b: 2 }], { delimiter: "\\t" }) as { csv: string }).csv).toBe("a\tb\r\n1\t2");
  });

  it("accepts a single object as one row", () => {
    const r = jsonToCsv({ a: 1 }, comma);
    if (!r.ok) throw new Error(r.error);
    expect(r.csv).toBe("a\r\n1");
  });

  it("rejects an array of plain values", () => {
    const r = jsonToCsv([1, 2, 3], comma);
    expect(r.ok).toBe(false);
  });
});

describe("textToCsv", () => {
  it("reports invalid JSON rather than throwing", () => {
    const r = textToCsv("{not json", { delimiter: "," });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not valid JSON/i);
  });
  it("converts valid JSON text", () => {
    const r = textToCsv('[{"a":1}]', { delimiter: "," });
    if (!r.ok) throw new Error(r.error);
    expect(r.csv).toBe("a\r\n1");
  });
});
