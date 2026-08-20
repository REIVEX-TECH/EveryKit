# EveryKit

Small single-purpose web tools that each finish one everyday task in about a
minute. Free preview, one small payment for the finished file, no accounts.

Every tool runs entirely in the browser. Your file is read by the tab, worked on
there, and never uploaded — which is both the point of the product and the
reason it costs nothing to run.

Built by [Reivex](https://reivex.io).

## The apps

| | Folder | Domain | What it is |
| --- | --- | --- | --- |
| Hub | [`hub/`](hub) | useeverykit.com | The directory of kits, `/kits.json`, and the one API endpoint |
| Photos | [`photos/`](photos) | photos.useeverykit.com | Passport and visa photos cropped from a selfie |
| Letters | [`letters/`](letters) | letters.useeverykit.com | Formal letters assembled from a short form |

None of them is deployed yet. [LAUNCH.md](LAUNCH.md) lists what is verified and what
still needs a human.

## Repo map

```
CLAUDE.md      shared context: brand, design system, payments, conventions
LAUNCH.md      pre-launch status and the remaining manual steps
db/            the one table EveryKit has, and how to get the list out
docker-compose.yml   local Postgres for developing the hub endpoint
hub/           Next.js app — the directory, the registry, /api/subscribe
photos/        Next.js app — the passport photo tool
letters/       Next.js app — the formal letter writer
docs/          the original build prompts, kept as a record of intent
```

The three apps share no code. That is deliberate: consistency comes from
`CLAUDE.md`, not from a package. A design change made in one has to be made in
the others — a cost that stays smaller than a shared package until there are
more kits than this.

## Running them

Each app is a standalone Next.js project with its own `package.json`.

```bash
cd hub && npm install && npm run dev
```

```bash
cd photos && npm install && npm run dev
```

```bash
cd letters && npm install && npm run dev
```

The ports are deliberately different — hub 4200, Photos 3000, Letters 3100 — so
all three can run at once. That is how you test the two things that cross
origins: the "More from EveryKit" strip, and the email ask.

To point a local Photos at a local hub, put this in `photos/.env.local`:

```
NEXT_PUBLIC_HUB_URL=http://localhost:4200
```

All three use the same commands:

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build. Every route prerenders. |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

Copy each app's `.env.example` to `.env.local` if you need to change anything.
Neither app requires a secret to run.

## Deploying

All three run on one VPS, as three `next start` processes behind Caddy, with
Postgres on the same box:

| App | Port | Domain |
| --- | --- | --- |
| hub | 3000 | useeverykit.com (and www, redirected) |
| photos | 3001 | photos.useeverykit.com |
| letters | 3002 | letters.useeverykit.com |

Nothing but Caddy is bound to a public interface. The apps listen on localhost,
and Postgres listens on localhost only.

| File | What it is |
| --- | --- |
| `ecosystem.config.js` | PM2 process definitions. Reads secrets from `.env.production`, which is git-ignored. |
| `.env.production.example` | The shape of that file. |
| `Caddyfile` | Copied to `/etc/caddy/Caddyfile`. Caddy obtains and renews the certificates itself. |
| `deploy.sh` | Pull, install, build all three, then reload PM2. |

Deploying a change:

```bash
cd /root/codes/EveryKit && ./deploy.sh
```

Everything is built before anything is reloaded, and the script aborts on a
failed build — so a broken commit leaves the running site untouched rather than
taking it down.

Exact DNS records, first-time setup and environment variables are in
[LAUNCH.md](LAUNCH.md).

## The two documents

**[CLAUDE.md](CLAUDE.md)** is the shared context every app is built against:
the brand, the design tokens, the payments convention, the layout rules, and a
definition of done. It applies to every app here and to any kit added later. Read it
before changing anything user-facing. It is written for whoever is doing the
work, human or otherwise.

**[LAUNCH.md](LAUNCH.md)** is the current state: what has been verified and how,
and what still needs an account, a domain or a decision. It is the handover
document, not a changelog.

## What is stored

Two tables, and between them they hold one piece of personal data.

An email address, if you give it, in `emails`. The hub owns it and the kits
never hold database credentials — they POST to `/api/subscribe` and carry on
whether it answers or not.

Page counts, in `pageviews`: a date, a kit, a path and a number. Every kit posts
to `/api/hit` once per page shown and the endpoint reads nothing else about the
caller — no address, no user agent, no referrer, no cookie, no id. Two people
and one person twice are the same row, permanently. That is the whole of the
analytics, it is first party, and there is no vendor involved.

Your files are a different matter and the promise there is unchanged: photos and
letters are processed entirely in the browser and never uploaded. There is no
server-side file handling anywhere and adding some would be a decision to make
deliberately, not to drift into.

See the email capture convention in [CLAUDE.md](CLAUDE.md), and
[`db/`](db) for the schema and how to pull the list.

## What is not here

No accounts, no unsubscribe automation, no email sending, no third-party
analytics, and nothing per-visitor anywhere.

There is one dashboard, at `useeverykit.com/admin`, for the one person who runs
this. It is server rendered, guarded by a signed cookie, noindexed, and linked
from nowhere in the UI. It reads the two tables and writes nothing.
