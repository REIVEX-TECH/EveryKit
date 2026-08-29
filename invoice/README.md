# EveryKit Invoice

Fill in a form, watch an A4 page build itself, download a PDF invoice. The form,
the preview, the logo and the PDF all live in the browser tab: there is no
endpoint on this app that could receive any of it.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `invoice.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3017.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, including fixture invoices through a PDF parser
npm run build       # production build
npm start           # serve the production build on 3017
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://invoice.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | `false` runs the launch-week path: nothing is gated behind payment |
| `NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL` | — | Only needed once payments are switched on |

## How it is put together

- `lib/invoice/money.ts` — every amount, and all the arithmetic.
- `lib/invoice/invoice.ts` — the document, and the copied summary.
- `lib/invoice/pdf.ts` — the A4 writer.
- `components/invoice/Preview.tsx` — the live page.
- `components/invoice/Workbench.tsx` — the form.

### The arithmetic is the product

Every amount is a whole number of the currency's smallest unit. Nothing is ever
a floating point number of major units, because `0.1 + 0.2` is
`0.30000000000000004` and an invoice a hundredth of a penny out is an invoice
somebody has to argue about.

Parsing is string-based right down to the last step for the same reason:
`19.99 * 100` is `1998.9999999999998`, and truncating that loses a penny. There
is a test that walks every value from 0.00 to 4.99 and checks each one lands on
the exact integer.

**The rounding rule.** Each line is rounded to whole minor units on its own, and
the subtotal is those rounded lines added up. Discount and tax are then each
computed on the subtotal and rounded once.

The alternative, holding full precision per line and rounding only at the end,
gives a total that cannot be reproduced from the printed lines. The lines are on
the page and somebody will add them, so matching what is printed matters more
than matching the theoretical answer to a fraction of a penny.

**Discount before tax.** VAT and GST are both charged on what is actually paid,
so the discount comes off the subtotal and tax is charged on what remains. A
discount larger than the invoice is clamped: that would be a credit note, which
is a different document.

### Currencies

Ten, including PKR and INR. Digits are grouped by locale rather than by a
hard-coded separator, because Indian numbering groups as 1,00,000 rather than
100,000 and getting that wrong looks immediately foreign to the person reading
the invoice. The yen has no decimal places because it has no minor unit, and the
formatter respects that rather than printing a meaningless `.00`.

### The rupee sign and WinAnsi

Standard-font PDFs are encoded in WinAnsi, which has no em dash, no curly quotes
and no ellipsis, and pdf-lib drops what it cannot encode rather than failing.
That lesson came from the Letters kit. The addition here is `₹`, which is
outside WinAnsi entirely: without substitution an Indian invoice would lose its
currency symbol from every figure on the page. It becomes `Rs`, which is not the
symbol but is unambiguous and survives.

### The preview and the PDF cannot disagree

The preview is HTML at the page's real proportions rather than a rendering of
the PDF, so it updates on every keystroke without re-running the writer. Both
read the same `totalsFor(invoice)`, so a figure shown on screen is by
construction the figure in the download. The greys are the same values too,
which is also what makes them pass contrast: `#777` on white is 4.48:1, under
what small text needs.

## Deploy notes

Runs as the PM2 process `everykit-invoice` on **port 3017**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`invoice.useeverykit.com` → `127.0.0.1:3017`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
