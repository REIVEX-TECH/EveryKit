# EveryKit Dev

Ten small developer tools that run entirely in your browser: JSON, base64, URL
encoding, UUIDs, hashes, JWT, regex, diff, timestamps and cron. Nothing you
paste is uploaded.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `dev.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3021.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, 136 tests over the ten tools
npm run build       # production build
npm start           # serve the production build on 3021
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://dev.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json`, `/api/hit` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | This kit has no paid path at all; the flag is inherited from the platform |

## How it is put together

Every tool is a pure function in `lib/dev/`, tested before its UI existed, with
a thin client component in `components/dev/` on top. That split is why the whole
kit can be checked in Node without a browser.

- `lib/dev/cron.ts` — the parser, the sentence and the next run times.
- `lib/dev/json.ts` — parse, format, minify, and the line and column of an error.
- `lib/dev/encode.ts` — base64 and URL, both directions, UTF-8 correct.
- `lib/dev/hash.ts` — SHA-256 and SHA-1 from WebCrypto, MD5 from spark-md5.
- `lib/dev/jwt.ts` — split, decode, and read the expiry claims.
- `lib/dev/regex.ts` — matching and highlighting, shared with the worker.
- `lib/dev/diff.ts` — line and word diffs over the `diff` package.
- `lib/dev/uuid.ts` — v4 layout over `crypto.getRandomValues`.
- `lib/dev/timestamp.ts` — unix time both ways, and relative phrasing.
- `lib/dev/work.ts` and `work.worker.ts` — the two jobs that must not run on the
  main thread.

Two dependencies do work this kit does not reimplement:
[`spark-md5`](https://www.npmjs.com/package/spark-md5) (WTFPL or MIT) for MD5,
chosen for its incremental interface so a large file hashes a slice at a time,
and [`diff`](https://www.npmjs.com/package/diff) (BSD-3-Clause) for the Myers
algorithm. Both are bundled and served from this origin. There is no CDN.

### The decisions worth knowing about

**Two jobs run in a worker, for different reasons.** JSON is a size problem: five
megabytes through parse and stringify is a few hundred milliseconds of frozen
tab. Regex is a correctness-of-the-page problem: `(a+)+b` against forty a's does
not finish this century and a running regex cannot be interrupted. A worker can
be terminated, which is the only reason the file exists. Measured: 5.18 MB
formatted in 118 ms with a worst main-thread gap of 54 ms, and the runaway
pattern killed at 2.3 s with the page still ticking every 64 ms.

**The cron day fields are an OR, and the page says so.** When both day of month
and day of week are restricted, cron runs when either matches: `0 0 13 * FRI` is
the 13th of every month AND every Friday. Every implementation shares this and
almost nobody expects it, so the sentence appends the explanation whenever both
fields are set.

**No `@daily`.** Half-supporting a syntax is how somebody comes to trust an
answer that is wrong. The parser says what `@daily` is in five fields instead.

**Base64 goes through a real UTF-8 encoder.** `btoa` works on bytes and a
JavaScript string is UTF-16, so the workaround most answers online suggest
mangles anything outside Latin-1 silently. Emoji and Urdu fixtures are in the
test suite for exactly this.

**The JWT tool will never verify a signature.** Verifying needs the key, and a
page that asked for your signing key would deserve what followed. The banner
says so above the output rather than in a footnote.

**Diff normalises both sides to one trailing newline.** `diffLines` compares
"b" against "b\n" as different lines, so appending two lines to a file read as
one removed and three added. This was caught by a test, not by eye.

**The MD5 streams and the SHA does not.** WebCrypto has no streaming digest, so
for SHA the slices are joined before hashing. That is a real memory cost on a
very large file and it is stated on the page rather than hidden.

## Deploy notes

Runs as the PM2 process `everykit-dev` on **port 3021**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`dev.useeverykit.com` → `127.0.0.1:3021`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
