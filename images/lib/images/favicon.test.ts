import { describe, expect, it } from "vitest";
import { buildIco, faviconHtml, ICON_SPECS } from "./favicon";

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** A stand-in PNG: the real signature followed by filler, at a given length. */
function fakePng(length: number, fill = 0xab): Uint8Array {
  const png = new Uint8Array(length).fill(fill);
  png.set(PNG_SIG, 0);
  return png;
}

function u16(view: DataView, at: number) {
  return view.getUint16(at, true);
}
function u32(view: DataView, at: number) {
  return view.getUint32(at, true);
}

describe("buildIco", () => {
  it("writes the ICONDIR header", () => {
    const ico = buildIco([{ size: 16, png: fakePng(40) }]);
    const view = new DataView(ico.buffer);
    expect(u16(view, 0)).toBe(0); // reserved
    expect(u16(view, 2)).toBe(1); // type: icon
    expect(u16(view, 4)).toBe(1); // count
  });

  it("points each directory entry at a real PNG payload", () => {
    // The one bug this format invites is a wrong offset, so this is the
    // assertion that matters: every entry's offset lands on a PNG signature.
    const images = [
      { size: 16, png: fakePng(50, 0x11) },
      { size: 32, png: fakePng(80, 0x22) },
      { size: 48, png: fakePng(120, 0x33) },
    ];
    const ico = buildIco(images);
    const view = new DataView(ico.buffer);

    expect(u16(view, 4)).toBe(3);

    for (let i = 0; i < images.length; i++) {
      const entry = 6 + i * 16;
      const declaredSize = u32(view, entry + 8);
      const offset = u32(view, entry + 12);
      expect(declaredSize).toBe(images[i].png.length);
      // The payload at that offset begins with the PNG signature.
      expect(Array.from(ico.slice(offset, offset + 8))).toEqual(PNG_SIG);
      // And it is the specific PNG we put in, checked by its filler byte.
      expect(ico[offset + 8]).toBe(images[i].png[8]);
    }
  });

  it("records each icon's dimension in the entry", () => {
    const ico = buildIco([{ size: 48, png: fakePng(40) }]);
    expect(ico[6]).toBe(48); // width
    expect(ico[7]).toBe(48); // height
  });

  it("writes 256 as zero, which is how the format expresses it", () => {
    const ico = buildIco([{ size: 256, png: fakePng(40) }]);
    expect(ico[6]).toBe(0);
    expect(ico[7]).toBe(0);
  });

  it("has a total length matching header, entries and payloads", () => {
    const images = [
      { size: 16, png: fakePng(50) },
      { size: 32, png: fakePng(90) },
    ];
    const ico = buildIco(images);
    expect(ico.length).toBe(6 + 2 * 16 + 50 + 90);
  });

  it("refuses an empty set", () => {
    expect(() => buildIco([])).toThrow(/at least one/i);
  });
});

describe("the icon set", () => {
  it("puts 16, 32 and 48 into the ICO and the larger ones outside it", () => {
    const inIco = ICON_SPECS.filter((s) => s.inIco).map((s) => s.size);
    expect(inIco).toEqual([16, 32, 48]);
    expect(ICON_SPECS.some((s) => s.size === 180 && !s.inIco)).toBe(true);
    expect(ICON_SPECS.some((s) => s.size === 512 && !s.inIco)).toBe(true);
  });

  it("names every file the HTML snippet references, and vice versa", () => {
    const html = faviconHtml();
    expect(html).toContain("/favicon.ico");
    expect(html).toContain("favicon-16x16.png");
    expect(html).toContain("favicon-32x32.png");
    expect(html).toContain("apple-touch-icon.png");
  });
});
