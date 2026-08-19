/**
 * A minimal ZIP writer, so a batch can come back as one download.
 *
 * Written here rather than pulled in, because the whole of what this kit needs
 * is "put these files in a container with no compression". Every byte in a
 * batch is already a JPEG, PNG or WebP — compressed formats that deflate will
 * not shrink — so store mode is not a shortcut, it is the correct choice, and
 * it makes the format small enough to write correctly and test.
 *
 * The output is a standard ZIP: local headers, a central directory, and an
 * end-of-central-directory record. Windows Explorer, macOS Archive Utility and
 * `unzip` all open it.
 */

export type ZipEntry = { name: string; bytes: Uint8Array };

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const END_SIG = 0x06054b50;

/** CRC-32, which a ZIP requires for every entry. */
function crc32(bytes: Uint8Array): number {
  let table = crc32.table;
  if (!table) {
    table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    crc32.table = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = table[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
crc32.table = undefined as Uint32Array | undefined;

/**
 * Names are stored as UTF-8 with the language-encoding flag set, which is what
 * makes a file called "café.jpg" come out with its accent intact rather than
 * as mojibake on a machine with a different default codepage.
 */
function encodeName(name: string): Uint8Array {
  return new TextEncoder().encode(name);
}

/**
 * Every entry gets the same fixed timestamp.
 *
 * A real clock would be the obvious choice, but it makes the output
 * unreproducible: the same inputs would give a different archive every run,
 * and the byte-level tests could not assert on it. Nothing downstream cares
 * what the date says, so it is pinned to the start of the MS-DOS epoch.
 */
const DOS_TIME = 0;
const DOS_DATE = 0x0021; // 1 January 1980, the earliest a ZIP can express

export function makeZip(entries: ZipEntry[]): Uint8Array {
  const encoded = entries.map((entry) => ({
    name: encodeName(entry.name),
    bytes: entry.bytes,
    crc: crc32(entry.bytes),
  }));

  const localSize = encoded.reduce(
    (sum, entry) => sum + 30 + entry.name.length + entry.bytes.length,
    0,
  );
  const centralSize = encoded.reduce((sum, entry) => sum + 46 + entry.name.length, 0);

  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);
  let at = 0;

  const offsets: number[] = [];

  for (const entry of encoded) {
    offsets.push(at);

    view.setUint32(at, LOCAL_SIG, true);
    view.setUint16(at + 4, 20, true); // version needed: 2.0
    view.setUint16(at + 6, 0x0800, true); // flag: names are UTF-8
    view.setUint16(at + 8, 0, true); // method: stored
    view.setUint16(at + 10, DOS_TIME, true);
    view.setUint16(at + 12, DOS_DATE, true);
    view.setUint32(at + 14, entry.crc, true);
    view.setUint32(at + 18, entry.bytes.length, true); // compressed size
    view.setUint32(at + 22, entry.bytes.length, true); // uncompressed size
    view.setUint16(at + 26, entry.name.length, true);
    view.setUint16(at + 28, 0, true); // extra field length
    at += 30;

    out.set(entry.name, at);
    at += entry.name.length;
    out.set(entry.bytes, at);
    at += entry.bytes.length;
  }

  const centralStart = at;

  encoded.forEach((entry, index) => {
    view.setUint32(at, CENTRAL_SIG, true);
    view.setUint16(at + 4, 20, true); // version made by
    view.setUint16(at + 6, 20, true); // version needed
    view.setUint16(at + 8, 0x0800, true);
    view.setUint16(at + 10, 0, true); // stored
    view.setUint16(at + 12, DOS_TIME, true);
    view.setUint16(at + 14, DOS_DATE, true);
    view.setUint32(at + 16, entry.crc, true);
    view.setUint32(at + 20, entry.bytes.length, true);
    view.setUint32(at + 24, entry.bytes.length, true);
    view.setUint16(at + 28, entry.name.length, true);
    view.setUint16(at + 30, 0, true); // extra
    view.setUint16(at + 32, 0, true); // comment
    view.setUint16(at + 34, 0, true); // disk number
    view.setUint16(at + 36, 0, true); // internal attributes
    view.setUint32(at + 38, 0, true); // external attributes
    view.setUint32(at + 42, offsets[index], true);
    at += 46;

    out.set(entry.name, at);
    at += entry.name.length;
  });

  view.setUint32(at, END_SIG, true);
  view.setUint16(at + 4, 0, true); // this disk
  view.setUint16(at + 6, 0, true); // disk with central directory
  view.setUint16(at + 8, encoded.length, true);
  view.setUint16(at + 10, encoded.length, true);
  view.setUint32(at + 12, centralSize, true);
  view.setUint32(at + 16, centralStart, true);
  view.setUint16(at + 20, 0, true); // comment length

  return out;
}

/**
 * Make a name safe to put in an archive, and unique within it.
 *
 * Two files chosen from different folders can easily share a name, and a ZIP
 * with two identical entries opens with one of them silently missing.
 */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((raw) => {
    const clean = raw.replace(/[\\/:*?"<>|]/g, "-").replace(/^\.+/, "") || "image";
    const count = seen.get(clean) ?? 0;
    seen.set(clean, count + 1);
    if (count === 0) return clean;

    const dot = clean.lastIndexOf(".");
    return dot > 0
      ? `${clean.slice(0, dot)} (${count})${clean.slice(dot)}`
      : `${clean} (${count})`;
  });
}
