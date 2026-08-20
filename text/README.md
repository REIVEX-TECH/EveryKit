# EveryKit Text

Four small text tools: a word counter, a case converter, a cleaner for messy
text, and a lorem ipsum generator. Everything computes in the page as you type,
and nothing is sent anywhere.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `text.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3020.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, against fixtures in several scripts
npm run build       # production build
npm start           # serve the production build on 3020
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://text.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated behind payment |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/text/count.ts` — words, characters, sentences, paragraphs, reading time.
- `lib/text/transform.ts` — case conversion and cleaning.
- `lib/text/lorem.ts` — deterministic placeholder text.
- `components/text/Workbench.tsx` — one client component driving all four tools.
- `app/[tool]/page.tsx` — four statically generated routes with `FAQPage` JSON-LD.

This kit talks to nothing but the hub. The CSP `connect-src` keeps the hub, for
the cross-promotion strip, the aggregate page count and the email ask, plus the
checkout host; there is no CDN and no model. Typing produces zero requests, which
was checked in the browser rather than assumed.

### The decisions worth knowing about

**Words** are runs of characters with whitespace on either side, splitting on
Unicode whitespace rather than the ASCII space. Right for English, Urdu, Arabic
and European languages. Wrong for Chinese and Japanese, which do not space their
words: those come out as very few very long words, and the FAQ says so and
points at the character count instead.

**Sentences** end at `.`, `!`, `?` and also `۔` and `؟` (Urdu and Arabic), `।`
and `॥` (Devanagari), and `。`, `！`, `？` (ideographic). Without those, a
paragraph of Urdu counts as one sentence. That is the kind of bug that passes
every English test and ships.

**Characters** are counted by grapheme through `Intl.Segmenter`, so a thumbs-up
is one character rather than two and a family emoji is one rather than several.

**Acronyms** survive every case conversion. The rule, stated on the page as well
as here: a token of two or more characters that is entirely capitals, allowing
digits, dots, hyphens and a possessive ending, is left exactly as it is. So NASA
stays NASA and `USA's` stays `USA's`. The cost is that text typed entirely in
capitals reads as one long acronym and comes back unchanged, so the tool warns
when it sees that rather than leaving it as a surprise.

**Title Case** keeps a short list of small words lower case in the middle, and
capitalises them at either end. Longer lists start disagreeing with each other
and with the person using them.

**Cleaning** applies in a fixed order: collapse spaces, then remove duplicate
lines, then remove line breaks. Duplicates have to be found while there are
still lines to compare, and collapsing first means two lines differing only by
trailing whitespace count as the same line. With every switch off, the text
comes out byte for byte as it went in.

**Lorem ipsum** is generated from a seed, so the same settings always give the
same text. A reload does not shuffle what you had, and the tests can assert on
exact output rather than on vague shapes.

## Deploy notes

Runs as the PM2 process `everykit-text` on **port 3020**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`text.useeverykit.com` → `127.0.0.1:3020`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and the certbot step for this subdomain: `LAUNCH.md`.

The subdomain needs an `A` record and a certbot run that includes **every** name
already on the certificate plus this one; see `LAUNCH.md`. Adding only the new
name would drop the others.
