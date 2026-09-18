import { describe, it, expect } from "vitest";
import { strFromU8, unzipSync } from "fflate";
import {
  buildExport,
  escapeHtml,
  newsletterFileName,
  renderEmailHtml,
  resolveUsedImages,
  safeColor,
  slugify,
} from "./export";
import {
  createBlock,
  type HeadingBlock,
  type ImageBlock,
  type NewsletterDoc,
  type TextBlock,
} from "./blocks";

// A real 1x1 PNG, so the exporter decodes actual bytes rather than a stub.
const PNG_1PX =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function imageBlock(imageId: string | null, extra: Partial<ImageBlock> = {}): ImageBlock {
  return { ...(createBlock("image") as ImageBlock), imageId, ...extra };
}

function docWith(blocks: NewsletterDoc["blocks"], images: NewsletterDoc["images"] = []): NewsletterDoc {
  return { name: "Test letter", pageBackground: "#f4f4f5", blocks, images };
}

describe("email HTML is client-safe", () => {
  const doc = docWith(
    [
      { ...(createBlock("heading") as HeadingBlock), text: "Hello <world> & friends" },
      { ...(createBlock("text") as TextBlock), text: "Line one\nLine two" },
      imageBlock("img1", { alt: "a cat", href: "https://example.com/cats", width: 500 }),
      createBlock("button"),
      createBlock("divider"),
      createBlock("spacer"),
      createBlock("footer"),
    ],
    [{ id: "img1", name: "My Cat Photo.PNG", dataUrl: PNG_1PX }],
  );
  const html = buildExport(doc).html;

  it("is built from presentation tables, not divs", () => {
    expect(html).toContain('role="presentation"');
    expect(html).toContain("<table");
    expect(html).toContain("<tr>");
    expect(html).toContain("<td");
  });

  it("uses inline styles only, with no style block", () => {
    expect(html).toContain('style="');
    expect(html.toLowerCase()).not.toContain("<style");
    expect(html.toLowerCase()).not.toContain("</style>");
  });

  it("never uses flexbox or grid for layout", () => {
    const lower = html.toLowerCase();
    expect(lower).not.toContain("display:flex");
    expect(lower).not.toContain("display: flex");
    expect(lower).not.toContain("display:grid");
    expect(lower).not.toContain("grid-template");
  });

  it("fixes the container at 600px", () => {
    expect(html).toContain('width="600"');
    expect(html).toContain("max-width:600px");
  });

  it("leads the font stack with IBM Plex Sans", () => {
    expect(html).toContain("'IBM Plex Sans'");
    const stackAt = html.indexOf("font-family:'IBM Plex Sans'");
    expect(stackAt).toBeGreaterThan(-1);
  });

  it("escapes user text so it cannot become markup", () => {
    expect(html).toContain("Hello &lt;world&gt; &amp; friends");
    expect(html).not.toContain("Hello <world>");
  });

  it("turns newlines in copy into <br>", () => {
    expect(html).toContain("Line one<br />Line two");
  });

  it("references images by a relative images/ path", () => {
    expect(html).toContain('src="images/my-cat-photo.png"');
    expect(html).not.toContain("data:image");
  });

  it("wraps a button as a bulletproof table cell, not a styled div", () => {
    expect(html).toContain('bgcolor="#1d81f2"');
    expect(html).toContain("border-radius:6px");
  });

  it("has a valid doctype and a title", () => {
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>Test letter</title>");
  });
});

describe("only images that are used get exported", () => {
  it("keeps a placed image and drops an unplaced one", () => {
    const doc = docWith(
      [imageBlock("used")],
      [
        { id: "used", name: "used.png", dataUrl: PNG_1PX },
        { id: "spare", name: "spare.png", dataUrl: PNG_1PX },
      ],
    );
    const used = resolveUsedImages(doc);
    expect(used.map((u) => u.id)).toEqual(["used"]);
    expect(used[0].path).toBe("images/used.png");
  });

  it("skips an image block with nothing chosen", () => {
    const doc = docWith([imageBlock(null)], []);
    expect(resolveUsedImages(doc)).toHaveLength(0);
    expect(buildExport(doc).html).not.toContain("<img");
  });

  it("gives two same-named images distinct file names", () => {
    const doc = docWith(
      [imageBlock("a"), imageBlock("b")],
      [
        { id: "a", name: "logo.png", dataUrl: PNG_1PX },
        { id: "b", name: "logo.png", dataUrl: PNG_1PX },
      ],
    );
    const paths = resolveUsedImages(doc).map((u) => u.path);
    expect(paths).toEqual(["images/logo.png", "images/logo-2.png"]);
  });
});

describe("the zip", () => {
  const doc = docWith(
    [{ ...(createBlock("heading") as HeadingBlock), text: "Zipped" }, imageBlock("img1")],
    [
      { id: "img1", name: "hero.png", dataUrl: PNG_1PX },
      { id: "unused", name: "unused.png", dataUrl: PNG_1PX },
    ],
  );
  const result = buildExport(doc);

  it("produces zip bytes with the PK signature", () => {
    expect(result.zip).toBeInstanceOf(Uint8Array);
    expect(result.zip.length).toBeGreaterThan(0);
    expect(result.zip[0]).toBe(0x50);
    expect(result.zip[1]).toBe(0x4b);
  });

  it("contains index.html, the README and only the used image", () => {
    const entries = unzipSync(result.zip);
    const names = Object.keys(entries).sort();
    expect(names).toEqual(["README.txt", "images/hero.png", "index.html"]);
    expect(strFromU8(entries["index.html"])).toContain("Zipped");
  });

  it("names the file after the newsletter", () => {
    expect(result.fileName).toBe("test-letter.zip");
  });

  it("ships a README that explains hosting, in house voice with no dashes", () => {
    expect(result.readme).toContain("images");
    expect(result.readme.toLowerCase()).toContain("uploaded");
    expect(result.readme).not.toContain("—");
    expect(result.readme).not.toMatch(/ - /);
  });
});

describe("value hardening", () => {
  it("passes real colours and rejects style injection", () => {
    expect(safeColor("#1d81f2")).toBe("#1d81f2");
    expect(safeColor("#fff")).toBe("#fff");
    expect(safeColor('#fff"><script>', "#000000")).toBe("#000000");
    expect(safeColor("javascript:alert(1)", "#123456")).toBe("#123456");
  });

  it("cannot be broken out of a style attribute via a colour", () => {
    const doc = docWith([{ ...(createBlock("heading") as HeadingBlock), text: "hi", background: '#fff"><b>x' }], []);
    const html = renderEmailHtml(doc, new Map());
    expect(html).not.toContain("<b>x");
  });

  it("slugifies names for the download", () => {
    expect(slugify("My Newsletter!")).toBe("my-newsletter");
    expect(newsletterFileName("  Spring Sale 2026 ")).toBe("spring-sale-2026.zip");
    expect(newsletterFileName("")).toBe("newsletter.zip");
  });

  it("escapes html entities", () => {
    expect(escapeHtml("<a> & <b>")).toBe("&lt;a&gt; &amp; &lt;b&gt;");
  });
});
