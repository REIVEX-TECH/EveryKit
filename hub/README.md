# EveryKit Hub

The front door of EveryKit at **useeverykit.com**. It does three things:

1. Routes people to the right kit in one click.
2. Serves `/kits.json`, the registry every kit reads.
3. Says what the brand promises in one screen.

It is not a tool and not a marketing site. Resist adding sections.

This is the `hub/` folder of the [EveryKit repo](../README.md). The shared
context — brand, design system and layout conventions — is in
[CLAUDE.md](../CLAUDE.md) at the repo root. Read it before changing anything
user-facing. Launch status is in [LAUNCH.md](../LAUNCH.md).

## Local setup

```bash
npm install
npm run dev
```

Runs on http://localhost:4200, deliberately not 3000, so it can run alongside a
kit while you test the "More from EveryKit" strip.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 4200 |
| `npm run build` | Production build. Every route prerenders. |
| `npm test` | Vitest over the registry contract |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://useeverykit.com` | Origin for canonicals, the sitemap and OpenGraph. |
| `DATABASE_URL` | none | Postgres, for the one table of email addresses. Without it `/api/subscribe` answers 500 and every kit falls back to handing over the file anyway. |

## The database

EveryKit stores one thing server-side: email addresses. One table, defined in
[`db/schema.sql`](../db/schema.sql) at the repo root, and no kit ever talks to
it — they all POST to this app's `/api/subscribe`.

### Locally

```bash
docker compose up -d
```

That starts Postgres 16 on 5432 and applies the schema on first run. Then:

```bash
DATABASE_URL=postgres://everykit:everykit@localhost:5432/everykit npm run dev
```

The schema is applied by the container's init hook, which only fires on an
empty data directory. After editing `db/schema.sql`, run
`docker compose down -v && docker compose up -d` to start clean.

No Docker? Any Postgres will do — create a database and run
`psql "$DATABASE_URL" -f db/schema.sql` against it.

### In production

Postgres runs on the same VPS as the apps, listening on localhost only. The
role and database are created once by hand; the exact commands are in
[LAUNCH.md](../LAUNCH.md).

`DATABASE_URL` goes in `/root/codes/EveryKit/.env.production`, which is
git-ignored and read by `ecosystem.config.js` at PM2 start. Changing it needs
`pm2 reload ecosystem.config.js --update-env` — a plain reload keeps the
environment the process started with.

Only the hub holds it. The kits post to `/api/subscribe` and never see a
database credential.

Getting the list out is [`db/export.md`](../db/export.md).

## `/api/subscribe`

The only endpoint EveryKit has. `POST { email, kit }`, and it answers
`{"ok":true}` whether the address is new or already known — a form that
answers differently for a known address is an enumeration oracle, and there is
no reason to build one.

CORS is an allowlist, not `*`, because this endpoint writes: the apex and any
single-label `*.useeverykit.com` subdomain, over https. Localhost is allowed
only when `VERCEL_ENV` is not `production`, so a dev machine can exercise the
real endpoint without the deployed hub accepting calls from anywhere.

A hidden `honeypot` field no real form fills is accepted with `{"ok":true}` and
written nowhere.

**The kits fail open.** If this endpoint is down, slow or blocked, every kit
hands over the file regardless and shows no error. That is deliberate and it is
covered by tests on both sides. A lead is worth less than a working tool.

## Adding a kit

Add an entry to `data/kits.ts`. That is the whole job — the directory and
`/kits.json` are both generated from it, so they cannot drift apart.

A new kit needs a `category`, and a glyph in `public/icons/<slug>.svg`
referenced by the registry. Glyphs are flat SVG in the brand family — the same
corner-radius language, `#1d81f2` with at most one `#ff8a4c` accent — and must
read at 48px, which is the size the directory renders them.

Categories come from `CATEGORIES` in the same file. A category with no live
kits does not render, so adding one before its first tool exists is harmless.

The category filter is component state, not a route. Every kit is in the
server-rendered HTML whatever is selected, so a crawler sees all of them and
nobody waits for a navigation to change shelf.

`lib/kits.test.ts` guards the registry contract: the five original published
fields keep their names and shapes, new fields are additive only, a consumer
that knows only the original five still parses every entry, slugs are unique,
and each kit's subdomain matches its slug. That last one matters
because every kit filters *itself* out of its own "More from EveryKit" strip by
comparing slugs — a mismatch would make a kit advertise itself.

## `/kits.json`

Served by a `force-static` route handler, so it is a build-time artefact rather
than a function.

Kits fetch it from their own subdomains, so it carries
`Access-Control-Allow-Origin: *` and a one-hour cache. Those headers are set
twice on purpose: once in the route handler, once in `next.config.ts`. A
static route is served as a plain asset and the handler's headers are not
guaranteed to survive that.

Getting this wrong is quiet rather than loud. Kits swallow every error from
this fetch by design — a broken hub must never break a working tool — so a
missing CORS header shows up as a strip that simply never appears, on somebody
else's domain. Check it with a real cross-origin request after changing
anything here:

```bash
curl -sI https://useeverykit.com/kits.json | grep -i access-control
```

## Deploying

Runs as PM2 process `everykit-hub` on port 3000, behind Caddy. Deploys with
`./deploy.sh` from the repo root.

For the human, not automated: attach `useeverykit.com` to this project and add
`www.useeverykit.com` redirecting to the apex. Kit subdomains belong to their
own PM2 processes and their own Caddy blocks — see the repo root's
`ecosystem.config.js` and `Caddyfile`.
