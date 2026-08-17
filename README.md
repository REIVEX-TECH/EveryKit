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
| Hub | [`hub/`](hub) | useeverykit.com | The directory of kits, and `/kits.json`, the registry every kit reads |
| Photos | [`photos/`](photos) | photos.useeverykit.com | Passport and visa photos cropped from a selfie |

Neither is deployed yet. [LAUNCH.md](LAUNCH.md) lists what is verified and what
still needs a human.

## Repo map

```
CLAUDE.md      shared context: brand, design system, payments, conventions
LAUNCH.md      pre-launch status and the remaining manual steps
hub/           Next.js app — the directory and the kit registry
photos/        Next.js app — the passport photo tool
docs/          the original build prompts, kept as a record of intent
```

The two apps share no code. That is deliberate: consistency comes from
`CLAUDE.md`, not from a package, until there are enough kits to justify one.
A design change made in one app has to be made in the other.

## Running them

Each app is a standalone Next.js project with its own `package.json`.

```bash
cd hub && npm install && npm run dev
```

```bash
cd photos && npm install && npm run dev
```

The hub runs on port 4200 and Photos on 3000, deliberately different so both can
run at once — which is how you test the "More from EveryKit" strip, since Photos
reads the hub's `/kits.json` across origins.

To point a local Photos at a local hub, put this in `photos/.env.local`:

```
NEXT_PUBLIC_HUB_URL=http://localhost:4200
```

Both apps use the same commands:

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

Subdomains belong to their own project — do not attach `photos.` to the hub's.

Deploy the hub first. Photos reads `useeverykit.com/kits.json`, and if the hub
is not up the cross-promotion strip silently does not render, which is correct
but looks like a bug if you are not expecting it.

Exact DNS records and environment variables are in [LAUNCH.md](LAUNCH.md).

## The two documents

**[CLAUDE.md](CLAUDE.md)** is the shared context every app is built against:
the brand, the design tokens, the payments convention, the layout rules, and a
definition of done. It applies to both apps and to any kit added later. Read it
before changing anything user-facing. It is written for whoever is doing the
work, human or otherwise.

**[LAUNCH.md](LAUNCH.md)** is the current state: what has been verified and how,
and what still needs an account, a domain or a decision. It is the handover
document, not a changelog.

## What is not here

No backend, no database, no user accounts, no server-side file handling. If a
feature seems to need one, that is a decision to make deliberately rather than
drift into — the privacy promise on every kit depends on it.
