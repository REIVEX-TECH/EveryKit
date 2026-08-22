/**
 * Building a real multi-size .ico from PNG images, byte by byte.
 *
 * The ICO format is a tiny header, one directory entry per image, then the
 * images themselves. Since Vista an entry's payload may be a whole PNG rather
 * than a raw bitmap, which is what every modern icon does and what keeps this
 * small: the browser has already encoded the PNGs, so this only has to frame
 * them.
 *
 * Written here rather than pulled in because that framing is about forty lines
 * and a dependency for it would be larger than the thing it does. It is pure,
 * so the header and the offsets are checked in the tests against the bytes the
 * spec requires.
 */

export type IcoImage = {
  /** Icon edge in pixels: 16, 32, 48. Must be 256 or under. */
  size: number;
  /** A complete PNG file at that size. */
  png: Uint8Array;
};

const ICONDIR = 6; // reserved(2) + type(2) + count(2)
const ICONDIRENTRY = 16;

/**
 * Frame a set of PNGs as one ICO.
 *
 * The directory is fixed-length and comes before any image, so every image's
 * offset is known before a single image byte is written: the header plus one
 * entry per image. That is the whole trick, and getting the offset wrong is
 * the one bug this format invites, so the tests assert each entry's offset
 * points at a PNG signature.
 */
export function buildIco(images: IcoImage[]): Uint8Array {
  if (images.length === 0) throw new Error("An ICO needs at least one image.");

  const total =
    ICONDIR +
    images.length * ICONDIRENTRY +
    images.reduce((sum, image) => sum + image.png.length, 0);

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  view.setUint16(0, 0, true); // reserved, always 0
  view.setUint16(2, 1, true); // type 1 = icon
  view.setUint16(4, images.length, true);

  let entryAt = ICONDIR;
  let imageAt = ICONDIR + images.length * ICONDIRENTRY;

  for (const image of images) {
    // 256 is written as 0 in a single byte, which is how the format expresses
    // it. Nothing here reaches 256, but honouring it keeps the writer correct.
    const dim = image.size >= 256 ? 0 : image.size;

    out[entryAt] = dim; // width
    out[entryAt + 1] = dim; // height
    out[entryAt + 2] = 0; // colours in palette: 0 for a PNG payload
    out[entryAt + 3] = 0; // reserved
    view.setUint16(entryAt + 4, 1, true); // colour planes
    view.setUint16(entryAt + 6, 32, true); // bits per pixel
    view.setUint32(entryAt + 8, image.png.length, true); // payload size
    view.setUint32(entryAt + 12, imageAt, true); // payload offset

    out.set(image.png, imageAt);

    entryAt += ICONDIRENTRY;
    imageAt += image.png.length;
  }

  return out;
}

/**
 * The icon set a site actually uses, and why each size is there.
 *
 * Kept beside the builder so the tool, the ZIP names and the HTML snippet all
 * read one list rather than three that can drift apart.
 */
export type IconSpec = {
  size: number;
  name: string;
  /** true when it also belongs inside favicon.ico. */
  inIco: boolean;
  purpose: string;
};

export const ICON_SPECS: IconSpec[] = [
  { size: 16, name: "favicon-16x16.png", inIco: true, purpose: "Browser tab" },
  { size: 32, name: "favicon-32x32.png", inIco: true, purpose: "Browser tab, sharper screens" },
  { size: 48, name: "favicon-48x48.png", inIco: true, purpose: "Windows and older browsers" },
  { size: 180, name: "apple-touch-icon.png", inIco: false, purpose: "iPhone home screen" },
  { size: 512, name: "icon-512.png", inIco: false, purpose: "Android install" },
];

/** The <head> snippet naming the files this produces. */
export function faviconHtml(): string {
  return [
    '<link rel="icon" href="/favicon.ico" sizes="any">',
    '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
  ].join("\n");
}
