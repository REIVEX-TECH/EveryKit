"use client";

/**
 * Typed signatures: rendering to a canvas, and to an SVG that survives being
 * sent to someone else.
 *
 * The awkward part is the SVG. A `<text>` element naming a font family only
 * renders correctly on a machine that has that font, and a handwriting font
 * almost nobody has installed. Sent to a solicitor it would arrive in Times New
 * Roman, which is not what anyone signed.
 *
 * So the font is inlined. The face is already self-hosted on this origin by
 * next/font, its URL is discoverable from the stylesheet it injected, and the
 * bytes go into the SVG as a data URI inside an @font-face rule. The result
 * opens correctly anywhere, with no external request and nothing to install.
 */

export type SignatureFont = {
  id: string;
  label: string;
  /** The family name next/font exposes through a CSS variable. */
  cssVariable: string;
};

/** How tall the typed signature is drawn, in canvas units. */
export const TYPED_FONT_SIZE = 64;

/** Padding around the text so descenders and flourishes are not clipped. */
const PAD = 16;

export const EXPORT_SCALE = 3;

function familyFor(font: SignatureFont): string {
  // The variable resolves to the family name plus its fallbacks.
  return getComputedStyle(document.documentElement).getPropertyValue(font.cssVariable).trim();
}

export type TypedRender = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

/**
 * Draw the text and hand back a canvas cropped to the ink.
 *
 * Measured rather than guessed: a script face's actual bounding box is nothing
 * like its font size, and the flourish on a capital letter routinely hangs well
 * outside the advance width.
 */
export function renderTyped(
  text: string,
  font: SignatureFont,
  colour: string,
  scale = EXPORT_SCALE,
): TypedRender | null {
  const value = text.trim();
  if (value === "") return null;

  const family = familyFor(font);
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return null;
  measure.font = `${TYPED_FONT_SIZE}px ${family}`;
  const metrics = measure.measureText(value);

  const ascent = metrics.actualBoundingBoxAscent || TYPED_FONT_SIZE * 0.8;
  const descent = metrics.actualBoundingBoxDescent || TYPED_FONT_SIZE * 0.3;
  const left = metrics.actualBoundingBoxLeft || 0;
  const right = metrics.actualBoundingBoxRight || metrics.width;

  const width = Math.ceil(left + right + PAD * 2);
  const height = Math.ceil(ascent + descent + PAD * 2);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.font = `${TYPED_FONT_SIZE}px ${family}`;
  ctx.fillStyle = colour;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(value, PAD + left, PAD + ascent);

  return { canvas, width, height };
}

/**
 * The woff2 bytes for a family, as a data URI.
 *
 * next/font writes an @font-face rule pointing at a file on this origin. Same
 * origin means the CSP allows fetching it, and inlining it is what makes the
 * exported SVG stand on its own.
 */
async function fontDataUri(family: string): Promise<string | null> {
  const wanted = family.split(",")[0].replace(/['"]/g, "").trim().toLowerCase();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // A stylesheet from another origin cannot be read. Ours can.
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const declared = rule.style
        .getPropertyValue("font-family")
        .replace(/['"]/g, "")
        .trim()
        .toLowerCase();
      if (declared !== wanted) continue;

      const src = rule.style.getPropertyValue("src");
      const match = src.match(/url\(["']?([^"')]+)["']?\)/);
      if (!match) continue;

      try {
        const response = await fetch(match[1]);
        if (!response.ok) return null;
        const buffer = new Uint8Array(await response.arrayBuffer());
        let binary = "";
        for (const byte of buffer) binary += String.fromCharCode(byte);
        return `data:font/woff2;base64,${btoa(binary)}`;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export type TypedSvg = { svg: string; fontEmbedded: boolean };

/**
 * A standalone SVG of the typed signature.
 *
 * When the font bytes can be read, they are embedded and the file renders
 * correctly for anyone. When they cannot, the SVG still carries the text with
 * the family named, and `fontEmbedded` comes back false so the UI can say the
 * recipient needs that font rather than letting them find out.
 */
export async function typedToSvg(
  text: string,
  font: SignatureFont,
  colour: string,
): Promise<TypedSvg | null> {
  const value = text.trim();
  if (value === "") return null;

  const rendered = renderTyped(value, font, colour, 1);
  if (!rendered) return null;

  const family = familyFor(font);
  const primary = family.split(",")[0].replace(/['"]/g, "").trim();
  const dataUri = await fontDataUri(family);

  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const face = dataUri
    ? `<defs><style>@font-face{font-family:"${primary}";src:url(${dataUri}) format("woff2");}</style></defs>`
    : "";

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${rendered.width}" height="${rendered.height}" viewBox="0 0 ${rendered.width} ${rendered.height}">`,
    face,
    `<text x="${PAD}" y="${rendered.height - PAD - TYPED_FONT_SIZE * 0.22}" font-family="${primary}" font-size="${TYPED_FONT_SIZE}" fill="${colour}">${escaped}</text>`,
    `</svg>`,
  ].join("");

  return { svg, fontEmbedded: dataUri !== null };
}
