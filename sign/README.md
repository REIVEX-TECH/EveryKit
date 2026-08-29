# EveryKit Sign

Draw or type a signature, download it as a transparent PNG or an SVG, and sign
a PDF. All of it happens in the browser tab: there is no endpoint on this app
that could receive a signature or a document.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `sign.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3016.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, including signed-PDF structure checks
npm run build       # production build
npm start           # serve the production build on 3016
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://sign.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated behind payment |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/sign/strokes.ts` — smoothing, bounds and the SVG path. Pure.
- `lib/sign/place.ts` — turning a box dragged on a preview into PDF coordinates.
- `lib/sign/signPdf.ts` — embedding and flattening, via pdf-lib.
- `lib/sign/typed.ts` — typed signatures, including the font embedding.
- `lib/sign/thumbnails.ts` — page pictures via pdf.js, vendored assets and all.
- `components/sign/SignaturePad.tsx` — the drawing surface.

### The pen

Strokes are drawn as quadratic curves through the sampled points, each sample
acting as a control point and the midpoint to the next as the end. Joining
samples with straight lines shows every sample as a corner; fitting a curve
through them exactly overshoots on sharp turns and reads as a shaky hand.

Pressure is deliberately ignored. It is absent on a mouse, inconsistent between
styluses, and reported as a flat middle value by many touchscreens, so varying
the line by it makes the same signature look different depending on the
hardware rather than the person.

The canvas is sized by CSS with the backing store following the measured box.
Driving the width from React state created a loop where the first measurement
landed before the stylesheet applied and the pad latched a two pixel width that
nothing corrected.

### The y axis

PDF measures upward from the bottom of the page; a browser measures downward
from the top. `previewBoxToPdf` does the flip, and it has its own test, because
getting it wrong puts every signature mirrored vertically, which looks
plausible on a symmetric page and obviously broken on a real one.

The signature is flattened into the page content rather than added as an
annotation. An annotation can be dragged off or deleted in any reader, and some
viewers do not print them, neither of which is what someone signing expects.

The image is embedded once however many times it is placed, so signing ten
pages costs one copy of the PNG. There is a test that asserts the file does not
grow proportionally.

### Typed signatures embed their font

A `<text>` element naming a handwriting family renders correctly only on a
machine that has that family, which almost nobody does. Sent to a solicitor it
would arrive in Times New Roman. So the woff2 is fetched from this origin, where
next/font already self-hosts it, and inlined into the SVG as a data URI inside
an `@font-face` rule. The file then renders correctly anywhere with no external
request. When the bytes cannot be read the tool says so rather than handing over
a file that quietly falls back.

### Page pictures are a preview, not a dependency

Thumbnails are drawn by pdf.js, which renders through the browser's frame loop.
A page that is not visible produces no frames and the render never settles; a
backgrounded tab behaves the same way. Blocking on them would mean a document
that cannot be signed at all because its picture did not arrive.

So the document becomes usable as soon as pdf-lib reports the page sizes, which
is all the placement maths needs, and the pictures fill in as they arrive. After
a timeout the tool carries on with plain page outlines and says so. Placement is
measured against the real page size either way, so a signature placed without a
picture lands in exactly the same spot.

`public/pdfjs/` holds pdf.js's `standard_fonts` and `cmaps`, copied out of the
package, for the reason the PDF kit documents: without them a page using one of
the fourteen standard fonts makes pdf.js request font data before it will draw,
and an unanswered request means `render()` never finishes. Refresh them by hand
when `pdfjs-dist` is upgraded:

```bash
cp -r node_modules/pdfjs-dist/standard_fonts node_modules/pdfjs-dist/cmaps public/pdfjs/
```

### What this is not

Not a cryptographic digital signature. It puts a picture of a signature onto a
document, which is what most people mean by signing a PDF, and it does not
certify who signed or when. The FAQ says so on every route rather than leaving
someone to assume otherwise.

## Deploy notes

Runs as the PM2 process `everykit-sign` on **port 3016**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`sign.useeverykit.com` → `127.0.0.1:3016`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
