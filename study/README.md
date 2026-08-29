# EveryKit Study

Calculators and helpers for students: GPA, what you need on the final,
citations in APA 7 and MLA 9, reading time, and a pomodoro timer. All of it
runs in the browser and none of it is stored.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `study.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3022.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, 53 tests over the five tools
npm run build       # production build
npm start           # serve the production build on 3022
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://study.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json`, `/api/hit` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | This kit has no paid path; the flag is inherited from the platform |

## How it is put together

Every tool is a pure function in `lib/study/`, tested before its UI existed,
with a thin client component in `components/study/` on top.

- `lib/study/gpa.ts` — the weighted mean, the grade scale, and a message per row
  that cannot count.
- `lib/study/finalGrade.ts` — the rearranged equation and the four kinds of
  answer it can give.
- `lib/study/citation.ts` — APA 7 and MLA 9 as segments, so the italics survive.
- `lib/study/reading.ts` — words to minutes, and the page estimate with its
  assumptions attached.
- `lib/study/timer.ts` — the countdown arithmetic and the generated chime.

No runtime dependencies beyond the platform's own. There is no citation
database, no grade service and no audio file.

### The decisions worth knowing about

**The GPA is weighted by credits.** A one credit A and a four credit C average
to a B if you ignore credits, and that is not what a registrar calculates. Every
course contributes grade points times credits, divided by total credits.

**Zero credits is refused with a message, not dropped.** A zero credit row
contributes nothing to either side of the division, so it would silently vanish
from the answer. The row says why and the rest of the calculation carries on.

**The final grade tool says when a target is unreachable.** Carrying 60 percent
into a final worth 20 percent means the course cannot end above 68, whatever
happens in the exam. Every other calculator prints "you need 150%" as though
that were an answer.

**Citations are segments, not strings.** Italics are part of being correct and a
plain string cannot carry them. The segments render to the page, to an HTML
clipboard flavour for pasting into a word processor, and flatten to plain text.
Asterisks around a journal title would be a markdown convention rather than a
citation style.

**Nothing is looked up.** No DOI resolution, no page fetching, no verification.
The tool formats what you type, and the page says so rather than implying the
citation has been checked.

**The page estimate names its assumptions.** Roughly 250 words to a double
spaced page in a 12 point serif with one inch margins. Change the font or the
spacing and the number changes, which is why a bare "3.2 pages" from any other
tool is invented precision.

**The timer reads the clock rather than counting down.** Browsers throttle
timers in background tabs to about once a minute, so a decrementing counter is
minutes wrong when you come back to it. The interval here only decides how often
to repaint.

**The chime is generated, not downloaded.** Two sine tones a fifth apart with a
soft envelope. No audio asset means nothing to host, nothing to license and
nothing to load.

## Deploy notes

Runs as the PM2 process `everykit-study` on **port 3022**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`study.useeverykit.com` → `127.0.0.1:3022`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
