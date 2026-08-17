# EveryKit Photos

Turn a phone selfie into a passport or visa photo at the exact size an
application asks for. Everything runs in the browser — there is no backend, no
database, and the photo is never uploaded.

Lives at **photos.useeverykit.com**. One kit in the EveryKit family, by
[Reivex](https://reivex.io). The hub at
[useeverykit.com](https://useeverykit.com) lists every kit and publishes the
`/kits.json` registry this app reads on its success screen.

This is the `photos/` folder of the [EveryKit repo](../README.md). The shared
context — brand, design system, payments and layout conventions — is in
[CLAUDE.md](../CLAUDE.md) at the repo root. Read it before changing anything
user-facing. Launch status is in [LAUNCH.md](../LAUNCH.md).

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build. Every route prerenders. |
| `npm test` | Vitest. Covers the crop maths, DPI writing, print layout and compliance rules. |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Environment

Copy `.env.example` to `.env.local`. Nothing is required to run the tool.

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://photos.useeverykit.com` | This kit's origin. Canonicals, OpenGraph, sitemap and JSON-LD all generate against it. No URLs are hardcoded in components. |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | The hub. Header, footer and the "More from EveryKit" strip read this. |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` is launch mode: the Download button hands over the clean file free and shows a launch-week badge. `true` puts it behind checkout. |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | empty | Lemon Squeezy overlay URL. Only read when payments are on. |

`lib/payments.ts` is the single checkout seam — no checkout logic lives in any
component. `startCheckout()` is a stub that throws a clear error rather than
failing quietly; the file lists what finishing it involves.

## Deploying

Vercel project **`everykit-photos`**, free tier, with **Root Directory** set to
`photos`. The build needs no secrets.

For the human, not automated: in the Vercel dashboard add
`photos.useeverykit.com` to this project, then create a DNS record — a CNAME
from `photos` to `cname.vercel-dns.com`. Set `NEXT_PUBLIC_SITE_URL` and
`NEXT_PUBLIC_HUB_URL` in the project's environment variables. The hub lives in a
separate Vercel project; subdomains are not attached to this one.

## How the crop maths works

All of it lives in `lib/imaging/cropMath.ts` as pure functions, with tests in
`cropMath.test.ts`. Nothing about the geometry depends on the DOM.

**1. From a face box to a head.** MediaPipe's detector returns a box around the
face and the two eye points. The box excludes hair, so the crown is estimated as
the top of the box lifted by `HAIR_ALLOWANCE` (10%) of the box height, and the
chin is taken as the bottom of the box. Eye height comes from the actual eye
points when they are available.

**2. From a head to a frame height.** Each spec says how tall the head should be
in millimetres, and how tall the whole photo is. That ratio is the head's share
of the frame, so:

```
cropHeight = headHeightPx / targetHeadFraction
cropWidth  = cropHeight * (spec.widthMm / spec.heightMm)
```

Aiming at the middle of the published range leaves room to drift either way and
still be legal. Where a country publishes no chin-to-crown range, a generic 0.65
is used and the UI says out loud that it is a general ratio rather than a rule.

**3. From a frame to a position.** Two anchors, in order of preference:

- The spec publishes an eye line (the US does: 28 to 35 mm from the bottom
  edge). Then `cropTop = eyeY - eyeFractionFromTop * cropHeight`, which puts the
  eyes exactly where the spec wants them.
- It does not (the UK does not). Then the crown is placed using a top margin:
  of the frame height not taken by the head, `TOP_MARGIN_SHARE` (27%) goes above
  the crown and the rest below the chin.

Horizontally the frame centres on the face box.

**4. Corrections.** The crown is then forced at least 3% below the top edge and
the chin no lower than 95% down, because keeping the whole head in frame matters
more than hitting the eye band exactly. If the ideal frame is bigger than the
photo it shrinks; if it hangs off an edge it slides back in. Both are reported
on the returned plan, as is the case where the crown or chin falls outside the
source photo entirely — no crop can fix that, so the tool says so instead of
pretending.

**5. Measuring back.** `measureCrop` runs the same maths in reverse on every
drag, converting the live rect into millimetres. That is what the compliance
list reads, and what `overlayGuides` draws over the crop window, so the diagram,
the ticks and the exported file can never disagree.

## Project layout

```
app/                       routes; every one is statically generated
  photo/[country]/         one SEO page per spec, with FAQPage JSON-LD
  opengraph-image.tsx      the before/after pair, drawn with next/og
components/tool/           Dropzone, SpecPicker, CropStage, SpecOverlay,
                           BackgroundToggle, ComplianceList, ExportPanel
components/site/           header, footer, the hero example pair
data/specs.ts              every photo spec, the single source of truth
lib/imaging/               faceDetect, cropMath, dpiWriter, printSheet,
                           render, backgroundRemoval, compliance, imageSource
lib/payments.ts            the single checkout seam
lib/kits.ts                reads the hub's /kits.json, fails silently
```

## Notes on the pieces

**DPI.** A canvas export reports no physical size, so a 600 x 600 PNG opens as
"8.33 inches at 72 DPI" — which is how photos get rejected at a print counter.
`dpiWriter.ts` rewrites the encoded bytes: a `pHYs` chunk inserted after `IHDR`
for PNG, the JFIF APP0 density fields for JPEG, inserting an APP0 when the
encoder wrote none. Verified end to end: a downloaded US photo is exactly
600 x 600 and reads as 2 x 2 inches at 300 DPI.

**Print sheet.** `printSheet.ts` fits copies onto 4 x 6 inch paper, trying both
paper orientations and four spacing options. A 4 mm gutter is nicer to cut, but
three 2 x 2 inch photos across come to exactly 6 inches, so insisting on the
gutter would hand over two copies where a print shop gives six. Most copies
wins, widest gutter breaks a tie.

**Background removal.** `@imgly/background-removal` is behind a dynamic import
and only loads when the toggle is used. Segmentation runs on a copy downscaled
to 1600 px; the result is used as an alpha mask over the full-resolution photo,
so the export stays as sharp as the original. The model choice is one constant
at the top of `backgroundRemoval.ts` — it defaults to the small quantised model
because most people arrive on a phone, often on mobile data.

**Models are fetched from CDNs.** The MediaPipe WASM runtime comes from
jsDelivr and the detection model from Google's storage bucket; both URLs are
constants at the top of `faceDetect.ts`, with a comment on how to self-host
(copy `node_modules/@mediapipe/tasks-vision/wasm` into `public/`). No image data
is ever sent — these are static file downloads.

**Content security policy.** `next.config.ts` restricts `connect-src` to the
three model hosts plus the hub. This is not decoration: MediaPipe's bundle posts
usage telemetry to `odml.pa.googleapis.com` and exposes no setting to disable
it, and leaving that host off the list is what actually stops it. Detection is
unaffected.

If you add anything that needs the network, it goes in that list or it will not
work — and note that some failures are silent by design. The "More from
EveryKit" strip is one: it swallows its own errors, so omitting the hub origin
would not raise anything, the strip would just never appear in production.

One known consequence: the browser logs a CSP violation for the blocked
telemetry every time detection starts. That is the only console output in
normal use. The alternative is allowing the request, which would break the
promise on the privacy page, so the noise stays. Blocking it from application
code is not an option — the request comes from the WASM runtime's worker, out
of reach of a main-thread `fetch` override.

## Specs data

`data/specs.ts` holds sixteen entries. Two rules when editing:

- Never invent a head-height range. Entries where the issuing authority
  publishes no chin-to-crown measurement leave `headMinMm`/`headMaxMm`
  undefined, and the tool reports "not published" rather than showing a green
  tick it cannot justify.
- Anything not checked against the authority's own page carries a
  `// TODO verify against official source` marker and `needsVerification: true`,
  which surfaces a caveat on that country's page.

Two of the sixteen still carry that marker: **Bangladesh** and **Nigeria**.
Neither authority publishes a photo specification that could be found, and every
size quoted online for them traces back to other photo-tool websites rather than
a government page. Their notes say so on the page.

The other fourteen were checked against the issuing authority in August 2026.
Three were wrong and are now corrected:

| Spec | Was | Now | Source |
| --- | --- | --- | --- |
| Saudi visa | 2 x 2 in | 40 x 60 mm | Ministry of Foreign Affairs |
| UAE visa | 43 x 55 mm | 35 x 45 mm | ICP personal photo specification |
| Philippines | 35 x 45 mm | 2 x 2 in | DFA and its posts abroad |

Where an authority publishes the head size as a percentage of frame height
rather than in millimetres — Pakistan's 70-80%, Saudi Arabia's 60-70% — the
millimetre range is derived from that percentage, and the comment on the entry
says so. That is a conversion, not a separate published figure.

## What this does not do

No accounts, no database, no server-side image processing, no admin panel, no
blog, no other EveryKit tools. One tool.
