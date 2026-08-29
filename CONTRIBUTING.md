# Contributing to EveryKit

Thanks for your interest in EveryKit. This guide covers how the repository is
organised, how to run it locally, and the conventions that keep the kits
consistent with each other.

By taking part you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Repository layout

EveryKit is a set of small, independent Next.js apps in one repository. The hub
is the platform; each kit is a single-purpose tool on its own subdomain.

```
hub/          The platform: the kit directory, /kits.json, /api/subscribe,
              /api/hit, and the /admin dashboard.
photos/       Passport and visa photos from a selfie.
letters/      Formal letters assembled from a short form.
pdf/          Merge, split, scan and shrink PDFs.
qr/           QR codes that never expire.
images/       Resize, convert and clean up photos.
background/   Remove or replace an image background.
text/         Count, convert and clean text.
sign/         Draw a signature and sign a PDF.
invoice/      Invoices, quotes and receipts as PDFs.
ringtone/     Trim audio into a ringtone.
dev/          Small developer tools.
study/        Calculators and helpers for students.
calc/         Everyday calculators.
teach/        Classroom tools for teachers.

db/           The one Postgres table the platform has, and its schema.
deploy/       nginx config and the edge helper that manages TLS.
brand/        Shared brand marks.
```

Each app is fully standalone and shares no runtime code with the others.
Consistency comes from the conventions in this file, not from a shared package.
A change to a shared convention has to be made in each app that needs it, which
stays cheaper than a shared package until there are many more kits than this.

## Local development

You need Node 20 or newer and npm.

Each app is its own npm project. To run one:

```bash
cd photos
npm install
npm run dev
```

The hub also needs Postgres for `/api/subscribe`, `/api/hit` and `/admin`.
A local instance is provided:

```bash
docker compose up -d          # starts Postgres on localhost:5432
psql "$DATABASE_URL" -f db/schema.sql
cd hub && npm install && npm run dev
```

Copy the `.env.example` in each app to `.env.local` and fill in the values you
need. Every value has a sensible default for local work, and the app degrades
gracefully when an optional one is missing.

## The quality gate

Every change must pass, in the app it touches:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run test          # vitest run
npm run build         # next build
```

A pull request that does not build, or that drops a check, will not be merged.

## Architecture principles

These are load-bearing. A change that breaks one of them needs to be discussed
first, because a lot of the product promise rests on them.

- **Client-side first.** A user's file is read, worked on, and saved back
  entirely in their own browser. It is never uploaded. This is the core promise
  and it applies to every kit that handles a file.
- **One database table, owned by the hub.** The only personal data the platform
  stores is an email address, offered by the user when they take a result. Kits
  never hold database credentials; they POST to the hub's endpoint. Nothing else
  goes server-side without a deliberate decision.
- **Aggregate measurement only.** There is no third-party analytics, no script,
  no per-person tracking. The only measurement is the hub's own hit counter,
  which increments an aggregate row and reads nothing about the caller.
- **Free and open-source dependencies only.** No paid APIs, fonts or components.
  If a capability seems to need a paid service, raise it in an issue rather than
  integrating it.
- **Self-hosted.** Everything runs on one server behind nginx. A kit must not
  depend on a platform-specific feature that only works on one host.

## Design system

Define these as CSS variables in `globals.css` and mirror them in the Tailwind
config.

- Background `#ffffff`, soft background `#f8fafc`
- Foreground `#171717`, light text `#444444`
- Primary `#1d81f2` (links, focus rings), primary-dark `#1769d4`
- Accent `#ff8a4c` (the single main call to action per screen)
- Success `#22c55e`
- Border `1px solid #e2e8f0`, card radius `16px`, buttons fully rounded
- Type: IBM Plex Sans via `next/font/google`. Headings 600, body 400.
- Icons: `lucide-react`.
- One soft shadow level on cards, none on buttons. Max content width 1040px.

Flat colours only: no gradients (the one exception is the scroll-fade mask on a
tool switcher), no glassmorphism, no glow, no purple. No emoji in the UI. No
fake testimonials, ratings or user counts.

## Voice

Plain, warm, specific. Sentence case everywhere, never Title Case or ALL CAPS.
Say what a thing does in concrete terms ("600 x 600 px at 300 DPI") rather than
selling it. No exclamation marks in system text.

Avoid marketing filler: seamless, empower, unlock, leverage, simply, just, easy,
supercharge, effortless, elevate, streamline, "Whether you're", "In today's",
"Say goodbye to".

Do not use a dash as punctuation in any text a user can read (UI copy, titles,
meta descriptions, FAQ answers, errors). Rewrite the sentence instead: a comma
if the parts are one thought, a full stop if they are two. Hyphens inside
compound words (client-side, 4x6 inch) are fine.

## Adding a kit

1. Copy the structure of an existing kit as a starting point.
2. Add an entry to the registry in `hub/data/kits.ts`. This is the single source
   of truth for the directory, `/kits.json`, the search and the cross-promotion
   strips.
3. Add a PM2 entry in `ecosystem.config.js` on a new port and an nginx block in
   `deploy/nginx/useeverykit.conf`.
4. Give the kit its own `README.md` and `.env.example`.

A wildcard DNS record on `*.useeverykit.com` means the new subdomain resolves as
soon as it exists, and `deploy/edge.sh` expands the certificate when it first
sees a new hostname.

## Commits and pull requests

- Keep commits focused, with a clear message describing the change and why.
- Open a pull request against `main`. Describe what changed and how you tested
  it.
- For a user-facing change, include a screenshot or a short description of the
  before and after.

## Reporting issues

Open a GitHub issue with steps to reproduce, what you expected, and what
happened. For anything security-sensitive, email
[hello@useeverykit.com](mailto:hello@useeverykit.com) instead of filing a public
issue.
