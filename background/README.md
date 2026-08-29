# EveryKit Background

Remove the background from a photo and save it transparent, on white, or on any
flat colour. Nothing is uploaded: the cutout happens inside the browser tab, and
there is no endpoint on this app that could receive an image.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `background.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3018.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, including a PNG alpha decoder
npm run build       # production build
npm start           # serve the production build on 3018
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://background.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated behind payment |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/background/remove.ts` — the engine. Same library, same model choice and
  same lazy-load pattern Photos already runs in production.
- `lib/background/output.ts` — output modes, hex parsing and alpha compositing.
  Pure functions, no DOM.
- `lib/background/png.ts` — a PNG reader that decodes the alpha channel.
- `components/background/Workbench.tsx` — the whole flow.
- `components/background/EdgeZoom.tsx` — the result magnified on its busiest edge.
- `app/[mode]/page.tsx` — two statically generated pages with `FAQPage` JSON-LD.

### Why the model loads late

`@imgly/background-removal` fetches a segmentation model and an ONNX runtime the
first time it runs, which is tens of megabytes. Nothing imports it at module
scope: the dynamic import inside `removeToTransparent` is what keeps the landing
page light, and Lighthouse mobile scores 99 performance because of it.

The CSP allows exactly one host for that, `staticimgly.com`, and the list is the
privacy claim enforced rather than asserted. Photos additionally allows the
MediaPipe hosts for face detection; there is no face detection here, so those
are deliberately absent rather than copied along.

### The mask is traced small and applied large

Segmentation runs on a copy no larger than 1600px, because that is the expensive
pass and finer input buys very little outline accuracy. The resulting mask is
then composited over the full-resolution image with `destination-in`, so what
gets saved is the size that was uploaded. Saving the model's own output directly
would silently cap every download at 1600px.

### Proving the transparency is real

A file named `.png` proves nothing: a canvas will happily encode a fully opaque
image as PNG, and the tool would then hand someone a "transparent background"
that is a solid rectangle. `lib/background/png.ts` decodes the alpha channel out
of the encoded bytes, undoing the per-row filters, and the tests assert against
real encoder output that transparent pixels exist and that soft edges show up as
partial alpha.

Verified the same way in a browser on a finished download: colour type 6, and
the decoded channel showed 48% fully transparent pixels with soft edges present,
at the original 900x1200.

### The edge view is the honest part

Every background remover looks flawless at thumbnail size. Hair and fine strands
are where they actually fail, and at 200px nobody can see it, so the result is
shown magnified four times on a chequerboard, positioned on whatever part of the
cutout has the most partial alpha. That is nearly always the hairline. Judge it
there rather than after the file has been used somewhere.

## Deploy notes

Runs as the PM2 process `everykit-background` on **port 3018**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`background.useeverykit.com` → `127.0.0.1:3018`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
