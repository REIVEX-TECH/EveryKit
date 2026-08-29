# EveryKit PDF

Six browser-based PDF tools: merge, split, extract, organise, images-to-PDF and
compress. Nothing is uploaded — every file is opened, worked on and saved by the
browser, and there is no endpoint on this app that could receive a document.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `pdf.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3013.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, byte-level tests against fixture PDFs
npm run build       # production build
npm start           # serve the production build on 3013
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://pdf.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: no job is gated |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/pdf/operations.ts` — every operation, as pure bytes-in/bytes-out
  functions with no DOM, network or worker. This is what the tests exercise.
- `lib/pdf/pageRanges.ts` — parsing "1-3, 7" into page indices, and the errors
  for what it cannot parse.
- `lib/pdf/pdf.worker.ts` — runs those operations off the main thread, so a
  60 MB merge does not freeze the tab.
- `lib/pdf/thumbnails.ts` — page pictures via pdf.js, loaded on demand.
- `components/pdf/Workbench.tsx` — one client component driving all six tools.
- `app/[tool]/page.tsx` — six statically generated routes, one per tool, each
  with its own metadata and `FAQPage` JSON-LD.

### pdf.js support files

`public/pdfjs/` holds pdf.js's `standard_fonts` and `cmaps`, copied out of the
package. They are not optional: a PDF using one of the fourteen standard fonts
makes pdf.js request the matching font data before it will draw, and if that
request cannot be answered `render()` never finishes — the thumbnails simply sit
blank with nothing in the console. Serving them from this origin also avoids the
CDN that every pdf.js example reaches for, which would put a third-party request
on a page whose whole promise is that it does not make one.

They are refreshed by hand when `pdfjs-dist` is upgraded:

```bash
cp -r node_modules/pdfjs-dist/standard_fonts node_modules/pdfjs-dist/cmaps public/pdfjs/
```

### What compression can and cannot do

It re-encodes the JPEG images inside a document and leaves text and vector
graphics alone. On a scan that is a large saving; on a text document it is close
to nothing, and the UI says so rather than implying it tried. There is no
setting that makes a text-only PDF smaller, because there is nothing in one to
give up.

## Deploy notes

Runs as the PM2 process `everykit-pdf` on **port 3013**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf` (`pdf.useeverykit.com`
  → `127.0.0.1:3013`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
