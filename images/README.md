# EveryKit Images

Batch resize, format conversion between JPG, PNG and WebP, and lossless EXIF
removal. Nothing is uploaded — every photo is read from disk, worked on in the
tab, and saved back, and there is no endpoint on this app that could receive
an image.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `images.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3015.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, byte-level tests on JPEG segments and the ZIP
npm run build       # production build
npm start           # serve the production build on 3015
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://images.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/images/jpeg.ts` — reading and rewriting a JPEG's marker segments. Pure
  bytes, no DOM.
- `lib/images/resize.ts` — the size arithmetic, separate from any canvas so the
  awkward cases can be tested directly.
- `lib/images/zip.ts` — a small store-only ZIP writer.
- `lib/images/process.ts` — the browser half: decode, apply, encode.
- `components/images/Workbench.tsx` — one client component driving all three
  tools.
- `app/[tool]/page.tsx` — three statically generated routes with `FAQPage`
  JSON-LD.

### Why EXIF removal does not go through a canvas

Drawing a photo to a canvas and re-encoding it is the usual way a browser tool
strips metadata. It works, and it also throws away the original compression and
replaces it with the browser's: the photo comes back softer, often larger, and
always different — for a job that should not have touched a single pixel.

A JPEG is a sequence of marker segments, one of which is the entropy-coded
scan. `stripMetadata` drops the metadata segments and copies everything else
through byte for byte. The scan is never parsed, only copied, because it
contains byte pairs that look like markers and are not — walking it as
structure is how a rewriter corrupts a file.

What comes out:

- **Removed:** EXIF and XMP (APP1), maker notes and ICC profiles (APP2 and up),
  and any comment (COM).
- **Kept:** JFIF (APP0), which holds the density fields — dropping it changes
  how some software reads the image's physical size.

The tests assert the scan bytes of the original and the result are identical.
Verified in the browser too, on a real Chrome-encoded JPEG with an EXIF block
spliced in: 544 bytes removed, the GPS string gone, the 3,403-byte scan
bit-identical, and every decoded subpixel unchanged.

Removing an ICC profile is the one removal that can change how an image looks.
It is the right default for a photo going online — a file with no profile is
treated as sRGB, which is what the camera produced anyway — but it is a real
trade rather than a free one.

### Why the ZIP writer is hand-written

The whole requirement is "put these files in a container with no compression".
Every byte in a batch is already a JPEG, PNG or WebP — compressed formats that
deflate will not shrink — so store mode is the correct choice rather than a
shortcut, and it makes the format small enough to write correctly and test.

Entries carry a fixed timestamp rather than the clock, so the same inputs give
the same archive and the byte-level tests can assert on it. Names are UTF-8
with the language-encoding flag set, and duplicates are numbered, because two
files chosen from different folders often share a name and a ZIP with two
identical entries opens with one silently missing.

Checked against Python's `zipfile` and the system `unzip`, both of which
validate every CRC and read all three entries back.

### Batching

Files go one at a time, not in parallel. Decoding twenty 12-megapixel photos
at once is how a phone browser runs out of memory and kills the tab. The
progress count is real, and past eight files the page says why it is taking a
moment.

## Deploy notes

Runs as the PM2 process `everykit-images` on **port 3015**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`images.useeverykit.com` → `127.0.0.1:3015`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
