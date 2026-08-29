# EveryKit Calc

Everyday calculators that just answer: age, the days between two dates, unit
conversion, loan instalments and percentages. All of it runs in the browser and
none of it is stored.

Part of [EveryKit](https://useeverykit.com), by [Reivex](https://reivex.io).
Lives at `calc.useeverykit.com`.

## Local setup

```bash
npm install
npm run dev
```

Then open http://localhost:3023.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest, 53 tests over the five calculators
npm run build       # production build
npm start           # serve the production build on 3023
```

## Environment variables

None are required; every one has a working default.

| Variable | Default | What it does |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://calc.useeverykit.com` | Canonicals, OG tags, sitemap |
| `NEXT_PUBLIC_HUB_URL` | `https://useeverykit.com` | Where `/kits.json`, `/api/hit` and `/api/subscribe` are read from |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `false` | This kit has no paid path; the flag is inherited from the platform |

## How it is put together

Every calculator is a pure function in `lib/calc/`, tested before its UI
existed, with a thin client component in `components/calc/` on top. No runtime
dependency beyond the platform's own.

- `lib/calc/dates.ts` — ages, anniversaries and day counts.
- `lib/calc/units.ts` — the factor tables and the temperature path.
- `lib/calc/emi.ts` — the annuity formula and the schedule, in whole cents.
- `lib/calc/percentage.ts` — the three questions and the trap in the third.

### The decisions worth knowing about

**Dates are compared at midday.** A date somebody types is a calendar date, not
an instant, and building it at midnight puts a daylight saving change one hour
away from moving the answer by a day. Midday is nowhere near a transition.

**Age is counted from the last anniversary that actually passed**, not by
subtracting the calendar fields and borrowing. Borrowing is where the off by one
in this kind of code lives: 31 January to 1 March goes negative and borrowing
twice changes the unit. One consequence is stated on the page: that span comes
out as 30 days rather than as "1 month and 1 day", because there is no 31
February for the month to complete on and clamping to the 28th would be a guess.

**A 29 February birthday is counted on 1 March in a common year.** That is a
convention rather than a fact, the same one `nextBirthday` uses, so the age and
the countdown can never disagree. The page says so when it applies.

**Including the end date is a visible switch.** The 1st to the 5th is four days
apart and five days if you are counting the days you have. Both questions get
asked constantly and each answer is wrong for the other.

**Temperature is not a ratio.** Celsius, Fahrenheit and Kelvin start in
different places, so 20 degrees is not twice 10. Converting it by multiplying is
the most common bug in a converter; it gets its own path here.

**Unit factors are the exact definitions.** An inch is 25.4 mm and a pound is
0.45359237 kg by international agreement, so those digits are not a rounding.
Answers are capped at six significant figures, because 2.5400000000000005 tells
you about floating point rather than about your measurement.

**Loans are worked in whole cents.** 240 rounded payments do not add up to the
loan, so the last instalment settles whatever is left and the schedule ends at
exactly zero. That is what a bank does, and it is why the last row differs from
the others by a few cents.

**Percent change is not symmetrical, and the page says so.** 40 to 50 is a 25
percent rise; 50 back to 40 is a 20 percent fall. It is the most common
percentage mistake there is, so the note appears with the answer rather than in
a footnote.

## Deploy notes

Runs as the PM2 process `everykit-calc` on **port 3023**, behind nginx.

- Process definition: `ecosystem.config.js` at the repo root.
- nginx server block: `deploy/nginx/useeverykit.conf`
  (`calc.useeverykit.com` → `127.0.0.1:3023`).
- Build order and reload: `deploy.sh` at the repo root.
- DNS and TLS: a wildcard `*.useeverykit.com` record resolves the subdomain, and [`deploy/edge.sh`](../deploy/edge.sh) expands the certificate when a new hostname first appears.
