# EveryKit Letters

Fill a short form and get a properly written formal letter. Fourteen kinds —
visa invitations, resignations, complaints, notice to a landlord, and more.

Lives at **letters.useeverykit.com**. One kit in the EveryKit family, by
[Reivex](https://reivex.io).

This is the `letters/` folder of the [EveryKit repo](../README.md). The shared
context — brand, design system, payments, email capture — is in
[CLAUDE.md](../CLAUDE.md) at the repo root. Launch status is in
[LAUNCH.md](../LAUNCH.md).

## Local setup

```bash
npm install
npm run dev
```

Runs on port 3100, so it can run alongside the hub (4200) and Photos (3000).

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3100 |
| `npm run build` | Production build. Every route prerenders. |
| `npm test` | Vitest — 817 tests, most of them over the templates |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Environment

| Variable | Default | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://letters.useeverykit.com` | Canonicals, OpenGraph, sitemap, JSON-LD. |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | The kits registry and the email endpoint. Must be on the CSP `connect-src`. |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` is launch mode: PDF and Word are free with a quiet badge. |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | empty | Only read when payments are on. |
| `NEXT_PUBLIC_AI_POLISH_ENABLED` | `false` | Phase 2 stub. See below. |

## How a letter is built

There is no AI in v1, and that is a decision rather than a shortcut.

A letter is a **structure**, not a string: `LetterDoc` in
`lib/letter/types.ts` keeps the sender block, recipient, date, subject,
salutation, body, valediction and sign-off apart, because the same document is
rendered four ways — the on-screen A4 preview, the plain text you copy, the PDF
and the DOCX. Producing a string in the templates would mean re-parsing it
later.

Each letter type in `data/letters/` supplies a `build(values, ctx)` that
assembles that structure from the form answers. The helpers it uses are what
make optional fields disappear cleanly:

- `sentence(...)` joins fragments, drops the empty ones, and closes with a full
  stop. A fragment beginning with punctuation attaches directly, so an optional
  clause written as `", covering X"` vanishes without leaving
  `"the programme , covering"`.
- `paragraph(...)` joins sentences and returns nothing when they all dropped, so
  the whole paragraph can be removed.
- `compact(...)` removes the empties from any list.
- `addressing(name)` returns the salutation **and** its matching valediction.
  Dear Sir or Madam closes Yours faithfully; a named person closes Yours
  sincerely. Getting that pair wrong is the clearest tell that a letter was not
  written by someone used to writing them.

Tone is not an adjective swap. On the five types that have it — complaint,
refund, repair, bank dispute, notice to vacate — polite and firm are separately
written paragraphs, and a test fails if they share more than 80% of their words.

### The tests are the quality bar

`data/letters/letters.test.ts` runs every template twice: once with every field
answered, once with only the required ones. Both passes are checked for the
artefacts a template engine leaves behind — doubled commas, a space before a
full stop, a sentence ending on a bare connective, `undefined`, an unreplaced
token — plus banned words, groveling, legalese, and the salutation pairing.

It has caught real defects, including a space-before-comma from the sentence
joiner and an em dash silently dropped by the PDF font.

## Exports

Both are produced in the browser; nothing is uploaded.

**PDF** uses `pdf-lib` with Helvetica, one of the fourteen fonts every reader
has built in, so no font file is shipped or fetched. Wrapping is done by hand,
which is a few dozen lines against several hundred kilobytes of alternative.

Standard-font PDFs are WinAnsi-encoded, which has no em dash, no curly quotes
and no ellipsis — and pdf-lib drops what it cannot encode rather than failing.
`toWinAnsi()` substitutes them at that boundary. Without it a subject line lost
its dash and left a hole.

**DOCX** uses the `docx` package, producing a real Office Open XML package
rather than HTML with a `.doc` extension. The difference shows the moment
someone opens it in Google Docs.

Both are verified by parsing the output back: A4 at 595 x 842 points, the right
page count, paging when a letter runs long, and the zip parts Word refuses to
open a file without.

## Privacy

Nothing you type leaves the browser, and nothing is saved — refreshing starts
again. That is why there is no draft recovery.

The one exception is the email address asked for before you copy or download,
which is optional and skippable. See [`lib/emailCapture.ts`](lib/emailCapture.ts)
and the privacy page; the rule it follows is in the shared context file.

## The AI seam

`lib/ai.ts` holds a stubbed `polishLetter()` behind
`NEXT_PUBLIC_AI_POLISH_ENABLED`, which is off and has no key handling anywhere.

If it is ever switched on: a letter is the user's private writing, so sending it
off-device needs an explicit opt-in, and the privacy page has to change in the
same commit — "built in your browser" would no longer be the whole truth.

## Deploying

Vercel project **`everykit-letters`**, free tier, **Root Directory** `letters`.

For the human: add `letters.useeverykit.com` to that project and point a CNAME
from `letters` to `cname.vercel-dns.com`. Set the environment variables above.
