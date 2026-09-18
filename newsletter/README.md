# EveryKit Newsletter

A visual, drag and drop email newsletter builder for people who do not write
code. Drag blocks onto a canvas, edit text in place, drop in images from a
side workspace, set colours and spacing, and export a folder containing email
safe HTML plus the images it uses.

Lives at **newsletter.useeverykit.com**. One kit in the EveryKit family, by
[Reivex](https://reivex.io).

This is the `newsletter/` folder of the [EveryKit repo](../README.md). The shared
context, brand, design system and layout conventions, is in
[CONTRIBUTING.md](../CONTRIBUTING.md) at the repo root. Read it before changing
anything user-facing.

Everything runs in the browser. The newsletter and the images you add are never
uploaded, which is the same promise every EveryKit tool makes.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3025.

## How the builder works

- **Blocks** live in `lib/newsletter/blocks.ts`: the model for heading, text,
  image, button, banner, two column, divider, spacer and footer, plus the
  defaults each one starts with.
- **The export** is in `lib/newsletter/export.ts`. It turns the block list into
  table based, inline styled HTML that renders in Gmail and Outlook, collects
  only the images actually used, and zips the HTML, the images and a short
  README with [fflate](https://github.com/101arrowz/fflate). It is unit tested
  in `lib/newsletter/export.test.ts`.
- **The UI** is in `components/newsletter/`: the palette, the canvas, the
  inspector, the image workspace and the iframe preview.

## The export folder

The download is a ZIP named after the newsletter, containing:

- `index.html`, the email safe HTML.
- `images/`, only the images the newsletter uses, as real files.
- `README.txt`, a short note explaining that to send the email the images must
  be hosted and the `images/...` paths swapped for hosted URLs, because email
  clients cannot read local files.

Hosting images and returning ready to send HTML with hosted URLs needs a
backend and is deliberately out of scope for v1. It is the natural next line.

## Deploy notes

Runs as the PM2 process `everykit-newsletter` on **port 3025**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`newsletter.useeverykit.com` -> `127.0.0.1:3025`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
