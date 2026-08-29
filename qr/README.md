# EveryKit QR

QR codes for links, plain text, Wi-Fi networks, contact cards and WhatsApp.
Nothing is uploaded — the code is drawn in the browser from what you type, and
there is no endpoint on this app that could receive it.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `qr.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3014.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, including round trips through a real decoder
npm run build       # production build
npm start           # serve the production build on 3014
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://qr.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/qr/payloads.ts` — turning what someone typed into the exact string a
  scanner expects, per format. Pure functions, no DOM.
- `lib/qr/render.ts` — the module matrix, and rendering it to SVG or to raw
  RGBA. Also free of the DOM, so the tests can rasterise in Node.
- `components/qr/QrWorkbench.tsx` — one client component driving all five
  kinds; the form is the only part that differs between them.
- `app/[kind]/page.tsx` — five statically generated routes, one per kind, each
  with its own metadata and `FAQPage` JSON-LD.

### Where the bugs in a QR tool actually are

Not in the encoder. Every library gets the modules right, and a code that
scans is not the same as a code that works. The failures are in the payload:

- **Wi-Fi.** `;` and `:` separate the fields, so a password containing either
  has to be escaped, along with `,`, `"` and the backslash itself. Skip it and
  the code scans cleanly and the phone tries to join with only the first part
  of the password. The backslash must be escaped *first*, or the backslashes
  introduced by the later replacements get escaped in turn.
- **vCard.** `,` and `;` separate the components of structured fields, so a
  surname like `Smith, Jr` arrives as two separate name parts unless escaped.
  A URL is deliberately *not* escaped — its own syntax uses those characters,
  and escaping them breaks the link rather than protecting it.
- **WhatsApp.** `wa.me` wants digits only, in full international form. A
  prettily formatted number is the usual reason one of these codes opens
  WhatsApp to nothing.

`lib/qr/payloads.test.ts` covers each of these as a payload assertion *and* as
a round trip: the payload is encoded, rasterised, and read back with `jsqr` —
an independent decoder — to confirm what a camera would actually get. The
Wi-Fi round trip goes one step further and unescapes the decoded string the way
a phone's parser does, which is the only check that proves the password
survives the whole journey.

### Why these codes cannot be edited later

They hold the information directly rather than pointing at a redirect on our
domain. That is the trade, and the landing page states it plainly: you cannot
change where a printed code points, and nobody can count its scans. In exchange
there is nothing to expire, nothing to renew, and no service that has to still
be running in ten years.

## Deploy notes

Runs as the PM2 process `everykit-qr` on **port 3014**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf` (`qr.useeverykit.com`
  → `127.0.0.1:3014`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
