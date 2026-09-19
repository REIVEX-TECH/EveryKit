/**
 * Turn a newsletter document into an email that actually sends.
 *
 * The output is email safe HTML: table based layout with role="presentation",
 * inline styles only, a fixed 600px container, and a web safe font stack led by
 * IBM Plex Sans. No <style> block is relied on, and there is no flexbox or grid
 * anywhere, because Gmail strips the former and Outlook understands neither.
 * Everything a modern page would reach for is the wrong tool here.
 *
 * The folder is zipped with fflate, the same MIT, no-dependency, no-network
 * library the PDF kit uses. Nothing is fetched at run time and nothing is
 * uploaded: the images are the ones the person put in the tab, written straight
 * into the archive.
 */

import { strFromU8, unzipSync, zipSync } from "fflate";
import { EMAIL_WIDTH, type Block, type NewsletterDoc } from "./blocks";

/**
 * IBM Plex Sans first, then the fonts that are actually installed in mail
 * clients. Email cannot rely on a web font loading, so the fallbacks carry the
 * real weight and Plex is a progressive nicety for the clients that have it.
 */
const FONT_STACK =
  "'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// --- escaping -------------------------------------------------------------

/** Escape text going into element content. User text is never trusted. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape a value going into a double-quoted attribute. */
export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

/** Escaped text with newlines turned into <br>, for multi-line copy. */
function textToHtml(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

// --- value hardening ------------------------------------------------------

/**
 * Only let a real colour into a style attribute. A colour input yields
 * #rrggbb, but a pasted value must never be able to close the attribute and
 * add its own declarations, so anything that is not a plain hex or rgb() colour
 * falls back rather than being trusted.
 */
export function safeColor(value: string, fallback = "#000000"): string {
  const v = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v;
  if (/^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/.test(v)) return v;
  if (/^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/.test(v)) return v;
  return fallback;
}

/** Clamp a number to a safe integer range for a px value. */
function clampInt(value: number, min: number, max: number): number {
  const n = Math.round(Number.isFinite(value) ? value : min);
  return Math.min(max, Math.max(min, n));
}

function evenRatio(count: number): number[] {
  const each = Math.floor(100 / count);
  const out = Array(count).fill(each);
  out[out.length - 1] += 100 - each * count;
  return out;
}

/**
 * Column widths in px, derived from the ratio and capped to the 600px email, so
 * the split is carried as real pixel widths the email clients honour. A ratio
 * that is malformed (wrong length, non-positive) falls back to even columns.
 */
function ratioToPx(ratio: number[], count: number): number[] {
  const source = Array.isArray(ratio) && ratio.length === count ? ratio : evenRatio(count);
  const clean = source.map((p) => (Number.isFinite(p) && p > 0 ? p : 1));
  const total = clean.reduce((a, b) => a + b, 0) || count;
  return clean.map((p) => Math.max(40, Math.round((EMAIL_WIDTH * p) / total)));
}

// --- images ---------------------------------------------------------------

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function parseDataUrl(dataUrl: string): { mime: string; base64: string } | null {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl.trim());
  if (!match) return null;
  return { mime: match[1].toLowerCase(), base64: match[2] };
}

/** Decode base64 to bytes. atob is global in browsers and in Node 20. */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

/** Encode bytes to base64. Chunked so a large image does not blow the stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function utf8ToBase64(text: string): string {
  return bytesToBase64(new TextEncoder().encode(text));
}

function base64ToUtf8(base64: string): string {
  return new TextDecoder().decode(base64ToBytes(base64));
}

function mimeFromPath(path: string): string {
  const ext = path.slice(path.lastIndexOf(".") + 1).toLowerCase();
  const entry = Object.entries(MIME_EXT).find(([, value]) => value === ext);
  return entry ? entry[0] : "image/png";
}

function safeBaseName(name: string): string {
  const base = name
    .replace(/^.*[\\/]/, "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return base || "image";
}

export type UsedImage = { id: string; path: string; bytes: Uint8Array };

/**
 * The images the newsletter actually references, each with a unique, safe file
 * name under images/. An image dropped into the workspace but never placed on
 * the canvas is not here, so the export never ships a file nobody can see.
 */
export function resolveUsedImages(doc: NewsletterDoc): UsedImage[] {
  const byId = new Map(doc.images.map((image) => [image.id, image]));
  const usedIds: string[] = [];
  const note = (imageId: string | null) => {
    if (imageId && byId.has(imageId) && !usedIds.includes(imageId)) usedIds.push(imageId);
  };
  for (const block of doc.blocks) {
    if (block.type === "image") note(block.imageId);
    // One level of nesting: image blocks placed inside a columns row.
    if (block.type === "columns") {
      for (const cell of block.columns) {
        if (cell.block && cell.block.type === "image") note(cell.block.imageId);
      }
    }
  }

  const taken = new Set<string>();
  const out: UsedImage[] = [];
  for (const id of usedIds) {
    const image = byId.get(id);
    if (!image) continue;
    const parsed = parseDataUrl(image.dataUrl);
    if (!parsed) continue;
    const ext = MIME_EXT[parsed.mime] ?? "png";
    const base = safeBaseName(image.name);
    let file = `${base}.${ext}`;
    let n = 2;
    while (taken.has(file.toLowerCase())) {
      file = `${base}-${n}.${ext}`;
      n += 1;
    }
    taken.add(file.toLowerCase());
    out.push({ id, path: `images/${file}`, bytes: base64ToBytes(parsed.base64) });
  }
  return out;
}

// --- block rendering ------------------------------------------------------

function renderBlock(block: Block, pathById: Map<string, string>): string {
  const pad = clampInt(block.padding, 0, 120);
  const bg = safeColor(block.background, "#ffffff");

  switch (block.type) {
    case "heading": {
      const size = clampInt(block.fontSize, 10, 60);
      return `<tr><td align="${block.align}" style="padding:${pad}px;background-color:${bg};font-family:${FONT_STACK};font-size:${size}px;font-weight:bold;line-height:1.3;color:${safeColor(block.color, "#171717")};">${textToHtml(block.text)}</td></tr>`;
    }
    case "banner": {
      const size = clampInt(block.fontSize, 10, 60);
      return `<tr><td align="${block.align}" style="padding:${pad}px;background-color:${bg};font-family:${FONT_STACK};font-size:${size}px;font-weight:bold;line-height:1.3;color:${safeColor(block.color, "#ffffff")};">${textToHtml(block.text)}</td></tr>`;
    }
    case "text":
    case "footer": {
      const size = clampInt(block.fontSize, 9, 40);
      return `<tr><td align="${block.align}" style="padding:${pad}px;background-color:${bg};font-family:${FONT_STACK};font-size:${size}px;line-height:1.5;color:${safeColor(block.color, "#444444")};">${textToHtml(block.text)}</td></tr>`;
    }
    case "columns": {
      const widths = ratioToPx(block.ratio, block.count);
      const cells = block.columns.slice(0, block.count);
      const columnsHtml = cells
        .map((cell, index) => {
          const colBg = safeColor(cell.background, "#ffffff");
          const colPad = clampInt(cell.padding, 0, 60);
          const content = cell.block
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${renderBlock(cell.block, pathById)}</table>`
            : "&nbsp;";
          // The column is an inline-block whose width tracks the container but is
          // capped at its share of 600px. When the container is wide enough the
          // columns sit at their ratio side by side; when it is not, the later
          // column cannot fit and wraps below, which is the stacking.
          return (
            `<div style="display:inline-block;width:100%;max-width:${widths[index]}px;vertical-align:top;text-align:left;">` +
            `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">` +
            `<tr><td valign="top" style="padding:${colPad}px;background-color:${colBg};">${content}</td></tr>` +
            `</table></div>`
          );
        })
        .join("");
      // font-size:0 on the wrapper removes the whitespace gap between inline-block
      // columns; each inner table sets its own font again.
      return (
        `<tr><td align="center" style="padding:${pad}px;background-color:${bg};">` +
        `<div style="font-size:0;text-align:center;">${columnsHtml}</div>` +
        `</td></tr>`
      );
    }
    case "image": {
      const path = block.imageId ? pathById.get(block.imageId) : undefined;
      if (!path) return "";
      const width = clampInt(block.width, 20, EMAIL_WIDTH);
      const img = `<img src="${escapeAttr(path)}" alt="${escapeAttr(block.alt)}" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />`;
      const href = block.href.trim();
      const inner = href ? `<a href="${escapeAttr(href)}" target="_blank" style="text-decoration:none;">${img}</a>` : img;
      return `<tr><td align="${block.align}" style="padding:${pad}px;background-color:${bg};">${inner}</td></tr>`;
    }
    case "button": {
      const radius = clampInt(block.radius, 0, 40);
      const btn = safeColor(block.buttonColor, "#1d81f2");
      const btnText = safeColor(block.buttonTextColor, "#ffffff");
      const href = block.href.trim() || "#";
      return (
        `<tr><td align="${block.align}" style="padding:${pad}px;background-color:${bg};">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">` +
        `<tr><td align="center" bgcolor="${btn}" style="border-radius:${radius}px;background-color:${btn};">` +
        `<a href="${escapeAttr(href)}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:${FONT_STACK};font-size:16px;font-weight:bold;line-height:1;color:${btnText};text-decoration:none;border-radius:${radius}px;">${escapeHtml(block.label)}</a>` +
        `</td></tr></table></td></tr>`
      );
    }
    case "divider": {
      const thickness = clampInt(block.thickness, 1, 20);
      const line = safeColor(block.lineColor, "#e2e8f0");
      return (
        `<tr><td style="padding:${pad}px;background-color:${bg};">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-top:${thickness}px solid ${line};font-size:0;line-height:0;">&nbsp;</td>` +
        `</tr></table></td></tr>`
      );
    }
    case "spacer": {
      const height = clampInt(block.height, 4, 200);
      return `<tr><td height="${height}" style="height:${height}px;line-height:${height}px;font-size:0;background-color:${bg};">&nbsp;</td></tr>`;
    }
  }
}

/**
 * The whole email as one HTML string.
 *
 * `embedComment`, when given, is an HTML comment placed just inside <html>. The
 * export uses it to carry a machine-readable snapshot of the document so the
 * same file can be opened back into the builder. Email clients ignore comments,
 * and the preview passes nothing, so it appears only in the downloaded file.
 */
export function renderEmailHtml(
  doc: NewsletterDoc,
  pathById: Map<string, string>,
  embedComment = "",
): string {
  const pageBg = safeColor(doc.pageBackground, "#f4f4f5");
  const rows = doc.blocks.map((block) => renderBlock(block, pathById)).filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">${embedComment ? `\n${embedComment}` : ""}
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${escapeHtml(doc.name || "Newsletter")}</title>
</head>
<body style="margin:0;padding:0;background-color:${pageBg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:${pageBg};">
<tr>
<td align="center" style="padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${EMAIL_WIDTH}px;margin:0 auto;font-family:${FONT_STACK};">
${rows}
</table>
</td>
</tr>
</table>
</body>
</html>
`;
}

// --- packaging ------------------------------------------------------------

/** A file-system-safe, lower-case name for the zip. */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function newsletterFileName(name: string): string {
  return `${slugify(name) || "newsletter"}.zip`;
}

function buildReadme(doc: NewsletterDoc): string {
  const title = doc.name || "Newsletter";
  return [
    title,
    "",
    "This folder was made with EveryKit Newsletter (newsletter.useeverykit.com).",
    "",
    "index.html is your email, written as email safe HTML.",
    "images/ holds the pictures it uses.",
    "",
    "To send this newsletter there is one thing to do first. Email cannot read",
    "image files from a folder on your computer, so the images have to live on",
    "the web. Upload the files in the images folder to your own image host or to",
    "your email tool, then open index.html and replace each src=\"images/...\"",
    "with the web address of that same image. After that the email is ready to",
    "paste into your email service and send.",
    "",
    "Everything was built in your browser. Nothing was uploaded.",
    "",
  ].join("\n");
}

function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export type ExportResult = {
  fileName: string;
  html: string;
  readme: string;
  images: UsedImage[];
  zip: Uint8Array;
};

/**
 * Build everything the download needs: the HTML, the used images, the README,
 * and the zip that holds all three.
 */
export function buildExport(doc: NewsletterDoc): ExportResult {
  const images = resolveUsedImages(doc);
  const pathById = new Map(images.map((image) => [image.id, image.path]));
  const html = renderEmailHtml(doc, pathById, encodeEmbed(buildManifest(doc, images)));
  const readme = buildReadme(doc);

  const record: Record<string, [Uint8Array, { level: 0 | 6 }]> = {
    // Text compresses well and is small; images are already compressed, so they
    // are stored rather than deflated (deflate over a JPEG spends CPU for almost
    // nothing).
    "index.html": [encode(html), { level: 6 }],
    "README.txt": [encode(readme), { level: 6 }],
  };
  for (const image of images) {
    record[image.path] = [image.bytes, { level: 0 }];
  }

  return {
    fileName: newsletterFileName(doc.name),
    html,
    readme,
    images,
    zip: zipSync(record),
  };
}

// --- reopening a saved export ---------------------------------------------

/**
 * The snapshot embedded in an export so it can be opened back into the builder.
 *
 * It carries the blocks and settings verbatim, and for each used image only its
 * id, name and the path it was written to, not the bytes, since the bytes are
 * already in the images/ folder of the same zip. The whole thing is base64 in an
 * HTML comment, which uses no "-" so it can never accidentally close the comment.
 */
const EMBED_TAG = "everykit:v1:";
const EMBED_RE = /<!--everykit:v1:([A-Za-z0-9+/=]+)-->/;

type EmbeddedImage = { id: string; name: string; path: string };
type EmbeddedDoc = {
  v: 1;
  name: string;
  pageBackground: string;
  blocks: Block[];
  images: EmbeddedImage[];
};

function buildManifest(doc: NewsletterDoc, used: UsedImage[]): EmbeddedDoc {
  const nameById = new Map(doc.images.map((image) => [image.id, image.name]));
  return {
    v: 1,
    name: doc.name,
    pageBackground: doc.pageBackground,
    blocks: doc.blocks,
    images: used.map((image) => ({
      id: image.id,
      name: nameById.get(image.id) ?? "image",
      path: image.path,
    })),
  };
}

function encodeEmbed(manifest: EmbeddedDoc): string {
  return `<!--${EMBED_TAG}${utf8ToBase64(JSON.stringify(manifest))}-->`;
}

export function parseEmbeddedDoc(html: string): EmbeddedDoc | null {
  const match = EMBED_RE.exec(html);
  if (!match) return null;
  try {
    const parsed = JSON.parse(base64ToUtf8(match[1])) as EmbeddedDoc;
    if (!parsed || typeof parsed.name !== "string" || typeof parsed.pageBackground !== "string") {
      return null;
    }
    if (!Array.isArray(parsed.blocks) || !Array.isArray(parsed.images)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Rebuild a document from a zip this tool produced. The blocks and settings come
 * from the embedded snapshot; each image is read back out of the images/ folder
 * and rehydrated into a data URL, so the builder is exactly where it left off.
 * Returns null if the file is not one of ours.
 */
export function importFromZipBytes(bytes: Uint8Array): NewsletterDoc | null {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    return null;
  }
  const indexBytes = entries["index.html"];
  if (!indexBytes) return null;
  const parsed = parseEmbeddedDoc(strFromU8(indexBytes));
  if (!parsed) return null;

  const images: NewsletterDoc["images"] = [];
  for (const meta of parsed.images) {
    const fileBytes = entries[meta.path];
    if (!fileBytes) continue;
    images.push({
      id: meta.id,
      name: meta.name,
      dataUrl: `data:${mimeFromPath(meta.path)};base64,${bytesToBase64(fileBytes)}`,
    });
  }
  return { name: parsed.name, pageBackground: parsed.pageBackground, blocks: parsed.blocks, images };
}

/**
 * Rebuild a document from a bare index.html this tool produced. The blocks come
 * back but the images cannot (their bytes live in the folder, not the file), so
 * image blocks return with nothing chosen. Prefer the zip.
 */
export function importFromHtml(html: string): NewsletterDoc | null {
  const parsed = parseEmbeddedDoc(html);
  if (!parsed) return null;
  return { name: parsed.name, pageBackground: parsed.pageBackground, blocks: parsed.blocks, images: [] };
}
