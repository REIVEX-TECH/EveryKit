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

## Adding a kit

Add an entry to `data/kits.ts`. That is the whole job — the directory and
`/kits.json` are both generated from it, so they cannot drift apart.

A new `slug` needs a matching thumbnail branch in
`components/KitThumbnail.tsx`, or it falls through to the generic one. The
thumbnails are inline SVG drawings of what a kit produces, not screenshots and
not stock photos, which is also why this page makes zero image requests.

`lib/kits.test.ts` guards the registry contract: published fields, unique
slugs, and that each kit's subdomain matches its slug. That last one matters
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

Vercel project **`everykit-hub`**, free tier, with **Root Directory** set to
`hub`.

For the human, not automated: attach `useeverykit.com` to this project and add
`www.useeverykit.com` redirecting to the apex. Kit subdomains belong to their
own Vercel projects — do not attach them here.
