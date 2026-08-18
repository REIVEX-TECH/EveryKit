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

One Vercel project per app, both on the free tier, each pointed at its folder
via **Root Directory** in the project's settings:

| Vercel project | Root Directory | Domain |
| --- | --- | --- |
| `everykit-hub` | `hub` | useeverykit.com |
| `everykit-photos` | `photos` | photos.useeverykit.com |
| `everykit-letters` | `letters` | letters.useeverykit.com |

Subdomains belong to their own project — do not attach `photos.` to the hub's.

Deploy the hub first. The kits read `useeverykit.com/kits.json` and post to
`/api/subscribe`, and both fail silently by design — if the hub is not up, the
cross-promotion strip does not render and no address is recorded. Correct
behaviour, but it looks like a bug if you are not expecting it.

Exact DNS records and environment variables are in [LAUNCH.md](LAUNCH.md).

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

One thing: an email address, if you give it, in one table. The hub owns it and
the kits never hold database credentials — they POST to `/api/subscribe` and
carry on whether it answers or not.

Your files are a different matter and the promise there is unchanged: photos and
letters are processed entirely in the browser and never uploaded. There is no
server-side file handling anywhere and adding some would be a decision to make
deliberately, not to drift into.

See the email capture convention in [CLAUDE.md](CLAUDE.md), and
[`db/`](db) for the schema and how to pull the list.

## What is not here

No accounts, no admin dashboard, no unsubscribe automation, no email sending, no
cookies, no analytics on the email table. One table, one endpoint, and the
capture points inside the kits.
